import { useEffect } from "react";
import Footer from "../components/Footer.jsx";
import Reveal from "../components/Reveal.jsx";

const EDUCATION = [
  {
    when: "就讀年份待補",
    h: "輔仁大學 · 資訊管理學系",
    sub: "主修資訊管理，並修習資訊技術（資工）相關課程。",
  },
];

const CERTS = [
  { n: "01", h: "Google Cloud 雲端認證", note: "取得年份待補" },
  { n: "02", h: "AWS 雲端認證", note: "取得年份待補" },
  { n: "03", h: "Hugging Face MCP 證書", note: "取得年份待補" },
];

const SKILLS = [
  {
    h: "需求分析與問題拆解",
    items: ["使用者訪談", "需求整理", "問題定義", "流程梳理"],
  },
  {
    h: "流程與系統規劃",
    items: ["流程設計", "系統規劃", "資料建模", "規格撰寫"],
  },
  {
    h: "前端與實作",
    items: ["React", "HTML / CSS", "JavaScript", "互動設計"],
  },
  {
    h: "資料與工具",
    items: ["Python", "SQL", "資料分析", "Git / GitHub"],
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
