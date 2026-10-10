/**
 * 展示無法執行時要對使用者說的話。
 *
 * 由 Demo.jsx（錯誤邊界、未知的展示）與三個 demo 元件（初始化或繪製失敗）共用。
 * 放在獨立檔案而不是 Demo.jsx 裡，是因為 demo 元件由 registry 動態載入，
 * 反過來匯入 Demo.jsx 會形成循環匯入。
 */

/**
 * 函式庫的原始錯誤訊息（例如 THREE.WebGLRenderer: Error creating WebGL context.）
 * 只對開發者有意義，對使用者只是雜訊，因此僅在開發模式附上。
 */
function technicalDetail(error) {
  if (!import.meta.env.DEV || !error) return "";
  return `（技術細節：${error.message || String(error)}）`;
}

export default function DemoUnavailable({ reason, error }) {
  return (
    <p className="demo-fallback">
      此互動展示無法在此裝置上執行{reason ? `（${reason}）` : ""}。
      展示內容需要 WebGL 與 JavaScript，請改用支援的瀏覽器，或開啟硬體加速後重新整理。
      {technicalDetail(error)}
    </p>
  );
}
