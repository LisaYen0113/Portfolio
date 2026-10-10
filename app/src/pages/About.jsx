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
          資訊管理 × 資訊工程。習慣先把問題拆解清楚，再決定要用什麼流程與工具解決。
        </p>
      </Reveal>

      <Reveal className="section" data-od-id="about-body">
        <div className="about-grid">
          <div>
            <p className="prose">
              我是顏妤帆，就讀輔仁大學資訊管理學系，113 學年度起雙主修資訊工程學系。
              我喜歡把模糊的需求整理成清楚的流程，再用系統與介面把它落實。
            </p>
            <p className="prose">
              在專題中，我主要負責後端開發與 API 規格制定——把 Request／Response 格式、
              HTTP 狀態碼與驗證方式寫成標準文件，讓團隊後續的功能有所依循。
              同時也處理環境指標的地理資訊與空間分析，並以 LangGraph 建構 AI 需求分析 Agent，
              引導使用者釐清自己的生活偏好。
            </p>
            <p className="prose">
              除了專題，我也參與國科會大專學生研究計畫，研究混合檢索架構 Agent 的解釋品質。
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
              <div className="fact-k">雙主修</div>
              <div className="fact-v">資訊工程學系（113 學年度起）</div>
            </div>
            <div>
              <div className="fact-k">在學期間</div>
              <div className="fact-v">2023 – 2027（預計 2027/6 畢業）</div>
            </div>
            <div>
              <div className="fact-k">關注領域</div>
              <div className="fact-v">後端開發 · API 設計 · AI Agent · 空間資訊</div>
            </div>
          </aside>
        </div>
      </Reveal>

      <Footer backTo="/" backLabel="返回首頁 ↑" />
    </>
  );
}
