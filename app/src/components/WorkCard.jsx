import { Link } from "react-router-dom";
import Reveal from "./Reveal.jsx";

// 作品集頁共用的卡片：專案與課程實作都走這個版型，
// 差別只有右上角的編號後綴（PROJECT／COURSE）與點進去之後的路由。
// work 需要 to、kind 兩個由 Portfolio.jsx 補上的欄位，其餘欄位兩份資料都有。
// delay 由呼叫端給，用來讓同一排的卡片依序進場。
export default function WorkCard({ work, delay = 0 }) {
  const {
    id,
    to,
    kind,
    num,
    pill,
    cardTitle,
    cardDesc,
    cardTags,
    cardRole,
    mediaLabel,
  } = work;

  // 讓這張卡參與篩選切換的轉場（見 useViewTransition.js）。
  // view-transition-name 在一份文件裡必須唯一，撞名會讓整個轉場被跳過，
  // 所以帶上 kind：專案與課程的 id 各自獨立、可能同名。
  // id 萬一含有非法字元就換成連字號，避免名稱無效導致轉場默默失效。
  const transitionName = `card-${kind}-${id}`
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");

  return (
    <Reveal
      as={Link}
      className="card"
      to={to}
      delay={delay}
      data-od-id={`work-card-${id}`}
      style={{ viewTransitionName: transitionName }}
    >
      <div className="card-media" aria-hidden="true">
        <span>{mediaLabel}</span>
      </div>
      <div className="card-body">
        <div className="card-top">
          <span className="card-idx">
            {num} / {kind}
          </span>
          <span className="tag">{pill}</span>
        </div>
        <h3 className="card-title">{cardTitle}</h3>
        <p className="card-desc">{cardDesc}</p>
        <div className="card-tags">
          {cardTags.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>
        <div className="card-role">{cardRole}</div>
      </div>
    </Reveal>
  );
}
