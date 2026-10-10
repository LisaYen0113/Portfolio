import { useEffect } from "react";
import Footer from "../components/Footer.jsx";
import Reveal from "../components/Reveal.jsx";

const EDUCATION = [
  {
    when: "2023 – 2027（預計 2027/6 畢業）",
    h: "輔仁大學 · 資訊管理學系",
    sub: "主修資訊管理學系，113 學年度起雙主修資訊工程學系。",
  },
];

const COURSE_HIGHLIGHTS = [
  "系統分析與設計 100",
  "資訊系統專題 95 / 97",
  "空間資訊管理 97",
  "離散數學 95",
  "資料結構 92",
  "資料庫管理 91",
];

const CERTS = [
  { n: "01", h: "Google Cloud 雲端認證", note: "取得年份待補" },
  { n: "02", h: "AWS 雲端認證", note: "取得年份待補" },
  { n: "03", h: "Hugging Face MCP 證書", note: "取得年份待補" },
];

const SKILLS = [
  {
    h: "後端與 API 設計",
    items: ["REST API", "API 規格文件", "HTTP 狀態碼", "Bearer Token 驗證"],
  },
  {
    h: "AI 應用與檢索",
    items: ["LangGraph", "RAG", "Embedding", "Prompt 優化"],
  },
  {
    h: "資料與空間資訊",
    items: ["Python", "SQL", "地理資訊處理", "空間分析"],
  },
  {
    h: "程式語言",
    items: ["Python（主要）", "Java", "C / C++", "JavaScript", "SQL", "PHP", "R"],
  },
  {
    h: "需求分析與協作",
    items: ["使用者訪談", "問卷驗證", "需求整理", "團隊協作"],
  },
];

export default function Experience() {
  useEffect(() => {
    document.title = "技能經歷 — 顏妤帆";
    return () => {
      document.title = "顏妤帆 — 作品集";
    };
  }, []);

  return (
    <>
      <Reveal as="header" className="page-head" data-od-id="experience-head">
        <span className="eyebrow">技能經歷</span>
        <h1 className="page-title">技能經歷</h1>
        <p className="page-intro">學歷、證照與技能，以及在專案中實際使用的能力。</p>
      </Reveal>

      <Reveal className="section" data-od-id="education">
        <div className="section-head">
          <span className="section-idx">01 — EDUCATION</span>
          <h2 className="section-title">學歷</h2>
        </div>
        <div className="timeline">
          {EDUCATION.map((e) => (
            <div className="tl-item" key={e.h}>
              <div className="tl-when">{e.when}</div>
              <div>
                <div className="tl-h">{e.h}</div>
                <p className="tl-sub">{e.sub}</p>
              </div>
            </div>
          ))}
          <div className="tl-item">
            <div className="tl-when">修課表現</div>
            <div>
              <div className="tl-h">專業科目</div>
              <ul className="skill-list">
                {COURSE_HIGHLIGHTS.map((c) => (
                  <li className="tag" key={c}>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal className="section" data-od-id="certifications">
        <div className="section-head">
          <span className="section-idx">02 — CERTIFICATIONS</span>
          <h2 className="section-title">證照</h2>
        </div>
        <div className="cert-list">
          {CERTS.map((c) => (
            <div className="cert" key={c.h}>
              <div className="cert-n">{c.n}</div>
              <div className="cert-h">{c.h}</div>
              <div className="cert-note">{c.note}</div>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal className="section" data-od-id="skills">
        <div className="section-head">
          <span className="section-idx">03 — SKILLS</span>
          <h2 className="section-title">技能</h2>
        </div>
        <div className="skills-grid">
          {SKILLS.map((s) => (
            <div className="skill-cat" key={s.h}>
              <div className="skill-cat-h">{s.h}</div>
              <ul className="skill-list">
                {s.items.map((it) => (
                  <li className="tag" key={it}>
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Reveal>

      <Footer backTo="/" backLabel="返回首頁 ↑" />
    </>
  );
}
