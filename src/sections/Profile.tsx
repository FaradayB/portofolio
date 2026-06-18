import { cv } from "../data/cv";
import Icon from "../components/Icon";

export default function Profile() {
  return (
    <div className="profile">
      <div className="section-kicker">Available for AI roles</div>
      <h1 className="profile-role">{cv.role}</h1>
      <p className="profile-bio">{cv.bio}</p>
      <div className="stat-row">
        {cv.stats.map((s) => (
          <span className="stat-pill" key={s}>{s}</span>
        ))}
      </div>
      <a className="btn-download" href={cv.resumePdf} target="_blank" rel="noopener">
        Download CV <Icon name="download" size={16} />
      </a>
    </div>
  );
}
