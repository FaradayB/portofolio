import { cv } from "../data/cv";

export default function Records() {
  return (
    <>
      {cv.projects.map((p) => (
        <div className="card project" key={p.title}>
          <div className="card-title">{p.title}</div>
          <div className="tech-row">
            {p.tech.map((t) => (
              <span className="tech-tag" key={t}>{t}</span>
            ))}
          </div>
          <div className="card-body">{p.description}</div>
          {(p.repo || p.demo) && (
            <div className="project-links">
              {p.repo && (
                <a href={p.repo} target="_blank" rel="noopener">Repo ↗</a>
              )}
              {p.demo && (
                <a href={p.demo} target="_blank" rel="noopener">Demo ↗</a>
              )}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
