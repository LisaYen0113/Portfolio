import { Link } from "react-router-dom";

export default function Footer({ backTo, backLabel = "返回作品集 ↑" }) {
  return (
    <footer className="footer">
      <span>© 2026 顏妤帆 · 作品集</span>
      {backTo === "top" ? (
        <a
          className="to-top"
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          回到頂端 ↑
        </a>
      ) : (
        <Link className="to-top" to={backTo}>
          {backLabel}
        </Link>
      )}
    </footer>
  );
}
