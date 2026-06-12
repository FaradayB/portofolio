import { cv } from "../data/cv";

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <div className="crest"><i className="ti ti-chess-knight" /></div>
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
