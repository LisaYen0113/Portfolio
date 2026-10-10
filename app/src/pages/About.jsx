import { useEffect } from "react";
import Footer from "../components/Footer.jsx";
import Reveal from "../components/Reveal.jsx";

export default function About() {
  useEffect(() => {
    document.title = "個人介紹 — 顏妤帆";
    return () => {
      document.title = "顏妤帆 — 作品集";
    };
  }, []);

  return (
    <>
      <Reveal as="header" className="page-head" data-od-id="about-head">
        <span className="eyebrow">個人介紹</span>
        <h1 className="page-title">顏妤帆</h1>
        <p className="page-intro">
          資訊管理 × 資訊技術。習慣先把問題拆解清楚，再決定要用什麼流程與工具解決。
        </p>
      </Reveal>

      <Reveal className="section" data-od-id="about-body">
        <div className="about-grid">
          <div>
            <p className="prose">
              我是顏妤帆，目前就讀輔仁大學資訊管理學系，並修習資訊技術（資工）相關課程。
              我喜歡把模糊的需求整理成清楚的流程，再用系統與介面把它落實。
            </p>
            <p className="prose">
              在專案中，我通常負責需求分析、流程規劃與前端實作；也樂於跨到資料處理與資料庫，
              把一個想法從「問題」一路推進到「可以用的東西」。
            </p>
            <p className="prose">
              這個作品集收錄了我的專題、課程實作與競賽企劃，紀錄我在學習與實作上的累積。
            </p>
          </div>

          <aside className="about-facts" data-od-id="about-facts">
            <div>
              <div className="fact-k">就讀學校</div>
              <div className="fact-v">輔仁大學</div>
            </div>
            <div>
              <div className="fact-k">主修</div>
              <div className="fact-v">資訊管理學系</div>
            </div>
            <div>
              <div className="fact-k">輔系 / 修課</div>
              <div className="fact-v">資訊技術（資工）</div>
            </div>
            <div>
              <div className="fact-k">關注領域</div>
              <div className="fact-v">需求分析 · 流程規劃 · 資料應用</div>
            </div>
          </aside>
        </div>
      </Reveal>

      <Footer backTo="/" backLabel="返回首頁 ↑" />
    </>
  );
}
