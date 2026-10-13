import Reveal from "./Reveal.jsx";
import ErDiagram from "./ErDiagram.jsx";
import SectionHead from "./SectionHead.jsx";
import Demo from "./Demo.jsx";

export function SpecGrid({ items }) {
  return (
    <div className="spec-grid" data-od-id="project-spec">
      {items.map((s) => (
        <div key={s.k}>
          <div className="spec-k">{s.k}</div>
          <div className={`spec-v${s.todo ? " is-todo" : ""}`}>{s.v}</div>
        </div>
      ))}
    </div>
  );
}

export function FlowSection({ block, anchor }) {
  // Demo 內部已自行包一層 Reveal；這裡直接回傳，否則會出現兩層 .section 造成多餘間距
  if (block.type === "demo") return <Demo block={block} anchor={anchor} />;

  return (
    <Reveal className="section" data-od-id={anchor}>
      <SectionHead idx={block.idx} heading={block.heading} />

      {block.type === "prose" && (
        <>
          <p className="prose">{block.text}</p>
          {block.todo && <div className="todo-note">待補：{block.todo}</div>}
        </>
      )}

      {block.type === "roles" && (
        /* 逐項進場要在這裡喊停：.roles 是 gap:1px 疊在 border 色底上的細線格，
           把 .role-item 藏起來只會先看到一格空格線。整區跟著 .section 進場。 */
        <div className="roles">
          {block.items.map((it) => (
            <div className="role-item" key={it.n}>
              <div className="role-n">{it.n}</div>
              <div>
                <div className="role-h">{it.h}</div>
                <p className="role-p">{it.p}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {block.type === "result" && (
        <div className="result-box">
          <div className="result-main">
            <div className="result-k">{block.k}</div>
            <div className={`result-v${block.todo ? " is-todo" : ""}`}>
              {block.v}
            </div>
          </div>
          <p className="result-p">{block.p}</p>
        </div>
      )}
    </Reveal>
  );
}

export function ShotGrid({ idx, heading, shots, anchor, erd }) {
  // 沒有截圖就整段不顯示，避免留一整排「圖片待補」
  if (!shots || shots.length === 0) return null;

  return (
    <Reveal className="section" data-od-id={anchor}>
      <SectionHead idx={idx} heading={heading} />
      {erd && <ErDiagram />}
      <div className="shot-grid">
        {shots.map((s, i) => (
          /* 截圖兩欄排，一張一張進場，同排由左而右錯開 70ms。
             .shot 本身沒有框線、.shot-grid 也是一般 gap，逐張淡入不會留下空框。 */
          <Reveal
            as="figure"
            className="shot"
            key={s.cap}
            delay={(i % 2) * 70}
            style={{ margin: 0 }}
          >
            {/* 有 src 就放圖，沒有才留「圖片待補」佔位 */}
            {s.src ? (
              <img className="shot-img" src={s.src} alt={s.cap} loading="lazy" />
            ) : (
              <div className="ph-img">圖片待補</div>
            )}
            <figcaption className="shot-cap">{s.cap}</figcaption>
          </Reveal>
        ))}
      </div>
    </Reveal>
  );
}

export function LinkRow({ idx, heading, link, anchor }) {
  // 沒有連結資料就整段不顯示。用「欄位不存在」判斷，不猜測 url 內容，既有頁面不受影響
  if (!link) return null;

  return (
    <Reveal className="section" data-od-id={anchor}>
      <SectionHead idx={idx} heading={heading} />
      <div className="repo-row">
        <div>
          <div className="repo-name">{link.name}</div>
          <div className="repo-note">{link.note}</div>
        </div>
        <a
          className="btn btn-primary"
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {link.label}
        </a>
      </div>
    </Reveal>
  );
}
