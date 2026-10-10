import { lazy } from "react";

/**
 * demo 鍵 → 元件。以 lazy 包裝讓 three.js 與各 demo 各自成為獨立 chunk，
 * 首頁與其他頁面不受影響。
 */
const registry = {
  "mexican-hat": lazy(() => import("./MexicanHat.jsx")),
  robot: lazy(() => import("./Robot.jsx")),
  maze: lazy(() => import("./Maze.jsx")),
};

export default registry;
