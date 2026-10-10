import { Link } from "react-router-dom";

export default function ProjectCard({ project }) {
  const { id, num, pill, cardTitle, cardDesc, cardTags, cardRole, mediaLabel } =
    project;

  return (
    <Link className="card" to={`/portfolio/${id}`} data-od-id={`project-card-${id}`}>
      <div className="card-media" aria-hidden="true">
        <span>{mediaLabel}</span>
      </div>
      <div className="card-body">
        <div className="card-top">
          <span className="card-idx">{num} / PROJECT</span>
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
    </Link>
  );
}
