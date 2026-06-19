# Subtle Sci-Fi Polish — Design Spec

**Date:** 2026-06-19
**Status:** Approved (design), pending implementation plan

## Goal

Give the portfolio a faint, "felt-not-noticed" outer-space / sci-fi atmosphere — inspired by the *grammar* of Destiny 2 and Warframe (geometry, glow discipline, motion weight, deep void) rather than their *vocabulary* (scanlines, neon traces, "transmission" framing, hex grids, gold filigree).

A casual visitor should register *"polished, vaguely sci-fi"* without being able to name why. A designer looking closely would notice the deliberate choices.

## Constraints (hard requirements)

- **No copy/text changes.** All website words stay exactly as they are now. The only glyph touched is one decorative CSS pseudo-element marker (see "Quiet signatures" → diamond bullet), which is not body content — but if that counts as "text" to the user, it is the first thing to drop.
- **No new components, no new colors** beyond deepening the dark background.
- Extend the existing CSS token system in [src/styles/cv.css](../../../src/styles/cv.css) — do not replace it.
- Dark theme, light theme, and `prefers-reduced-motion` must all keep working. Atmosphere effects (starfield, nebula) collapse under reduced-motion.
- Keep performance cheap: starfield via CSS/canvas layers, never a per-star DOM explosion.

## Intensity level: "Subtle but felt"

Chosen over "whisper" (invisible only) and "quiet signatures" (no atmosphere). Includes all three layers below.

## Scope — three layers

### Layer 1 — Atmosphere (the "felt" part)

1. **Deepen the void.** Shift the dark `--bg` from `#0a0a0b` toward a near-black navy/indigo. Keep it dark enough that text contrast on `--surface` cards is unaffected. Light theme `--bg` unchanged.
2. **Low-opacity starfield.** Evolve the existing radial-dot grain at [src/styles/cv.css:85](../../../src/styles/cv.css#L85) (`body::before`) into a faint starfield: varied dot sizes, very low opacity, a few stars that twinkle slowly (opacity animation). Should read as *texture*, not "outer space."
3. **Soft nebula.** One large, very-low-opacity radial-gradient blob (deep indigo/violet) drifting slowly behind content. Sits below the content layer (`z-index: 0`), never over text.

### Layer 2 — Quiet signatures (noticed on a second look)

4. **Single-corner chamfer.** Cut one corner (~8px) of `.card` and the active arc-wheel pill via `clip-path`. Reads as "intentionally designed," not "gamer UI."
5. **Active-only glow.** A faint accent halo (`box-shadow` / `drop-shadow`) on the *active* arc-wheel pill (`.arc-pill.is-active`) only. All other pills stay flat.
6. **Hairline corner-brackets.** 1px, low-opacity bracket marks on the hero / active nav node.
7. **Diamond bullet (decorative, droppable).** Swap the `→` marker in `.stat-pill::before` ([src/styles/cv.css:484](../../../src/styles/cv.css#L484)) for a diamond `◇`. This is a CSS decorative glyph, not page copy — but it is the first thing to cut if the user considers it "text."

### Layer 3 — Invisible (felt, never seen)

8. **Heavier motion easing.** Make the existing section-transition easing slower and more deliberate (Bungie-menu weight). Same keyframes (`viewSlideUp` / `viewSlideDown` at [src/styles/cv.css:255](../../../src/styles/cv.css#L255)), adjusted timing/easing only.

## Affected files (anticipated)

- [src/styles/cv.css](../../../src/styles/cv.css) — token tweaks, `body::before` starfield, nebula layer, chamfers, glow, brackets, easing. Most/all work lives here.
- [src/components/ArcWheelNav.tsx](../../../src/components/ArcWheelNav.tsx) — only if corner-brackets/active-node markup needs a hook that pure CSS can't reach.
- No changes to any section component, data file, or copy.

## Out of scope (explicitly dropped)

Scanlines, "incoming transmission" framing, glowing energy traces, gold/Orokin filigree, energy-color picker, hex motifs, warp transitions, terminator-sweep theme toggle, any lexicon / wording changes.

## Success criteria

- The dark theme feels visibly "deeper" but all text remains comfortably legible.
- The starfield and nebula are perceptible only when looked for; they never compete with content.
- The active nav node clearly reads as "selected" via glow + chamfer.
- Toggling reduced-motion removes all animated atmosphere with no broken layout.
- Light theme and dark theme both look intentional.
- Zero website copy has changed.

## Build order

1. Atmosphere — deepen void, starfield, nebula.
2. Quiet signatures — chamfers, active glow, corner-brackets, diamond bullet.
3. Motion — heavier easing.
