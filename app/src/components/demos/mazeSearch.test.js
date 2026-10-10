import test from "node:test";
import assert from "node:assert/strict";
import {
  cloneMaze,
  createMaze,
  EXIT,
  PASSAGE,
  SIZE,
  WALL,
  search,
} from "./mazeSearch.js";

/** 把 generator 跑到完，收集所有事件 */
function collect(gen) {
  const events = [];
  for (const ev of gen) events.push(ev);
  return events;
}

test("初始迷宮是 10×10，出口 [0][9] 是通道", () => {
  const grid = createMaze();
  assert.equal(grid.length, SIZE);
  assert.equal(grid[0].length, SIZE);
  assert.equal(grid[EXIT.y][EXIT.x], PASSAGE);
});

test("createMaze 每次回傳獨立的陣列", () => {
  const a = createMaze();
  const b = createMaze();
  a[1][1] = WALL;
  assert.equal(b[1][1], PASSAGE, "修改一份不得影響另一份");
});

test("從 (5,1) 可以抵達出口，並回傳連續且不穿牆的路徑", () => {
  const grid = createMaze();
  const events = collect(search(grid, { x: 5, y: 1 }));

  const found = events.find((e) => e.type === "found");
  assert.ok(found, "必須找到出口");

  assert.deepEqual(found.path[0], { x: 5, y: 1 });
  assert.deepEqual(found.path.at(-1), EXIT);

  for (let i = 1; i < found.path.length; i++) {
    const a = found.path[i - 1];
    const b = found.path[i];
    const distance = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    assert.equal(distance, 1, `第 ${i} 步不連續：${JSON.stringify([a, b])}`);
  }
  for (const p of found.path) {
    assert.equal(grid[p.y][p.x], PASSAGE, `路徑經過牆：${JSON.stringify(p)}`);
  }
});

test("搜尋順序為右 → 下 → 左 → 上", () => {
  // 全通道的 3×3，從左上角出發，第二個造訪的鄰格必須是右邊
  const grid = Array.from({ length: 3 }, () => new Array(3).fill(PASSAGE));
  const visits = collect(search(grid, { x: 0, y: 0 }, { x: 2, y: 2 })).filter(
    (e) => e.type === "visit"
  );

  assert.deepEqual(visits[0], { type: "visit", x: 0, y: 0 });
  assert.deepEqual(visits[1], { type: "visit", x: 1, y: 0 }, "第二個造訪的必須是右邊那格");
});

test("不會重複造訪同一格", () => {
  const grid = createMaze();
  const visits = collect(search(grid, { x: 5, y: 1 }))
    .filter((e) => e.type === "visit")
    .map((e) => `${e.x},${e.y}`);

  assert.equal(new Set(visits).size, visits.length, "有格子被造訪兩次");
});

test("出口被封死時回報 unreachable", () => {
  const grid = createMaze();
  grid[1][9] = WALL; // 出口唯一相鄰的通道

  const events = collect(search(grid, { x: 5, y: 1 }));
  assert.ok(events.some((e) => e.type === "unreachable"));
  assert.equal(events.some((e) => e.type === "found"), false);
});

test("入口在牆上時回報 unreachable，且不產生任何 visit", () => {
  const grid = createMaze();
  const events = collect(search(grid, { x: 0, y: 0 })); // [0][0] 是牆

  assert.ok(events.some((e) => e.type === "unreachable"));
  assert.equal(events.filter((e) => e.type === "visit").length, 0);
});

test("這個迷宮會產生回溯事件", () => {
  // 入口必須挑會走進死路的那一格。row 1 是一條直通出口的走廊，
  // 從 (5,1) 或 (1,1) 出發都是 6 次 visit、0 次 backtrack 直達出口，
  // 在那裡這個斷言會退化成恆真。全迷宮 43 格通道中有 24 格會回溯；
  // (7,8) 有 11 次，且是兩段多層回溯（5 層與 6 層）後才找到正確路徑。
  const grid = createMaze();
  const events = collect(search(grid, { x: 7, y: 8 }));
  assert.ok(events.filter((e) => e.type === "backtrack").length > 0);
});

test("cloneMaze 產生的副本與來源互不影響", () => {
  const grid = createMaze();
  const copy = cloneMaze(grid);
  copy[1][1] = WALL;
  assert.equal(grid[1][1], PASSAGE);
});

test("找到出口後就結束，found 之後不再有任何事件", () => {
  const grid = createMaze();
  const events = collect(search(grid, { x: 5, y: 1 }));

  const foundIndex = events.findIndex((e) => e.type === "found");
  assert.ok(foundIndex >= 0, "必須找到出口");
  // 畫面迴圈靠這個性質決定何時停止呼叫 generator：
  // found 若不是最後一個事件，迴圈就得自己判斷何時該停。
  assert.equal(foundIndex, events.length - 1, "found 之後仍有事件");
});
