// 迷宮資料與 DFS 搜尋。純函式，不碰 DOM，可用 node --test 獨立驗證。
// 座標慣例沿用原始 C++ 檔：grid[y][x]，y 為列（0 在最上），x 為行（0 在最左）。

export const SIZE = 10;
export const WALL = 1;
export const PASSAGE = 0;

/** 出口固定於 [0][9]，即最右上角 */
export const EXIT = Object.freeze({ x: 9, y: 0 });

/** 原始 C++ 檔的初始迷宮配置，1 為牆、0 為通道 */
export const INITIAL_LAYOUT = Object.freeze([
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1, 1, 0, 1],
  [1, 1, 1, 1, 1, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 0, 0, 1, 0, 1, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
].map((row) => Object.freeze([...row])));

export function cloneMaze(grid) {
  return grid.map((row) => [...row]);
}

export function createMaze() {
  return cloneMaze(INITIAL_LAYOUT);
}

/**
 * 深度優先搜尋，逐步產生事件。
 * 搜尋順序沿用原檔：右 → 下 → 左 → 上
 * （原檔 dfs(x + 1, y) || dfs(x, y + 1) || dfs(x - 1, y) || dfs(x, y - 1)）。
 */
export function* search(grid, entrance, exit = EXIT) {
  const size = grid.length;
  const visited = Array.from({ length: size }, () => new Array(size).fill(false));
  const path = [];

  const walkable = (x, y) =>
    x >= 0 && y >= 0 && x < size && y < size && grid[y][x] === PASSAGE;

  function* dfs(x, y) {
    if (!walkable(x, y) || visited[y][x]) return false;

    visited[y][x] = true;
    path.push({ x, y });
    yield { type: "visit", x, y };

    if (x === exit.x && y === exit.y) {
      yield { type: "found", path: path.map((p) => ({ ...p })) };
      return true;
    }

    // 先算好鄰居再遞迴，避免受到遞迴內部的狀態變動影響
    const neighbours = [
      [x + 1, y],
      [x, y + 1],
      [x - 1, y],
      [x, y - 1],
    ];
    for (const [nx, ny] of neighbours) {
      if (yield* dfs(nx, ny)) return true;
    }

    path.pop();
    yield { type: "backtrack", x, y };
    return false;
  }

  if (!(yield* dfs(entrance.x, entrance.y))) {
    yield { type: "unreachable" };
  }
}
