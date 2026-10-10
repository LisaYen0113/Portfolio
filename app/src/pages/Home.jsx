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
          資訊管理 × 資訊技術。把需求拆解成可執行的流程與系統，並用清楚的介面把複雜的資訊變得容易理解。
        </p>
        <div className="hero-meta">
          <span className="tag">需求分析</span>
          <span className="tag">流程規劃</span>
          <span className="tag">資料應用</span>
          <span className="tag">前端實作</span>
        </div>
      </Reveal>

      <Reveal className="section" data-od-id="featured-work">
        <div className="section-head">
          <span className="section-idx">— SELECTED</span>
          <h2 className="section-title">精選作品</h2>
        </div>

        <div className="work-list">
          {featured.map((p) => (
            <Link className="work-row" key={p.id} to={`/portfolio/${p.id}`}>
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
            </Link>
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
