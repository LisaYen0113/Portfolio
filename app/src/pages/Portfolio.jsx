import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import projects from "../data/projects.json";
import courses from "../data/courses.json";
import ProjectCard from "../components/ProjectCard.jsx";
import { IconChevron } from "../components/icons.jsx";
import Footer from "../components/Footer.jsx";
import Reveal from "../components/Reveal.jsx";

export default function Portfolio() {
  const categories = useMemo(
    () => ["全部", ...Array.from(new Set(projects.map((p) => p.category)))],
    []
  );
  const [active, setActive] = useState("全部");

  const visible =
    active === "全部"
      ? projects
      : projects.filter((p) => p.category === active);

  return (
    <>
      <Reveal as="header" className="page-head" data-od-id="portfolio-head">
        <span className="eyebrow">作品集</span>
        <h1 className="page-title">作品集</h1>
        <p className="page-intro">
          從資訊系統、AI 應用到互動設計與產品企劃，以下是完整的專案與課程實作。
        </p>
      </Reveal>

      <Reveal className="section" data-od-id="portfolio-list">
        <div className="filter-bar" role="tablist" aria-label="作品分類">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={active === c}
              className={`filter-chip${active === c ? " is-active" : ""}`}
              onClick={() => setActive(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="card-grid">
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </Reveal>

      <Reveal className="section" data-od-id="courses">
        <div className="more-head">
          <h2 className="section-title">課程與延伸實作</h2>
          <span className="section-idx">COURSE · 01–05</span>
        </div>

        <div className="more-list">
          {courses.map((c) => (
            <Link className="more-item" key={c.id} to={`/courses/${c.id}`}>
              <div>
                <div className="mi-title">{c.listTitle}</div>
                <p className="mi-desc">{c.listDesc}</p>
              </div>
              <div className="mi-right">
                <span className="mi-form">{c.listForm}</span>
                <span className="mi-go" aria-hidden="true">
                  <IconChevron />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Reveal>

      <Footer backTo="/" backLabel="返回首頁 ↑" />
    </>
  );
}
