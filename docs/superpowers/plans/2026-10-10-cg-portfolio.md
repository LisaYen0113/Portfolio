# 電腦圖學作品集化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把三份電腦圖學作業（墨西哥帽子、機器人大變身、老鼠走迷宮）改寫成可在瀏覽器直接互動的 React 元件，放進既有作品集網站並部署到公開網址。

**Architecture:** 沿用網站既有的資料驅動架構——新增一種 `demo` 內容區塊型別，由 `FlowSection` 分派到 `Demo.jsx`；`Demo.jsx` 透過 registry 以 `React.lazy` 載入三個互相獨立的 demo 元件。三個 demo 共用一個 `useCanvasStage` hook 處理 canvas 尺寸、RAF 迴圈與資源釋放。迷宮的 DFS 演算法抽成不碰 DOM 的純模組，可獨立測試。

**Tech Stack:** React 18.3.1、Vite 5.4.8、react-router-dom 6.26.2、three.js r186、Canvas 2D、Node 內建測試執行器（`node --test`）

**Spec:** `docs/superpowers/specs/2026-10-10-cg-portfolio-design.md`

**原始檔:** Task 1 會把三份原始檔複製到 `legacy/`。Task 5～7 的程式碼已把原始檔的實際內容逐段轉錄進來，但**幾何與動畫的數值以 `legacy/` 下的原始檔為準**——若本計畫與原始檔不一致，以原始檔為準。

## Global Constraints

- 執行位置：`C:\github\跨領域資訊作品集網頁原型`，應用程式在 `app/` 子目錄
- 執行指令一律先 `cd app`（或使用 `npm --prefix app`）
- **不得新增執行期相依套件，除了 `three`**（唯一例外）
- **不得引入測試框架**；只用 Node 內建 `node --test`（需 Node ≥ 18.13）。`package.json` 的 `test` script **明確列出測試檔**，新增測試檔時要一併加進去
- **不得改動既有視覺系統**：`DESIGN-HANDOFF.md` 是視覺契約。新元件重用既有 class（`.section`、`.section-head`、`.section-idx`、`.section-title`、`.btn`、`.prose`、`.todo-note`、`.detail-hero` 等）與 `:root` 既有 token，不新增設計 token
- devicePixelRatio 上限 **2**
- 所有控制項必須是真正的 `<button>`（鍵盤可達、focus 可見）
- 必須尊重 `prefers-reduced-motion: reduce`（**但僅限自動播放的動畫，見 Review Focus 5**）
- `console.error` 只在 `import.meta.env.DEV` 為真時輸出
- 不可變：所有 state 更新以新物件取代，不得就地修改
- Commit 格式 `<type>: <description>`（type ∈ feat / fix / refactor / docs / test / chore / perf / ci）
- **不要加 Co-Authored-By 或其他署名行**（使用者全域設定已停用署名）
- 程式碼註解用繁體中文，與既有檔案一致

## Review Focus

以下五類是 spec 隱含要求、但沒有單元測試會涵蓋的失敗模式。每一項都在擁有該程式碼的任務裡有對應的驗證步驟。

1. **WebGL／Canvas 無法使用**（關閉硬體加速、舊機器、`getContext` 回傳 null）→ 使用者應看到一段說明文字，而不是空白區塊或整個詳情頁崩潰
2. **換頁時 WebGL context 未釋放** → 連續瀏覽六次後再回到 demo 頁，canvas 仍必須正常運作（瀏覽器上限約 16 個 context）
3. **JSON 裡的 `demo` 鍵打錯字** → 該區塊應顯示說明文字，且**同頁其他區塊與其他 demo 必須照常運作**
4. **360px 寬的視窗** → 頁面不得出現橫向捲動，canvas 不得撐破容器
5. **`prefers-reduced-motion: reduce`** → 帽子**不得自動公轉**；**但機器人與迷宮不受此限**——這兩者的動態完全由使用者按鈕觸發，使用者按下「跳舞」卻看到靜止的機器人是壞掉，不是無障礙

---

## 檔案結構

**新增**

| 路徑 | 職責 |
|---|---|
| `.gitignore` | 排除 `node_modules/`、`dist/` |
| `.gitattributes` | `legacy/** -text`，避免 Big5 原檔被換行正規化破壞 |
| `legacy/README.md` | 三份原始檔的來源、參考基礎、改寫對應 |
| `legacy/mexican-hat/index.r83.html` | 帽子原始檔（r83） |
| `legacy/robot/index.r83.html` | 機器人原始檔（r83） |
| `legacy/maze/main.cpp` | 迷宮原始檔（C++ / freeglut，Big5） |
| `app/src/components/SectionHead.jsx` | 從 `Detail.jsx` 抽出的區塊標題元件（避免 `Demo.jsx` ↔ `Detail.jsx` 循環匯入） |
| `app/src/components/Demo.jsx` | demo 區塊外殼：標題、說明、可見才載入、錯誤邊界、替代文案 |
| `app/src/components/demos/registry.js` | demo 鍵 → `lazy()` 元件的對照表 |
| `app/src/components/demos/useCanvasStage.js` | canvas 尺寸、RAF 迴圈、ResizeObserver、資源釋放 |
| `app/src/components/demos/mazeSearch.js` | 迷宮資料與 DFS generator（純函式，無 DOM） |
| `app/src/components/demos/mazeSearch.test.js` | 上述的單元測試 |
| `app/src/components/demos/hatParams.js` | 帽子 demo 的參數範圍與增減邏輯（純函式） |
| `app/src/components/demos/hatParams.test.js` | 上述的單元測試 |
| `app/src/components/demos/Maze.jsx` | 迷宮 demo（Canvas 2D） |
| `app/src/components/demos/MexicanHat.jsx` | 帽子 demo（three.js） |
| `app/src/components/demos/Robot.jsx` | 機器人 demo（three.js） |
| `app/vercel.json` | SPA 路由重寫 |

**修改**

| 路徑 | 變更 |
|---|---|
| `app/package.json` | 加 `three` 相依、加 `test` script |
| `app/src/components/Detail.jsx` | `SectionHead` 改為匯入；`FlowSection` 加 `demo` 分支 |
| `app/src/pages/CourseDetail.jsx` | `anchorFor` 加 `demo` 分支；截圖區編號由 flow 長度推算 |
| `app/src/pages/ProjectDetail.jsx` | 同上 |
| `app/src/data/courses.json` | 第 05 筆（`webgl`）內容填實 |
| `app/src/data/projects.json` | 新增 `maze-dfs` 一筆 |
| `app/src/styles/global.css` | 追加 demo 相關樣式（附錄 A） |

---

## Task 1: 原始碼入庫

**Files:**
- Create: `.gitignore`
- Create: `.gitattributes`
- Create: `legacy/README.md`
- Create: `legacy/mexican-hat/index.r83.html`、`legacy/robot/index.r83.html`、`legacy/maze/main.cpp`

**Interfaces:**
- Consumes: 無
- Produces: `legacy/` 下的三份原始檔，Task 5～7 改寫時以它們為依據

- [ ] **Step 1: 建立 .gitignore**

建立 `.gitignore`：

```
node_modules/
dist/
.DS_Store
*.local
.vercel
```

- [ ] **Step 2: 建立 .gitattributes，保護 Big5 原檔**

`legacy/maze/main.cpp` 是 Big5 編碼。Git 的換行正規化雖然不會破壞 Big5（0x0D/0x0A 不是合法的 Big5 尾位元組），但把這些檔案標為 binary 可以避免任何自動轉換與 diff 雜訊。

建立 `.gitattributes`：

```
legacy/** -text
```

- [ ] **Step 3: 複製三份原始檔**

執行：

```bash
cd "C:/github/跨領域資訊作品集網頁原型"
mkdir -p legacy/mexican-hat legacy/robot legacy/maze
cp "C:/Users/yenli/OneDrive/桌面/大二上電腦圖學/墨西哥帽子/墨西哥帽子.html" legacy/mexican-hat/index.r83.html
cp "C:/Users/yenli/OneDrive/桌面/大二上電腦圖學/機器人大變身/index.html" legacy/robot/index.r83.html
cp "C:/Users/yenli/OneDrive/桌面/大二上電腦圖學/老鼠走迷宮/source code/main.cpp" legacy/maze/main.cpp
```

**不要**複製 `three.js-master/`——那是 2017 年的 three.js 原始碼，體積大且非本人著作。

- [ ] **Step 4: 驗證檔案完整**

執行：

```bash
cd "C:/github/跨領域資訊作品集網頁原型" && ls -l legacy/*/ && wc -l legacy/*/* && grep -c "dfs" legacy/maze/main.cpp
```

預期：三個檔案都存在且非 0 bytes，且 `main.cpp` 的 `dfs` 出現次數大於 0。**不要**用行數精確比對——`wc -l` 對不同換行方式的計數會有差異，行數不是可靠的驗證方式。真正的驗證是 Task 5 完成後在瀏覽器跑出來的迷宮與原檔一致。

- [ ] **Step 5: 撰寫 legacy/README.md**

建立 `legacy/README.md`：

```markdown
# 課程作業原始檔

此目錄保存「電腦圖學」（資工輔系）三份作業的原始程式碼，僅作對照與來源說明之用，不參與建置、不進部署產物。

## mexican-hat/index.r83.html

- 課程作業：墨西哥帽子
- 執行環境：three.js r83（2017 年），需以舊版 `examples/js` 全域載入方式執行
- 參考基礎：行星公轉範例來自吳祐任學長（作業書面報告已註明）；行星自轉作法參考陳冠宇學長
- 本人新增：sinc 函式線框球體、月球縮放振盪、地球與地球2 的可調公轉半徑、地球2 的 x 軸翻滾、按鈕控制介面
- 改寫為：`app/src/components/demos/MexicanHat.jsx`

## robot/index.r83.html

- 課程作業：機器人大變身
- 執行環境：three.js r83
- 參考基礎：基於老師提供的 WebGL 版機器人範例
- 本人新增：九種動作的關節動畫、動作切換介面
- 改寫為：`app/src/components/demos/Robot.jsx`
- 改寫時的重要變更：原檔將不含 skin weights 的軀幹幾何放入 `SkinnedMesh` 並 `bind()` 一個骨架。此寫法在現代 three.js 下仍會顯示，但依賴 WebGL 對缺失頂點屬性補上的通用預設值 `(0,0,0,1)`，屬未定義行為。改寫版將軀幹改為一般 `Mesh` 並掛在 `bodyBone` 之下。

## maze/main.cpp

- 課程作業：老鼠走迷宮
- 執行環境：C++ / freeglut，原始檔為 Big5 編碼
- 參考基礎：無，個人獨立完成
- 內容：10×10 迷宮、深度優先搜尋（DFS）與回溯、右鍵選單操作介面
- 改寫為：`app/src/components/demos/Maze.jsx`（演算法核心在 `mazeSearch.js`）
- 改寫時的重要變更：繪圖由 OpenGL `GL_QUADS` 改為 Canvas 2D `fillRect`；DFS 改寫為 generator 以支援逐步播放
```

- [ ] **Step 6: 建立既有網站的基準 commit**

**這一步不能跳過。** 這個 repo 目前只有兩個 `docs/` 的 commit——整個網站（`app/` 的 25 個檔案，含 `package.json`、所有 `.jsx`、`global.css` 與兩份 JSON）從未進版控。Task 8 要用 `gh repo create --source=. --push` 建 repo 並部署，若 `app/` 沒有 commit，推上去的是空殼，Vercel 會建置失敗。

先確認沒有任何機密外洩：

```bash
cd "C:/github/跨領域資訊作品集網頁原型" && git status --short && find . -name ".env*" -not -path "*/node_modules/*"
```

預期：`find` 沒有任何輸出（沒有 `.env` 檔）。若有輸出，停下來告知使用者，不要 commit。

確認後提交全部既有內容：

```bash
cd "C:/github/跨領域資訊作品集網頁原型"
git add -A
git commit -m "chore: 匯入既有作品集網站與設計來源檔"
```

`-A` 會一併納入根目錄的 OpenDesign 匯出檔（`*.html`、`assets/`、`DESIGN-HANDOFF.md`、`DESIGN-MANIFEST.json`）與兩份設計來源檔（PDF 2.5 MB、`.drawio` 61 KB），合計約 3.3 MB。這些是設計契約與來源，保留在版控中是合理的。

- [ ] **Step 7: Commit 原始檔與版控設定**

```bash
cd "C:/github/跨領域資訊作品集網頁原型"
git add .gitignore .gitattributes legacy/
git commit -m "chore: 保存電腦圖學作業原始檔並設定版控屬性"
```

---

## Task 2: 迷宮演算法核心（TDD）

**Files:**
- Create: `app/src/components/demos/mazeSearch.js`
- Create: `app/src/components/demos/mazeSearch.test.js`
- Modify: `app/package.json`（加 `test` script）

**Interfaces:**
- Consumes: 無
- Produces:
  - `SIZE: number` = 10
  - `WALL: number` = 1、`PASSAGE: number` = 0
  - `EXIT: { x: number, y: number }` = `{ x: 9, y: 0 }`（凍結物件）
  - `INITIAL_LAYOUT: number[][]` — `grid[y][x]`，`y` 為列（0 在最上）、`x` 為行（0 在最左）
  - `createMaze(): number[][]` — 回傳 `INITIAL_LAYOUT` 的深拷貝
  - `cloneMaze(grid): number[][]`
  - `search(grid, entrance, exit = EXIT): Generator<MazeEvent>` — `entrance` 為 `{ x, y }`
  - `MazeEvent` 為下列之一：
    - `{ type: "visit", x, y }`
    - `{ type: "backtrack", x, y }`
    - `{ type: "found", path: { x, y }[] }`
    - `{ type: "unreachable" }`

- [ ] **Step 1: 加入 test script**

在 `app/package.json` 的 `"scripts"` 加入（明確列出檔案，避免依賴 Node 對目錄參數的版本差異；日後新增測試檔要一併加進來）：

```json
"test": "node --test src/components/demos/mazeSearch.test.js src/components/demos/hatParams.test.js"
```

`hatParams.test.js` 要到 Task 6 才會建立，因此本任務期間只能單獨執行測試檔，不要跑 `npm test`。

- [ ] **Step 2: 寫失敗的測試**

建立 `app/src/components/demos/mazeSearch.test.js`：

```js
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
  const grid = createMaze();
  const events = collect(search(grid, { x: 5, y: 1 }));
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
```

- [ ] **Step 3: 執行測試，確認失敗**

```bash
cd "C:/github/跨領域資訊作品集網頁原型/app" && node --test src/components/demos/mazeSearch.test.js
```

預期：FAIL，錯誤為 `Cannot find module './mazeSearch.js'`。

- [ ] **Step 4: 實作 mazeSearch.js**

建立 `app/src/components/demos/mazeSearch.js`：

```js
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
```

- [ ] **Step 5: 執行測試，確認通過**

```bash
cd "C:/github/跨領域資訊作品集網頁原型/app" && node --test src/components/demos/mazeSearch.test.js
```

預期：PASS，10 個測試全數通過。

- [ ] **Step 6: Commit**

```bash
cd "C:/github/跨領域資訊作品集網頁原型"
git add app/package.json app/src/components/demos/mazeSearch.js app/src/components/demos/mazeSearch.test.js
git commit -m "feat: 新增迷宮 DFS 搜尋核心與單元測試"
```

---

## Task 3: canvas 生命週期 hook

**Files:**
- Create: `app/src/components/demos/useCanvasStage.js`

**Interfaces:**
- Consumes: 無
- Produces: `useCanvasStage(options) => { containerRef, canvasRef, error }`
  - `options.init({ canvas, width, height, dpr })` — 掛載時呼叫一次。可回傳一個 cleanup 函式
  - `options.frame({ dt, elapsed })` — 每個動畫影格呼叫，`dt` 為秒（上限 0.1）
  - `options.onResize({ canvas, width, height, dpr })` — 容器尺寸變動時呼叫（掛載後首次變動才觸發）
  - `containerRef` 需掛在**有明確尺寸**的元素上（本計畫是 `.demo-canvas-wrap`，它有 `aspect-ratio: 1 / 1`）；`canvasRef` 掛在 `<canvas>`
  - `error` 為 `Error | null`，`init` 或 `frame` 拋錯時被設值

**這一版是整個專案資源管理的核心**，review 時特別注意 cleanup 路徑。

- [ ] **Step 1: 實作 useCanvasStage.js**

建立 `app/src/components/demos/useCanvasStage.js`：

```js
import { useEffect, useRef, useState } from "react";

/** 高解析手機的繪製成本上限，超過 2 沒有視覺效益 */
const MAX_DPR = 2;

/**
 * 管理一個 canvas 的完整生命週期：尺寸、動畫迴圈、資源釋放。
 *
 * 釋放不是最佳化而是必要：換頁時若未釋放 WebGL context，
 * 連續瀏覽數頁就會耗盡瀏覽器約 16 個的上限，導致後續 canvas 全部失效。
 */
export default function useCanvasStage({ init, frame, onResize }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);

  // 用 ref 保存最新的 callback，讓 effect 只需執行一次
  const latest = useRef({ init, frame, onResize });
  latest.current = { init, frame, onResize };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    let disposed = false;
    let rafId = 0;
    let cleanup = null;
    let last = performance.now();
    const started = last;

    const measure = () => {
      const rect = container.getBoundingClientRect();
      return {
        canvas,
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
        dpr: Math.min(window.devicePixelRatio || 1, MAX_DPR),
      };
    };

    const applySize = (size) => {
      canvas.width = Math.round(size.width * size.dpr);
      canvas.height = Math.round(size.height * size.dpr);
    };

    let failed = false;
    try {
      const size = measure();
      applySize(size);
      cleanup = latest.current.init?.(size);
    } catch (e) {
      failed = true;
      setError(e);
    }

    let observer = null;
    if (!failed) {
      const tick = (now) => {
        if (disposed) return;
        // 分頁切換回來時 dt 會非常大，設上限避免動畫一次跳掉
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        try {
          latest.current.frame?.({ dt, elapsed: (now - started) / 1000 });
        } catch (e) {
          setError(e);
          return;
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);

      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(() => {
          if (disposed) return;
          const size = measure();
          applySize(size);
          latest.current.onResize?.(size);
        });
        observer.observe(container);
      }
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      observer?.disconnect();
      // 即使 init 拋錯，cleanup 仍要執行——init 可能在建立 renderer 之後才失敗，
      // 此時若不執行 cleanup 就會洩漏一個 WebGL context
      try {
        cleanup?.();
      } catch (e) {
        if (import.meta.env.DEV) console.error("[demo] 釋放資源時發生錯誤:", e);
      }
    };
  }, []);

  return { containerRef, canvasRef, error };
}
```

- [ ] **Step 2: 確認既有頁面仍可建置**

```bash
cd "C:/github/跨領域資訊作品集網頁原型/app" && npm run build
```

預期：建置成功。此時尚無元件使用此 hook，只是確認沒有語法錯誤。

- [ ] **Step 3: Commit**

```bash
cd "C:/github/跨領域資訊作品集網頁原型"
git add app/src/components/demos/useCanvasStage.js
git commit -m "feat: 新增 canvas 生命週期與資源釋放 hook"
```

---

## Task 4: demo 區塊外殼、資料與骨架元件

這個任務結束後，兩個頁面都會渲染出 demo 區塊（內容是佔位畫面），Task 5～7 再逐一替換成真正的實作。

**Files:**
- Create: `app/src/components/SectionHead.jsx`
- Create: `app/src/components/Demo.jsx`
- Create: `app/src/components/demos/registry.js`
- Create: `app/src/components/demos/Maze.jsx`（佔位版）
- Create: `app/src/components/demos/MexicanHat.jsx`（佔位版）
- Create: `app/src/components/demos/Robot.jsx`（佔位版）
- Modify: `app/src/components/Detail.jsx`
- Modify: `app/src/pages/CourseDetail.jsx`
- Modify: `app/src/pages/ProjectDetail.jsx`
- Modify: `app/src/data/courses.json`
- Modify: `app/src/data/projects.json`
- Modify: `app/src/styles/global.css`（附錄 A）

**Interfaces:**
- Consumes: `useCanvasStage`（Task 3）
- Produces:
  - `SectionHead({ idx, heading })` — **預設匯出**
  - `<Demo block={block} anchor={anchor} />` — `block` 為 spec §5.1 的 demo 區塊
  - `registry` — 預設匯出 `{ "mexican-hat": Component, robot: Component, maze: Component }`
  - 三個 demo 元件皆不接受 props

- [ ] **Step 1: 抽出 SectionHead**

建立 `app/src/components/SectionHead.jsx`：

```jsx
export default function SectionHead({ idx, heading }) {
  return (
    <div className="section-head">
      <span className="section-idx">{idx}</span>
      <h2 className="section-title">{heading}</h2>
    </div>
  );
}
```

在 `app/src/components/Detail.jsx` 中，刪除原本的 `function SectionHead(...)` 定義，改為在檔案開頭加入：

```js
import SectionHead from "./SectionHead.jsx";
```

這是純抽取，`Detail.jsx` 其餘部分與輸出完全不變。

- [ ] **Step 2: 建立 registry**

建立 `app/src/components/demos/registry.js`：

```js
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
```

- [ ] **Step 3: 建立三個佔位元件**

三個檔案先建立成可運作的佔位版。Task 5～7 會分別整份取代。

`app/src/components/demos/Maze.jsx`：

```jsx
import useCanvasStage from "./useCanvasStage.js";

export default function Maze() {
  const { containerRef, canvasRef, error } = useCanvasStage({
    frame: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("瀏覽器不支援 Canvas 2D");
      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      const scale = canvas.width / width;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.fillStyle = "#FFF5F7";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#725334";
      ctx.font = "16px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("迷宮展示建置中", width / 2, height / 2);
    },
  });

  return (
    <div className="demo-stage">
      <div className="demo-canvas-wrap" ref={containerRef}>
        <canvas ref={canvasRef} className="demo-canvas" role="img" aria-label="迷宮展示" />
      </div>
      {error && <p className="demo-fallback">此展示無法啟動：{error.message}</p>}
    </div>
  );
}
```

`app/src/components/demos/MexicanHat.jsx` 與 `app/src/components/demos/Robot.jsx`：同結構，但**不使用 2D context**，canvas 保持空白：

```jsx
import useCanvasStage from "./useCanvasStage.js";

export default function MexicanHat() {
  const { containerRef, canvasRef, error } = useCanvasStage({
    frame: () => {},
  });

  return (
    <div className="demo-stage">
      <div className="demo-canvas-wrap" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="demo-canvas"
          role="img"
          aria-label="墨西哥帽子展示"
        />
      </div>
      <p className="demo-fallback">three.js 展示建置中</p>
      {error && <p className="demo-fallback">此展示無法啟動：{error.message}</p>}
    </div>
  );
}
```

`Robot.jsx` 同結構，`aria-label` 改為 `"機器人大變身展示"`。

- [ ] **Step 4: 建立 Demo.jsx**

建立 `app/src/components/Demo.jsx`：

```jsx
import { Component, Suspense, useEffect, useRef, useState } from "react";
import Reveal from "./Reveal.jsx";
import SectionHead from "./SectionHead.jsx";
import registry from "./demos/registry.js";

/** 提前 200px 開始載入，讓使用者捲到時已經就緒 */
const PRELOAD_MARGIN = "200px 0px";

function DemoLoading() {
  return (
    <div className="demo-stage">
      <p className="demo-fallback">展示載入中…</p>
    </div>
  );
}

function DemoFallback({ reason }) {
  return (
    <div className="demo-stage">
      <p className="demo-fallback">
        此互動展示無法在此裝置上執行{reason ? `（${reason}）` : ""}。
        展示內容需要 WebGL 與 JavaScript，請改用支援的瀏覽器，或開啟硬體加速後重新整理。
      </p>
    </div>
  );
}

/** 單一 demo 的錯誤不得影響整頁 */
class DemoBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error("[demo] 元件發生錯誤:", error, info);
  }

  render() {
    if (this.state.error) return <DemoFallback reason={this.state.error.message} />;
    return this.props.children;
  }
}

/** 捲到附近才回傳 true，避免一次建立多個 WebGL context */
function useNearViewport(ref) {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: PRELOAD_MARGIN }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, near]);

  return near;
}

export default function Demo({ block, anchor }) {
  const hostRef = useRef(null);
  const near = useNearViewport(hostRef);
  const DemoComponent = registry[block.demo];

  return (
    <Reveal className="section" data-od-id={anchor}>
      <SectionHead idx={block.idx} heading={block.heading} />

      <div ref={hostRef}>
        {!DemoComponent ? (
          <DemoFallback reason={`未知的展示「${block.demo}」`} />
        ) : near ? (
          <DemoBoundary>
            <Suspense fallback={<DemoLoading />}>
              <DemoComponent />
            </Suspense>
          </DemoBoundary>
        ) : (
          <DemoLoading />
        )}
      </div>

      {block.caption && <p className="demo-caption">{block.caption}</p>}
      {block.note && <p className="demo-note">{block.note}</p>}
    </Reveal>
  );
}
```

- [ ] **Step 5: 在 FlowSection 加入 demo 分支**

在 `app/src/components/Detail.jsx` 開頭加入：

```js
import Demo from "./Demo.jsx";
```

把 `FlowSection` 改成在 `demo` 型別時**直接回傳** `Demo`，不進入外層 `Reveal`——`Demo.jsx` 內部已自行包一層，否則會出現兩層 `.section` 造成多餘間距：

```jsx
export function FlowSection({ block, anchor }) {
  if (block.type === "demo") return <Demo block={block} anchor={anchor} />;

  return (
    <Reveal className="section" data-od-id={anchor}>
      {/* 其餘維持原樣 */}
    </Reveal>
  );
}
```

- [ ] **Step 6: 更新兩個詳情頁的 anchorFor 與編號**

`app/src/pages/CourseDetail.jsx`：

```js
const pad = (n) => String(n).padStart(2, "0");

function anchorFor(block) {
  if (block.type === "demo") return `course-demo-${block.demo}`;
  if (block.type === "roles") return "course-body";
  if (block.type === "result") return "course-outcome";
  return "course-background";
}
```

並把寫死的截圖編號改為由 flow 長度推算——原本寫死 `idx="04 — SCREENSHOTS"`，flow 擴充到 5 塊後會與 flow 自己的編號撞號：

```jsx
<ShotGrid
  idx={`${pad(course.flow.length + 1)} — SCREENSHOTS`}
  heading={course.screensHeading}
  shots={course.shots}
  erd={course.erd}
  anchor="course-screenshots"
/>
```

`app/src/pages/ProjectDetail.jsx` 同樣處理：

```js
const pad = (n) => String(n).padStart(2, "0");

function anchorFor(block) {
  if (block.type === "demo") return `project-demo-${block.demo}`;
  if (block.type === "roles") return "project-body";
  if (block.type === "result")
    return block.idx.includes("EVALUATION") ? "project-evaluation" : "project-awards";
  return "project-background";
}
```

```jsx
<ShotGrid
  idx={`${pad(project.flow.length + 1)} — SCREENSHOTS`}
  heading={project.screensHeading}
  shots={project.shots}
  anchor="project-screenshots"
/>
```

- [ ] **Step 7: 追加 demo 樣式**

把附錄 A 的 CSS 追加到 `app/src/styles/global.css` 檔案**結尾**。這些樣式只使用 `:root` 既有的 token，不新增任何變數。

- [ ] **Step 8: 填實 courses.json 第 05 筆**

在 `app/src/data/courses.json` 中找到 `"id": "webgl"` 那一筆，做以下變更。**其餘既有欄位（`num`、`pill`、`title`、`listTitle` 及任何本步驟未提及的鍵）保持原樣不動。**

`lead` 改為：

```
資工輔系修課期間的電腦圖學實作，從圖元繪製、光照著色到互動動畫。兩份作業已改寫為可直接在瀏覽器操作的展示。
```

`spec` 改為：

```json
[
  { "k": "課程", "v": "電腦圖學", "todo": false },
  { "k": "學期", "v": "113 學年度第 1 學期", "todo": true },
  { "k": "修課身分", "v": "資工輔系", "todo": false },
  { "k": "技術", "v": "three.js · WebGL · C++ / OpenGL", "todo": false }
]
```

`flow` 改為：

```json
[
  {
    "type": "prose",
    "idx": "01 — BACKGROUND",
    "heading": "課程與學習脈絡",
    "text": "這門課從圖學的底層原理開始：座標系統與透視投影、區域光照與全域光照、渲染管線與 z-buffer，一路到階層式建模。每學一個概念就配一份實作，於是有了下面兩份作業——一份練數學函式的曲面繪製與座標變換，一份練骨架階層與動作控制。"
  },
  {
    "type": "demo",
    "idx": "02 — DEMO",
    "heading": "互動展示：墨西哥帽子",
    "demo": "mexican-hat",
    "caption": "拖曳可旋轉視角、滾輪縮放。下方按鈕對應作業要求的三項功能：月球縮放振盪、可調整的地球公轉半徑、地球2 的完整翻滾。",
    "note": "參考基礎：行星公轉範例來自吳祐任學長，行星自轉作法參考陳冠宇學長。sinc 函式線框球體、月球縮放、兩顆地球的公轉半徑控制與地球2 的 x 軸翻滾為本人實作。"
  },
  {
    "type": "demo",
    "idx": "03 — DEMO",
    "heading": "互動展示：機器人大變身",
    "demo": "robot",
    "caption": "點擊按鈕切換九種動作，拖曳可環繞觀看。每個動作都是一組關節角度隨時間變化的組合。",
    "note": "參考基礎：基於老師提供的 WebGL 版機器人範例。九種動作的關節動畫與動作切換介面為本人實作。"
  },
  {
    "type": "roles",
    "idx": "04 — WORK",
    "heading": "執行內容",
    "items": [
      { "n": "01", "h": "曲面繪製", "p": "以 sinc 函式取樣產生線框球體，逐頂點計算座標與顏色，練習緩衝區幾何的建立方式。" },
      { "n": "02", "h": "座標變換", "p": "以階層式模型實作行星系統的公轉與自轉，並讓月球半徑隨時間週期性縮放。" },
      { "n": "03", "h": "骨架動畫", "p": "以 Bone 階層建立機器人骨架，設計九種動作的關節角度變化，並處理動作之間的互斥切換。" }
    ]
  },
  {
    "type": "result",
    "idx": "05 — OUTCOME",
    "heading": "學習成果",
    "k": "自製課程講義 · 95 / 120",
    "v": "主動整理成教材",
    "todo": false,
    "p": "除了完成作業，也把課堂內容整理成一份自己的圖學講義，涵蓋光線追蹤、透視投影、渲染管線、z-buffer 與階層式建模。整理講義的過程比寫程式更能確認自己真的理解了原理，而不只是讓作業跑得動。"
  }
]
```

`screensHeading` 與 `shots` 保持原樣（截圖仍待補，不在本次範圍）。

`links` 改為：

```json
{
  "idx": "07 — SOURCE",
  "heading": "原始碼",
  "name": "github.com/待補 · computer-graphics",
  "note": "改寫後的元件位於 app/src/components/demos/，原始作業檔案保存在 legacy/。",
  "label": "在 GitHub 檢視",
  "url": "#"
}
```

- [ ] **Step 9: 新增 projects.json 的迷宮專案**

在 `app/src/data/projects.json` 的陣列**最後**（`line-competition` 之後）加入：

```json
{
  "id": "maze-dfs",
  "num": "05",
  "pill": "Algorithm",
  "category": "演算法",
  "featured": true,
  "title": "老鼠走迷宮：DFS 搜尋視覺化",
  "lead": "以深度優先搜尋在 10×10 迷宮中尋找出口，並把搜尋與回溯的完整過程逐步視覺化。",
  "cardTitle": "老鼠走迷宮：DFS 搜尋視覺化",
  "cardDesc": "以深度優先搜尋在 10×10 迷宮中尋找出口，將搜尋順序與回溯過程逐步呈現，可單步檢視、調整速度。",
  "cardTags": ["C++", "OpenGL", "演算法"],
  "cardRole": "課程作業 · 個人",
  "mediaLabel": "DFS 搜尋 · 互動展示",
  "spec": [
    { "k": "年份", "v": "大二上 · 電腦圖學", "todo": false },
    { "k": "專案角色", "v": "個人", "todo": false },
    { "k": "專案類型", "v": "課程作業", "todo": false },
    { "k": "技術", "v": "C++ · OpenGL / freeglut → JavaScript · Canvas 2D", "todo": false }
  ],
  "flow": [
    {
      "type": "prose",
      "idx": "01 — BACKGROUND",
      "heading": "作業背景",
      "text": "以深度優先搜尋（DFS）在 10×10 的迷宮中找出從入口到出口的一條路徑，並把搜尋的過程畫出來。迷宮可以用右鍵選單切換成挖牆模式自行編輯，出口固定在最右上角 [0][9]。"
    },
    {
      "type": "demo",
      "idx": "02 — DEMO",
      "heading": "互動展示：DFS 搜尋",
      "demo": "maze",
      "caption": "先設定入口，按下開始即可看到搜尋與回溯的過程。單步模式適合一步步檢視 DFS 的決策。",
      "note": "原始版本為 C++ / freeglut。網頁版改用 Canvas 2D 重寫繪圖，並把 DFS 改寫成可逐步執行的形式，以支援單步與速度調整。"
    },
    {
      "type": "roles",
      "idx": "03 — APPROACH",
      "heading": "演算法設計",
      "items": [
        { "n": "01", "h": "迷宮表示法", "p": "10×10 的二維陣列，1 代表牆、0 代表通道，出口固定於 [0][9]。搜尋時另用一個 visited 陣列記錄走過的格子。" },
        { "n": "02", "h": "DFS 與回溯", "p": "從入口出發，依序嘗試右、下、左、上四個方向，走進第一個可通且未造訪的格子。四個方向都走不通時退回上一格，這就是回溯。抵達出口時回傳 true，整條遞迴鏈一路回傳。" },
        { "n": "03", "h": "逐步視覺化", "p": "把 DFS 改寫成每次探索或回溯就產生一個事件的產生器，畫面依事件逐步播放，因此可以暫停、單步與調整速度，而不是播放一段預錄動畫。" }
      ]
    },
    {
      "type": "result",
      "idx": "04 — RESULT",
      "heading": "成果與限制",
      "k": "DFS 找到的是「一條可通的路」",
      "v": "不是最短路徑",
      "todo": false,
      "p": "DFS 只保證找得到路，不保證最短——它會一頭鑽進第一個可行的方向，直到碰壁才回頭。若需要最短路徑，應改用廣度優先搜尋（BFS）或 A*。這也是這個作業最有價值的部分：親眼看到搜尋策略如何決定結果的好壞。"
    }
  ],
  "screensHeading": "搜尋過程",
  "shots": [
    { "cap": "01 — DFS 搜尋中，淺色為已造訪的格子" },
    { "cap": "02 — 抵達出口後顯示完整路徑" }
  ],
  "repo": {
    "idx": "06 — SOURCE",
    "heading": "原始碼",
    "name": "github.com/待補 · computer-graphics",
    "note": "網頁版位於 app/src/components/demos/，C++ 原始檔保存在 legacy/maze/。",
    "label": "在 GitHub 檢視",
    "url": "#"
  }
}
```

注意：`maze-game`（「人生任務系統（迷宮）」）是另一件作品，**不要**與此筆合併或修改。

- [ ] **Step 10: 建置並在瀏覽器逐頁確認**

```bash
cd "C:/github/跨領域資訊作品集網頁原型/app" && npm run dev
```

開啟 `http://localhost:5173`，依序確認：

1. `/courses/webgl` — 顯示 5 個區塊，其中 02、03 是 demo 區塊（顯示「three.js 展示建置中」），04 是執行內容，05 是學習成果
2. `/portfolio/maze-dfs` — 顯示 4 個區塊，02 是 demo 區塊（顯示淡粉色底 + 「迷宮展示建置中」）
3. 截圖區編號為 `06 — SCREENSHOTS`（課程頁）與 `05 — SCREENSHOTS`（迷宮頁）
4. `/portfolio` 列表出現第五張卡片「老鼠走迷宮：DFS 搜尋視覺化」
5. 其他既有課程與專案頁面外觀與改動前一致

- [ ] **Step 11: 驗證未知 demo 鍵會優雅降級（Review Focus 3）**

暫時把 `app/src/data/projects.json` 中 `maze-dfs` 的 `"demo": "maze"` 改成 `"demo": "maze-typo"`，重整 `/portfolio/maze-dfs`。

預期：該區塊顯示「此互動展示無法在此裝置上執行（未知的展示「maze-typo」）」，**同頁其他三個區塊、截圖區與原始碼區照常顯示，頁面不崩潰**。確認後把值改回 `"maze"`。

- [ ] **Step 12: Commit**

```bash
cd "C:/github/跨領域資訊作品集網頁原型"
git add app/src/components app/src/pages app/src/data app/src/styles/global.css
git commit -m "feat: 新增 demo 內容區塊型別與迷宮專案資料"
```

---

## Task 5: 迷宮互動元件

**Files:**
- Modify: `app/src/components/demos/Maze.jsx`（整份取代 Task 4 的佔位版）

**Interfaces:**
- Consumes: `search`、`createMaze`、`EXIT`、`SIZE`、`WALL`（Task 2）；`useCanvasStage`（Task 3）
- Produces: `<Maze />`，不接受 props

**設計要點：** 搜尋狀態（generator、已造訪集合、目前位置、解答路徑）全部放在 ref，由 RAF 迴圈直接讀寫並繪製 canvas，不經過 React 的 re-render。React state 只保留需要顯示在 DOM 上的東西（狀態文字、按鈕的 disabled）。

`phase` 有五個值：`idle` | `searching` | `done` | `unreachable` | `need-entrance`。
`playing` 是**獨立於 phase 的布林值**，代表「自動播放中」。分成兩個狀態是刻意的——單步之後 phase 仍是 `searching`，只是 `playing` 為 false；若把「單步」也編進 phase，就無法區分「單步中」與「跑完了」。

- [ ] **Step 1: 改寫 Maze.jsx**

以以下內容整份取代 `app/src/components/demos/Maze.jsx`：

```jsx
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
```

**幾個容易寫錯的地方：**

- `handleStep` **先** `setPhase("searching")` **才** `advance()`。`advance()` 若結束會把 phase 覆寫成 `done` / `unreachable`；兩者在同一批次，後寫的勝出。反過來寫就會讓 `done` 被蓋成 `searching`，狀態列永遠停在「單步模式」
- `advance()` 在 `found` / `unreachable` 時把 `genRef.current` 設為 `null`，下一次「單步」才會重新開始，而不是卡在已耗盡的 generator 上
- `playing` 只在 `useRef` 的初始值裡出現一次，不在每次 render 覆寫。若寫成 `viewRef.current.playing = playing`，RAF 迴圈剛設好的值會在下次 render 被打回舊值
- `frame` 每格重設 transform，不在 `init` 或 `onResize` 裡處理縮放。這樣 resize 後不需要額外同步，少一條會失效的路徑

- [ ] **Step 2: 建置確認**

```bash
cd "C:/github/跨領域資訊作品集網頁原型/app" && npm run build
```

預期：建置成功。

- [ ] **Step 3: 瀏覽器驗證迷宮行為**

```bash
cd "C:/github/跨領域資訊作品集網頁原型/app" && npm run dev
```

開啟 `/portfolio/maze-dfs`，確認：

1. 畫面顯示 10×10 迷宮，牆是灰綠色、通道是淡粉色、右上角出口是棕色
2. 未設入口時按「開始搜尋」與「單步」→ 狀態列顯示「尚未設定入口——請切換到『模式：設定入口』後點選一個通道格子」
3. 切換到「設定入口」模式，點座標 (5,1) 的位置（上排往下數第二列、左邊數來第六格）→ 該格變成棕色
4. 按「開始搜尋」→ 看到淺綠色逐步擴散，並出現深綠色目前位置
5. 抵達出口後整條路徑變成深綠色，狀態列顯示路徑長度
6. 按「重置」→ 迷宮還原、入口消失、狀態列回到初始文字
7. 「單步」每按一次只前進一格，狀態列顯示「單步模式 · 已造訪 N 格」
8. 單步走到出口 → 狀態列變成「已抵達出口 · 路徑長度 N 格」（**不是**停在「單步模式」）；再按一次「單步」會重新開始
9. 速度切換慢／中／快，重新開始後速率確實不同
10. 點出口那格 → 沒有變化；把入口設在牆上 → 沒有反應
11. 用「挖牆」模式把格子 (9,1)（右上角出口往下第一格）填成牆，設定入口後開始 → 顯示「從這個入口無法抵達出口」

- [ ] **Step 4: 用鍵盤操作一次**

按 Tab 走訪所有控制項，確認每顆按鈕都有可見的 focus 樣式，Enter / Space 都能作用。

- [ ] **Step 5: 確認 reduced-motion 不影響迷宮（Review Focus 5）**

開啟「模擬 prefers-reduced-motion: reduce」，重整，按「開始搜尋」。

預期：**搜尋動畫照常播放**。迷宮的動態完全由使用者按下按鈕才開始，屬於使用者主動要求的動作，不該被抑制。

- [ ] **Step 6: Commit**

```bash
cd "C:/github/跨領域資訊作品集網頁原型"
git add app/src/components/demos/Maze.jsx
git commit -m "feat: 實作迷宮 DFS 互動展示"
```

---

## Task 6: 墨西哥帽子元件

**Files:**
- Create: `app/src/components/demos/hatParams.js`
- Create: `app/src/components/demos/hatParams.test.js`
- Modify: `app/src/components/demos/MexicanHat.jsx`（整份取代佔位版）
- Modify: `app/package.json`（加 `three`）

**Interfaces:**
- Consumes: `useCanvasStage`（Task 3）
- Produces:
  - `HAT_LIMITS` — `{ moonSpeed, earthSpeed, earth1Distance, earth2Distance }`，各有 `{ min, max, step, initial }`
  - `adjust(current: number, key: string, direction: 1 | -1): number`
  - `<MexicanHat />`，不接受 props

- [ ] **Step 1: 安裝 three.js**

```bash
cd "C:/github/跨領域資訊作品集網頁原型/app" && npm install three@^0.186.0
```

預期：`package.json` 的 `dependencies` 出現 `three`。

- [ ] **Step 2: 寫 hatParams 的失敗測試**

建立 `app/src/components/demos/hatParams.test.js`：

```js
import test from "node:test";
import assert from "node:assert/strict";
import { HAT_LIMITS, adjust } from "./hatParams.js";

test("增加時加上一個 step", () => {
  assert.equal(adjust(0.05, "moonSpeed", 1), 0.055);
});

test("已在最大值時增加無效", () => {
  assert.equal(adjust(HAT_LIMITS.moonSpeed.max, "moonSpeed", 1), HAT_LIMITS.moonSpeed.max);
});

test("減少時減去一個 step", () => {
  assert.equal(adjust(0.05, "moonSpeed", -1), 0.045);
});

test("已在最小值時減少無效，且不會低於下限", () => {
  assert.equal(adjust(HAT_LIMITS.moonSpeed.min, "moonSpeed", -1), HAT_LIMITS.moonSpeed.min);
});

test("不會因浮點誤差累積而超出範圍", () => {
  let value = HAT_LIMITS.earthSpeed.initial;
  for (let i = 0; i < 200; i++) value = adjust(value, "earthSpeed", 1);
  assert.equal(value, HAT_LIMITS.earthSpeed.max);
});

test("四個參數的初始值都在範圍內", () => {
  for (const [key, limit] of Object.entries(HAT_LIMITS)) {
    assert.ok(limit.initial >= limit.min && limit.initial <= limit.max, `${key} 初始值超出範圍`);
  }
});

test("距離參數可增加到 400 / 500 且不會超過", () => {
  let a = HAT_LIMITS.earth1Distance.initial;
  for (let i = 0; i < 100; i++) a = adjust(a, "earth1Distance", 1);
  assert.equal(a, 400);

  let b = HAT_LIMITS.earth2Distance.initial;
  for (let i = 0; i < 100; i++) b = adjust(b, "earth2Distance", 1);
  assert.equal(b, 500);
});

test("未知的參數鍵會拋錯", () => {
  assert.throws(() => adjust(1, "notAKey", 1), /未知的帽子參數/);
});
```

- [ ] **Step 3: 執行測試，確認失敗**

```bash
cd "C:/github/跨領域資訊作品集網頁原型/app" && npm test
```

預期：FAIL，`Cannot find module './hatParams.js'`（`mazeSearch.test.js` 的 10 個測試應通過）。

- [ ] **Step 4: 實作 hatParams.js**

建立 `app/src/components/demos/hatParams.js`。上下限與每次增減量**逐項對應原始檔 `legacy/mexican-hat/` 所引用的 `three.js-master/examples/js/myself/button.js`**：

```js
// 墨西哥帽子 demo 的可調參數。範圍與增減量對應原始檔的 button.js。
export const HAT_LIMITS = Object.freeze({
  moonSpeed: Object.freeze({ min: 0.01, max: 0.1, step: 0.005, initial: 0.05 }),
  earthSpeed: Object.freeze({ min: 0.001, max: 0.05, step: 0.002, initial: 0.01 }),
  earth1Distance: Object.freeze({ min: 100, max: 400, step: 10, initial: 200 }),
  earth2Distance: Object.freeze({ min: 150, max: 500, step: 10, initial: 250 }),
});

/**
 * 依原檔規則調整參數：增加時若已達上限則維持不變，
 * 減少時若已達下限也維持不變。
 */
export function adjust(current, key, direction) {
  const limit = HAT_LIMITS[key];
  if (!limit) throw new Error(`未知的帽子參數：${key}`);

  const next = current + direction * limit.step;
  // toFixed 消除浮點累積誤差，否則連續增減後會出現 0.30000000000000004 這類值，
  // 讓「已達上限」的比較失準
  const rounded = Number(next.toFixed(6));
  return Math.min(limit.max, Math.max(limit.min, rounded));
}
```

- [ ] **Step 5: 執行全部測試，確認通過**

```bash
cd "C:/github/跨領域資訊作品集網頁原型/app" && npm test
```

預期：PASS，`mazeSearch` 10 個 + `hatParams` 8 個，共 18 個通過。

- [ ] **Step 6: 改寫 MexicanHat.jsx**

以以下內容整份取代 `app/src/components/demos/MexicanHat.jsx`。**幾何與動畫數值逐段轉錄自 `legacy/mexican-hat/index.r83.html`**，只做必要的 API 變更。

```jsx
import { useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import useCanvasStage from "./useCanvasStage.js";
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
      {error && <p className="demo-fallback">此展示無法啟動：{error.message}</p>}
    </div>
  );
}
```

- [ ] **Step 7: 建置並在瀏覽器確認**

```bash
cd "C:/github/跨領域資訊作品集網頁原型/app" && npm run build && npm run dev
```

開啟 `/courses/webgl`，確認：

1. 五個天體都以線框顯示，太陽（橘）與兩顆地球（綠、藍）呈帽狀 sinc 曲面，月球（深藍）較小
2. 拖曳可旋轉視角、滾輪可縮放
3. 八顆按鈕都有作用，下方數字隨之改變
4. 月球半徑明顯週期性縮放（範圍 0.5～1.5 倍）
5. 把地球半徑調到 400 後按「＋」不再變化；調到 100 後按「−」不再變化
6. 地球2 除了公轉也 visibly 沿 x 軸翻滾
7. Console 無 error

與原檔外觀不一致時，**回頭讀 `legacy/mexican-hat/index.r83.html` 的對應行**，不要憑感覺調整。

- [ ] **Step 8: 驗證 reduced-motion（Review Focus 5）**

在 Chrome 開發者工具的 Rendering 面板開啟「Emulate CSS media feature prefers-reduced-motion: reduce」，重整。

預期：**公轉與自轉停止**，畫面停在靜態一幀；拖曳與八顆按鈕仍可操作，且按下半徑按鈕後天體位置會在下一個影格更新。

- [ ] **Step 9: Commit**

```bash
cd "C:/github/跨領域資訊作品集網頁原型"
git add app/package.json app/package-lock.json app/src/components/demos/hatParams.js app/src/components/demos/hatParams.test.js app/src/components/demos/MexicanHat.jsx
git commit -m "feat: 以現代 three.js 改寫墨西哥帽子展示"
```

---

## Task 7: 機器人元件

**Files:**
- Modify: `app/src/components/demos/Robot.jsx`（整份取代佔位版）

**Interfaces:**
- Consumes: `useCanvasStage`（Task 3）、`three`（Task 6）
- Produces: `<Robot />`，不接受 props

**三個必須知道的原始檔特性：**

1. **沒有頭部骨架。** 原檔的骨架只有 root / body / 左右臂 / 左右腿共六根，頭是直接掛在 `bodyBone` 底下的 `Mesh`。頭部動畫是直接寫 `headMesh.rotation.x`，所以 `sceneRef` 要一併暴露 `headMesh`。
2. **軀幹寫法必須改。** 原檔把不含 `skinIndex`／`skinWeight` 的軀幹幾何放進 `SkinnedMesh` 再 `bind()` 骨架。現代 three.js 仍會顯示，但那是靠 WebGL 對缺失頂點屬性補上的通用預設值 `(0,0,0,1)`，屬未定義行為。改寫版把軀幹改成一般 `Mesh` 直接掛在 `bodyBone` 底下，視覺相同但語意正確。
3. **動作之間會殘留角度。** 原檔多數動作分支只設定部分關節而沒有先歸零，所以切換動作時會帶著前一個動作的角度。這是原檔的行為，予以保留——**只有「立正」會把所有關節歸零**，原檔的頁面上也寫著「換動作前先立正」。

- [ ] **Step 1: 改寫 Robot.jsx**

以以下內容整份取代 `app/src/components/demos/Robot.jsx`。幾何與動畫公式**逐段轉錄自 `legacy/robot/index.r83.html`**。

```jsx
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
```

**注意**：這裡**刻意不使用** `prefers-reduced-motion`。原檔的機器人完全由按鈕觸發、沒有任何自動播放，OrbitControls 的自動旋轉也沒有啟用，因此沒有需要抑制的非必要動態。若使用者在 reduced-motion 下按下「跳舞」卻看到靜止的機器人，那是壞掉而不是無障礙。

- [ ] **Step 2: 建置並在瀏覽器確認**

```bash
cd "C:/github/跨領域資訊作品集網頁原型/app" && npm run build && npm run dev
```

開啟 `/courses/webgl`，確認：

1. 機器人顯示完整——**軀幹必須可見**（這是骨架改法的關鍵驗證點，若軀幹消失表示掛載方式寫錯）
2. 拖曳可環繞觀看、滾輪縮放
3. 九顆按鈕逐一測試，每個動作的姿態與開啟 `legacy/robot/index.r83.html` 的結果一致
4. 切換動作時一次只有一個動作生效，不會有兩個動作混在一起
5. 按「快跑」與「跳舞」時軀幹會左右擺動（驗證軀幹確實掛在 `bodyBone` 底下）
6. 按「立正」後所有關節歸零，恢復立正姿態
7. Console 無 error

與原檔外觀不一致時，**回頭讀 `legacy/robot/index.r83.html` 的 `update()`**，不要憑感覺調整。

- [ ] **Step 3: 確認 reduced-motion 下仍可操作（Review Focus 5）**

開啟「模擬 prefers-reduced-motion: reduce」，重整，按「跳舞」。

預期：**機器人照常跳舞**。（與帽子相反——帽子的公轉是自動播放，必須停；機器人的動作是使用者按出來的，必須動。）

- [ ] **Step 4: Commit**

```bash
cd "C:/github/跨領域資訊作品集網頁原型"
git add app/src/components/demos/Robot.jsx
git commit -m "feat: 以現代 three.js 改寫機器人大變身展示"
```

---

## Task 8: 部署與驗收

**Files:**
- Create: `app/vercel.json`

- [ ] **Step 1: 建立 SPA 路由重寫設定**

建立 `app/vercel.json`：

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

沒有這個設定，直接開啟 `/portfolio/maze-dfs` 會回 404——而推甄審查者正是會直接點深連結的人。

- [ ] **Step 2: 建置確認**

```bash
cd "C:/github/跨領域資訊作品集網頁原型/app" && npm run build
```

預期：建置成功，`dist/` 產生。確認 `dist/assets/` 中有多個 chunk——three.js 應獨立成一個較大的 chunk，不與首頁 bundle 混在一起。

- [ ] **Step 3: 執行全部單元測試**

```bash
cd "C:/github/跨領域資訊作品集網頁原型/app" && npm test
```

預期：18 個測試全數通過。

- [ ] **Step 4: 提交並推送**

```bash
cd "C:/github/跨領域資訊作品集網頁原型"
git add app/vercel.json
git commit -m "chore: 新增 Vercel SPA 路由重寫設定"
```

接著在 GitHub 建立 repo 並推送（此步驟需要使用者本人的帳號授權）：

```bash
gh repo create computer-graphics-portfolio --private --source=. --remote=origin --push
```

若 `gh` 未登入，請使用者執行 `! gh auth login` 後重試。

- [ ] **Step 5: 部署到 Vercel**

此步驟需要使用者本人的帳號授權。請使用者執行：

```
! npx vercel login
```

登入完成後：

```bash
cd "C:/github/跨領域資訊作品集網頁原型/app" && npx vercel --prod
```

**部署時 Root Directory 必須設為 `app`**（若從 repo 根目錄部署，需在 Vercel 專案設定中把 Root Directory 指到 `app`）。部署完成後記下正式網址。

- [ ] **Step 6: 驗收——深連結**

在瀏覽器**直接輸入**（不是從首頁點進去）以下網址：

1. `<正式網址>/courses/webgl`
2. `<正式網址>/portfolio/maze-dfs`

預期：兩者都正常載入，**不回 404**。若 404，檢查 Step 1 的 `vercel.json` 是否在 `app/` 目錄下且已部署。

- [ ] **Step 7: 驗收——連續換頁不洩漏 WebGL context（Review Focus 2）**

在 `/courses/webgl` 與 `/portfolio/maze-dfs` 之間來回**導覽六次**，最後回到 `/courses/webgl`。

預期：**帽子與機器人兩個展示仍正常顯示並可互動。** 若第三次之後開始出現空白 canvas 或 console 出現 `Too many active WebGL contexts`，表示 `useCanvasStage` 的釋放路徑沒生效，回到 Task 3 檢查 cleanup。

- [ ] **Step 8: 驗收——360px 寬度（Review Focus 4）**

在開發者工具中把視窗設為 360×800，逐頁檢查 `/courses/webgl`、`/portfolio/maze-dfs`、`/portfolio`。

預期：**沒有橫向捲動**（在 console 執行 `document.documentElement.scrollWidth <= window.innerWidth` 應為 `true`），canvas 維持正方形且不超出容器。若控制項在小螢幕擠壓變形，調整附錄 A 的 `.demo-controls` 換行設定。

- [ ] **Step 9: 驗收——WebGL 不可用（Review Focus 1）**

在 Chrome 開啟 `chrome://flags`，把 `#disable-webgl` 設為 Enabled，重開瀏覽器，載入 `/courses/webgl`。

預期：兩個 demo 區塊各自顯示一段說明文字，**頁面的文字內容、截圖區、原始碼區全部照常顯示，不崩潰**。確認後把 flag 設回 Default。

- [ ] **Step 10: 驗收——Console 乾淨**

逐頁開啟 `/`、`/portfolio`、`/courses/webgl`、`/portfolio/maze-dfs`，確認 console **沒有任何 error**。

- [ ] **Step 11: 回填連結並重新部署**

把 `app/src/data/courses.json` 的 `links.url` 與 `app/src/data/projects.json` 中 `maze-dfs` 的 `repo.url` 從 `"#"` 改為實際的 GitHub 網址，`name` 與 `note` 的「待補」一併更新。

```bash
cd "C:/github/跨領域資訊作品集網頁原型"
git add app/src/data
git commit -m "docs: 回填課程與迷宮專案的原始碼連結"
cd app && npx vercel --prod
```

- [ ] **Step 12: 回報驗收結果**

把 Step 6～10 的實際結果逐項列出回報。任何一項未通過都要明確說明，不要略過。

---

## 附錄 A：demo 樣式

追加到 `app/src/styles/global.css` 結尾。只使用既有的 `:root` token。

```css
/* ---------- demo 區塊 ---------- */

.demo-stage {
  margin-top: var(--gap-lg);
  display: flex;
  flex-direction: column;
  gap: var(--gap);
}

.demo-canvas-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  max-height: min(70vh, 560px);
  margin-inline: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.demo-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: manipulation;
  cursor: crosshair;
}

.demo-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.demo-speeds {
  display: flex;
  gap: 4px;
  margin-inline-start: auto;
}

.demo-controls .btn[aria-pressed="true"] {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--surface);
}

.demo-status,
.demo-caption,
.demo-note {
  margin: 0;
  font-size: var(--fs-small);
  line-height: 1.7;
  color: var(--muted);
}

.demo-note {
  padding-inline-start: 12px;
  border-inline-start: 2px solid var(--border);
  font-size: var(--fs-mono);
}

.demo-fallback {
  margin: 0;
  padding: var(--gap-lg);
  font-size: var(--fs-small);
  line-height: 1.8;
  color: var(--muted);
  text-align: center;
}

@media (max-width: 600px) {
  .demo-speeds {
    margin-inline-start: 0;
  }
}
```
