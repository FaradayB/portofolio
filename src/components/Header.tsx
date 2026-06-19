import { cv } from "../data/cv";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";
import EnergyPicker from "./EnergyPicker";

export default function Header() {
  const initials = cv.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          {initials}
          {/* Drop a square photo at public/profile.jpg to replace the initials.
              If the file is missing the image hides itself and initials show. */}
          <img
            src="/profile.jpg"
            alt={cv.name}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </div>
        <div>
          <div className="brand-name">{cv.name}</div>
          <div className="brand-role">{cv.role}</div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-hints">
          <a href={`mailto:${cv.emailHint}`}>{cv.emailHint}</a>
          <a href={`https://${cv.githubHint}`} target="_blank" rel="noopener">{cv.githubHint}</a>
        </div>
        <EnergyPicker />
        <ThemeToggle />
      </div>
    </header>
  );
}
