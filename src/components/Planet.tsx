/**
 * Decorative celestial body in the bottom-right corner, anchored partially
 * off-screen and fixed BEHIND all content. Dark theme shows a cratered moon;
 * light theme shows a ringed planet (Saturn). Both are rendered and CSS reveals
 * the one matching the active <html data-theme>. The rim-light / ring are
 * tinted with the active energy color via `stroke: var(--accent)` in CSS.
 * Non-interactive (pointer-events: none) — never touches readability.
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

      {/* Ringed planet — light theme */}
      <svg className="planet planet-saturn" viewBox="0 0 360 300" fill="none">
        <defs>
          <radialGradient id="saturnBody" cx="38%" cy="33%" r="80%">
            <stop offset="0%" stopColor="#f6f1e6" />
            <stop offset="60%" stopColor="#e4ddcb" />
            <stop offset="100%" stopColor="#cdc3ad" />
          </radialGradient>
          <radialGradient id="saturnShade" cx="64%" cy="70%" r="60%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.16" />
            <stop offset="70%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          {/* lower half of the canvas — reveals the ring's near side over the body */}
          <clipPath id="ringFront">
            <rect x="0" y="150" width="360" height="160" />
          </clipPath>
        </defs>
        {/* ring — full ellipse (its far side is then covered by the body) */}
        <ellipse
          className="planet-ring"
          cx="180" cy="150" rx="165" ry="46"
          transform="rotate(-18 180 150)"
          strokeWidth="20"
          opacity="0.3"
        />
        {/* planet body */}
        <circle cx="180" cy="150" r="92" fill="url(#saturnBody)" />
        <circle cx="180" cy="150" r="92" fill="url(#saturnShade)" />
        {/* ring — near side, drawn over the body */}
        <g clipPath="url(#ringFront)">
          <ellipse
            className="planet-ring"
            cx="180" cy="150" rx="165" ry="46"
            transform="rotate(-18 180 150)"
            strokeWidth="20"
            opacity="0.3"
          />
        </g>
      </svg>
    </div>
  );
}
