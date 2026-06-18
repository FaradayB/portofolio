/**
 * Celestial glyphs for the arc-wheel travelers.
 * Dark theme uses star/moon; light theme uses sun/saturn.
 * Stroke-based, currentColor — matches the Icon set. Saturn is multi-element
 * (planet + ring) so it can't live in the single-path Icon component.
 */
export type CelestialName = "star" | "moon" | "sun" | "saturn";

const SUN =
  "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4";
const MOON = "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z";
const STAR =
  "M12 3l2.1 5.3 5.4.4-4.1 3.5 1.3 5.3L12 14.6 7.3 17.5l1.3-5.3-4.1-3.5 5.4-.4z";

interface Props {
  name: CelestialName;
  size?: number;
}

export default function Celestial({ name, size = 18 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {name === "saturn" ? (
        <>
          <circle cx="12" cy="12" r="4.6" />
          <ellipse cx="12" cy="12" rx="9.5" ry="3.3" transform="rotate(-20 12 12)" />
        </>
      ) : (
        <path d={name === "sun" ? SUN : name === "moon" ? MOON : STAR} />
      )}
    </svg>
  );
}
