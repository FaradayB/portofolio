import { cv } from "../data/cv";
import Icon from "../components/Icon";

export default function Profile() {
  return (
    <div className="profile hud-frame">
      <div className="section-kicker">Available for AI roles</div>
      <h1 className="profile-role">{cv.role}</h1>
      <div className="flex flex-col gap-4"> 
        {cv.bio.map((paragraph, index) => (
          <p key={index} className="profile-bio">
            {paragraph}
          </p>
        ))}
      </div>
      <div className="stat-row">
        {cv.stats.map((s) => (
          <span className="stat-pill" key={s}>{s}</span>
        ))}
      </div>
      <a className="btn-download hud-rim" href={cv.resumePdf} target="_blank" rel="noopener">
        Download CV <Icon name="download" size={16} />
      </a>
    </div>
  );
}
