import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import projects from "../data/projects.json";
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
  if (block.type === "demo") return `project-demo-${block.demo}`;
  if (block.type === "roles") return "project-body";
  if (block.type === "result")
    return block.idx.includes("EVALUATION")
      ? "project-evaluation"
      : "project-awards";
  return "project-background";
}

export default function ProjectDetail() {
  const { id } = useParams();
  const project = projects.find((p) => p.id === id);

  useEffect(() => {
    if (project) document.title = `${project.title} — 顏妤帆`;
    return () => {
      document.title = "顏妤帆 — 作品集";
    };
  }, [project]);

  if (!project) return <NotFound />;

  return (
    <>
      <header className="detail-hero" data-od-id="project-hero">
        <Link className="back-link" to="/portfolio">
          <IconChevronLeft />
          返回作品集
        </Link>

        <div className="work-top">
          <span className="tag">{project.pill}</span>
          <span className="work-index">{project.num} / PROJECT</span>
        </div>

        <h1 className="detail-title">{project.title}</h1>
        <p className="detail-lead">{project.lead}</p>

        <SpecGrid items={project.spec} />
      </header>

      {/* 作品連結放最上面：有連結就佔 01，其餘區塊順序往後遞延 */}
      <LinkRow
        idx={project.repo?.idx}
        heading={project.repo?.heading}
        link={project.repo}
        anchor="project-repo"
      />

      {project.flow.map((block, i) => (
        <FlowSection key={i} block={block} anchor={anchorFor(block)} />
      ))}

      <ShotGrid
        idx={`${pad(project.flow.length + (project.repo ? 2 : 1))} — ${project.screensIdx ?? "SCREENSHOTS"}`}
        heading={project.screensHeading}
        shots={project.shots}
        anchor="project-screenshots"
      />

      <Footer backTo="/portfolio" backLabel="返回作品集 ↑" />
    </>
  );
}
