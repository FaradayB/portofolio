import { useEffect, useRef, useState, type CSSProperties } from "react";
import Icon from "./Icon";

type Theme = "dark" | "light";
type Energy = "arc" | "solar" | "void" | "orokin";

const ENERGIES: { id: Energy; label: string; swatch: string }[] = [
  { id: "arc", label: "Arc", swatch: "#3ba9ff" },
  { id: "solar", label: "Solar", swatch: "#ff9d3b" },
  { id: "void", label: "Void", swatch: "#9a6bff" },
  { id: "orokin", label: "Orokin", swatch: "#e7c873" },
];

function initialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage?.getItem("theme");
  if (saved === "dark" || saved === "light") return saved;
  if (typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  return "dark";
}

function initialEnergy(): Energy {
  if (typeof window === "undefined") return "void";
  const saved = window.localStorage?.getItem("energy");
  if (saved && ENERGIES.some((e) => e.id === saved)) return saved as Energy;
  return "void";
}

export default function ThemeMenu() {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [energy, setEnergy] = useState<Energy>(initialEnergy);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage?.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-energy", energy);
    window.localStorage?.setItem("energy", energy);
  }, [energy]);

  // close on outside click / Escape while open
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const nextTheme: Theme = theme === "dark" ? "light" : "dark";
  const activeSwatch = ENERGIES.find((e) => e.id === energy)?.swatch;

  return (
    <div className="theme-menu" ref={rootRef}>
      <button
        type="button"
        className="theme-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Theme"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name={theme === "dark" ? "moon" : "sun"} size={16} />
        <span className="theme-menu-label">Theme</span>
        <span
          className="theme-menu-dot"
          style={{ ["--dot" as string]: activeSwatch } as CSSProperties}
        />
      </button>

      {open && (
        <div className="theme-menu-panel" role="menu" aria-label="Theme">
          <div className="theme-menu-section">Mode</div>
          <button
            type="button"
            className="theme-menu-mode"
            role="menuitem"
            onClick={() => setTheme(nextTheme)}
          >
            <Icon name={theme === "dark" ? "moon" : "sun"} size={16} />
            <span>{theme === "dark" ? "Dark" : "Light"}</span>
            <span className="theme-menu-meta">{nextTheme}</span>
          </button>

          <div className="theme-menu-section">Energy</div>
          {ENERGIES.map((e) => (
            <button
              key={e.id}
              type="button"
              className={"theme-menu-energy" + (energy === e.id ? " is-active" : "")}
              role="menuitemradio"
              aria-checked={energy === e.id}
              onClick={() => setEnergy(e.id)}
            >
              <span
                className="theme-menu-swatch"
                style={{ ["--swatch" as string]: e.swatch } as CSSProperties}
              />
              <span>{e.label}</span>
              <span className="theme-menu-check" aria-hidden="true">✓</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
