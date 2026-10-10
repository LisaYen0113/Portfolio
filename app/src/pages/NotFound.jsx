import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  useEffect(() => {
    document.title = "找不到頁面 — 顏妤帆";
    return () => {
      document.title = "顏妤帆 — 作品集";
    };
  }, []);

  return (
    <section className="detail-hero" data-od-id="not-found">
      <span className="eyebrow">404</span>
      <h1 className="detail-title">找不到這個頁面</h1>
      <p className="detail-lead">你查看的頁面不存在，或連結已經更新。</p>
      <div style={{ marginTop: "28px" }}>
        <Link className="btn btn-primary" to="/">
          回到首頁
        </Link>
      </div>
    </section>
  );
}
