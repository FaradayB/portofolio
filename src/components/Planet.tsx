/**
 * Decorative celestial body in the bottom-right corner, anchored partially
 * off-screen and fixed BEHIND all content. Dark theme shows a cratered moon;
 * light theme shows a glowing sun. Both are rendered and CSS reveals the one
 * matching the active <html data-theme>. The moon's rim-light and the sun's
 * rays are tinted with the active energy color via `stroke: var(--accent)` in
 * CSS. Non-interactive (pointer-events: none) — never touches readability.
 */
export default function Planet() {
  return (
    <div className="planet-field" aria-hidden="true">
      {/* Moon — dark theme */}
      <svg className="planet planet-moon" viewBox="0 0 300 300" fill="none">
        <defs>
          <radialGradient id="moonBody" cx="36%" cy="32%" r="80%">
            <stop offset="0%" stopColor="#26262f" />
            <stop offset="55%" stopColor="#15151b" />
            <stop offset="100%" stopColor="#0b0b11" />
          </radialGradient>
          <filter id="moonGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <circle cx="150" cy="150" r="135" fill="url(#moonBody)" />
        {/* craters — faint, just enough to read as a moon */}
        <circle cx="112" cy="118" r="13" fill="#000" opacity="0.18" />
        <circle cx="188" cy="158" r="20" fill="#000" opacity="0.16" />
        <circle cx="132" cy="200" r="10" fill="#000" opacity="0.18" />
        <circle cx="205" cy="206" r="7" fill="#000" opacity="0.16" />
        {/* energy-color rim-light on the edge facing the nebula (upper-left) */}
        <path
          className="planet-rim"
          d="M150 15 A135 135 0 0 0 15 150"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.55"
          filter="url(#moonGlow)"
        />
      </svg>

      {/* Sun — light theme */}
      <svg className="planet planet-sun" viewBox="0 0 300 300" fill="none">
        <defs>
          <radialGradient id="sunBody" cx="42%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#fff7e0" />
            <stop offset="45%" stopColor="#ffdf8a" />
            <stop offset="80%" stopColor="#ffb24a" />
            <stop offset="100%" stopColor="#f59023" />
          </radialGradient>
          {/* soft warm halo bleeding past the disc */}
          <radialGradient id="sunCorona" cx="50%" cy="50%" r="50%">
            <stop offset="52%" stopColor="#ffb24a" stopOpacity="0" />
            <stop offset="74%" stopColor="#ffb24a" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#ffb24a" stopOpacity="0" />
          </radialGradient>
          <filter id="sunGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          {/* one ray; rotated copies below build the full corona */}
          <line id="sunRay" x1="150" y1="44" x2="150" y2="8" strokeWidth="6" strokeLinecap="round" />
        </defs>

        {/* corona halo */}
        <circle cx="150" cy="150" r="132" fill="url(#sunCorona)" />

        {/* energy-tinted rays radiating from the disc */}
        <g className="planet-rays" filter="url(#sunGlow)" opacity="0.5">
          <use href="#sunRay" />
          <use href="#sunRay" transform="rotate(30 150 150)" />
          <use href="#sunRay" transform="rotate(60 150 150)" />
          <use href="#sunRay" transform="rotate(90 150 150)" />
          <use href="#sunRay" transform="rotate(120 150 150)" />
          <use href="#sunRay" transform="rotate(150 150 150)" />
          <use href="#sunRay" transform="rotate(180 150 150)" />
          <use href="#sunRay" transform="rotate(210 150 150)" />
          <use href="#sunRay" transform="rotate(240 150 150)" />
          <use href="#sunRay" transform="rotate(270 150 150)" />
          <use href="#sunRay" transform="rotate(300 150 150)" />
          <use href="#sunRay" transform="rotate(330 150 150)" />
        </g>

        {/* sun disc */}
        <circle cx="150" cy="150" r="100" fill="url(#sunBody)" />
        {/* upper-left highlight, matching the moon's lit edge */}
        <circle cx="150" cy="150" r="100" fill="url(#sunCorona)" opacity="0.4" />
      </svg>
    </div>
  );
}
