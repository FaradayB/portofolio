import { useEffect, useRef, useState, type CSSProperties } from "react";
import { sections, SectionId } from "../data/sections";
import Icon from "./Icon";
import Celestial, { type CelestialName } from "./Celestial";

/* -------------------------------------------------------------------------
   Endless arc-wheel navigation.

   Each item sits on the edge of a large INVISIBLE circle whose centre is
   off-screen to the right, so only the left bulge shows as a curved sidebar.
   Wheel / drag rotate `offset`; items recycle forever with no seam.
   ------------------------------------------------------------------------- */

const SPACING = 3;                 // angular gap between items (degrees)
const RADIUS = 1440;                // circle radius (px)
const PILL_W = 175;                // fixed pill size (kept in sync with CSS vars)
const PILL_H = 42;
const COUNT = sections.length;
const TOTAL = COUNT * SPACING;
const HALF = TOTAL / 2;
// px of vertical drag that equals one item — makes a pill track the pointer 1:1
const DEG_PER_PX = SPACING / (RADIUS * Math.sin((SPACING * Math.PI) / 180));

const hasRAF = typeof requestAnimationFrame === "function";

interface Props {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}

interface Traveler {
  id: number;
  icon: CelestialName;
  dur: number;
}

function useMediaQuery(query: string): boolean {
  const get = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false;
  const [match, setMatch] = useState(get);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(query);
    const handler = () => setMatch(mq.matches);
    handler();
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [query]);
  return match;
}

// current theme, by observing <html data-theme="…"> (set by ThemeToggle)
function useTheme(): "dark" | "light" {
  const get = () =>
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "light"
      ? "light"
      : "dark";
  const [theme, setTheme] = useState<"dark" | "light">(get);
  useEffect(() => {
    if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;
    const obs = new MutationObserver(() => setTheme(get()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

const indexOf = (id: SectionId) => sections.findIndex((s) => s.id === id);
const nearestIndex = (offset: number) =>
  ((Math.round(offset / SPACING) % COUNT) + COUNT) % COUNT;
const alignFor = (i: number, near: number) => {
  const base = i * SPACING;
  return base + Math.round((near - base) / TOTAL) * TOTAL;
};

export default function ArcWheelNav({ active, onSelect }: Props) {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const mobile = useMediaQuery("(max-width: 860px)");
  const theme = useTheme();

  const activeIndex = indexOf(active);

  const stageRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(activeIndex * SPACING);
  const targetRef = useRef(activeIndex * SPACING);
  const rafRef = useRef<number | null>(null);
  const lastSelRef = useRef(activeIndex);
  const programmaticRef = useRef(false); // true while easing to a clicked/arrowed item
  const dragRef = useRef({ active: false, moved: false, startY: 0, startOffset: 0 });

  const [offset, setOffset] = useState(activeIndex * SPACING);
  const [dims, setDims] = useState({ w: 340, h: 640 });
  // celestial icons drifting down the arc rail (spawned at random intervals)
  const [travelers, setTravelers] = useState<Traveler[]>([]);

  // keep the selection ref in sync if the active view changes from elsewhere
  useEffect(() => { lastSelRef.current = activeIndex; }, [activeIndex]);

  // measure the stage (drives the off-screen circle centre)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [reduced, mobile]);

  // live-select the centred section as the ring rotates (drag / wheel)
  function liveSelect(o: number) {
    const idx = nearestIndex(o);
    if (idx !== lastSelRef.current) {
      lastSelRef.current = idx;
      onSelect(sections[idx].id);
    }
  }

  function tick() {
    const o = offsetRef.current;
    const t = targetRef.current;
    const d = t - o;
    if (Math.abs(d) < 0.06) {
      offsetRef.current = t;
      setOffset(t);
      if (!programmaticRef.current) liveSelect(t);
      const idx = nearestIndex(t);
      const aligned = alignFor(idx, t);
      if (Math.abs(aligned - t) > 0.1) {
        targetRef.current = aligned;            // snap a pill to centre
        rafRef.current = requestAnimationFrame(tick);
      } else {
        programmaticRef.current = false;
        rafRef.current = null;
      }
      return;
    }
    const next = o + d * 0.16;
    offsetRef.current = next;
    setOffset(next);
    if (!programmaticRef.current) liveSelect(next);
    rafRef.current = requestAnimationFrame(tick);
  }

  function animate() {
    if (!hasRAF) {
      offsetRef.current = targetRef.current;
      setOffset(targetRef.current);
      liveSelect(targetRef.current);
      return;
    }
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
  }

  function selectIndex(i: number) {
    lastSelRef.current = i;
    programmaticRef.current = true;
    onSelect(sections[i].id);
    targetRef.current = alignFor(i, offsetRef.current);
    animate();
  }

  function step(delta: number) {
    selectIndex((lastSelRef.current + delta + COUNT) % COUNT);
  }

  // wheel navigation: only the main content drives section changes. Let it
  // scroll until it reaches its top or bottom edge; a further scroll there
  // moves to the prev/next section. One section per notch, briefly locked.
  useEffect(() => {
    if (reduced || mobile) return;
    let lockUntil = 0;
    const onWheel = (e: WheelEvent) => {
      const t = e.target as Element | null;
      const content = (t && typeof t.closest === "function"
        ? t.closest(".stage")
        : null) as HTMLElement | null;
      if (!content) return; // ignore scrolls outside the main view
      const atTop = content.scrollTop <= 2;
      const atBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 2;
      const down = e.deltaY > 0;
      // still room to scroll in this direction → let the content scroll
      if ((down && !atBottom) || (!down && !atTop)) return;
      // content already at its edge → change section
      e.preventDefault();
      const now = Date.now();
      if (now < lockUntil || Math.abs(e.deltaY) < 1) return;
      lockUntil = now + 600;
      step(down ? 1 : -1);   // scroll down → next section
      content.scrollTop = 0; // start the new section at the top
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, mobile]);

  useEffect(() => () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); }, []);

  // spawn a celestial icon down the rail every few seconds (desktop, motion on)
  useEffect(() => {
    if (reduced || mobile) return;
    const pair: readonly CelestialName[] =
      theme === "light" ? ["sun", "saturn"] : ["star", "moon"];
    let alive = true;
    let timer = 0;
    const spawn = () => {
      if (!alive) return;
      const icon = pair[Math.random() < 0.5 ? 0 : 1];
      setTravelers((t: Traveler[]) => [
        ...t,
        { id: Date.now() + Math.random(), icon, dur: 6 + Math.random() * 3 },
      ]);
      timer = window.setTimeout(spawn, 4000 + Math.random() * 4000);
    };
    timer = window.setTimeout(spawn, 1200 + Math.random() * 2000);
    return () => { alive = false; clearTimeout(timer); };
  }, [reduced, mobile, theme]);

  const removeTraveler = (id: number) =>
    setTravelers((t: Traveler[]) => t.filter((x: Traveler) => x.id !== id));

  function onPointerDown(e: React.PointerEvent) {
    programmaticRef.current = false;
    dragRef.current = {
      active: true, moved: false,
      startY: e.clientY, startOffset: offsetRef.current,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d.active) return;
    const dy = e.clientY - d.startY;
    if (Math.abs(dy) > 5) d.moved = true;
    const o = d.startOffset + dy * DEG_PER_PX;
    offsetRef.current = o;
    targetRef.current = o;
    setOffset(o);
    liveSelect(o);
  }
  function onPointerUp(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    animate(); // settle / snap to nearest
  }

  function onKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown": case "ArrowRight": e.preventDefault(); step(1); break;
      case "ArrowUp": case "ArrowLeft": e.preventDefault(); step(-1); break;
      case "Home": e.preventDefault(); selectIndex(0); break;
      case "End": e.preventDefault(); selectIndex(COUNT - 1); break;
    }
  }

  const srSummary = (
    <p className="sr-only">
      Section navigation. {COUNT} items on a rotating wheel. Use the arrow keys to
      move between sections; press Enter to open the focused section.
    </p>
  );

  // ---- Reduced motion OR mobile: plain, conventional menus -----------------
  if (reduced) {
    return (
      <nav className="arcwheel" aria-label="Sections">
        {srSummary}
        <div className="arclist">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              className={"arc-pill" + (s.id === active ? " is-active" : "")}
              aria-pressed={s.id === active}
              aria-current={s.id === active ? "page" : undefined}
              onClick={() => onSelect(s.id)}
            >
              <span className="arc-ico"><Icon name={s.icon} size={14} /></span>
              <span className="arc-label">{s.label}</span>
            </button>
          ))}
        </div>
      </nav>
    );
  }

  if (mobile) {
    return (
      <nav className="tabbar" aria-label="Sections">
        {srSummary}
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            className={"tab" + (s.id === active ? " is-active" : "")}
            aria-pressed={s.id === active}
            aria-current={s.id === active ? "page" : undefined}
            onClick={() => onSelect(s.id)}
          >
            <Icon name={s.icon} size={18} />
            <span>{s.label}</span>
          </button>
        ))}
      </nav>
    );
  }

  // ---- Desktop arc wheel ---------------------------------------------------
  const centerX = dims.w + RADIUS - 150;
  const centerY = dims.h / 2;

  // sample the same circle the pills ride into a path (top -> bottom) so the
  // dashed rail and the celestial travelers share one geometry.
  const span = Math.asin(Math.min(0.98, (dims.h / 2 + 80) / RADIUS)); // radians
  const SAMPLES = 24;
  let railPath = "";
  for (let i = 0; i <= SAMPLES; i++) {
    const a = Math.PI + span - 2 * span * (i / SAMPLES); // top (-y) -> bottom (+y)
    const px = centerX + RADIUS * Math.cos(a);
    const py = centerY + RADIUS * Math.sin(a);
    railPath += (i === 0 ? "M" : "L") + px.toFixed(1) + " " + py.toFixed(1) + " ";
  }

  return (
    <nav
      className="arcwheel"
      aria-label="Sections"
      onKeyDown={onKeyDown}
      style={{ "--pill-w": `${PILL_W}px`, "--pill-h": `${PILL_H}px` } as CSSProperties}
    >
      {srSummary}
      <div className="arcwheel-guide" aria-hidden="true" />
      <div
        ref={stageRef}
        className="arcwheel-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <svg className="arcwheel-rail" width={dims.w} height={dims.h} aria-hidden="true">
          <path d={railPath} />
        </svg>
        {travelers.map((t: Traveler) => (
          <div
            key={t.id}
            className="arc-traveler"
            style={{
              ["offsetPath" as string]: `path('${railPath}')`,
              animationDuration: `${t.dur}s`,
            } as CSSProperties}
            onAnimationEnd={() => removeTraveler(t.id)}
            aria-hidden="true"
          >
            <Celestial name={t.icon} size={18} />
          </div>
        ))}
        {sections.map((s, i) => {
          let rel = (((i * SPACING - offset) % TOTAL) + TOTAL) % TOTAL;
          if (rel > HALF) rel -= TOTAL;
          const a = ((180 + rel) * Math.PI) / 180;
          const x = centerX + RADIUS * Math.cos(a);
          const y = centerY + RADIUS * Math.sin(a);
          const left = x - PILL_W / 2;
          const top = y - PILL_H / 2;
          const opacity = Math.max(0.12, 1 - (Math.abs(rel) / HALF) * 0.9);
          const isActive = s.id === active;
          return (
            <button
              key={s.id}
              type="button"
              data-index={i}
              className={"arc-pill" + (isActive ? " is-active" : "")}
              aria-pressed={isActive}
              aria-current={isActive ? "page" : undefined}
              style={{ transform: `translate3d(${left}px, ${top}px, 0)`, opacity }}
              onClick={() => { if (!dragRef.current.moved) selectIndex(i); }}
            >
              <span className="arc-ico"><Icon name={s.icon} size={14} /></span>
              <span className="arc-label">{s.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
