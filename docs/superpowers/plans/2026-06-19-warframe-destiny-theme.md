# Warframe × Destiny 2 Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three signature systems — an energy-color picker, a reusable HUD frame kit, and a star-chart/Director nav — that make the portfolio read distinctly as Warframe × Destiny 2 (even blend), building on the existing subtle sci-fi polish.

**Architecture:** Mostly CSS extending the existing token system in `src/styles/cv.css`. One new React component (`EnergyPicker`) mirrors the existing `ThemeToggle` pattern (localStorage + a `data-*` attribute on `<html>`). Everything visual derives from the existing `--accent` / `--accent-soft` / `--on-accent` tokens, so the energy picker recolors the whole UI by overriding those tokens via `[data-energy="…"]` selectors.

**Tech Stack:** React 18 + TypeScript, plain CSS (custom properties, `clip-path`, `color-mix`, `radial-gradient`, keyframes), Vite. No new dependencies.

## Global Constraints

- **Even blend:** Destiny geometry (diamonds/rhombus, restraint) as structure; Warframe energy (glow, route, scanlines, color) as accents. Glow/scanlines/rims apply to chrome only — NEVER over paragraph/body text.
- **No website copy changes** beyond the new energy picker's `aria-label`/`title` (which are UI controls, not content). Section wording untouched.
- **No literal game IP** — energy names (Orokin/Arc/Solar/Void/Stasis) are internal labels/tooltips only.
- **Do NOT change** the scroll direction (`scroll down → next`), the wheel order (`a = ((180 - rel) * Math.PI) / 180` in `ArcWheelNav.tsx`), or the slide mapping (`setDir(d > 0 ? "up" : "down")` in `App.tsx`).
- **Default energy: Orokin gold.** Base CSS accent tokens are set to gold so first paint is gold (no flash).
- **Themes + reduced-motion must keep working.** Every energy has dark- AND light-theme variants. All new animations (`railFlow` recolor, `hudScan`, `hudRim`, `hudDraw`) must collapse under the existing `@media (prefers-reduced-motion: reduce)` block (global `animation-duration: 0.001ms !important`). `.hud-rim` carries a STATIC base `box-shadow` so its glow survives reduced-motion.
- **Performance:** CSS only — no per-particle DOM, no WebGL.
- **Environment:** node/npm NOT installed locally; `npm test`/`npm run build`/`tsc` cannot run here. Verify by inspection (read regions, `grep`, confirm TS syntax mirrors existing patterns). Real build check = Vercel preview after the user pushes. Write `EnergyPicker.tsx` carefully — a TS error only surfaces at Vercel build.
- **Git:** stage only (`git add`). Do NOT commit, do NOT push — the user does that.

---

### Task 1: Energy-color system

**Files:**
- Modify: `src/styles/cv.css` — retune base accent tokens to gold; add 10 `[data-energy]` override blocks; add `.energy-picker` / `.energy-swatch` styles.
- Create: `src/components/EnergyPicker.tsx`
- Modify: `src/components/Header.tsx` — render `<EnergyPicker />` in topbar-right.

**Interfaces:**
- Consumes: existing tokens `--accent`, `--accent-soft`, `--on-accent`, `--border-strong`, `--surface`, `--ease`; the `data-theme` attribute set by `ThemeToggle`.
- Produces: a `data-energy` attribute on `<html>` (values: `orokin|arc|solar|void|stasis`), persisted in `localStorage["energy"]`, default `orokin`. CSS class hooks `.energy-picker`, `.energy-swatch`, `.energy-swatch.is-active`.

- [ ] **Step 1: Retune the base DARK accent tokens to Orokin gold**

In `src/styles/cv.css`, in the `:root, :root[data-theme="dark"]` block, find:

```css
  --accent: #4d7cff;
  --accent-soft: rgba(77, 124, 255, 0.14);
  --on-accent: #ffffff;
```

Replace with:

```css
  --accent: #e7c873;
  --accent-soft: rgba(231, 200, 115, 0.18);
  --on-accent: #1a1405;
```

- [ ] **Step 2: Retune the base LIGHT accent tokens to Orokin gold (light variant)**

In the `:root[data-theme="light"]` block, find:

```css
  --accent: #3a5fe0;
  --accent-soft: rgba(58, 95, 224, 0.16);
  --on-accent: #ffffff;
```

Replace with:

```css
  --accent: #9a7b1e;
  --accent-soft: rgba(154, 123, 30, 0.16);
  --on-accent: #ffffff;
```

- [ ] **Step 3: Add the energy override blocks**

Find the end of the light block followed by the global reset:

```css
  --shadow: 0 18px 50px -30px rgba(40, 38, 28, 0.45);
}

* { box-sizing: border-box; }
```

Replace with (inserts the energy blocks between the closing `}` and `* { … }`):

```css
  --shadow: 0 18px 50px -30px rgba(40, 38, 28, 0.45);
}

/* ---------- energy colors — override accent tokens (default = Orokin gold) ----------
   Dark variants first, then higher-specificity light variants. */
:root[data-energy="orokin"] { --accent: #e7c873; --accent-soft: rgba(231, 200, 115, 0.18); --on-accent: #1a1405; }
:root[data-energy="arc"]    { --accent: #3ba9ff; --accent-soft: rgba(59, 169, 255, 0.15);  --on-accent: #04121f; }
:root[data-energy="solar"]  { --accent: #ff9d3b; --accent-soft: rgba(255, 157, 59, 0.16);  --on-accent: #1a0e00; }
:root[data-energy="void"]   { --accent: #9a6bff; --accent-soft: rgba(154, 107, 255, 0.16); --on-accent: #ffffff; }
:root[data-energy="stasis"] { --accent: #62d0ff; --accent-soft: rgba(98, 208, 255, 0.16);  --on-accent: #04121f; }

:root[data-theme="light"][data-energy="orokin"] { --accent: #9a7b1e; --accent-soft: rgba(154, 123, 30, 0.16); --on-accent: #ffffff; }
:root[data-theme="light"][data-energy="arc"]    { --accent: #1f6fd0; --accent-soft: rgba(31, 111, 208, 0.16); --on-accent: #ffffff; }
:root[data-theme="light"][data-energy="solar"]  { --accent: #c2660d; --accent-soft: rgba(194, 102, 13, 0.16); --on-accent: #ffffff; }
:root[data-theme="light"][data-energy="void"]   { --accent: #6b3fd0; --accent-soft: rgba(107, 63, 208, 0.16); --on-accent: #ffffff; }
:root[data-theme="light"][data-energy="stasis"] { --accent: #1487b8; --accent-soft: rgba(20, 135, 184, 0.16); --on-accent: #ffffff; }

* { box-sizing: border-box; }
```

- [ ] **Step 4: Add the energy-picker styles**

At the END of `src/styles/cv.css`, append:

```css
/* =========================================================================
   Energy-color picker (topbar)
   ========================================================================= */
.energy-picker {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 4px;
}
.energy-swatch {
  width: 16px;
  height: 16px;
  padding: 0;
  border: 1px solid var(--border-strong);
  border-radius: 4px;
  background: var(--swatch);
  cursor: pointer;
  transition: transform 0.18s var(--ease), box-shadow 0.18s var(--ease);
}
.energy-swatch:hover { transform: translateY(-2px); }
.energy-swatch.is-active {
  box-shadow: 0 0 0 2px var(--surface), 0 0 0 3px var(--swatch), 0 0 8px -1px var(--swatch);
}
.energy-swatch:focus-visible { outline: 2px solid var(--swatch); outline-offset: 2px; }

@media (max-width: 540px) {
  .energy-picker { display: none; }   /* keep the small-screen topbar uncrowded */
}
```

- [ ] **Step 5: Create the EnergyPicker component**

Create `src/components/EnergyPicker.tsx` with EXACTLY this content (mirrors `ThemeToggle.tsx`; the `["--swatch" as string]` cast matches the existing pattern used in `ArcWheelNav.tsx`):

```tsx
import { useEffect, useState, type CSSProperties } from "react";

type Energy = "orokin" | "arc" | "solar" | "void" | "stasis";

const ENERGIES: { id: Energy; label: string; swatch: string }[] = [
  { id: "orokin", label: "Orokin", swatch: "#e7c873" },
  { id: "arc", label: "Arc", swatch: "#3ba9ff" },
  { id: "solar", label: "Solar", swatch: "#ff9d3b" },
  { id: "void", label: "Void", swatch: "#9a6bff" },
  { id: "stasis", label: "Stasis", swatch: "#62d0ff" },
];

function initialEnergy(): Energy {
  if (typeof window === "undefined") return "orokin";
  const saved = window.localStorage?.getItem("energy");
  if (saved && ENERGIES.some((e) => e.id === saved)) return saved as Energy;
  return "orokin";
}

export default function EnergyPicker() {
  const [energy, setEnergy] = useState<Energy>(initialEnergy);

  useEffect(() => {
    document.documentElement.setAttribute("data-energy", energy);
    window.localStorage?.setItem("energy", energy);
  }, [energy]);

  return (
    <div className="energy-picker" role="radiogroup" aria-label="Energy color">
      {ENERGIES.map((e) => (
        <button
          key={e.id}
          type="button"
          className={"energy-swatch" + (energy === e.id ? " is-active" : "")}
          style={{ ["--swatch" as string]: e.swatch } as CSSProperties}
          role="radio"
          aria-checked={energy === e.id}
          aria-label={e.label}
          title={e.label}
          onClick={() => setEnergy(e.id)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Wire EnergyPicker into the Header**

In `src/components/Header.tsx`, add the import after the `ThemeToggle` import:

```tsx
import ThemeToggle from "./ThemeToggle";
import EnergyPicker from "./EnergyPicker";
```

Then find:

```tsx
        <div className="topbar-hints">
          <a href={`mailto:${cv.emailHint}`}>{cv.emailHint}</a>
          <a href={`https://${cv.githubHint}`} target="_blank" rel="noopener">{cv.githubHint}</a>
        </div>
        <ThemeToggle />
```

Replace with (inserts `<EnergyPicker />` before `<ThemeToggle />`):

```tsx
        <div className="topbar-hints">
          <a href={`mailto:${cv.emailHint}`}>{cv.emailHint}</a>
          <a href={`https://${cv.githubHint}`} target="_blank" rel="noopener">{cv.githubHint}</a>
        </div>
        <EnergyPicker />
        <ThemeToggle />
```

- [ ] **Step 7: Verify (static + safety)**

- `grep -n "data-energy" src/styles/cv.css` → 10 override blocks present (5 dark, 5 light).
- Confirm base dark `--accent: #e7c873;` and base light `--accent: #9a7b1e;`.
- Confirm `src/components/EnergyPicker.tsx` exists; re-read it for TS correctness (typed `Energy`, `CSSProperties` import, no `any`, default export).
- Confirm `Header.tsx` imports and renders `<EnergyPicker />` exactly once, before `<ThemeToggle />`.
- `git status --short` → only `src/styles/cv.css`, `src/components/Header.tsx`, new `src/components/EnergyPicker.tsx` (plus docs). NOT `src/data/cv.ts`.

- [ ] **Step 8: Stage (no commit, no push)**

```bash
git add src/styles/cv.css src/components/EnergyPicker.tsx src/components/Header.tsx
```

Report Task 1 staged.

---

### Task 2: HUD frame kit

**Files:**
- Modify: `src/styles/cv.css` — remove the old single `.section-head::before` bracket; add `.hud-frame` / `.hud-scan` / `.hud-rim` classes + keyframes.
- Modify: `src/App.tsx` — add `hud-frame` to the section-head element.
- Modify: `src/sections/Profile.tsx` — add `hud-frame` to the profile wrapper and `hud-rim` to the download button.
- Modify: `src/components/ArcWheelNav.tsx` — add `hud-scan` to the DESKTOP `.arcwheel` nav element only.

**Interfaces:**
- Consumes: tokens `--accent`, `--ease`, `--ease-weighted` (added in the subtle pass); existing `.section-head`, `.profile`, `.btn-download`, desktop `.arcwheel` selectors.
- Produces: reusable classes `.hud-frame` (diagonal corner brackets, draws in), `.hud-scan` (scanline overlay behind content via `::before`), `.hud-rim` (static glow border + gentle pulse). Used here and consumed by Task 3 for the active nav node.

- [ ] **Step 1: Remove the old single section-head bracket**

In `src/styles/cv.css`, find and DELETE this entire block (added in the subtle pass), leaving the `.section-head { … }` line above it intact:

```css
.section-head::before {
  content: "";
  position: absolute;
  top: -10px;
  left: 0;
  width: 14px;
  height: 14px;
  border-top: 1px solid var(--accent);
  border-left: 1px solid var(--accent);
  opacity: 0.5;
  pointer-events: none;
}
```

After deletion the line `.section-head { margin-bottom: 28px; position: relative; }` must still be present (it stays — `.hud-frame` needs that `position: relative`).

- [ ] **Step 2: Add the HUD frame kit classes**

At the END of `src/styles/cv.css`, append:

```css
/* =========================================================================
   HUD frame kit — corner brackets, scanlines, energy rim (chrome only)
   ========================================================================= */
/* diagonal corner brackets (top-left + bottom-right) that draw in */
.hud-frame { position: relative; }
.hud-frame::before,
.hud-frame::after {
  content: "";
  position: absolute;
  width: 14px;
  height: 14px;
  border: 1px solid var(--accent);
  opacity: 0.55;
  pointer-events: none;
  animation: hudDraw 0.5s var(--ease-weighted) both;
}
.hud-frame::before { top: -8px; left: -8px; border-right: 0; border-bottom: 0; }
.hud-frame::after { bottom: -8px; right: -8px; border-left: 0; border-top: 0; }
@keyframes hudDraw {
  from { opacity: 0; transform: scale(0.6); }
  to   { opacity: 0.55; transform: none; }
}

/* faint scanlines, painted BEHIND content via ::before */
.hud-scan { position: relative; }
.hud-scan::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    color-mix(in srgb, var(--accent) 10%, transparent) 0 1px,
    transparent 1px 5px
  );
  opacity: 0.4;
  animation: hudScan 9s linear infinite;
}
@keyframes hudScan {
  from { background-position: 0 0; }
  to   { background-position: 0 25px; }
}

/* energy rim — STATIC glow base (survives reduced-motion) + gentle pulse */
.hud-rim {
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--accent) 28%, transparent),
    0 0 16px -8px var(--accent);
  animation: hudRim 3.4s var(--ease) infinite alternate;
}
@keyframes hudRim {
  from { box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 22%, transparent), 0 0 14px -9px var(--accent); }
  to   { box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 40%, transparent), 0 0 24px -6px var(--accent); }
}
```

- [ ] **Step 3: Apply `hud-frame` to the section header**

In `src/App.tsx`, find:

```tsx
              <div className="section-head">
```

Replace with:

```tsx
              <div className="section-head hud-frame">
```

- [ ] **Step 4: Apply `hud-frame` to the profile hero and `hud-rim` to the CTA**

In `src/sections/Profile.tsx`, find:

```tsx
    <div className="profile">
```

Replace with:

```tsx
    <div className="profile hud-frame">
```

Then find:

```tsx
      <a className="btn-download" href={cv.resumePdf} target="_blank" rel="noopener">
```

Replace with:

```tsx
      <a className="btn-download hud-rim" href={cv.resumePdf} target="_blank" rel="noopener">
```

- [ ] **Step 5: Apply `hud-scan` to the desktop arc-wheel nav**

In `src/components/ArcWheelNav.tsx`, find the DESKTOP return's opening nav tag (it has `onKeyDown` and a `style` prop — this is the desktop wheel, NOT the `reduced` or `mobile` returns):

```tsx
    <nav
      className="arcwheel"
      aria-label="Sections"
      onKeyDown={onKeyDown}
```

Replace with:

```tsx
    <nav
      className="arcwheel hud-scan"
      aria-label="Sections"
      onKeyDown={onKeyDown}
```

Leave the `reduced` return (`<nav className="arcwheel" aria-label="Sections">`) and the `mobile` return (`<nav className="tabbar" …>`) UNCHANGED.

- [ ] **Step 6: Verify (static + safety)**

- `grep -n "hud-frame\|hud-scan\|hud-rim\|hudDraw\|hudScan\|hudRim" src/styles/cv.css` → all three classes + three keyframes present; old `.section-head::before` gone (`grep -n "section-head::before" src/styles/cv.css` → no matches).
- Confirm `App.tsx` section-head is `"section-head hud-frame"`; `Profile.tsx` has `"profile hud-frame"` and `"btn-download hud-rim"`; `ArcWheelNav.tsx` desktop nav is `"arcwheel hud-scan"` and the other two navs are unchanged.
- `git status --short` → only the four files above (plus docs); NOT `src/data/cv.ts`.

- [ ] **Step 7: Stage (no commit, no push)**

```bash
git add src/styles/cv.css src/App.tsx src/sections/Profile.tsx src/components/ArcWheelNav.tsx
```

Report Task 2 staged.

---

### Task 3: Star-Chart / Director nav

**Files:**
- Modify: `src/styles/cv.css` — recolor the rail into a glowing route; add diamond node frame to `.arc-ico`; add corner brackets + diamond frame to the active node.

**Interfaces:**
- Consumes: existing selectors `.arcwheel-rail path`, `.arc-pill .arc-ico`, `.arc-pill.is-active`; tokens `--accent`, `--on-accent`, `--border-strong`. (No markup changes — all hooks already exist.)
- Produces: the final star-chart appearance. No new selectors other tasks depend on.

- [ ] **Step 1: Turn the dashed rail into a glowing energy route**

In `src/styles/cv.css`, find:

```css
.arcwheel-rail path {
  fill: none;
  stroke: var(--faint);
  stroke-width: 1.5;
  stroke-dasharray: 3 9;
  opacity: 0.7;
  animation: railFlow 1.1s linear infinite;
}
```

Replace with:

```css
.arcwheel-rail path {
  fill: none;
  stroke: var(--accent);
  stroke-width: 1.5;
  stroke-dasharray: 3 9;
  opacity: 0.5;
  filter: drop-shadow(0 0 3px color-mix(in srgb, var(--accent) 60%, transparent));
  animation: railFlow 1.1s linear infinite;
}
```

- [ ] **Step 2: Add a diamond node frame around each pill icon**

Find:

```css
.arc-pill .arc-ico { flex: none; display: grid; place-items: center; color: var(--muted); transition: color 0.25s; }
```

Replace with:

```css
.arc-pill .arc-ico {
  position: relative;
  flex: none;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  color: var(--muted);
  transition: color 0.25s;
}
/* Destiny-style rhombus node frame behind the icon */
.arc-pill .arc-ico::before {
  content: "";
  position: absolute;
  inset: 1px;
  border: 1px solid var(--border-strong);
  transform: rotate(45deg);
  transition: border-color 0.25s;
  pointer-events: none;
}
```

- [ ] **Step 3: Frame and bracket the active node**

Find the active-pill rule (it currently has the subtle-pass glow):

```css
.arc-pill.is-active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
  box-shadow:
    0 0 22px -6px color-mix(in srgb, var(--accent) 55%, transparent),
    0 0 0 1px color-mix(in srgb, var(--accent) 40%, transparent);
}
.arc-pill.is-active .arc-ico { color: var(--on-accent); }
```

Replace with:

```css
.arc-pill.is-active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
  box-shadow:
    0 0 22px -6px color-mix(in srgb, var(--accent) 55%, transparent),
    0 0 0 1px color-mix(in srgb, var(--accent) 40%, transparent);
}
.arc-pill.is-active .arc-ico { color: var(--on-accent); }
.arc-pill.is-active .arc-ico::before { border-color: var(--on-accent); }
/* HUD corner brackets framing the active "you are here" node */
.arc-pill.is-active::before,
.arc-pill.is-active::after {
  content: "";
  position: absolute;
  width: 9px;
  height: 9px;
  border: 1px solid var(--on-accent);
  opacity: 0.85;
  pointer-events: none;
}
.arc-pill.is-active::before { top: 5px; left: 5px; border-right: 0; border-bottom: 0; }
.arc-pill.is-active::after { bottom: 5px; right: 5px; border-left: 0; border-top: 0; }
```

- [ ] **Step 4: Verify (static + safety)**

- `grep -n "arcwheel-rail path\|arc-ico::before\|is-active::before\|is-active::after" src/styles/cv.css` → route uses `stroke: var(--accent)` + `drop-shadow`; `.arc-ico::before` diamond present; active brackets present.
- Confirm the active-pill `box-shadow` glow is retained (not removed) and `.arc-ico` is now `position: relative; width/height 20px`.
- Confirm NO markup changes this task: `git status --short` → only `src/styles/cv.css` (plus docs).
- Sanity-check the protected logic is untouched: `grep -n "180 - rel\|down ? 1 : -1\|d > 0 ? \"up\"" src/components/ArcWheelNav.tsx src/App.tsx` → all three present (wheel order, scroll step, slide mapping).

- [ ] **Step 5: Stage (no commit, no push)**

```bash
git add src/styles/cv.css
```

Report Task 3 staged — all three systems complete and staged for the user to review/commit.

---

## Self-Review

**Spec coverage:**
- Energy-color system (picker, 5 colors, dark+light variants, Orokin default, localStorage) → Task 1. ✓
- Star-chart nav: glowing route → Task 3 Step 1; diamond nodes → Step 2; framed active node → Step 3. ✓
- HUD kit: corner brackets (`.hud-frame`), scanlines (`.hud-scan`), energy rim (`.hud-rim`) → Task 2; applied to section-head, profile, CTA, nav. ✓
- Even blend / chrome-only glow → constraints + scanlines behind content via `::before`, brackets outside text. ✓
- No copy changes → only new picker control + class attributes; section text untouched. ✓
- Protected scroll/order/slide logic → Task 3 Step 4 explicitly re-checks all three. ✓
- Themes + reduced-motion → 10 energy blocks cover both themes; `.hud-rim` static base survives reduced-motion; animations collapse via existing global block. ✓
- Default Orokin, no flash → base tokens set to gold in Task 1 Steps 1–2. ✓

**Placeholder scan:** No TBD/TODO; every step shows exact old→new code and exact values. ✓

**Type/name consistency:** `data-energy` values (`orokin|arc|solar|void|stasis`) match between `EnergyPicker.tsx` and the CSS blocks; swatch hexes in the component match the dark energy `--accent` values; class names (`.energy-picker`, `.energy-swatch`, `.hud-frame`, `.hud-scan`, `.hud-rim`) defined in CSS match those applied in TSX; keyframes (`hudDraw`, `hudScan`, `hudRim`) defined once and referenced consistently. ✓

**Environment honesty:** no local node stated; verification is inspection + Vercel; stage-only, user commits. ✓
