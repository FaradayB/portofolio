# Camp Menu CV — React/TS App with In-Browser Qwen Chatbot

**Date:** 2026-06-12
**Type:** Single-page React + TypeScript app (Vite), Dockerized dev environment, deployed free to Vercel, with an in-browser RAG/LLM chatbot.
**Supersedes:** `2026-06-12-arcus-orbal-portfolio-design.md` (multi-page static ARCUS site) and the single-file approach in `prompt.md`.

---

## Concept

A single-page interactive CV styled as the **Trails of Cold Steel Camp Menu** (per
`prompt.md`): gradient + honeycomb background, gold/silver pill nav, Cinzel typography,
HP/EP-style skill bars. It is rebuilt as a React/TypeScript app so a small **RAG/LLM
chatbot** about the CV can be added.

The chatbot uses a **lightweight local model (Qwen) running in the visitor's browser**
via WebLLM/WebGPU. This is the only architecture that satisfies all three goals at once:
free, serverless-host-friendly (Vercel), and a genuinely local lightweight model.

### Why browser-side, not server-side
- Free serverless hosts (Vercel) serve static files + short-lived functions; they cannot
  run a persistent Qwen container. No reliable *free* 24/7 container host exists for an LLM.
- WebLLM downloads quantized Qwen weights to the visitor's device and runs inference
  client-side. All static → deploys free to Vercel.
- A CV is a few hundred words, so the whole document fits in the model context. "RAG" here
  is just injecting the CV as the system prompt — no vector database or embeddings server.

---

## Stack & Tooling

| Concern | Choice | Rationale |
|---|---|---|
| Framework | React + TypeScript | Requested; component model fits the section/nav structure |
| Build tool | Vite | Fast dev/HMR; Vercel auto-detects it |
| In-browser LLM | `@mlc-ai/web-llm` | Runs quantized Qwen via WebGPU, streams tokens |
| Default model | `Qwen2.5-0.5B-Instruct` (q4f16, ~350 MB) | Small one-time download; one constant to bump to 1.5B |
| Styling | Plain CSS (`styles/cv.css`) | Preserves `prompt.md`'s exact pixel specs; no Tailwind |
| Fonts/Icons | Cinzel + Tabler via CDN | Same as the spec |
| Tests | Vitest + React Testing Library | Component + unit tests; LLM mocked behind interface |

---

## Project Structure

```
/ (repo root)
  src/
    data/cv.ts            # single source of truth: all resume content, typed
    components/
      Header.tsx          # crest badge, name, role
      Sidebar.tsx         # 9 pill nav buttons (8 sections + Companion)
      Footer.tsx          # dynamic section hint + university line
      SkillBar.tsx        # HP/EP-style stat bar
      Card.tsx            # gold-left-border content card
    sections/
      Profile.tsx  Education.tsx  Experience.tsx  Research.tsx
      Leadership.tsx  Skills.tsx  Certifications.tsx  Contact.tsx
    chat/
      ChatPanel.tsx       # Camp-Menu-styled chat UI (the "Companion" section)
      engine.ts           # ChatEngine interface + WebLLMEngine implementation
      systemPrompt.ts     # builds CV-context system prompt from cv.ts
    App.tsx               # active-section state, layout
    main.tsx              # React entry
    styles/cv.css         # full Camp Menu theme
  public/
    CV-FARADAY BARR FATAHILLAH-1.pdf   # kept, linked as "Download CV"
  index.html              # Vite HTML shell (Cinzel + Tabler links)
  Dockerfile              # multi-stage: dev (Vite HMR) + prod (build -> nginx)
  docker-compose.yml      # dev service, hot reload via bind mount
  vercel.json             # SPA rewrites + COOP/COEP headers for WebGPU
  package.json  tsconfig.json  vite.config.ts
  docs/superpowers/specs/2026-06-12-react-camp-menu-cv-chatbot-design.md
```

### Single source of truth — `cv.ts`
All resume content (identity, education, experience, research, leadership, skills,
certifications, contact) lives in one typed module. It feeds **both** the rendered
sections **and** the chatbot system prompt, so editing the CV in one place updates both.

---

## Visual System (from `prompt.md`)

Carried over verbatim from `prompt.md`: gradient background
(`#2e3d4a → #4a6070 @30% → #7a95a8 @70% → #8faabb`), interlocking twin-`<pattern>`
SVG honeycomb, metallic-silver default / gold-tinted active pill buttons, gold-left-border
content cards, Cinzel typography, and HP/EP-style skill bars grouped into AI/ML (orange),
MLOps/Cloud (blue), Other/Hardware (green). The eight content sections and their copy come
straight from `prompt.md` sections 1–8.

---

## Chatbot Design

### Engine interface (the future-backend seam)
```ts
interface ChatEngine {
  init(onProgress: (p: InitProgress) => void): Promise<void>;
  ask(messages: ChatMessage[]): AsyncIterable<string>;   // streams tokens
}
```
- **Today:** one implementation, `WebLLMEngine`, loads Qwen via `@mlc-ai/web-llm` and
  streams tokens.
- **Later (optional):** a `RemoteEngine` calling a hosted API can be dropped in by changing
  one wiring line; the UI is unchanged. This is the "add a backend later" mechanism.

### Context / "RAG"
`systemPrompt.ts` serializes `cv.ts` into a system prompt instructing the model to answer
only from the CV and to say so when something isn't covered. No vector store.

### UI / UX
- A **9th sidebar element, "Companion"** (Tabler `ti-message-chatbot`), opens the chat in
  the main content area, styled to match the Camp Menu.
- On first open, the model downloads with a visible progress bar.
- **WebGPU fallback:** if the browser lacks WebGPU, the panel shows a graceful message
  ("Companion needs a WebGPU-capable browser") instead of failing.
- Streaming token output; user messages and model replies styled as Camp Menu cards.

---

## Docker + Vercel Workflow

- **Local dev (no local Node):** `docker compose up` runs the Vite dev server with HMR;
  source is bind-mounted, so editing files on Windows refreshes the browser.
- **Deploy:** push to GitHub → Vercel builds from source and serves the static output.
- **Prod image (bonus):** the Dockerfile's prod stage builds and serves via nginx for
  optional self-hosting; not required by Vercel.
- **Cross-origin isolation:** WebGPU/WebLLM needs COOP/COEP headers, set in `vercel.json`
  and the nginx/dev config.

---

## Migration — What Is Removed

Deleted from the working tree (retained in git history):
`index.html` (ARCUS), `orbment.html`, `records.html`, `log.html`, `link.html`,
`assets/css/arcus.css`, `assets/js/arcus.js`.

Kept: `prompt.md`, `FARADAY BARR FATAHILLAH-resume.md`, `public/CV-...pdf`, the docs/specs
folder. The ARCUS spec is superseded by this document (noted in its header), not deleted.

---

## Testing

- **Component:** section switching shows exactly one section; Sidebar marks the active
  button; `SkillBar` renders the correct width/color per percent and category.
- **Unit:** `systemPrompt.ts` output contains key CV facts (name, GPA, current role).
- **Chat UI:** tested against a mock `ChatEngine` (no real model load); verifies progress,
  streaming render, and the WebGPU-absent fallback path.

---

## Out of Scope

- Server-side model hosting, vector databases, embeddings services (Paths B/C).
- Authentication, analytics, CMS, multi-page routing.
- Conversation persistence across reloads.

---

## Decisions Locked

- Design: **`prompt.md` Camp Menu** (ARCUS retired).
- Chatbot: **Path A — Qwen in-browser via WebLLM**.
- Default model: **Qwen2.5-0.5B-Instruct** (bumpable to 1.5B via one constant).
- Chat entry point: **9th "Companion" sidebar button**.
- ARCUS files: **deleted from working tree** (kept in git history).
