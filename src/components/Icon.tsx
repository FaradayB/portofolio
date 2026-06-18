/**
 * Tiny inline-SVG icon set (stroke-based, currentColor) replacing the former
 * Tabler webfont CDN. Add new glyphs here as needed — no runtime dependency.
 */
export type IconName =
  | "user" | "school" | "briefcase" | "trophy" | "microscope" | "crown"
  | "chart" | "certificate" | "mail" | "chat" | "phone" | "linkedin"
  | "github" | "download" | "sun" | "moon" | "arrow";

const paths: Record<IconName, string> = {
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0",
  school: "M22 9 12 5 2 9l10 4 10-4ZM6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5",
  briefcase: "M3 8h18v12H3zM8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0V4ZM8 5H4v2a3 3 0 0 0 4 3M16 5h4v2a3 3 0 0 1-4 3M9 20h6M12 13v4",
  microscope: "M6 21h12M9 4l4 4-3 3-4-4zM10 9l5 5M11 17a5 5 0 0 0 6-5",
  crown: "M3 7l4 4 5-7 5 7 4-4-2 12H5z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  certificate: "M12 3 4 6v5c0 4 3.4 7.5 8 9 4.6-1.5 8-5 8-9V6z",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12Z",
  phone: "M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  linkedin: "M5 9v10M5 5v.01M9 19v-6a2 2 0 0 1 4 0v6M13 13a3 3 0 0 1 6 0v6",
  github: "M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C7.3 2.3 6.3 2.6 6.3 2.6a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 5 9c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21",
  download: "M12 3v12M7 11l5 5 5-5M5 21h14",
  sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
  arrow: "M5 12h14M13 6l6 6-6 6",
};

interface Props {
  name: IconName;
  size?: number;
  className?: string;
}

export default function Icon({ name, size = 18, className }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
