import { useEffect, useRef, useState, type CSSProperties } from "react";
import { sections, SectionId } from "../data/sections";
import Icon from "./Icon";

/* -------------------------------------------------------------------------
   Endless arc-wheel navigation.

   Each item sits on the edge of a large INVISIBLE circle whose centre is
   off-screen to the right, so only the left bulge shows as a curved sidebar.
   Wheel / drag rotate `offset`; items recycle forever with no seam.
   ------------------------------------------------------------------------- */

const SPACING = 10;                 // angular gap between items (degrees)
const RADIUS = 360;                // circle radius (px)
const PILL_W = 150;                // fixed pill size (kept in sync with CSS vars)
const PILL_H = 36;
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

  // keep selection ref in sync if the view changes from elsewhere
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

  // native, non-passive wheel listener so we can preventDefault page scroll
  useEffect(() => {
    const el = stageRef.current;
    if (!el || reduced || mobile) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      programmaticRef.current = false;
      targetRef.current += e.deltaY * 0.08;
      animate();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, mobile]);

  useEffect(() => () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); }, []);

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
