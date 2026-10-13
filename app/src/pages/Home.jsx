import { Link } from "react-router-dom";
import projects from "../data/projects.json";
import { IconChevron } from "../components/icons.jsx";
import Footer from "../components/Footer.jsx";
import Reveal from "../components/Reveal.jsx";

export default function Home() {
  const featured = projects.filter((p) => p.featured);

  return (
    <>
      <Reveal as="header" className="hero" data-od-id="hero">
        <span className="eyebrow">Portfolio · 2026</span>
        <h1>顏妤帆</h1>
        <p className="lead">
          資訊管理 × 資訊工程雙主修。從後端與 API 規格到 AI Agent 與空間分析，
          把需求拆解成可以運作的系統。
        </p>
        <div className="hero-meta">
          <span className="tag">後端開發</span>
          <span className="tag">API 設計</span>
          <span className="tag">AI Agent</span>
          <span className="tag">空間資訊</span>
        </div>
      </Reveal>

      <Reveal className="section" data-od-id="featured-work">
        <div className="section-head">
          <span className="section-idx">— SELECTED</span>
          <h2 className="section-title">精選作品</h2>
        </div>

        <div className="work-list">
          {featured.map((p, i) => (
            <Reveal
              as={Link}
              className="work-row"
              key={p.id}
              to={`/portfolio/${p.id}`}
              delay={i * 60}
            >
              <div>
                <span className="wr-idx">
                  {p.num} · {p.pill}
                </span>
                <div className="wr-title">{p.cardTitle}</div>
                <p className="wr-desc">{p.cardDesc}</p>
                <div className="wr-tags">
                  {p.cardTags.map((t) => (
                    <span className="tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="wr-right">
                <span className="wr-role">{p.cardRole}</span>
                <span className="wr-go" aria-hidden="true">
                  <IconChevron />
                </span>
              </div>
            </Reveal>
          ))}
        </div>

        <div style={{ marginTop: "28px" }}>
          <Link className="btn" to="/portfolio">
            查看全部作品與課程實作
          </Link>
        </div>
      </Reveal>

      <Footer backTo="top" />
    </>
  );
}
