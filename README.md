# Faraday Barr Fatahillah — Interactive CV

A single-page CV styled as the *Trails of Cold Steel* **Camp Menu**, built with
**React + TypeScript (Vite)**. It includes a **Companion** chatbot that, by default,
talks to a hosted **Gemini Flash** model through a small Vercel serverless function
(works on every device, including iOS/mobile where WebGPU isn't available), and falls
back to a small **Qwen** model running entirely in the browser via
[WebLLM](https://github.com/mlc-ai/web-llm) if the hosted call ever fails.

- 9 CV sections (Profile, Education, Experience, **Records/Projects**, Research, Leadership,
  Skills, Certifications, Contact) + a 10th **Companion** chat section.
- The Companion is **opt-in**: the model only downloads after the visitor clicks
  "Start Companion".
- All resume content lives in one typed file: `src/data/cv.ts`. Edit it in one place and
  both the rendered sections **and** the chatbot's knowledge update.
- Designed to deploy free on **Vercel** (or any static host). Development runs entirely in
  **Docker**, so you don't need Node installed locally.

---

## Prerequisites

You need **one** of the following toolchains. Docker is what this project was designed
around; local Node is a lighter alternative.

| Option | Install | Notes |
|---|---|---|
| **Docker Desktop** (recommended) | https://www.docker.com/products/docker-desktop/ | Launch it and wait for the whale icon to show **"Engine running"**. On Windows, keep the default WSL2 backend. |
| **Node.js 20+** (alternative) | https://nodejs.org/ | Then use the bare `npm …` commands shown in each section below. |

To use the **Companion chatbot**, you also need a **WebGPU-capable browser** — a recent
**Chrome, Edge, or Firefox**. The first time you open the Companion, the browser downloads
the Qwen model weights (~350 MB) once and caches them.

---

## Quick start (Docker)

From the project root:

```bash
# 1. Build the dev image
docker compose build

# 2. Install dependencies into the container volume (first time only)
docker compose run --rm web npm install

# 3. Start the dev server with hot reload
docker compose up
```

Then open **http://localhost:5173**. Edit files in your normal editor — the browser
refreshes automatically. Stop the server with `Ctrl+C`.

> **Note:** the first `npm install` writes `package-lock.json` into the project (via the
> bind mount). Commit it so future installs are reproducible.

### Quick start (local Node alternative)

If you installed Node instead of Docker:

```bash
npm install
npm run dev        # http://localhost:5173
```

---

## Running tests

The project uses **Vitest** + **React Testing Library**. The chatbot's LLM is mocked in
tests, so they run fast and need no GPU or model download.

```bash
# Docker
docker compose run --rm web npm test

# or, with local Node
npm test
```

Expected: all suites pass (`cv`, `App`, `SkillBar`, `Sections`, `systemPrompt`,
`ChatPanel`).

---

## Production build

### Static output (what Vercel serves)

```bash
# Docker
docker compose run --rm web npm run build      # output in ./dist

# or local Node
npm run build
```

### Self-host the built site with nginx (optional)

The `Dockerfile` has a `prod` stage that builds the app and serves it with nginx:

```bash
docker build --target prod -t faraday-cv .
docker run -p 8080:80 faraday-cv               # http://localhost:8080
```

---

## Deploy to Vercel (free)

1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com/), **New Project → Import** your repo.
3. Vercel auto-detects Vite (static build from `vercel.json`) *and* the `/api/chat.ts`
   serverless function. Just click **Deploy**.
4. In the project's **Settings → Environment Variables**, add `GEMINI_API_KEY` (get a
   free key from [Google AI Studio](https://aistudio.google.com/app/apikey); keep that
   Gemini project on the **free tier with billing disabled** so there's no surprise cost).

### Environment variables

Copy `.env.example` to `.env.local` for local dev (`vercel dev` or `vite` will pick it
up) and set the same `GEMINI_API_KEY` in the Vercel dashboard for production. The key is
only read server-side in `/api/chat.ts` — it's never sent to the browser. If the hosted
call fails for any reason (missing key, network issue, rate limit), the Companion
silently falls back to the in-browser Qwen model where WebGPU is available.

> Any static host works for the static build (Netlify, Cloudflare Pages, GitHub Pages),
> but the hosted Companion specifically needs Vercel's serverless functions for
> `/api/chat`. On other hosts, the Companion still works via the WebLLM fallback.

---

## Project layout

```
src/
  data/
    cv.ts            # SINGLE SOURCE OF TRUTH — all resume content (edit here)
    sections.ts      # the 9 sidebar entries (label, icon, footer hint)
  components/         # Header, Sidebar, Footer, SkillBar, Card
  sections/          # the 8 content sections, each rendering cv.ts
  chat/
    engine.ts        # ChatEngine interface + WebLLMEngine (Qwen in-browser)
    RemoteEngine.ts  # ChatEngine that calls /api/chat (hosted Gemini)
    FallbackEngine.ts# tries RemoteEngine, falls back to WebLLMEngine on failure
    systemPrompt.ts  # turns cv.ts into the chatbot's system prompt
    ChatPanel.tsx    # the Companion chat UI
  App.tsx            # active-section state + layout
  styles/cv.css      # the full Camp Menu theme
api/
  chat.ts            # Vercel serverless function: calls Gemini, reuses systemPrompt.ts
public/              # CV PDF (linked from the app)
Dockerfile           # multi-stage: dev (HMR) + prod (nginx)
docker-compose.yml   # dev service with hot reload
vercel.json          # Vite build + SPA rewrite + headers
```

---

## Editing your CV

Open **`src/data/cv.ts`** and edit the fields — name, bio, experience, **projects**,
skills, etc. Both the on-screen sections and the Companion chatbot's answers update from
this one file. Add `repo`/`demo` URLs to any project in `cv.projects` to show `[Repo ↗]` /
`[Demo ↗]` links on its card.

**Profile photo:** drop a square image at **`public/profile.jpg`** to replace the crest
icon in the header. If the file is absent, the crest icon shows instead.

**Download CV:** the Profile section links `public/CV-FARADAY BARR FATAHILLAH-1.pdf` via
`cv.resumePdf` — swap that file (or the path) to change it.

To change the chatbot model (e.g. to a larger Qwen), edit `MODEL_ID` in
`src/chat/engine.ts`. Use one of the model ids listed by `@mlc-ai/web-llm`'s
`prebuiltAppConfig` (e.g. `Qwen2.5-1.5B-Instruct-q4f16_1-MLC` for higher quality at the
cost of a larger download).

### Swapping the hosted model or adding another backend

The chatbot sits behind the `ChatEngine` interface in `src/chat/engine.ts`. The default
engine is `FallbackEngine(new RemoteEngine(), new WebLLMEngine())` — to point at a
different hosted API (or your own FastAPI/Ollama service), write a class implementing
`ChatEngine` and pass it in:

```tsx
<ChatPanel engine={new MyRemoteEngine()} />
```

Nothing else in the UI changes. To change the hosted model itself, edit `GEMINI_MODEL` in
`api/chat.ts`.

---

## Troubleshooting

- **Companion shows a "needs WebGPU" message:** your browser doesn't expose WebGPU. Use a
  recent Chrome/Edge/Firefox; on Linux you may need to enable the WebGPU flag.
- **First Companion response is slow:** the model weights (~350 MB) download once on first
  use, then are cached by the browser.
- **HMR not refreshing inside Docker on Windows:** this project sets `usePolling` in
  `vite.config.ts` and `CHOKIDAR_USEPOLLING=true` in `docker-compose.yml` to make file
  watching work through the bind mount. If it still lags, restart `docker compose up`.
- **`docker: command not found`:** Docker Desktop isn't running or isn't on PATH — launch
  it and reopen your terminal.
