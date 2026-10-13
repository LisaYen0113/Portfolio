import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import courses from "../data/courses.json";
import {
  SpecGrid,
  FlowSection,
  ShotGrid,
  LinkRow,
} from "../components/Detail.jsx";
import { IconChevronLeft } from "../components/icons.jsx";
import Footer from "../components/Footer.jsx";
import NotFound from "./NotFound.jsx";

const pad = (n) => String(n).padStart(2, "0");

function anchorFor(block) {
  if (block.type === "demo") return `course-demo-${block.demo}`;
  if (block.type === "roles") return "course-body";
  if (block.type === "result") return "course-outcome";
  return "course-background";
}

export default function CourseDetail() {
  const { id } = useParams();
  const course = courses.find((c) => c.id === id);

  useEffect(() => {
    if (course) document.title = `${course.title} — 顏妤帆`;
    return () => {
      document.title = "顏妤帆 — 作品集";
    };
  }, [course]);

  if (!course) return <NotFound />;

  return (
    <>
      <header className="detail-hero" data-od-id="course-hero">
        <Link className="back-link" to="/portfolio">
          <IconChevronLeft />
          返回作品集
        </Link>

        <div className="work-top">
          <span className="tag">{course.pill}</span>
          <span className="work-index">COURSE · {course.num}</span>
        </div>

        <h1 className="detail-title">{course.title}</h1>
        <p className="detail-lead">{course.lead}</p>

        <SpecGrid items={course.spec} />
      </header>

      {/* 作品連結放最上面：有連結就佔 01，其餘區塊順序往後遞延 */}
      <LinkRow
        idx={course.links?.idx}
        heading={course.links?.heading}
        link={course.links}
        anchor="course-link"
      />

      {course.flow.map((block, i) => (
        <FlowSection key={i} block={block} anchor={anchorFor(block)} />
      ))}

      <ShotGrid
        idx={`${pad(course.flow.length + (course.links ? 2 : 1))} — ${course.screensIdx ?? "SCREENSHOTS"}`}
        heading={course.screensHeading}
        shots={course.shots}
        erd={course.erd}
        anchor="course-screenshots"
      />

      <Footer backTo="/portfolio" backLabel="返回作品集 ↑" />
    </>
  );
}
