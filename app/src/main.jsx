import React from "react";
import ReactDOM from "react-dom/client";
// 用 BrowserRouter 而不是 HashRouter：規格 §8.3／驗收 §9.3 的深連結是路徑形式
// （直接開啟 /portfolio/maze-dfs 不得 404），而 vercel.json 的 rewrites 正是為此存在——
// 在 HashRouter 底下那個設定毫無作用，深連結 /portfolio/maze-dfs 只會回 index.html、
// 落到 #/ 顯示首頁，於是「不 404」的驗收會靜默通過卻顯示錯的頁面。
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
