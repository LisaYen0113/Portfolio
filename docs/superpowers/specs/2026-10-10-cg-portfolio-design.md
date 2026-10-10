# 電腦圖學作品集化 — 設計文件

日期：2026-10-10
狀態：待實作

## 1. 背景與目標

顏妤帆（資管二乙，修習資工輔系）正在進行研究所推甄，需要把「大二上電腦圖學」課程的三份作業放進既有的 React 作品集網站，作為備審資料可引用的公開連結。

三份作業現況：

| 作業 | 原始形式 | 現況 |
|---|---|---|
| 墨西哥帽子 | three.js r83 單檔 HTML，278 行 | 只能用 2017 年的 three.js 跑 |
| 機器人大變身 | three.js r83 單檔 HTML，507 行 | 同上 |
| 老鼠走迷宮 | C++ / freeglut，338 行，Big5 編碼 | 需編譯，審查者無法直接執行 |

**成功條件**：三份作業都能在公開網址上直接互動操作，且頁面說得清楚「這是什麼、我做了什麼」。

**目標讀者**：推甄審查教授。他們不會編譯 C++，也不會有耐心看程式碼；他們會點連結、看畫面、可能問一兩句。

## 2. 範圍

**範圍內**

- 三份作業改寫為可在瀏覽器直接互動的 React 元件
- 填入 `courses.json` 既有但空白的第 05 筆（`webgl`）
- 在 `projects.json` 新增一筆迷宮專案
- 新增 `demo` 內容區塊型別與其渲染器
- 建立 git repo、部署至 Vercel、設定 SPA 路由重寫
- 三份原始檔入庫作為對照

**範圍外**

- 不改動網站既有的視覺設計、排版或 design token（`DESIGN-HANDOFF.md` 是視覺契約）
- 不動其他四筆課程與其他四筆專案
- 不重寫成大型遊戲（迷宮維持演算法視覺化的定位）
- 不新增測試框架（網站目前無測試，見 §11）
- 不合併 `projects.json` 既有的 `maze-game`（「人生任務系統（迷宮）」）——那是不同的作品

## 3. 現況

作品集網站位於 `C:\github\跨領域資訊作品集網頁原型`。

- 技術棧：React 18.3.1、Vite 5.4.8、react-router-dom 6.26.2
- 資料驅動：`app/src/data/courses.json`、`app/src/data/projects.json`
- 詳情頁共用渲染器：`app/src/components/Detail.jsx`，其中 `FlowSection` 依 `block.type` 分派（現有 `prose` / `roles` / `result` 三型）
- 路由：`/courses/:id` → `CourseDetail`、`/portfolio/:id` → `ProjectDetail`
- 目前**不是 git repo、沒有 `node_modules`、沒有部署設定**

`courses.json` 第 05 筆 `webgl` 已是為這門課預留的位置（`title: "資工輔系修課成果"`、`pill: "精選課程作品"`），三個 flow 區塊與截圖欄位皆為待補狀態。

## 4. 資訊架構

依使用者決定：帽子與機器人留在課程頁，迷宮獨立為專案。

| 作品 | 歸屬 | 路由 |
|---|---|---|
| 墨西哥帽子 | `courses.json` #05 (`webgl`) | `/courses/webgl` |
| 機器人大變身 | `courses.json` #05 (`webgl`) | `/courses/webgl` |
| 老鼠走迷宮 | `projects.json` 新增，`id: "maze-dfs"` | `/portfolio/maze-dfs` |

**既有路由不需任何改動。** 兩個動態路由已能承載新內容，`Layout`、`NotFound`、`Footer` 皆沿用。

## 5. 資料結構

### 5.1 新增 `demo` 區塊型別

`FlowSection` 新增第四種 `type`：

```json
{
  "type": "demo",
  "idx": "02 — DEMO",
  "heading": "互動展示：墨西哥帽子",
  "demo": "mexican-hat",
  "caption": "拖曳可旋轉視角；下方按鈕對應作業要求的三項功能。",
  "note": "參考基礎：學長提供的行星公轉範例。我在此之上實作月球縮放振盪、調整兩顆地球的公轉半徑，以及地球2 的 x 軸翻滾。"
}
```

- `demo` 為 registry 的鍵，值域限 `"mexican-hat"` | `"robot"` | `"maze"`
- `caption`、`note` 皆為選填；`note` 即 §10 的參考基礎註記
- 未知的 `demo` 鍵必須優雅降級（見 §6）

### 5.2 `anchorFor()` 需同步更新

兩個詳情頁的 `anchorFor(block)` 目前會讓非 `roles` / `result` 的區塊落到同一個 `data-od-id`。新增 `demo` 分支，並以 `demo` 鍵區分，避免同頁多個 demo 撞號：

- `CourseDetail.jsx`：`demo` → `` `course-demo-${block.demo}` ``
- `ProjectDetail.jsx`：`demo` → `` `project-demo-${block.demo}` ``

### 5.2.1 區塊編號會撞號，需一併修正

`CourseDetail.jsx` 把截圖區的編號寫死為 `idx="04 — SCREENSHOTS"`，`ProjectDetail.jsx` 同樣寫死 `04 — SCREENSHOTS`。flow 從 3 塊擴充為 5 塊（課程頁）與 4 塊（專案頁）後，這兩個編號會與 flow 的區塊重複。

修正方式：由 flow 長度推算，不再寫死。

```js
const pad = (n) => String(n).padStart(2, "0");
const shotsIdx = `${pad(flow.length + 1)} — SCREENSHOTS`;
```

同時更新資料中的編號，使其接續：課程頁 `links.idx` → `"07 — LINK"`；迷宮專案的 `repo.idx` → `"06 — SOURCE"`。其餘既有課程與專案因 flow 長度未變，編號維持原樣。

### 5.3 `courses.json` #05 的內容

flow 由 3 塊擴充為 5 塊：

| idx | type | heading | 內容 |
|---|---|---|---|
| 01 — BACKGROUND | prose | 課程與學習脈絡 | 資工輔系修習電腦圖學，從圖元繪製、光照著色到互動動畫 |
| 02 — DEMO | demo | 互動展示：墨西哥帽子 | `demo: "mexican-hat"` |
| 03 — DEMO | demo | 互動展示：機器人大變身 | `demo: "robot"` |
| 04 — WORK | roles | 執行內容 | 三項實作重點 |
| 05 — OUTCOME | result | 學習成果 | 自製講義成績與學習心得 |

`spec` 更新為四欄：

| k | v | todo |
|---|---|---|
| 課程 | 電腦圖學 | false |
| 學期 | 113 學年度第 1 學期 | **true** |
| 修課身分 | 資工輔系 | false |
| 技術 | three.js · WebGL · C++ / OpenGL | false |

「學期」的值由學號 `412402311` 推算（`412` = 民國 112 年入學 → 大二上為 113 學年度第 1 學期），**未經使用者確認**，因此設 `todo: true`，由既有的 `is-todo` 樣式在頁面上標示為待確認。使用者確認正確後將 `todo` 改為 `false`，若推算有誤則直接更正 `v`。

### 5.4 `projects.json` 新增項目

新增於陣列最後，`num: "05"`。

```
id:         "maze-dfs"
num:        "05"
pill:       "Algorithm"
category:   "演算法"
title:      "老鼠走迷宮：DFS 搜尋視覺化"
```

flow 四塊：

| idx | type | heading | 內容 |
|---|---|---|---|
| 01 — BACKGROUND | prose | 作業背景 | 以深度優先搜尋在 10×10 迷宮中尋找出口 |
| 02 — DEMO | demo | 互動展示：DFS 搜尋 | `demo: "maze"` |
| 03 — APPROACH | roles | 演算法設計 | 見下 |
| 04 — RESULT | result | 成果與限制 | 見下 |

「演算法設計」三項：

1. **迷宮表示法** — 10×10 二維陣列，出口固定於 `[0][9]`
2. **DFS 與回溯** — 搜尋方向順序為**右 → 下 → 左 → 上**（沿用原檔 `dfs(x+1,y) || dfs(x,y+1) || dfs(x-1,y) || dfs(x,y-1)`）……；遞迴回傳 `true` 代表已抵達出口，`false` 觸發回溯
3. **互動與視覺化** — 入口設定、挖牆／補牆、動畫播放

「成果與限制」要誠實寫出：**DFS 找到的是「一條可通的路」，不是最短路徑**；若要最短路徑需改用 BFS 或 A*。這一條是加分項，顯示作者理解演算法的性質而非只會照抄。

### 5.5 `legacy/` 原始碼對照目錄

在 repo 根目錄新增：

```
legacy/
  README.md                 說明各檔來源與改寫對應
  mexican-hat/index.r83.html
  robot/index.r83.html
  maze/main.cpp
```

只放原始檔，**不包含** 2017 年的 `three.js-master/`（體積過大且非本人著作）。

`legacy/README.md` 逐檔說明：來源、作者、授權狀態、改寫成哪個元件、改了什麼。這是 §10 參考基礎註記的完整版。

各作品頁的「原始碼」連結指向對應的 `legacy/` 路徑，讓審查者能看「原始 → 改寫」的對照。

## 6. 元件架構

```
app/src/components/Demo.jsx              外殼：標題、說明、載入狀態、錯誤邊界
app/src/components/demos/registry.js     鍵 → lazy(() => import(...))
app/src/components/demos/MexicanHat.jsx
app/src/components/demos/Robot.jsx
app/src/components/demos/Maze.jsx
app/src/components/demos/useScene.js     共用：建立、尺寸、動畫迴圈、釋放
app/src/components/demos/mazeSearch.js   DFS generator（純函式，無 DOM 相依）
```

### 6.1 載入策略

- `registry.js` 以 `React.lazy` 包裝三個元件，各自成為獨立 chunk
- `Demo.jsx` 以 `IntersectionObserver` 決定何時掛載（沿用 `Reveal.jsx` 既有模式）：使用者滾到該區塊才 `import()` 並建立 WebGL context
- `Suspense` fallback 顯示與區塊同高的佔位，避免載入時版面跳動

### 6.2 資源釋放（必要，非最佳化）

React Router 換頁時 demo 元件被卸載。**若未釋放 WebGL context，連續瀏覽數頁就會耗盡瀏覽器約 16 個的 context 上限，導致整站後續的 canvas 全部失效。**

cleanup 必須：

1. `cancelAnimationFrame(rafId)`
2. 解除 `ResizeObserver`、`IntersectionObserver`
3. `geometry.dispose()`、`material.dispose()`、`texture.dispose()`
4. `renderer.dispose()`
5. `renderer.forceContextLoss()`

`useScene.js` 集中處理這五步，三個 demo 不得各自實作。

### 6.3 錯誤處理

- 每個 demo 各自包一層 error boundary。單一 demo 失敗不得影響整頁
- WebGL 不可用（無硬體加速、舊機器）時顯示一段說明文字（說明此展示需要 WebGL、可改用什麼方式瀏覽），而非白畫面
- registry 查不到 `block.demo` 鍵時，渲染一段「此展示尚未提供」的說明，不拋錯
- 開發模式下 `console.error` 記錄；正式建置不輸出

### 6.4 無障礙與偏好

- 尊重 `prefers-reduced-motion: reduce`：停用自動旋轉與自動播放，改為靜態一幀 + 手動操作
- 所有控制項使用真正的 `<button>`，鍵盤可達、focus 可見
- canvas 加上 `role="img"` 與 `aria-label` 描述內容；另提供一段文字說明作為替代
- 觸控裝置：canvas 的格點操作需同時支援 pointer 事件（滑鼠與觸控）

### 6.5 尺寸

canvas 尺寸由容器的 `ResizeObserver` 驅動，乘上 `window.devicePixelRatio`（上限 2，避免高解析手機過度繪製）。CSS 尺寸 100% 寬、以 `aspect-ratio` 固定比例，容器內不得產生橫向捲動。

## 7. 三個 demo 的實作規格

### 7.1 墨西哥帽子

**改寫幅度：小。** 原檔 278 行，僅兩處 API 需變更：

| 原檔（r83） | 現代 three.js（r186） |
|---|---|
| `new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors })` | `{ vertexColors: true }` |
| `geometry.addAttribute('position', …)` | `geometry.setAttribute('position', …)` |

已於 spike 中以 r186 實測確認：`THREE.VertexColors` 與 `BufferGeometry.prototype.addAttribute` 皆為 `undefined`，`setAttribute` + `Float32BufferAttribute` + `Line` 組合可正常建構。

保留原邏輯：sinc 函式線框球體、月球縮放振盪、地球與地球2 的公轉半徑、地球2 的 x 軸翻滾。

控制項：原檔的 `TrackballControls`（舊 `examples/js` 全域檔）改用 npm 版 `OrbitControls`。原檔 8 顆按鈕改寫為 React 按鈕列、由 state 驅動（原檔透過 `myself/button.js` 直接修改閉包變數）：

- 月球速度 +／−
- 地球速度 +／−
- 地球公轉半徑 +／−
- 地球2 公轉半徑 +／−

**這 8 顆按鈕對應作業的三項要求**（月球縮放、可調公轉半徑、地球2 自轉一圈），因此在版面上需顯眼、附說明文字，不可折疊或縮小到難以察覺。實作時逐一對照原檔確認每顆按鈕的作用變數。

### 7.2 機器人大變身

**改寫幅度：中。** 原檔 507 行。

**骨架改法（spike 結論）**：原檔把不含 skin weights 的軀幹幾何放進 `SkinnedMesh` 再 `bind()` 骨架。實測 r186 下仍會正確顯示，但這是因為缺失的頂點屬性被 WebGL 補上通用預設值 `(0,0,0,1)`，使 `skinWeight.x/y/z` 為 0、`skinIndex.w = 1` 指向 `bone[1]`（即 `bodyBone`）——**屬於未定義行為的僥倖成立，不應保留。**

改寫方式：

- 軀幹改為一般 `THREE.Mesh`，直接 `bodyBone.add(bodyMesh)`
- 移除 `new THREE.Skeleton([...])` 與 `bodyMesh.bind(skeleton)`
- 頭、眼、嘴、手、腳原本就是掛在 Bone 底下的普通 `Mesh`，維持不變

視覺結果與原檔一致，但不再依賴未定義行為。

**動作狀態**：9 種動作（走路／快走／快跑／招手／抱抱／沮喪／立正／跌倒／跳舞）全數保留。原檔以 9 個互斥布林旗標表示，改為**單一 `action` 字串 state**，消除「兩個動作同時為真」的非法狀態。動畫迴圈交由 `useScene.js` 管理。

需保留 `OrbitControls` 與 `MeshStandardMaterial` 光照設定。實作時逐一對照原檔確認每個動作的關節角度與時間參數。

### 7.3 老鼠走迷宮

**改寫幅度：重寫。** 原檔為 C++ / freeglut 338 行、Big5 編碼。

**為什麼用 Canvas 2D 而非 WebGL**：原檔是逐格 `GL_QUADS` 填色，Canvas 2D 的 `fillRect` 是它的直接對應。同一套心智模型、程式碼更短，且讓版面焦點落在**演算法**而非圖學 API。本作業的價值在 DFS 與回溯，不在繪圖技術。

**規格逐條對應原檔：**

| 原檔 | 網頁版 |
|---|---|
| 10×10 迷宮 | 同 |
| 出口固定 `[0][9]` | 同 |
| 右鍵選單三項：入口模式／挖牆、開始 DFS、重置 | 開始／重置／模式切換三顆按鈕，另加速度三檔按鈕群組（慢／中／快） |
| 搜尋方向：右 → 下 → 左 → 上 | 同 |
| 遞迴 DFS + 回溯 | 同（改為 generator，見下） |
| 學號繪於畫面 | 改為狀態列：「DFS 進行中 · 已探索 37 格」 |

**配色沿用原檔**（`main.cpp` 的 `glColor3f`）：

| 用途 | 原值 | Hex |
|---|---|---|
| 牆 | 0.698, 0.784, 0.733 | `#B2C8BB` |
| 通道 | 1.0, 0.961, 0.969 | `#FFF5F7` |
| 入口／出口 | 0.447, 0.325, 0.204 | `#725334` |
| 老鼠與路徑 | 0.271, 0.475, 0.290 | `#45794A` |

**動畫做法**：DFS 寫成 **generator**，放在 `mazeSearch.js`（純函式，不碰 DOM，可獨立測試）：

```
function* dfs(maze, start, exit)
  → 每探索一格 yield { type: "visit", x, y, depth }
  → 每回溯一格 yield { type: "backtrack", x, y }
  → 抵達出口    yield { type: "found", path }
```

UI 以 `requestAnimationFrame` + 時間累積器消費事件，速度可調。如此**是真的在執行 DFS**，而非播放預錄軌跡；暫停、單步、調速都是自然副產品。**單步功能對「解說演算法」尤其重要**，必須實作。

**互動規則**（沿用原檔語意）：

- 點格點切換牆／通道；出口 `[0][9]` 不可變更
- 入口模式下點格點設定入口；入口不可設在牆上
- 開始 DFS 前若無入口，顯示提示（原檔的入口預設為 `-1, -1`，即**沒有預設入口**，必須先設定）
- 「重置」還原為初始迷宮配置、清除入口、清除搜尋狀態——與原檔一致（原檔 Reset 會把 `entranceX/entranceY` 設回 `-1`）

**無障礙**：控制項皆為真按鈕。canvas 的格點操作支援 pointer 事件（滑鼠 + 觸控），並提供可見的操作說明文字。

## 8. 部署

1. 在 `C:\github\跨領域資訊作品集網頁原型` 執行 `git init`
2. 新增 `.gitignore`：`node_modules/`、`dist/`、`.DS_Store`
3. 新增 `app/vercel.json`：

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**這是必要設定。** 沒有它，直接開啟 `/portfolio/maze-dfs` 或 `/courses/webgl` 會回 404——而推甄審查者正是會直接點深連結的人。

4. Vercel 專案 Root Directory 設為 `app/`
5. repo 根目錄的原型 HTML（`course-webgl.html` 等）留在版控中作為設計依據，不進部署產物

## 9. 驗收條件

1. `npm run build` 通過，無錯誤
2. `npm run dev` 下三個 demo 皆可互動，且行為符合 §7
3. 部署後**直接開啟深連結** `/portfolio/maze-dfs` 與 `/courses/webgl` 不 404
4. 360×800 寬度下無橫向捲動，canvas 不破版
5. **連續換頁六次後 demo 仍正常運作**（驗證 §6.2 的 context 釋放確實在做）
6. 瀏覽器 console 無 error
7. 停用硬體加速或 WebGL 不可用時，頁面顯示替代說明而非白畫面

## 10. 參考基礎與學術誠信

帽子與機器人兩份作業皆建立在他人的範例程式碼之上：

- **墨西哥帽子**：以吳祐任學長的程式碼為基礎（作者本人的書面報告已註明），另參考陳冠宇學長的行星自轉作法
- **機器人大變身**：基於老師提供的 WebGL 版機器人範例

處理方式：各 demo 區塊的 `note` 欄位寫明參考基礎與**自己新增的部分**；`legacy/README.md` 提供完整說明。

理由：備審資料被追問時能誠實回答；把來源講清楚反而讓「我加了什麼」成為可辨識的具體貢獻；且審查者看得出這是課程作業，主動說明優於被動被問。

呈現上是一行低調的註記，不是道歉聲明。

## 11. 測試

網站目前無測試框架。**本專案不引入測試框架**——一週時程內，把時間投在三個 demo 的可用性上報酬率更高。

唯一例外：`mazeSearch.js` 是純函式、無 DOM 相依，以 `node --test`（Node 內建，無需新增相依）驗證：

- 能從入口抵達出口，回傳路徑首尾正確
- 路徑是連續的（相鄰格必相鄰）
- 路徑不穿牆
- 無解迷宮回傳 `null`

其餘以 §9 的手動驗收為準。

## 12. 待使用者自行核對的欄位

`courses.json` #05 的「學期」欄位依學號推算填入 `113 學年度第 1 學期`，並標記 `todo: true`（見 §5.3）。使用者已表明會自行核對更正，因此不阻擋實作。這是全份資料中唯一未經確認的值；其餘欄位皆已確定。

## 13. 風險與對策

| 風險 | 對策 |
|---|---|
| three.js 打包約 600KB | `React.lazy` 分 chunk，首頁不受影響 |
| 舊 `TrackballControls` 全域檔已不存在 | 改用 npm 版 `OrbitControls`（r186 確認存在） |
| WebGL context 洩漏導致整站失效 | §6.2 集中式釋放 + §9 第 5 點驗收 |
| 三份原檔的年齡與編碼 | 迷宮原檔為 Big5，讀取時需注意；僅作對照，不執行編譯 |
| 一週時程 | 三個 demo 中迷宮為重寫、風險最高，優先開工 |
