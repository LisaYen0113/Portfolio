import { useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import useCanvasStage from "./useCanvasStage.js";

/**
 * 九種動作。標籤沿用原檔按鈕上的文字——
 * 注意原檔的 btnRun 標示為「快走」、btnfast 標示為「快跑」，兩者與變數名稱相反，
 * 這裡刻意保留原檔的標籤與順序。
 */
const ACTIONS = [
  { key: "walk", label: "走路" },
  { key: "run", label: "快走" },
  { key: "fast", label: "快跑" },
  { key: "wave", label: "招手" },
  { key: "hug", label: "抱抱" },
  { key: "sad", label: "沮喪" },
  { key: "stand", label: "立正" },
  { key: "fall", label: "跌倒" },
  { key: "dance", label: "跳舞" },
];

/** 原檔的 walkSpeed / runSpeed / fastSpeed / waveSpeed / hugSpeed / sadSpeed / danceSpeed */
const SPEEDS = {
  walk: 0.05,
  run: 0.1,
  fast: 0.1,
  wave: 0.1,
  hug: 0.05,
  sad: 0.05,
  dance: 0.1,
};

/** 原檔中會累加 walkAngle 的動作；立正與跌倒不會 */
const MOVING = new Set(["walk", "run", "fast", "wave", "hug", "sad", "dance"]);

export default function Robot() {
  // 原檔載入時所有旗標都是 false（靜止）。「立正」會把所有關節歸零，
  // 外觀與該狀態完全相同，且原檔頁面自己寫著「換動作前先立正」，因此以此為預設值。
  const [action, setAction] = useState("stand");

  // RAF 迴圈每格讀取目前動作，放在 ref 以免閉包抓到舊值
  const actionRef = useRef(action);
  actionRef.current = action;

  const sceneRef = useRef(null);

  const { containerRef, canvasRef, error } = useCanvasStage({
    init: ({ canvas, width, height, dpr }) => {
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xeeeeee);

      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 15;

      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(10, 10, 10);
      scene.add(directionalLight);

      // 原檔的三種材質
      const boxMaterial = new THREE.MeshStandardMaterial({ color: 0xc7b98c });
      const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
      const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

      // ---- 骨架：六根 Bone，位置逐項取自原檔 ----
      const rootBone = new THREE.Bone();
      rootBone.position.set(0, 0, 0);

      const bodyBone = new THREE.Bone();
      bodyBone.position.set(0, 0, 0);
      rootBone.add(bodyBone);

      const leftArmBone = new THREE.Bone();
      leftArmBone.position.set(-2.7, 2, 0);
      bodyBone.add(leftArmBone);

      const rightArmBone = new THREE.Bone();
      rightArmBone.position.set(2.7, 2, 0);
      bodyBone.add(rightArmBone);

      const leftLegBone = new THREE.Bone();
      leftLegBone.position.set(-1, -2.5, 0);
      bodyBone.add(leftLegBone);

      const rightLegBone = new THREE.Bone();
      rightLegBone.position.set(1, -2.5, 0);
      bodyBone.add(rightLegBone);

      // ---- 軀幹 ----
      // 原檔：new THREE.SkinnedMesh(new THREE.BoxGeometry(4, 5, 2), boxMaterial)
      //       + new THREE.Skeleton([...六根...]) + bodyMesh.bind(skeleton)。
      // 該幾何沒有 skinIndex / skinWeight，只靠 WebGL 補上的預設值 (0,0,0,1) 顯示，
      // 屬未定義行為。改為一般 Mesh 掛在 bodyBone 底下，視覺相同。
      const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 2), boxMaterial);
      bodyBone.add(bodyMesh);

      // ---- 頭部：掛在 bodyBone，不是骨架 ----
      const headMesh = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 3), boxMaterial);
      headMesh.position.set(0, 4.5, 0);
      bodyBone.add(headMesh);

      // ---- 眼睛：共用同一個幾何 ----
      const eyeGeometry = new THREE.CircleGeometry(0.3, 32);
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-1, 0.5, 1.6);
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(1, 0.5, 1.6);
      headMesh.add(leftEye, rightEye);

      // ---- 嘴巴 ----
      // 原檔直接指派 geometry.attributes.position 與 geometry.index，
      // 現代 three.js 要用 setAttribute / setIndex。
      const mouthGeometry = new THREE.BufferGeometry();
      mouthGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute([0, 0, 0.1, -0.5, -0.5, 0.1, 0.5, -0.5, 0.1], 3)
      );
      mouthGeometry.setIndex([0, 1, 2]);
      const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
      mouth.position.set(0, -0.3, 1.6);
      headMesh.add(mouth);

      // ---- 手臂：幾何原點下移，讓旋轉軸落在肩膀 ----
      const armGeometry = new THREE.BoxGeometry(1, 4, 1);
      armGeometry.translate(0, -2, 0);
      leftArmBone.add(new THREE.Mesh(armGeometry, boxMaterial));
      rightArmBone.add(new THREE.Mesh(armGeometry, boxMaterial));

      // ---- 腳 ----
      const legGeometry = new THREE.BoxGeometry(1.5, 3, 1.5);
      legGeometry.translate(0, -1.5, 0);
      leftLegBone.add(new THREE.Mesh(legGeometry, boxMaterial));
      rightLegBone.add(new THREE.Mesh(legGeometry, boxMaterial));

      scene.add(rootBone);

      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;

      sceneRef.current = {
        renderer,
        scene,
        camera,
        controls,
        parts: { bodyBone, leftArmBone, rightArmBone, leftLegBone, rightLegBone, headMesh },
        // 原檔的 walkAngle，跨動作延續不清零
        walkAngle: 0,
        materials: [boxMaterial, eyeMaterial, mouthMaterial],
      };

      return () => {
        controls.dispose();
        // 左右手臂、左右腳、左右眼共用幾何，用 Set 去重避免重複釋放
        const geometries = new Set();
        scene.traverse((obj) => {
          if (obj.geometry) geometries.add(obj.geometry);
        });
        for (const geometry of geometries) geometry.dispose();
        for (const material of sceneRef.current.materials) material.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
      };
    },

    frame: ({ dt }) => {
      const ctx = sceneRef.current;
      if (!ctx) return;
      const action = actionRef.current;
      const { bodyBone, leftArmBone, rightArmBone, leftLegBone, rightLegBone, headMesh } =
        ctx.parts;
      const frames = dt * 60;

      // 原檔先讀取上一幀的 walkAngle 才累加，順序要一致
      const currentAngle = ctx.walkAngle;
      if (MOVING.has(action)) ctx.walkAngle += SPEEDS[action] * frames;

      let swingAngle = 0;

      // 原檔 update() 中九個互斥的 if 區塊，逐條轉錄為 switch。
      // 注意：原檔多數分支只設定部分關節而沒有先歸零，因此動作之間會殘留
      // 前一個動作的角度（例如跳舞後切到沮喪，手臂仍舉著）。這是原檔的行為，
      // 予以保留；「立正」是唯一會把所有關節歸零的動作。
      switch (action) {
        case "run":
          swingAngle = (Math.sin(currentAngle) * Math.PI) / 4;
          leftArmBone.rotation.x = swingAngle;
          rightArmBone.rotation.x = -swingAngle;
          leftLegBone.rotation.x = -swingAngle;
          rightLegBone.rotation.x = swingAngle;
          break;

        case "walk":
          swingAngle = (Math.sin(currentAngle) * Math.PI) / 6; // 幅度較小
          leftArmBone.rotation.x = swingAngle;
          rightArmBone.rotation.x = -swingAngle;
          leftLegBone.rotation.x = -swingAngle;
          rightLegBone.rotation.x = swingAngle;
          break;

        case "fast":
          swingAngle = (Math.sin(currentAngle) * Math.PI) / 2;
          bodyBone.rotation.y = (Math.sin(currentAngle * 0.5) * Math.PI) / 8;
          leftArmBone.rotation.x = swingAngle;
          rightArmBone.rotation.x = -swingAngle;
          leftLegBone.rotation.x = -swingAngle;
          rightLegBone.rotation.x = swingAngle;
          break;

        case "wave":
          swingAngle = (Math.sin(currentAngle) * Math.PI) / 8;
          rightArmBone.rotation.x = -Math.PI / 1.5; // 右臂垂直舉起
          rightArmBone.rotation.z = swingAngle; // 左右擺動
          break;

        case "hug":
          rightArmBone.rotation.x = -Math.PI / 1.5;
          leftArmBone.rotation.x = -Math.PI / 1.5;
          headMesh.rotation.x = -Math.PI / 8; // 微微抬頭
          break;

        case "sad":
          headMesh.rotation.x = Math.PI / 4; // 頭部低下
          break;

        case "stand":
          headMesh.rotation.x = 0;
          leftArmBone.rotation.x = 0;
          leftArmBone.rotation.z = 0;
          rightArmBone.rotation.x = 0;
          rightArmBone.rotation.z = 0;
          leftLegBone.rotation.x = 0;
          rightLegBone.rotation.x = 0;
          bodyBone.rotation.y = 0;
          bodyBone.rotation.x = 0;
          break;

        case "fall":
          bodyBone.rotation.x = -Math.PI / 6; // 軀幹向後傾
          headMesh.rotation.x = -Math.PI / 8;
          leftArmBone.rotation.x = Math.PI / 4;
          rightArmBone.rotation.x = Math.PI / 4;
          leftArmBone.rotation.z = -Math.PI / 8;
          rightArmBone.rotation.z = Math.PI / 8;
          leftLegBone.rotation.x = Math.PI / 6;
          rightLegBone.rotation.x = -Math.PI / 6;
          break;

        case "dance":
          swingAngle = (Math.sin(currentAngle) * Math.PI) / 8;
          bodyBone.rotation.y = (Math.sin(currentAngle * 0.5) * Math.PI) / 8;
          rightArmBone.rotation.x = -Math.PI / 1.5;
          rightArmBone.rotation.z = swingAngle;
          leftArmBone.rotation.x = -Math.PI / 1.5;
          leftArmBone.rotation.z = swingAngle;
          break;

        default:
          break;
      }

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

  return (
    <div className="demo-stage">
      <div className="demo-canvas-wrap" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="demo-canvas"
          role="img"
          aria-label="由骨架階層驅動的方塊機器人"
        />
      </div>

      <div className="demo-controls">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            type="button"
            className="btn"
            aria-pressed={a.key === action}
            onClick={() => setAction(a.key)}
          >
            {a.label}
          </button>
        ))}
      </div>

      <p className="demo-status" aria-live="polite">
        目前動作：{ACTIONS.find((a) => a.key === action)?.label}
        {action !== "stand" && "（切換動作前先按「立正」可將關節歸零）"}
      </p>
      {error && <p className="demo-fallback">此展示無法啟動：{error.message}</p>}
    </div>
  );
}
