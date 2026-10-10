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
  return (
    <Reveal className="section" data-od-id={anchor}>
      <SectionHead idx={idx} heading={heading} />
      {erd && <ErDiagram />}
      <div className="shot-grid">
        {shots.map((s) => (
          <figure className="shot" key={s.cap} style={{ margin: 0 }}>
            <div className="ph-img">圖片待補</div>
            <figcaption className="shot-cap">{s.cap}</figcaption>
          </figure>
        ))}
      </div>
    </Reveal>
  );
}

export function LinkRow({ idx, heading, link, anchor }) {
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
