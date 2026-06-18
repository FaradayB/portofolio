# Faraday Barr Fatahillah — Portfolio

A single-page portfolio built with **React + TypeScript (Vite)**, organised around a
signature **endless arc-wheel** navigation: the nav items ride the edge of a large,
invisible off-screen circle, and scrolling or dragging rotates them around it forever
(items that pass off one end wrap back in from the other). The aesthetic is a
near-monochrome system with a single bold lime accent, in both **dark and light** themes.
It includes a **Companion** chatbot that talks to a hosted chain of free models —
**Gemini Flash** variants first, then **Groq (Llama 3.3 70B)** as a fallback — through the
`/api/chat` Vercel serverless function. It works on every device and loads instantly.

- 9 sections (Profile, Education, Experience, **Records/Projects**, Research, Leadership,
  Skills, Certifications, Contact) + a 10th **Companion** chat section.
- **Arc-wheel nav** with full keyboard support (arrow keys rotate + select), `aria-current`,
  focus rings and an sr-only summary. It respects `prefers-reduced-motion` (falls back to a
  plain vertical list) and collapses to a **bottom tab bar** on mobile.
- All resume content lives in one typed file: `src/data/cv.ts`. Edit it in one place and
  both the rendered sections **and** the chatbot's knowledge update.
- No UI dependencies: icons are inline SVG (`src/components/Icon.tsx`), theming is plain
  CSS variables. Designed to deploy free on **Vercel**.

---

## Prerequisites

| Option | Install | Notes |
|---|---|---|
| **Node.js 20+** | https://nodejs.org/ | Use the `npm …` commands shown in each section below. |

---

## Quick start

From the project root:

```bash
npm install
npm run dev        # http://localhost:5173
```

Then open **http://localhost:5173**. Edit files in your normal editor — the browser
refreshes automatically. Stop the server with `Ctrl+C`.

---

## Running tests

The project uses **Vitest** + **React Testing Library**. The chatbot's LLM is mocked in
tests, so they run fast.

```bash
npm test
```

Expected: all suites pass (`cv`, `App`, `SkillBar`, `Sections`, `systemPrompt`,
`ChatPanel`).

---

## Production build

### Static output (what Vercel serves)

```bash
npm run build      # output in ./dist
```

---

## Deploy to Vercel (free)

1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com/), **New Project → Import** your repo.
3. Vercel auto-detects Vite (static build from `vercel.json`) *and* the `/api/chat.ts`
   serverless function. Just click **Deploy**.
4. In the project's **Settings → Environment Variables**, add `GEMINI_API_KEY` (get a
   free key from [Google AI Studio](https://aistudio.google.com/app/apikey); keep that
   Gemini project on the **free tier with billing disabled** so there's no surprise cost)
   and `GROQ_API_KEY` (a free key from [Groq](https://console.groq.com/keys)).

### Environment variables

Copy `.env.example` to `.env.local` for local dev (`vercel dev` or `vite` will pick it
up) and set the same keys in the Vercel dashboard for production:

- **`GEMINI_API_KEY`** — primary provider.
- **`GROQ_API_KEY`** — final fallback (Llama 3.3 70B).

Both keys are read **server-side only** in `/api/chat.ts` — they're never sent to the
browser. The chat advances through the Gemini models on any failure (rate-limit included)
and falls back to Groq last; if all of them fail it returns an error.

> Any static host works for the static build (Netlify, Cloudflare Pages, GitHub Pages),
> but the hosted Companion specifically needs Vercel's serverless functions for
> `/api/chat`.

---

## Project layout

```
src/
  data/
    cv.ts            # SINGLE SOURCE OF TRUTH — all resume content (edit here)
    sections.ts      # the 10 nav entries (label, icon, footer hint)
  components/         # ArcWheelNav, Header, Footer, ThemeToggle, Icon, SkillBar, Card
  sections/          # the content sections, each rendering cv.ts
  chat/
    engine.ts        # ChatEngine interface
    RemoteEngine.ts  # ChatEngine that calls /api/chat (hosted model chain)
    systemPrompt.ts  # turns cv.ts into the chatbot's system prompt
    ChatPanel.tsx    # the Companion chat UI
  App.tsx            # active-section state + layout
  styles/cv.css      # design system: tokens, dark/light themes, arc-wheel + components
api/
  chat.ts            # Vercel serverless function: walks the Gemini→Groq model chain, reuses systemPrompt.ts
public/              # CV PDF (linked from the app)
vercel.json          # Vite build + SPA rewrite + headers
```

---

## Editing your CV

Open **`src/data/cv.ts`** and edit the fields — name, bio, experience, **projects**,
skills, etc. Both the on-screen sections and the Companion chatbot's answers update from
this one file. Add `repo`/`demo` URLs to any project in `cv.projects` to show `[Repo ↗]` /
`[Demo ↗]` links on its card.

**Profile photo:** drop a square image at **`public/profile.jpg`** to replace the initials
mark in the header. If the file is absent, the initials show instead.

**Download CV:** the Profile section links `public/CV-FARADAY BARR FATAHILLAH-1.pdf` via
`cv.resumePdf` — swap that file (or the path) to change it.

To change the chatbot models or their order, edit the `MODEL_CHAIN` array in
`api/chat.ts`.

---

## Troubleshooting

- **Companion returns an error:** every model in the chain failed. Check that
  `GEMINI_API_KEY` and `GROQ_API_KEY` are set in your environment (or the Vercel
  dashboard) and that the keys are valid and within quota.
