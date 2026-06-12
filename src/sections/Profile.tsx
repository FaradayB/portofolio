import { cv } from "../data/cv";

export default function Profile() {
  return (
    <div className="profile">
      <div className="diamond">◆</div>
      <div className="profile-role">{cv.role}</div>
      <p className="profile-bio">{cv.bio}</p>
      <div className="stat-row">
        {cv.stats.map((s) => (
          <span className="stat-pill" key={s}>{s}</span>
        ))}
      </div>
      <a className="btn-download" href={cv.resumePdf} target="_blank" rel="noopener">
        <i className="ti ti-download" /> Download CV
      </a>
    </div>
  );
}
