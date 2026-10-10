# 課程作業原始檔

此目錄保存「電腦圖學」（資工雙主修）三份作業的原始程式碼，僅作對照與來源說明之用，不參與建置、不進部署產物。

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

## maze/main.utf8.cpp

- `maze/main.cpp` 的 UTF-8 轉錄版。內容逐字元相同（339 行），僅編碼由 Big5 轉為 UTF-8
- 存在理由：`main.cpp` 為 Big5 編碼，GitHub 以 UTF-8 解讀會使 27 行中文註解顯示為亂碼，不利線上閱讀
- 原始檔 `maze/main.cpp` 保留未更動，為真正的原始碼依據；此檔僅為方便閱讀的副本，不參與建置，亦不進部署產物
- 作品頁的「在 GitHub 檢視」連結指向此檔
