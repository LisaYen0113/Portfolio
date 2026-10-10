import { NavLink } from "react-router-dom";
import {
  IconHome,
  IconUser,
  IconGrid,
  IconBadge,
  IconMail,
  IconCollapse,
} from "./icons.jsx";

const NAV = [
  { to: "/", label: "首頁", Icon: IconHome, end: true },
  { to: "/about", label: "個人介紹", Icon: IconUser },
  { to: "/portfolio", label: "作品集", Icon: IconGrid },
  { to: "/experience", label: "技能經歷", Icon: IconBadge },
  { to: "/contact", label: "聯絡方式", Icon: IconMail },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className="sidebar" data-od-id="sidebar">
      <div className="sidebar-head">
        <div className="sb-top">
          <NavLink className="logo" to="/" aria-label="顏妤帆 — 作品集">
            <span className="logo-mark" aria-hidden="true">
              顏
            </span>
            <span className="logo-name">顏妤帆</span>
          </NavLink>
        </div>
        <button
          type="button"
          className="sb-toggle"
          aria-label="收合側邊欄"
          aria-expanded={!collapsed}
          aria-controls="sb-nav"
          onClick={onToggle}
        >
          <IconCollapse />
        </button>
      </div>

      <div className="meta">Portfolio · 2026</div>

      <nav className="sidebar-nav" id="sb-nav" aria-label="主導覽">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `nav-item${isActive ? " is-active" : ""}`
            }
          >
            <span className="ic" aria-hidden="true">
              <Icon />
            </span>
            <span className="lbl">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">INFO MGMT × IT</div>
    </aside>
  );
}
