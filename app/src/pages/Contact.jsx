import { useEffect } from "react";
import Footer from "../components/Footer.jsx";
import Reveal from "../components/Reveal.jsx";

const EMAIL = "yenlisa0113@gmail.com";
const GITHUB = "https://github.com/LisaYen0113";

const CONTACTS = [
  {
    k: "Email",
    v: EMAIL,
    note: "如需合作或進一步了解，歡迎來信。",
    href: `mailto:${EMAIL}`,
  },
  {
    k: "GitHub",
    v: "github.com/LisaYen0113",
    note: "專案原始碼與實作紀錄。",
    href: GITHUB,
  },
];

export default function Contact() {
  useEffect(() => {
    document.title = "聯絡方式 — 顏妤帆";
    return () => {
      document.title = "顏妤帆 — 作品集";
    };
  }, []);

  return (
    <>
      <Reveal as="header" className="page-head" data-od-id="contact-head">
        <span className="eyebrow">聯絡方式</span>
        <h1 className="page-title">聯絡方式</h1>
        <p className="page-intro">如果你想聊聊專案、合作或實習機會，歡迎透過以下方式聯繫。</p>
      </Reveal>

      <Reveal className="section" data-od-id="contact-list">
        <div className="contact-grid">
          {CONTACTS.map((c) => (
            <a
              className="contact-card"
              key={c.k}
              href={c.href}
              {...(c.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              <span className="contact-k">{c.k}</span>
              <span className="contact-v">{c.v}</span>
              <span className="contact-note">{c.note}</span>
            </a>
          ))}
        </div>
      </Reveal>

      <Footer backTo="/" backLabel="返回首頁 ↑" />
    </>
  );
}
