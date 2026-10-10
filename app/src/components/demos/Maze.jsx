import { useCallback, useRef, useState } from "react";
import useCanvasStage from "./useCanvasStage.js";
import { EXIT, SIZE, WALL, createMaze, search } from "./mazeSearch.js";

// 配色沿用原始 C++ 檔的 glColor3f 數值
const COLOR = {
  wall: "#B2C8BB",
  passage: "#FFF5F7",
  marker: "#725334",
  trail: "#45794A",
  trailSoft: "rgba(69, 121, 74, 0.22)",
  line: "rgba(51, 71, 78, 0.2)",
};

const SPEEDS = [
  { key: "slow", label: "慢", stepMs: 260 },
  { key: "normal", label: "中", stepMs: 110 },
  { key: "fast", label: "快", stepMs: 30 },
];

const DEFAULT_SPEED = SPEEDS[1];

export default function Maze() {
  const [grid, setGrid] = useState(() => createMaze());
  const [entrance, setEntrance] = useState(null);
  const [mode, setMode] = useState("wall"); // wall | entrance
  const [speedKey, setSpeedKey] = useState(DEFAULT_SPEED.key);
  const [phase, setPhase] = useState("idle"); // idle | searching | done | unreachable | need-entrance
  const [playing, setPlaying] = useState(false);
  const [visitedCount, setVisitedCount] = useState(0);

  // 搜尋狀態放在 ref：RAF 迴圈每格讀寫，不需要經過 re-render
  const genRef = useRef(null);
  const visitedRef = useRef(new Set());
  const currentRef = useRef(null);
  const solutionRef = useRef(null);
  const accumulatorRef = useRef(0);

  // 迴圈每格要讀到最新的畫面狀態。playing 由事件處理器與迴圈共同維護，
  // 因此只在這裡初始化，不在每次 render 覆寫。
  const viewRef = useRef({ grid, entrance, stepMs: DEFAULT_SPEED.stepMs, playing: false });
  viewRef.current.grid = grid;
  viewRef.current.entrance = entrance;
  viewRef.current.stepMs = (SPEEDS.find((s) => s.key === speedKey) ?? DEFAULT_SPEED).stepMs;

  // 實際繪製的版面，供點擊座標換算使用（與 draw 用同一組數字）
  const layoutRef = useRef({ size: 1, offsetX: 0, offsetY: 0 });

  // playing 同時存在 state 與 ref：state 給按鈕的 disabled 用，ref 給 RAF 迴圈讀。
  // 兩者一律透過這個函式一起寫，才不會不同步。
  const setPlayingBoth = useCallback((value) => {
    viewRef.current.playing = value;
    setPlaying(value);
  }, []);

  const clearSearch = useCallback(() => {
    genRef.current = null;
    visitedRef.current = new Set();
    currentRef.current = null;
    solutionRef.current = null;
    accumulatorRef.current = 0;
    setPlayingBoth(false);
    setVisitedCount(0);
    setPhase("idle");
  }, [setPlayingBoth]);

  /** 取出一個事件並更新搜尋狀態。回傳 false 表示搜尋已結束。 */
  const advance = useCallback(() => {
    const gen = genRef.current;
    if (!gen) return false;

    const { value, done } = gen.next();
    if (done) return false;

    if (value.type === "visit") {
      visitedRef.current.add(`${value.x},${value.y}`);
      currentRef.current = value;
      setVisitedCount(visitedRef.current.size);
      return true;
    }
    if (value.type === "backtrack") {
      currentRef.current = value;
      return true;
    }
    if (value.type === "found") {
      solutionRef.current = value.path;
      // 設回 null，讓下一次「單步」重新開始一輪，而不是卡在已耗盡的 generator
      genRef.current = null;
      setPlayingBoth(false);
      setPhase("done");
      return false;
    }
    // unreachable
    genRef.current = null;
    setPlayingBoth(false);
    setPhase("unreachable");
    return false;
  }, [setPlayingBoth]);

  const draw = useCallback((ctx, size) => {
    const { grid: cells, entrance: start } = viewRef.current;
    const cell = size / SIZE;

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        ctx.fillStyle = cells[y][x] === WALL ? COLOR.wall : COLOR.passage;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    ctx.fillStyle = COLOR.trailSoft;
    for (const key of visitedRef.current) {
      const [x, y] = key.split(",").map(Number);
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }

    const solution = solutionRef.current;
    if (solution) {
      ctx.fillStyle = COLOR.trail;
      for (const p of solution) ctx.fillRect(p.x * cell, p.y * cell, cell, cell);
    }

    // 出入口
    ctx.fillStyle = COLOR.marker;
    ctx.fillRect(EXIT.x * cell, EXIT.y * cell, cell, cell);
    if (start) ctx.fillRect(start.x * cell, start.y * cell, cell, cell);

    // 目前位置（找到解答後整條路徑已上色，不用再標）
    const current = currentRef.current;
    if (current && !solution) {
      ctx.fillStyle = COLOR.trail;
      ctx.fillRect(current.x * cell, current.y * cell, cell, cell);
    }

    // 格線
    ctx.strokeStyle = COLOR.line;
    ctx.lineWidth = 1;
    for (let i = 0; i <= SIZE; i++) {
      const at = Math.round(i * cell) + 0.5;
      ctx.beginPath();
      ctx.moveTo(at, 0);
      ctx.lineTo(at, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, at);
      ctx.lineTo(size, at);
      ctx.stroke();
    }
  }, []);

  const { containerRef, canvasRef, error } = useCanvasStage({
    frame: ({ dt }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (viewRef.current.playing) {
        accumulatorRef.current += dt * 1000;
        const step = viewRef.current.stepMs;
        while (accumulatorRef.current >= step) {
          accumulatorRef.current -= step;
          if (!advance()) break;
        }
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("瀏覽器不支援 Canvas 2D");

      const cssWidth = canvas.clientWidth || 1;
      const cssHeight = canvas.clientHeight || 1;
      const scale = canvas.width / cssWidth;
      const size = Math.min(cssWidth, cssHeight);
      const offsetX = (cssWidth - size) / 2;
      const offsetY = (cssHeight - size) / 2;
      layoutRef.current = { size, offsetX, offsetY };

      // 每格都重設 transform，這樣 resize 之後不需要額外同步
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      ctx.save();
      ctx.translate(offsetX, offsetY);
      draw(ctx, size);
      ctx.restore();
    },
  });

  const beginSearch = () => {
    solutionRef.current = null;
    visitedRef.current = new Set();
    currentRef.current = null;
    accumulatorRef.current = 0;
    setVisitedCount(0);
    genRef.current = search(viewRef.current.grid, viewRef.current.entrance, EXIT);
    setPhase("searching");
  };

  const handleStart = () => {
    if (playing) return;
    if (!entrance) {
      setPhase("need-entrance");
      return;
    }
    beginSearch();
    setPlayingBoth(true);
  };

  const handleStep = () => {
    if (playing) return;
    if (!entrance) {
      setPhase("need-entrance");
      return;
    }
    if (!genRef.current) beginSearch();
    // 先設 searching 再 advance：advance 若結束會把 phase 覆寫成 done / unreachable，
    // 兩者在同一個批次裡，後寫的勝出。順序反過來就會把 done 蓋掉。
    setPhase("searching");
    advance();
  };

  const handleReset = () => {
    // 與原檔一致：重置會還原迷宮並清除入口（原檔把 entranceX / entranceY 設回 -1）
    setGrid(createMaze());
    setEntrance(null);
    clearSearch();
  };

  const handleCanvasClick = (event) => {
    if (playing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const { size, offsetX, offsetY } = layoutRef.current;
    const cell = size / SIZE;
    const x = Math.floor((event.clientX - rect.left - offsetX) / cell);
    const y = Math.floor((event.clientY - rect.top - offsetY) / cell);
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    if (x === EXIT.x && y === EXIT.y) return; // 出口不可變更
    if (entrance && entrance.x === x && entrance.y === y) return; // 入口不可被埋掉

    if (mode === "entrance") {
      if (grid[y][x] === WALL) return; // 入口不可設在牆上
      setEntrance({ x, y });
      clearSearch();
      return;
    }

    setGrid((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === y
          ? row.map((value, colIndex) =>
              colIndex === x ? (value === WALL ? 0 : WALL) : value
            )
          : row
      )
    );
    clearSearch();
  };

  const statusText = {
    idle: "先設定入口：切換到「模式：設定入口」後點選任一通道格子。",
    "need-entrance": "尚未設定入口——請切換到「模式：設定入口」後點選一個通道格子。",
    searching: playing
      ? `DFS 搜尋中 · 已造訪 ${visitedCount} 格`
      : `單步模式 · 已造訪 ${visitedCount} 格`,
    done: `已抵達出口 · 路徑長度 ${solutionRef.current?.length ?? 0} 格`,
    unreachable: "從這個入口無法抵達出口",
  }[phase];

  return (
    <div className="demo-stage">
      <div className="demo-canvas-wrap" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="demo-canvas"
          role="img"
          aria-label={`10×10 迷宮，出口在右上角，目前已造訪 ${visitedCount} 格`}
          onClick={handleCanvasClick}
        />
      </div>

      <div className="demo-controls">
        <button type="button" className="btn btn-primary" onClick={handleStart} disabled={playing}>
          開始搜尋
        </button>
        <button type="button" className="btn" onClick={handleStep} disabled={playing}>
          單步
        </button>
        <button type="button" className="btn" onClick={handleReset}>
          重置
        </button>
        <button
          type="button"
          className="btn"
          aria-pressed={mode === "entrance"}
          onClick={() => setMode((m) => (m === "wall" ? "entrance" : "wall"))}
        >
          {mode === "wall" ? "模式：挖牆 / 補牆" : "模式：設定入口"}
        </button>
        <div className="demo-speeds" role="group" aria-label="播放速度">
          {SPEEDS.map((s) => (
            <button
              key={s.key}
              type="button"
              className="btn"
              aria-pressed={s.key === speedKey}
              onClick={() => setSpeedKey(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <p className="demo-status" aria-live="polite">
        {statusText}
      </p>
      {error && <p className="demo-fallback">此展示無法啟動：{error.message}</p>}
    </div>
  );
}
