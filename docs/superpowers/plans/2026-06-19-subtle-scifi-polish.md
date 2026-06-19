# Subtle Sci-Fi Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a faint, "felt-not-noticed" outer-space atmosphere (deepened void, low-opacity starfield + nebula, geometric chamfers, active-node glow, heavier motion) inspired by Destiny 2 / Warframe grammar — without changing any website copy.

**Architecture:** All work is CSS-only, confined to [src/styles/cv.css](../../../src/styles/cv.css). It extends the existing CSS-custom-property token system and the existing `body::before` / section-transition machinery rather than adding components or markup. Every hook needed (`.arc-pill.is-active`, `.card`, `.section-head`, `.stat-pill::before`, `body::before`, `viewSlideUp/Down`) already exists in the codebase, so no `.tsx` files are touched.

**Tech Stack:** Plain CSS (custom properties, `clip-path`, `radial-gradient`, keyframe animations, `color-mix`). No new dependencies.

## Global Constraints

- **No copy/text changes.** Every website word stays exactly as-is. The only glyph touched is the decorative `.stat-pill::before` marker (`→` → `◇`), a CSS pseudo-element, not page content. (Task 2, Step "diamond bullet" is the one to skip if this counts as "text" to the user.)
- **No new components, no new colors** beyond deepening the dark `--bg` (and a derived nebula tint from the existing `--accent`).
- **Extend** the token system in `src/styles/cv.css`; do not replace it.
- **Themes + reduced-motion must keep working.** Light theme `--bg` unchanged; the existing `@media (prefers-reduced-motion: reduce)` block at `src/styles/cv.css:626` already zeroes all animations, so twinkle/nebula-drift/transition become static automatically — verify it still does.
- **Performance:** atmosphere via CSS gradient layers on pseudo-elements only — never per-star DOM nodes.
- **Environment:** node/npm is NOT installed locally and there is no Docker — local `npm test` / `npm run build` cannot run here. Since no `.ts/.tsx` is modified, the TypeScript build and existing Vitest suite are unaffected by design; final build verification happens via the Vercel cloud build after the user pushes.
- **Git:** stage only (`git add`). Do NOT commit and do NOT push — the user commits and pushes themselves.

---

### Task 1: Atmosphere — deepen void, starfield, nebula

**Files:**
- Modify: `src/styles/cv.css` — dark `--bg` token (line ~33), `body::before` block (lines 84–96), add `body::after` + keyframes.

**Interfaces:**
- Consumes: existing tokens `--bg`, `--border`, `--text`, `--accent`, `--ease`; existing `.shell { z-index: 1 }` (lines 115–116) which keeps content above the `z-index: 0` pseudo layers.
- Produces: a static-friendly atmosphere layer behind all content. No new selectors other code depends on.

- [ ] **Step 1: Deepen the dark background token**

In the `:root, :root[data-theme="dark"]` block, change the background from near-black grey to near-black navy. Find:

```css
  --bg: #0a0a0b;
```

Replace with:

```css
  --bg: #07080f;
```

(Light theme `--bg: #f1efe9` is left untouched.)

- [ ] **Step 2: Upgrade `body::before` into a low-opacity starfield with a gentle twinkle**

Replace the entire existing block (lines 84–96):

```css
/* subtle grain/texture via layered radial dots — flat, cheap, no images */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.5;
  background:
    radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0) 0 0 / 26px 26px;
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 30% 30%, #000 30%, transparent 100%);
          mask-image: radial-gradient(ellipse 80% 60% at 30% 30%, #000 30%, transparent 100%);
}
```

with:

```css
/* starfield: existing dot-grain + two sparse star layers, gently twinkling.
   Reads as texture first, "space" only on a second look. */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.5;
  background:
    /* sparse bright stars */
    radial-gradient(circle at 20% 30%, color-mix(in srgb, var(--text) 65%, transparent) 0.7px, transparent 1.4px) 0 0 / 230px 210px,
    radial-gradient(circle at 72% 78%, color-mix(in srgb, var(--text) 50%, transparent) 0.7px, transparent 1.4px) 0 0 / 310px 290px,
    radial-gradient(circle at 45% 60%, color-mix(in srgb, var(--text) 40%, transparent) 0.6px, transparent 1.3px) 0 0 / 180px 260px,
    /* base dot-grain (unchanged) */
    radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0) 0 0 / 26px 26px;
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 30% 30%, #000 30%, transparent 100%);
          mask-image: radial-gradient(ellipse 80% 60% at 30% 30%, #000 30%, transparent 100%);
  animation: starTwinkle 7s var(--ease) infinite alternate;
}
@keyframes starTwinkle {
  from { opacity: 0.44; }
  to   { opacity: 0.56; }
}
```

- [ ] **Step 3: Add the drifting nebula as `body::after`**

Immediately after the `@keyframes starTwinkle { … }` block from Step 2, add:

```css
/* one soft, slow-drifting nebula blob behind content (never over text) */
body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.55;
  background:
    radial-gradient(42% 50% at 18% 28%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 70%),
    radial-gradient(46% 42% at 82% 76%, color-mix(in srgb, #6d4bff 16%, transparent), transparent 72%);
  animation: nebulaDrift 44s var(--ease) infinite alternate;
}
@keyframes nebulaDrift {
  from { transform: translate3d(-2%, -1%, 0) scale(1.05); }
  to   { transform: translate3d(2%, 1.5%, 0) scale(1.12); }
}
:root[data-theme="light"] body::after { opacity: 0.3; }
```

- [ ] **Step 4: Verify (visual + safety)**

- Read the modified region of `src/styles/cv.css` to confirm: the `body::before` block is syntactically closed, `body::after` and both `@keyframes` are present, and no stray braces remain.
- Confirm no `.ts`/`.tsx` file was modified (`git status --short` should show only `src/styles/cv.css` plus the docs files).
- Confirm the reduced-motion block at `src/styles/cv.css:626` still uses the global `* { animation-duration: 0.001ms !important }` rule, which neutralizes `starTwinkle` and `nebulaDrift` automatically. No change needed there — just confirm it is still present after your edits.
- If node becomes available, optional: `npm run dev` and eyeball the dark theme (deeper void, faint stars, soft glow corners) and light theme (no harsh nebula). Otherwise the Vercel preview after the user pushes is the build check.

- [ ] **Step 5: Stage (do not commit, do not push)**

```bash
git add src/styles/cv.css
```

Tell the user Task 1 is staged and ready for them to review/commit.

---

### Task 2: Quiet signatures — chamfers, active glow, corner-brackets, diamond bullet

**Files:**
- Modify: `src/styles/cv.css` — add chamfer rules, augment `.arc-pill.is-active` (lines ~378–382), make `.section-head` positioned + add bracket pseudo, change `.stat-pill::before` (line ~484).

**Interfaces:**
- Consumes: existing selectors `.card`, `.contact-item`, `.brand-mark`, `.theme-toggle`, `.arc-pill.is-active`, `.section-head`, `.stat-pill::before`; tokens `--accent`, `--accent-soft`.
- Produces: purely visual changes; no selectors other code depends on.

> **Planning note (deviation from spec, intentional):** `clip-path` chamfers cleanly on rounded-*rectangle* panels but fights the full pill-radius of `.arc-pill` / `.btn-download`. So the chamfer is applied to the rounded-rect family (cards, contact items, the header chips) and the active nav node gets its "selected" signature from **glow** instead of a chamfer. This preserves the geometric HUD language without breaking pill shapes. The spec's intent (geometric tells + active-node emphasis) is fully met.

- [ ] **Step 1: Add single-corner chamfers to the rounded-rect panel family**

Add this block near the card styles (e.g. just after the `.card:hover` rule around line 451):

```css
/* single cut corner — a quiet "designed panel" tell. clip-path overrides
   border-radius on these elements; the straight edges keep their border. */
.card,
.contact-item {
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
}
.brand-mark,
.theme-toggle {
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
}
```

- [ ] **Step 2: Add an accent glow to the active arc-wheel pill only**

Find the existing rule (lines ~378–382):

```css
.arc-pill.is-active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}
```

Replace with (adds `box-shadow`; keeps everything else):

```css
.arc-pill.is-active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
  box-shadow:
    0 0 22px -6px color-mix(in srgb, var(--accent) 55%, transparent),
    0 0 0 1px color-mix(in srgb, var(--accent) 40%, transparent);
}
```

- [ ] **Step 3: Add a hairline corner-bracket to the section hero**

Find the existing rule (line ~213):

```css
.section-head { margin-bottom: 28px; }
```

Replace with:

```css
.section-head { margin-bottom: 28px; position: relative; }
.section-head::before {
  content: "";
  position: absolute;
  top: -10px;
  left: -14px;
  width: 14px;
  height: 14px;
  border-top: 1px solid var(--accent);
  border-left: 1px solid var(--accent);
  opacity: 0.5;
  pointer-events: none;
}
```

- [ ] **Step 4: Swap the stat-pill bullet to a diamond (decorative; skip if user counts it as "text")**

Find the existing rule (line ~484):

```css
.stat-pill::before { content: "→ "; color: var(--accent); }
```

Replace with:

```css
.stat-pill::before { content: "◇ "; color: var(--accent); }
```

- [ ] **Step 5: Verify (visual + safety)**

- Read each modified region to confirm braces/selectors are intact and `clip-path` polygons are well-formed.
- `git status --short` shows only `src/styles/cv.css` (plus docs) — no `.tsx` touched.
- If node available, optional `npm run dev`: cards/header chips show one cut corner; the active nav pill glows; non-profile sections show a faint top-left bracket near the title; profile stat-pills lead with `◇`. Otherwise rely on the Vercel preview.

- [ ] **Step 6: Stage (do not commit, do not push)**

```bash
git add src/styles/cv.css
```

Tell the user Task 2 is staged and ready for them to review/commit.

---

### Task 3: Motion — heavier, more deliberate section easing

**Files:**
- Modify: `src/styles/cv.css` — add an easing token (near line 22), update the `.view[data-dir=…]` rules (lines ~239–240) and the `viewSlideUp` / `viewSlideDown` keyframes (lines ~255–262).

**Interfaces:**
- Consumes: existing `.view[data-dir="down"]` / `.view[data-dir="up"]` selectors driven by `data-dir` in [src/App.tsx:54](../../../src/App.tsx#L54); existing keyframe names `viewSlideUp` / `viewSlideDown`.
- Produces: same animation names and `data-dir` contract — App.tsx needs no change.

- [ ] **Step 1: Add a weighted easing token**

In `:root` (near the existing `--ease:` at line 22), add a second token directly below it:

```css
  --ease-weighted: cubic-bezier(0.16, 1, 0.3, 1);
```

- [ ] **Step 2: Slow down and re-ease the section transitions**

Find (lines ~239–240):

```css
.view[data-dir="down"] { animation: viewSlideUp 0.5s var(--ease) both; }
.view[data-dir="up"]   { animation: viewSlideDown 0.5s var(--ease) both; }
```

Replace with:

```css
.view[data-dir="down"] { animation: viewSlideUp 0.66s var(--ease-weighted) both; }
.view[data-dir="up"]   { animation: viewSlideDown 0.66s var(--ease-weighted) both; }
```

- [ ] **Step 3: Add a touch more travel for "weight"**

Find (lines ~255–262):

```css
@keyframes viewSlideUp {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: none; }
}
@keyframes viewSlideDown {
  from { opacity: 0; transform: translateY(-40px); }
  to   { opacity: 1; transform: none; }
}
```

Replace with:

```css
@keyframes viewSlideUp {
  from { opacity: 0; transform: translateY(54px); }
  to   { opacity: 1; transform: none; }
}
@keyframes viewSlideDown {
  from { opacity: 0; transform: translateY(-54px); }
  to   { opacity: 1; transform: none; }
}
```

- [ ] **Step 4: Verify (visual + safety)**

- Confirm `--ease-weighted` is defined once in `:root` and referenced by both `.view[data-dir=…]` rules; keyframe names are unchanged (`viewSlideUp` / `viewSlideDown`) so App.tsx still matches.
- Confirm the reduced-motion block at line ~626 still force-collapses animation durations (these transitions included).
- `git status --short` shows only `src/styles/cv.css` (plus docs).
- If node available, optional `npm run dev`: switching sections feels slightly slower and heavier, not floaty.

- [ ] **Step 5: Stage (do not commit, do not push)**

```bash
git add src/styles/cv.css
```

Tell the user Task 3 is staged — all three tasks are now staged and ready for their review/commit.

---

## Self-Review

**Spec coverage:**
- Deepen void → Task 1 Step 1. ✓
- Low-opacity starfield + twinkle → Task 1 Step 2. ✓
- Soft drifting nebula → Task 1 Step 3. ✓
- Single-corner chamfer → Task 2 Step 1 (rounded-rect family; active pill uses glow instead — documented deviation). ✓
- Active-only glow → Task 2 Step 2. ✓
- Hairline corner-brackets → Task 2 Step 3. ✓
- Diamond bullet (droppable) → Task 2 Step 4, flagged. ✓
- Heavier motion easing → Task 3. ✓
- No copy changes → only decorative `::before` glyph touched, flagged. ✓
- Themes + reduced-motion intact → verified in each task's Step 4; light `--bg` untouched; nebula dimmed in light. ✓

**Placeholder scan:** No TBD/TODO/"handle edge cases"; every code step shows exact old → new CSS. ✓

**Type/name consistency:** Keyframe names (`viewSlideUp`/`viewSlideDown`) and the `data-dir` contract preserved so App.tsx is untouched; new tokens (`--ease-weighted`) and new keyframes (`starTwinkle`, `nebulaDrift`) are each defined once and referenced consistently. ✓

**Environment honesty:** Local node/build unavailable is stated; verification leans on no-TS-change safety + Vercel preview; commit/push left to the user per their workflow. ✓
