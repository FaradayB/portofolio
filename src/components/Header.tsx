import { cv } from "../data/cv";

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <div className="crest">
          <i className="ti ti-chess-knight" />
          {/* Drop a square photo at public/profile.jpg to replace the crest icon.
              If the file is missing the image hides itself and the icon shows. */}
          <img
            className="crest-photo"
            src="/profile.jpg"
            alt={cv.name}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </div>
        <div>
          <div className="header-name">{cv.name.toUpperCase()}</div>
          <div className="header-rule" />
          <div className="header-role">{cv.role.toUpperCase()}</div>
        </div>
      </div>
      <div className="header-hints">
        <div><i className="ti ti-mail" />: {cv.emailHint}</div>
        <div><i className="ti ti-brand-github" />: {cv.githubHint}</div>
      </div>
    </header>
  );
}
