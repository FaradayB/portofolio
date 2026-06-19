# Warframe × Destiny 2 Theme — Design Spec

**Date:** 2026-06-19
**Status:** Approved (design), pending spec review
**Builds on:** the existing subtle sci-fi polish (starfield, nebula, accent glow, chamfers, brackets, heavier motion).

## Goal

Make the portfolio read *distinctly* as Warframe / Destiny 2 inspired — an "even blend" where **Destiny supplies the structure** (diamond/rhombus geometry, restraint, negative space) and **Warframe supplies the energy** (glowing routes, scanlines, animated rims, a player-chosen energy color). Three signature systems, no literal game assets (no ripped logos, fonts, or audio).

## Scope — three systems

1. **Star-Chart / Director navigation** (augment the existing arc wheel)
2. **HUD frame system** (reusable corner-bracket / scanline / energy-rim kit)
3. **Energy-color system** (swatch picker that recolors the whole UI)

The "Transmission companion" idea was considered and **deliberately deferred** — not in this build.

## Constraints (hard requirements)

- **Even blend:** geometric restraint (Destiny) as the base; glow/scanline/energy (Warframe) as accents. Body text stays clean and fully readable — scanlines, glow, and energy rims apply to chrome only, never to paragraph text.
- **No website copy changes** beyond UI controls that are inherently new (the energy picker's labels/aria). Section content wording is untouched.
- **No literal game IP** — colors, geometry, and naming are *inspired by*, not copied. Energy color names (Arc/Solar/Void/Stasis/Orokin) are used as internal labels/tooltips only.
- **Do not break** the recently-fixed scroll direction (`scroll down → next section`), wheel order (`180 - rel` top-to-bottom), or the slide-direction mapping in `App.tsx`.
- **Themes + reduced-motion must keep working.** Light theme stays usable; energy colors have dark- and light-tuned variants for contrast. All new animations (route flow, scanlines, rim pulse, bracket draw-in) collapse under `prefers-reduced-motion`.
- **Default energy on first load: Orokin (gold).**
- **Performance:** CSS-driven (gradients, transforms, box-shadow); no per-particle DOM, no WebGL.
- **Environment:** node not installed locally — verification is static review + Vercel preview after the user pushes.
- **Git:** stage only; the user commits and pushes.

## System 1 — Star-Chart / Director navigation

Augment the existing `ArcWheelNav`, do not rebuild it. Label pills stay (usability + the working scroll/order logic untouched).

- **Glowing energy route:** restyle `.arcwheel-rail path` from a faint dashed grey line to an `--accent`-colored energy line with a soft glow (drop-shadow), keeping the existing downward dash-flow animation. This is the Warframe star-chart route connecting destinations.
- **Diamond node frames:** wrap each pill's icon (`.arc-ico`) in a rhombus frame — a 45°-rotated square border behind the icon (Destiny Director node). Inactive nodes use a muted border; the node sits on the route.
- **Active node treatment:** the active pill (`.arc-pill.is-active`, already glowing from the subtle pass) gets:
  - a brighter, larger diamond node frame in `--accent`,
  - hairline **corner brackets** (HUD frame from System 2),
  - a gentle energy-rim pulse.
- **No markup changes expected** in `ArcWheelNav.tsx` — all of the above is reachable via existing classes (`.arcwheel-rail path`, `.arc-ico`, `.arc-pill`, `.arc-pill.is-active`). If a clean diamond frame proves impossible in pure CSS, a single wrapper span around the icon is the only allowed markup change.

## System 2 — HUD frame system

A small reusable CSS kit, applied to hero chrome only.

- **Corner brackets (`.hud-frame`):** diagonal corner accents (top-left + bottom-right) drawn with `::before` / `::after` (each an L made from two 1px borders), in `--accent` at low opacity. On section change they **draw in** via a quick scale/opacity animation tied to the existing view-transition timing.
- **Scanline overlay (`.hud-scan`):** a faint `repeating-linear-gradient` of thin lines, very low opacity, slowly translating. Applied to the profile hero panel only.
- **Energy-rim (`.hud-rim`):** a thin animated glow border (animated `box-shadow` / gradient) for the active nav node and the profile hero.

**Where applied:**
- `.section-head` → promote its current single corner bracket to a full `.hud-frame` (diagonal brackets).
- `.profile` hero → `.hud-scan` + `.hud-rim`.
- Active nav node → `.hud-frame` brackets + `.hud-rim` (part of System 1's active treatment).

## System 3 — Energy-color system

A swatch picker that recolors the UI by overriding existing accent tokens. Because everything (glow, routes, brackets, rims, active node, links, buttons) already derives from `--accent` / `--accent-soft` / `--on-accent`, recoloring cascades automatically.

- **New component `EnergyPicker.tsx`** mirroring `ThemeToggle.tsx`: reads `localStorage["energy"]` (default `"orokin"`), writes it, and sets `document.documentElement.setAttribute("data-energy", energy)`. Renders 5 small swatch buttons (or a compact popover) with `aria-label`/`title` = the energy name. Placed in the topbar-right of `Header.tsx`, before `<ThemeToggle />`.
- **Five energies**, each defining `--accent`, `--accent-soft`, `--on-accent`, with **dark- and light-theme variants**. Selector pattern in `cv.css`:
  - dark: `:root[data-energy="arc"] { … }` (and the rest)
  - light: `:root[data-theme="light"][data-energy="arc"] { … }`
- **Default = Orokin (gold):** set the base dark block (`:root, :root[data-theme="dark"]`) and the base light block accent tokens to the Orokin values so the very first paint is gold (no blue-to-gold flash), and also define an explicit `[data-energy="orokin"]` block for when it is chosen in the picker.

**Color values (starting point — may be nudged during review):**

| Energy | Dark `--accent` | Dark `--on-accent` | Light `--accent` | Light `--on-accent` |
|--------|-----------------|--------------------|------------------|---------------------|
| Orokin (default) | `#e7c873` | `#1a1405` | `#9a7b1e` | `#ffffff` |
| Arc    | `#3ba9ff` | `#04121f` | `#1f6fd0` | `#ffffff` |
| Solar  | `#ff9d3b` | `#1a0e00` | `#c2660d` | `#ffffff` |
| Void   | `#9a6bff` | `#ffffff` | `#6b3fd0` | `#ffffff` |
| Stasis | `#62d0ff` | `#04121f` | `#1487b8` | `#ffffff` |

`--accent-soft` per energy = the same hue at ~15–18% alpha. `--on-accent` is the text color used *on* the accent (active pill, download button): dark text on the bright energies, white where needed (Void, all light-theme variants) to keep contrast safe.

## Files affected (anticipated)

- `src/styles/cv.css` — energy palettes (base + 5×2 blocks), star-chart route/node/active restyle, `.hud-frame` / `.hud-scan` / `.hud-rim` classes and their reduced-motion fallbacks, application to `.section-head` / `.profile`.
- `src/components/EnergyPicker.tsx` — **new**, mirrors ThemeToggle.
- `src/components/Header.tsx` — add `<EnergyPicker />` to topbar-right.
- `src/components/ArcWheelNav.tsx` — only if the diamond node frame needs one wrapper span (prefer pure CSS).
- No changes to section data or section copy.

## Out of scope

Transmission/comms companion treatment, decode/scan text-decrypt transitions, angular custom display font, diamond frames on every section icon, audio, WebGL/3D, energy-color animation presets beyond the static glow.

## Success criteria

- The nav unmistakably reads as a star-chart/Director: glowing route, diamond nodes, a clearly-framed active "you are here" node.
- Hero chrome shows HUD framing (brackets + faint scanlines + energy rim) without harming readability.
- The energy picker switches the entire UI accent (glow, route, nodes, brackets, links, buttons) live, persists across reloads, and defaults to Orokin gold.
- Every energy is legible in both dark and light themes.
- `prefers-reduced-motion` disables route flow, scanline drift, rim pulse, and bracket draw-in with no broken layout.
- The fixed scroll direction, wheel order, and slide mapping still behave exactly as they do now.

## Build order

1. **Energy-color system** — palettes + `EnergyPicker` + Header wiring. (Foundation: everything else recolors through it; lowest risk; immediately visible.)
2. **HUD frame system** — `.hud-frame` / `.hud-scan` / `.hud-rim` classes + apply to section-head and profile.
3. **Star-Chart nav** — route glow, diamond nodes, active-node framing (consumes the HUD classes from step 2). Riskiest, done last on a working base.
