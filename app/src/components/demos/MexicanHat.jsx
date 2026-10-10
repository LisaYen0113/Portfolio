import { useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import useCanvasStage from "./useCanvasStage.js";
import DemoUnavailable from "./DemoUnavailable.jsx";
import { HAT_LIMITS, adjust } from "./hatParams.js";

/**
 * 原檔的取樣：x = π(4i/rows − 2)、y = π(4j/rows − 2)、r = √(x²+y²)，
 * 值為 sin(r)/r，r 為 0 時取 1。
 *
 * 原檔的資料迴圈用 nRows 當 j 的分母（`Math.PI * (4 * j / nRows - 2.0)`），
 * 三組取樣的 rows 與 columns 都是同一個數字，因此這裡只用一個參數。
 */
function buildSincGrid(rows) {
  const grid = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    const x = Math.PI * ((4 * i) / rows - 2.0);
    for (let j = 0; j < rows; j++) {
      const y = Math.PI * ((4 * j) / rows - 2.0);
      const r = Math.sqrt(x * x + y * y);
      row.push(r ? Math.sin(r) / r : 1);
    }
    grid.push(row);
  }
  return grid;
}

/**
 * 把取樣結果攤成 THREE.Line 的頂點序列。
 *
 * 頂點公式：X = scale·2i/rows − 1 − scale、Y = scale·data[i][j]、Z = scale·2j/rows − 1 − scale。
 *
 * 原檔只對太陽多做一趟「j 外層、i 內層」的迴圈。這個「先列後行、再先行後列」
 * 的順序正是帽子狀線框的成因，不能省略也不能合併。
 */
function buildWireGeometry(rows, scale, [red, green, blue], { crossPass = false } = {}) {
  const grid = buildSincGrid(rows);
  const points = [];
  const colors = [];

  const emit = (i, j) => {
    points.push(
      (scale * 2 * i) / rows - 1 - scale,
      scale * grid[i][j],
      (scale * 2 * j) / rows - 1 - scale
    );
    colors.push(red, green, blue);
  };

  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < rows - 1; j++) emit(i, j);
  }
  if (crossPass) {
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < rows - 1; i++) emit(i, j);
    }
  }

  const geometry = new THREE.BufferGeometry();
  // 原檔的 geometry.addAttribute(...) 在現代 three.js 已移除，改為 setAttribute
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingBox();
  return geometry;
}

// 五個天體共用同一個材質，對應原檔的 line_material。
// 原檔的 vertexColors: THREE.VertexColors 在現代 three.js 已移除，改為 true。
const LINE_MATERIAL = new THREE.LineBasicMaterial({ vertexColors: true });

/** 五個天體的取樣密度、尺寸與顏色，全部取自原檔 */
const BODIES = {
  sun: { rows: 50, scale: 50, rgb: [1.0, 0.5, 0.0], crossPass: true },
  earth: { rows: 30, scale: 30, rgb: [0.0, 0.5, 0.3], crossPass: false },
  earth2: { rows: 30, scale: 30, rgb: [0.0, 0.3, 0.6], crossPass: false },
  moon: { rows: 10, scale: 10, rgb: [0.0, 0.0, 0.3], crossPass: false },
  moon2: { rows: 10, scale: 10, rgb: [0.0, 0.0, 0.3], crossPass: false },
};

const MOON_ORBIT_RADIUS = 50;

export default function MexicanHat() {
  const [params, setParams] = useState(() => ({
    moonSpeed: HAT_LIMITS.moonSpeed.initial,
    earthSpeed: HAT_LIMITS.earthSpeed.initial,
    earth1Distance: HAT_LIMITS.earth1Distance.initial,
    earth2Distance: HAT_LIMITS.earth2Distance.initial,
  }));

  // 轉速與半徑由 RAF 迴圈每格讀取，因此放在 ref 而非 state
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const reducedRef = useRef(
    typeof window !== "undefined" &&
      Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  );

  const sceneRef = useRef(null);

  const { containerRef, canvasRef, error } = useCanvasStage({
    init: ({ canvas, width, height, dpr }) => {
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      renderer.setClearColor(0xffffff); // 原檔設定的白色背景

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
      camera.position.z = 500; // 原檔的相機位置

      const bodies = {};
      for (const [name, spec] of Object.entries(BODIES)) {
        const line = new THREE.Line(
          buildWireGeometry(spec.rows, spec.scale, spec.rgb, spec),
          LINE_MATERIAL
        );
        bodies[name] = line;
        scene.add(line);
      }

      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;

      sceneRef.current = {
        renderer,
        scene,
        camera,
        controls,
        ...bodies,
        // 原檔的四個累加角度與月球縮放因子
        angles: { earth: 0, earth2: 0, moon: 0, moon2: 0 },
        moonScale: 1,
      };

      return () => {
        controls.dispose();
        for (const name of Object.keys(BODIES)) bodies[name].geometry.dispose();
        // 五個天體共用同一個材質，只能釋放一次
        LINE_MATERIAL.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
      };
    },

    frame: ({ dt }) => {
      const ctx = sceneRef.current;
      if (!ctx) return;
      const p = paramsRef.current;
      // 原檔的累加量是「每幀」而非「每秒」，以 60fps 為基準換算
      const frames = dt * 60;

      if (!reducedRef.current) {
        ctx.angles.earth += p.earthSpeed * frames;
        ctx.angles.earth2 += p.earthSpeed * 1.2 * frames;
        ctx.angles.moon += p.moonSpeed * frames;
        ctx.angles.moon2 += p.moonSpeed * 1.5 * frames;

        // 只有 moon 會縮放，moon2 不會——與原檔一致
        ctx.moonScale = 1 + 0.5 * Math.sin(ctx.angles.moon);
        ctx.moon.scale.setScalar(ctx.moonScale);

        for (const name of Object.keys(BODIES)) ctx[name].rotation.y += 0.01 * frames;
        ctx.earth2.rotation.x += 0.01 * frames; // 地球2 的 x 軸翻滾
      }

      ctx.earth.position.set(
        p.earth1Distance * Math.cos(ctx.angles.earth),
        p.earth1Distance * Math.sin(ctx.angles.earth),
        0
      );
      ctx.earth2.position.set(
        p.earth2Distance * Math.cos(ctx.angles.earth2),
        p.earth2Distance * Math.sin(ctx.angles.earth2),
        0
      );
      // 兩顆月球都繞著「第一顆地球」的半徑公轉——原檔就是這樣寫的
      ctx.moon.position.set(
        p.earth1Distance * Math.cos(ctx.angles.earth) +
          MOON_ORBIT_RADIUS * Math.cos(ctx.angles.moon),
        p.earth1Distance * Math.sin(ctx.angles.earth) +
          MOON_ORBIT_RADIUS * Math.sin(ctx.angles.moon),
        0
      );
      ctx.moon2.position.set(
        p.earth1Distance * Math.cos(ctx.angles.earth) +
          MOON_ORBIT_RADIUS * Math.cos(ctx.angles.moon2),
        p.earth1Distance * Math.sin(ctx.angles.earth) +
          MOON_ORBIT_RADIUS * Math.sin(ctx.angles.moon2),
        0
      );

      ctx.controls.update();
      ctx.renderer.render(ctx.scene, ctx.camera);
    },

    onResize: ({ width, height }) => {
      const ctx = sceneRef.current;
      if (!ctx) return;
      ctx.camera.aspect = width / height;
      ctx.camera.updateProjectionMatrix();
      ctx.renderer.setSize(width, height, false);
    },
  });

  const bump = (key, direction) =>
    setParams((prev) => ({ ...prev, [key]: adjust(prev[key], key, direction) }));

  return (
    <div className="demo-stage">
      <div className="demo-canvas-wrap" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="demo-canvas"
          role="img"
          aria-label="以 sinc 函式繪製的行星系統線框模型"
        />
      </div>

      <div className="demo-controls">
        {/* 八顆按鈕逐一對應原檔的按鈕，順序與原檔一致 */}
        <button type="button" className="btn" onClick={() => bump("moonSpeed", -1)}>
          月球速度 −
        </button>
        <button type="button" className="btn" onClick={() => bump("moonSpeed", 1)}>
          月球速度 ＋
        </button>
        <button type="button" className="btn" onClick={() => bump("earthSpeed", -1)}>
          地球速度 −
        </button>
        <button type="button" className="btn" onClick={() => bump("earthSpeed", 1)}>
          地球速度 ＋
        </button>
        <button type="button" className="btn" onClick={() => bump("earth1Distance", -1)}>
          地球半徑 −
        </button>
        <button type="button" className="btn" onClick={() => bump("earth1Distance", 1)}>
          地球半徑 ＋
        </button>
        <button type="button" className="btn" onClick={() => bump("earth2Distance", -1)}>
          地球2 半徑 −
        </button>
        <button type="button" className="btn" onClick={() => bump("earth2Distance", 1)}>
          地球2 半徑 ＋
        </button>
      </div>

      <p className="demo-status" aria-live="polite">
        月球速度 {params.moonSpeed.toFixed(3)} · 地球速度 {params.earthSpeed.toFixed(3)} ·
        地球公轉半徑 {params.earth1Distance} · 地球2 公轉半徑 {params.earth2Distance}
      </p>
      <p className="demo-note">
        地球公轉半徑範圍 100–400、地球2 為 150–500，月球半徑隨時間以 sin 振盪。
      </p>
      {error && <DemoUnavailable error={error} />}
    </div>
  );
}
