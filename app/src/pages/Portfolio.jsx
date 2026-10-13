import { useState } from "react";
import projects from "../data/projects.json";
import courses from "../data/courses.json";
import WorkCard from "../components/WorkCard.jsx";
import Footer from "../components/Footer.jsx";
import Reveal from "../components/Reveal.jsx";
import useViewTransition from "../components/useViewTransition.js";

// 專案與課程實作共用同一面卡片牆。課程的詳細頁在 /courses/:id、專案在 /portfolio/:id，
// 這兩個欄位只有在這一頁才需要，所以由這裡補上，資料檔本身維持原樣。
const WORKS = [
  ...projects.map((p) => ({ ...p, kind: "PROJECT", to: `/portfolio/${p.id}` })),
  ...courses.map((c) => ({ ...c, kind: "COURSE", to: `/courses/${c.id}` })),
];

const CATEGORIES = ["全部", ...new Set(WORKS.map((w) => w.category))];

export default function Portfolio() {
  const [active, setActive] = useState("全部");
  const withTransition = useViewTransition();

  const visible =
    active === "全部" ? WORKS : WORKS.filter((w) => w.category === active);

  // 切到同一個分類不用重跑轉場
  const selectCategory = (next) => {
    if (next === active) return;
    withTransition(() => setActive(next));
  };

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
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={active === c}
              className={`filter-chip${active === c ? " is-active" : ""}`}
              onClick={() => selectCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="card-grid">
          {visible.map((w, i) => (
            /* 每張卡各自進場。整面卡片牆如果一起被觀察，捲到第三列時前三列
               早就淡入完了，等於沒有動畫；交給卡片自己等自己進畫面。
               同一列由左而右錯開 70ms（三欄時一列是 0／70／140ms）。 */
            <WorkCard key={w.id} work={w} delay={(i % 3) * 70} />
          ))}
        </div>
      </Reveal>

      <Footer backTo="/" backLabel="返回首頁 ↑" />
    </>
  );
}
