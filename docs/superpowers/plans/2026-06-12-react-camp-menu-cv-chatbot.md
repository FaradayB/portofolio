# React Camp Menu CV + In-Browser Qwen Chatbot — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the static CV as a React/TypeScript single-page app (Vite) styled as the Trails of Cold Steel Camp Menu, with a lightweight Qwen chatbot running in the visitor's browser via WebLLM/WebGPU, developed inside Docker and deployable free to Vercel.

**Architecture:** A Vite + React + TS SPA. All resume content lives in one typed module (`src/data/cv.ts`) that feeds both the rendered sections and the chatbot's system prompt. The chatbot sits behind a `ChatEngine` interface (today: `WebLLMEngine`; future: a remote backend) so swapping to a server is a one-line change. The CV is small enough to be injected wholesale into the system prompt — no vector DB. Docker provides the dev toolchain (no local Node); Vercel builds from source.

**Tech Stack:** React 18, TypeScript, Vite, `@mlc-ai/web-llm` (Qwen2.5-0.5B-Instruct), Vitest + React Testing Library, Docker (dev + prod multi-stage), nginx (prod), Vercel.

---

## Toolchain Convention (READ FIRST)

This machine has **no Node and no Docker**. Task 0 installs Docker Desktop. After that, **every** Node/npm/test command runs *inside the container*. The canonical prefix is:

```bash
docker compose run --rm web <command>
```

Examples used throughout this plan:
- Install deps: `docker compose run --rm web npm install`
- Run one test: `docker compose run --rm web npx vitest run src/path/file.test.tsx`
- Run all tests: `docker compose run --rm web npm test`
- Start dev server (foreground, HMR): `docker compose up`

Never run bare `npm`/`npx`/`node` — they are not installed on the host.

---

## File Structure

| File | Responsibility |
|---|---|
| `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts` | Project + Vite + Vitest config |
| `index.html` | Vite HTML shell; Cinzel + Tabler CDN links; `#root` |
| `Dockerfile` | Multi-stage: `dev` (Vite HMR) + `prod` (build → nginx) |
| `docker-compose.yml`, `.dockerignore`, `nginx.conf` | Dev container + prod serving |
| `vercel.json` | SPA rewrite + security headers |
| `src/main.tsx` | React entry; mounts `<App/>` |
| `src/App.tsx` | Active-section state; composes Header/Sidebar/main/Footer |
| `src/styles/cv.css` | Full Camp Menu theme (background, nav, cards, bars) |
| `src/data/cv.ts` | Typed single source of truth for all resume content |
| `src/data/sections.ts` | Section registry (id, label, icon, footer hint) |
| `src/components/Header.tsx` | Crest badge, name, role, contact hints |
| `src/components/Sidebar.tsx` | 9 pill nav buttons; active state |
| `src/components/Footer.tsx` | Dynamic section hint + university line |
| `src/components/SkillBar.tsx` | One HP/EP-style stat bar |
| `src/components/Card.tsx` | Gold-left-border content card |
| `src/sections/*.tsx` | The 8 content sections, rendering `cv.ts` |
| `src/chat/systemPrompt.ts` | Builds CV-context system prompt from `cv.ts` |
| `src/chat/engine.ts` | `ChatEngine` interface + `WebLLMEngine` |
| `src/chat/ChatPanel.tsx` | Companion chat UI (progress, streaming, fallback) |
| `src/test/setup.ts` | Vitest + jest-dom setup |

**Removed (kept in git history):** `index.html` (ARCUS — overwritten), `orbment.html`, `records.html`, `log.html`, `link.html`, `assets/css/arcus.css`, `assets/js/arcus.js`.

---

## Task 0: Install Docker Desktop (manual, one-time)

**This is a human action — an agent cannot do it.** If Docker is already installed and `docker compose version` works, skip to Task 1.

- [ ] **Step 1: Install Docker Desktop for Windows**

Download from https://www.docker.com/products/docker-desktop/ , install, reboot if prompted, and launch Docker Desktop until the whale icon shows "Engine running". WSL2 backend is the default and is recommended.

- [ ] **Step 2: Verify**

Run (PowerShell):
```powershell
docker --version
docker compose version
```
Expected: both print version numbers (Docker ≥ 24, Compose v2). If "command not found", Docker Desktop is not on PATH — restart the terminal / Docker Desktop.

---

## Task 1: Project config + Docker dev environment

We hand-write all config files (no interactive `npm create`), then install deps in the container. This task ends with a running dev server.

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `.dockerignore`, `Dockerfile`, `docker-compose.yml`, `src/main.tsx`, `src/App.tsx`, `src/styles/cv.css`, `src/test/setup.ts`
- Modify: `.gitignore`
- Delete: `orbment.html`, `records.html`, `log.html`, `link.html`, `assets/css/arcus.css`, `assets/js/arcus.js`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "faraday-cv",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host",
    "test": "vitest run"
  },
  "dependencies": {
    "@mlc-ai/web-llm": "^0.2.79",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.2",
    "vite": "^6.0.5",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Write `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Write `vite.config.ts`** (note `usePolling` — required for HMR through a Windows Docker bind mount)

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: { usePolling: true },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: false,
  },
});
```

- [ ] **Step 5: Write `index.html`** (overwrites the ARCUS file)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Faraday Barr Fatahillah · AI Engineer</title>
    <meta name="description" content="Interactive CV of Faraday Barr Fatahillah, AI Engineer." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Write `src/test/setup.ts`**

```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 7: Write `src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/cv.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 8: Write a minimal `src/App.tsx` placeholder** (replaced in Task 4)

```tsx
export default function App() {
  return <div className="app">Loading…</div>;
}
```

- [ ] **Step 9: Write a minimal `src/styles/cv.css` placeholder** (replaced in Task 3)

```css
:root { color-scheme: dark; }
body { margin: 0; font-family: "Cinzel", serif; }
```

- [ ] **Step 10: Write `.dockerignore`**

```
node_modules
dist
.git
*.log
```

- [ ] **Step 11: Write `Dockerfile`** (multi-stage; prod stage used in Task 9)

```dockerfile
# --- dev: Vite dev server with HMR ---
FROM node:20-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# --- build: produce static assets ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# --- prod: serve static assets with nginx ---
FROM nginx:alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 12: Write `docker-compose.yml`** (dev service; named volume keeps container `node_modules` separate from the host bind mount)

```yaml
services:
  web:
    build:
      context: .
      target: dev
    ports:
      - "5173:5173"
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    environment:
      - CHOKIDAR_USEPOLLING=true

volumes:
  node_modules:
```

- [ ] **Step 13: Update `.gitignore`** — append:

```
node_modules
dist
.vite
```

- [ ] **Step 14: Delete the obsolete ARCUS files**

Run (PowerShell):
```powershell
Remove-Item orbment.html, records.html, log.html, link.html -Confirm:$false
Remove-Item assets/css/arcus.css, assets/js/arcus.js -Confirm:$false
```
(`index.html` is already overwritten by Step 5. The `assets/img` folder and `public/` stay.)

- [ ] **Step 15: Build the image and install dependencies**

Run:
```bash
docker compose build
docker compose run --rm web npm install
```
Expected: image builds; `npm install` completes and writes `package-lock.json` to the host (via bind mount). If you see a peer-dependency warning for `@mlc-ai/web-llm`, it is non-fatal.

- [ ] **Step 16: Smoke-test the dev server**

Run:
```bash
docker compose up
```
Expected: Vite prints `Local: http://localhost:5173/`. Open it in a browser — you should see "Loading…". Stop with `Ctrl+C`.

- [ ] **Step 17: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite+React+TS app in Docker; retire ARCUS files"
```

---

## Task 2: CV data — the single source of truth

**Files:**
- Create: `src/data/cv.ts`, `src/data/cv.test.ts`

- [ ] **Step 1: Write the failing test** — `src/data/cv.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { cv } from "./cv";

describe("cv data", () => {
  it("has core identity", () => {
    expect(cv.name).toBe("Faraday Barr Fatahillah");
    expect(cv.role).toBe("AI Engineer");
    expect(cv.bio.length).toBeGreaterThan(40);
  });

  it("has all eight content sections populated", () => {
    expect(cv.stats).toHaveLength(3);
    expect(cv.education).toBeDefined();
    expect(cv.experience).toHaveLength(4);
    expect(cv.research).toHaveLength(1);
    expect(cv.leadership).toHaveLength(2);
    expect(cv.skillGroups).toHaveLength(3);
    expect(cv.certifications).toHaveLength(4);
    expect(cv.contact).toHaveLength(4);
  });

  it("skill percentages are within range", () => {
    for (const g of cv.skillGroups) {
      for (const s of g.skills) {
        expect(s.pct).toBeGreaterThan(0);
        expect(s.pct).toBeLessThanOrEqual(100);
      }
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `docker compose run --rm web npx vitest run src/data/cv.test.ts`
Expected: FAIL — `Cannot find module './cv'`.

- [ ] **Step 3: Write `src/data/cv.ts`**

```ts
export interface Entry {
  title: string;
  org: string;
  date: string;
  body: string;
}

export interface Skill {
  name: string;
  pct: number;
}

export interface SkillGroup {
  category: string;
  color: string; // bar fill color
  skills: Skill[];
}

export interface Certification {
  title: string;
  sub: string;
}

export interface ContactItem {
  icon: string; // tabler icon class, e.g. "ti-phone"
  label: string;
  value: string;
  href?: string;
}

export interface CV {
  name: string;
  role: string;
  bio: string;
  emailHint: string;
  githubHint: string;
  stats: string[];
  education: Entry;
  experience: Entry[];
  research: Entry[];
  leadership: Entry[];
  skillGroups: SkillGroup[];
  certifications: Certification[];
  contact: ContactItem[];
}

export const cv: CV = {
  name: "Faraday Barr Fatahillah",
  role: "AI Engineer",
  bio:
    "I build end-to-end AI systems — from model training to cloud deployment. " +
    "Experienced across LLM / RAG, computer vision (YOLOv8), and IoT, with " +
    "production MLOps on FastAPI, Docker, GCP, Prometheus and Grafana. " +
    "Computer Engineering graduate, Telkom University — highest GPA in my major.",
  emailHint: "faradaybarrf@gmail.com",
  githubHint: "github.com/FaradayB",
  stats: ["GPA 3.88", "250+ Students Mentored", "Top of Major"],
  education: {
    title: "Bachelor of Computer Engineering",
    org: "Telkom University — Bandung, Indonesia",
    date: "Sep 2021 – Aug 2025",
    body:
      "GPA: 3.88 / 4.00 · Highest GPA in major · Led 15 teaching assistants · " +
      "Mentored 250+ students",
  },
  experience: [
    {
      title: "AI Engineer Bootcamp Trainee",
      org: "PT. Berlian Sistem Informasi — Jakarta",
      date: "Apr 2026 – Sep 2026",
      body:
        "Built end-to-end AI predictive maintenance system on GCP with Docker, " +
        "FastAPI, Prometheus, Grafana. Built RAG chatbot using Azure AI Foundry, " +
        "LangChain, Azure AI Search. Engineered prompts for grounding and token " +
        "efficiency, validated via Azure Evaluations.",
    },
    {
      title: "Deputy Assistant Coordinator",
      org: "i-Smile Laboratory — Bandung",
      date: "Jul 2024 – Jul 2025",
      body:
        "Designed and delivered 7 hands-on AI practicum sessions in Python. Led ML " +
        "study group for 50+ students covering fundamentals and workflows.",
    },
    {
      title: "Machine Learning Cohort",
      org: "Bangkit Academy",
      date: "Sep 2024 – Dec 2024",
      body:
        "Built SugarCare diabetes prediction app — 83% accuracy. Studied deep " +
        "learning and GANs. Recognized as Active Participant.",
    },
    {
      title: "Teaching Assistant",
      org: "Telkom University — Bandung",
      date: "Sep 2024 – Aug 2025",
      body:
        "Assisted 5 courses including IoT and Control Systems. Contributed to course " +
        "materials, assessments, and grading.",
    },
  ],
  research: [
    {
      title: "Student Researcher",
      org: "Telkom University",
      date: "Feb 2024 – Aug 2025",
      body:
        "Led RFID-based inventory management research, built Android Kotlin app, led " +
        "system experiments. Supported fall detection research through debugging, " +
        "knowledge transfer, and hardware-software coordination.",
    },
  ],
  leadership: [
    {
      title: "Head of Academics & Profession Dept.",
      org: "HMTK (Computer Engineering Student Assoc.) — Bandung",
      date: "Dec 2024 – Aug 2025",
      body:
        "Managed department activities, coordinated company visits, led academic " +
        "study groups for 100+ students.",
    },
    {
      title: "Organizer",
      org: "AWS Gen-AI Tour",
      date: "Aug 2024",
      body:
        "Led student organizer team across Telkom University and Binus University. " +
        "Managed speakers, materials, and technical operations for AWS generative AI " +
        "hands-on event.",
    },
  ],
  skillGroups: [
    {
      category: "AI & Machine Learning",
      color: "#e08010",
      skills: [
        { name: "Python", pct: 95 },
        { name: "TensorFlow/PyTorch", pct: 90 },
        { name: "Scikit-learn", pct: 88 },
        { name: "YOLO / CV", pct: 85 },
        { name: "RAG / LLM", pct: 90 },
        { name: "LangChain", pct: 85 },
      ],
    },
    {
      category: "MLOps & Cloud",
      color: "#1858b0",
      skills: [
        { name: "Docker", pct: 88 },
        { name: "GCP", pct: 82 },
        { name: "Azure AI Foundry", pct: 85 },
        { name: "FastAPI", pct: 88 },
        { name: "Prometheus/Grafana", pct: 80 },
      ],
    },
    {
      category: "Other & Hardware",
      color: "#20a040",
      skills: [
        { name: "Android (Kotlin)", pct: 75 },
        { name: "Arduino / ESP32", pct: 78 },
        { name: "C", pct: 72 },
        { name: "Streamlit", pct: 85 },
      ],
    },
  ],
  certifications: [
    { title: "Generative AI for Everyone", sub: "Coursera, 2024" },
    { title: "DeepLearning.AI TensorFlow Developer Specialization", sub: "2024" },
    { title: "Structuring Machine Learning Projects", sub: "DeepLearning.AI, 2024" },
    { title: "Machine Learning Specialization", sub: "DeepLearning.AI, 2024" },
  ],
  contact: [
    { icon: "ti-phone", label: "Phone", value: "+6281282658563", href: "tel:+6281282658563" },
    { icon: "ti-mail", label: "Email", value: "faradaybarrf@gmail.com", href: "mailto:faradaybarrf@gmail.com" },
    { icon: "ti-brand-linkedin", label: "LinkedIn", value: "linkedin.com/in/faradaybarr", href: "https://linkedin.com/in/faradaybarr" },
    { icon: "ti-brand-github", label: "GitHub", value: "github.com/FaradayB", href: "https://github.com/FaradayB" },
  ],
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `docker compose run --rm web npx vitest run src/data/cv.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/cv.ts src/data/cv.test.ts
git commit -m "feat: typed CV data as single source of truth"
```

---

## Task 3: Camp Menu theme CSS

Port the visual system from `prompt.md` into `src/styles/cv.css`. This is presentational (no test); verified visually via the dev server.

**Files:**
- Modify: `src/styles/cv.css` (replace the placeholder)

- [ ] **Step 1: Replace `src/styles/cv.css` with the full theme**

```css
:root {
  color-scheme: dark;
  --gold: #c8a830;
  --gold-bright: #e8d49a;
  --gold-mid: #c9a84c;
  --ink: #1a1e28;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: "Cinzel", serif;
  color: #e8e2cc;
  background:
    linear-gradient(to top, #2e3d4a 0%, #4a6070 30%, #7a95a8 70%, #8faabb 100%);
  min-height: 100vh;
}

/* honeycomb overlay */
.honeycomb {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.5;
}

.app {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 18px;
}

/* ---------- Header ---------- */
.header { display: flex; align-items: center; justify-content: space-between; padding: 18px 0; gap: 18px; }
.header-left { display: flex; align-items: center; gap: 14px; }
.crest {
  width: 54px; height: 54px; border-radius: 50%;
  background: #1a1e28; border: 2px solid var(--gold);
  display: grid; place-items: center; color: var(--gold); font-size: 26px;
}
.header-name {
  font-weight: 700; font-size: 22px; color: #e8d070;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.53); letter-spacing: 1px;
}
.header-rule { height: 3px; background: #b82020; margin: 4px 0; width: 100%; }
.header-role { font-size: 11px; letter-spacing: 3px; color: #e8b840; }
.header-hints { text-align: right; font-size: 12px; color: #ddd8c0; line-height: 1.9; }
.header-hints i { color: var(--gold); margin-right: 4px; }

/* ---------- Layout body ---------- */
.body { display: grid; grid-template-columns: 180px 1fr; gap: 24px; padding: 8px 0 24px; }

/* ---------- Sidebar ---------- */
.sidebar { display: flex; flex-direction: column; gap: 10px; }
.navbtn {
  display: flex; align-items: center; gap: 10px;
  width: 148px; height: 34px; padding: 0 8px;
  border-radius: 17px; cursor: pointer;
  background: linear-gradient(to bottom, #d8dce4, #b8bcc8, #9ca0b0, #c0c4d0);
  border: 1px solid #b0b8c0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.27), inset 0 1px 0 rgba(255,255,255,0.67);
  font-family: "Cinzel", serif;
}
.navbtn .badge {
  width: 26px; height: 26px; border-radius: 50%;
  background: linear-gradient(to bottom, #d0d4dc, #9098a8);
  border: 1px solid #a0a8b8; display: grid; place-items: center;
  color: #2a2e3a; font-size: 14px; flex: none;
}
.navbtn .label { font-size: 12px; letter-spacing: 2px; color: #2a2e3a; }
.navbtn.active {
  background: linear-gradient(to bottom, #e8d890, #c8a830, #a07820, #c0a040);
  border: 1px solid #e8c840;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,240,0.5);
}
.navbtn.active .label { color: #1a1200; }

/* ---------- Main content ---------- */
.main { min-height: 360px; }
.card {
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
  border-left: 3px solid var(--gold);
  border-radius: 3px; padding: 12px 14px; margin-bottom: 10px;
}
.card-title { font-size: 13px; color: var(--gold-bright); font-weight: 700; }
.card-sub { font-size: 11px; color: var(--gold-mid); margin: 2px 0 6px; }
.card-body { font-size: 10px; color: #a09878; line-height: 1.7; }

/* Profile */
.profile { text-align: center; padding-top: 8px; }
.diamond { color: var(--gold); font-size: 22px; }
.profile-role { font-size: 30px; color: var(--gold-bright); margin: 8px 0; }
.profile-bio { font-size: 11px; color: #cfc8ad; line-height: 1.8; max-width: 620px; margin: 0 auto 16px; }
.stat-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.stat-pill { border: 1px solid var(--gold); border-radius: 14px; padding: 5px 12px; font-size: 10px; color: var(--gold-bright); }

/* Skills */
.skill-group-head { font-size: 12px; color: var(--gold-bright); letter-spacing: 2px; margin: 14px 0 8px; }
.skill-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.skill-label { font-size: 10px; letter-spacing: 1px; color: #c8b880; min-width: 140px; }
.skill-track {
  flex: 1; height: 9px; border-radius: 1px;
  background: rgba(26,32,40,0.53); border: 1px solid rgba(255,255,255,0.13);
  overflow: hidden;
}
.skill-fill { height: 100%; }

/* Certifications */
.cert { display: flex; flex-direction: column; }
.cert .card-sub { margin-bottom: 0; }

/* Contact */
.contact { display: flex; flex-direction: column; gap: 14px; align-items: center; padding-top: 8px; }
.contact-item { display: flex; align-items: center; gap: 12px; font-size: 13px; }
.contact-item i { color: var(--gold); font-size: 20px; }
.contact-label { color: var(--gold-mid); min-width: 80px; }
.contact-value { color: var(--gold-bright); text-decoration: none; }
.contact-div { color: var(--gold); opacity: 0.6; }

/* ---------- Footer ---------- */
.footer {
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(26,30,40,0.8); border-top: 2px solid var(--gold);
  padding: 8px 14px; font-size: 10px; color: #c0b890;
}
.footer .hint i { color: var(--gold); margin-right: 6px; }
.footer-right { text-align: right; line-height: 1.5; }

/* ---------- Chat / Companion ---------- */
.chat { display: flex; flex-direction: column; height: 420px; }
.chat-log { flex: 1; overflow-y: auto; padding-right: 6px; }
.chat-msg { margin-bottom: 8px; }
.chat-msg .card-sub { text-transform: uppercase; }
.chat-form { display: flex; gap: 8px; margin-top: 10px; }
.chat-input {
  flex: 1; background: rgba(0,0,0,0.25); border: 1px solid var(--gold);
  border-radius: 3px; color: #e8e2cc; font-family: "Cinzel", serif;
  font-size: 11px; padding: 8px 10px;
}
.chat-send {
  background: linear-gradient(to bottom, #e8d890, #c8a830, #a07820);
  border: 1px solid #e8c840; border-radius: 3px; color: #1a1200;
  font-family: "Cinzel", serif; font-size: 11px; padding: 0 14px; cursor: pointer;
}
.chat-send:disabled { opacity: 0.5; cursor: default; }
.chat-status { font-size: 10px; color: var(--gold-mid); margin-bottom: 8px; }
.chat-fallback { font-size: 11px; color: #cfc8ad; line-height: 1.8; }

@media (max-width: 760px) {
  .body { grid-template-columns: 1fr; }
  .sidebar { flex-direction: row; flex-wrap: wrap; }
}
```

- [ ] **Step 2: Verify it loads (visual smoke)**

Run: `docker compose up`, open http://localhost:5173 — background gradient should render, "Loading…" centered. Stop with `Ctrl+C`. (Full layout arrives in Task 4.)

- [ ] **Step 3: Commit**

```bash
git add src/styles/cv.css
git commit -m "feat: Camp Menu theme CSS"
```

---

## Task 4: Section registry, layout shell, and navigation

Build the section registry, then `Header`, `Sidebar`, `Footer`, and `App` with active-section state. TDD covers the interactive behavior (switching sections + footer hint).

**Files:**
- Create: `src/data/sections.ts`, `src/components/Header.tsx`, `src/components/Sidebar.tsx`, `src/components/Footer.tsx`, `src/App.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write `src/data/sections.ts`**

```ts
export type SectionId =
  | "profile" | "education" | "experience" | "research"
  | "leadership" | "skills" | "certifications" | "contact" | "companion";

export interface SectionMeta {
  id: SectionId;
  label: string;
  icon: string;  // tabler icon class
  hint: string;  // footer text when active
}

export const sections: SectionMeta[] = [
  { id: "profile",        label: "Profile",        icon: "ti-user",        hint: "Viewing Profile overview." },
  { id: "education",      label: "Education",      icon: "ti-school",      hint: "Viewing Education records." },
  { id: "experience",    label: "Experience",    icon: "ti-briefcase",   hint: "Viewing Experience records." },
  { id: "research",       label: "Research",       icon: "ti-microscope",  hint: "Viewing Research records." },
  { id: "leadership",     label: "Leadership",     icon: "ti-crown",       hint: "Viewing Leadership records." },
  { id: "skills",         label: "Skills",         icon: "ti-chart-bar",   hint: "Viewing Skills ratings." },
  { id: "certifications", label: "Certifications", icon: "ti-certificate", hint: "Viewing Certifications." },
  { id: "contact",        label: "Contact",        icon: "ti-mail",        hint: "Viewing Contact links." },
  { id: "companion",      label: "Companion",      icon: "ti-message-chatbot", hint: "Talking with the CV Companion." },
];
```

- [ ] **Step 2: Write `src/components/Header.tsx`**

```tsx
import { cv } from "../data/cv";

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <div className="crest"><i className="ti ti-chess-knight" /></div>
        <div>
          <div className="header-name">{cv.name.toUpperCase()}</div>
          <div className="header-rule" />
          <div className="header-role">{cv.role.toUpperCase()}</div>
        </div>
      </div>
      <div className="header-hints">
        <div><i className="ti ti-mail" />: {cv.emailHint}</div>
        <div><i className="ti ti-brand-github" />: {cv.githubHint}</div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Write `src/components/Sidebar.tsx`**

```tsx
import { sections, SectionId } from "../data/sections";

interface Props {
  active: SectionId;
  onSelect: (id: SectionId) => void;
}

export default function Sidebar({ active, onSelect }: Props) {
  return (
    <nav className="sidebar" aria-label="Sections">
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          className={"navbtn" + (s.id === active ? " active" : "")}
          aria-pressed={s.id === active}
          onClick={() => onSelect(s.id)}
        >
          <span className="badge"><i className={"ti " + s.icon} /></span>
          <span className="label">{s.label}</span>
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Write `src/components/Footer.tsx`**

```tsx
interface Props { hint: string; }

export default function Footer({ hint }: Props) {
  return (
    <footer className="footer">
      <span className="hint"><i className="ti ti-shield" />{hint}</span>
      <span className="footer-right">
        Telkom University · GPA 3.88<br />Class of 2025
      </span>
    </footer>
  );
}
```

- [ ] **Step 5: Write the failing test** — `src/App.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App navigation", () => {
  it("shows Profile by default with the first button active", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /Profile/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Viewing Profile overview\./)).toBeInTheDocument();
  });

  it("switches sections on click and updates the footer hint", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Experience/ }));
    expect(screen.getByRole("button", { name: /Experience/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Viewing Experience records\./)).toBeInTheDocument();
    // Profile content (role headline) no longer shown
    expect(screen.queryByText("AI Engineer", { selector: ".profile-role" })).not.toBeInTheDocument();
    // an Experience card is shown
    expect(screen.getByText("AI Engineer Bootcamp Trainee")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `docker compose run --rm web npx vitest run src/App.test.tsx`
Expected: FAIL — sections not rendered yet (App is the placeholder).

- [ ] **Step 7: Replace `src/App.tsx`** (imports the section components built in Task 6; create empty stand-ins now so this compiles, then flesh them out in Task 6)

```tsx
import { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import { sections, SectionId } from "./data/sections";
import Profile from "./sections/Profile";
import Education from "./sections/Education";
import Experience from "./sections/Experience";
import Research from "./sections/Research";
import Leadership from "./sections/Leadership";
import Skills from "./sections/Skills";
import Certifications from "./sections/Certifications";
import Contact from "./sections/Contact";
import ChatPanel from "./chat/ChatPanel";

const views: Record<SectionId, JSX.Element> = {
  profile: <Profile />,
  education: <Education />,
  experience: <Experience />,
  research: <Research />,
  leadership: <Leadership />,
  skills: <Skills />,
  certifications: <Certifications />,
  contact: <Contact />,
  companion: <ChatPanel />,
};

export default function App() {
  const [active, setActive] = useState<SectionId>("profile");
  const hint = sections.find((s) => s.id === active)!.hint;

  return (
    <>
      <Honeycomb />
      <div className="app">
        <Header />
        <div className="body">
          <Sidebar active={active} onSelect={setActive} />
          <main className="main">{views[active]}</main>
        </div>
        <Footer hint={hint} />
      </div>
    </>
  );
}

function Honeycomb() {
  return (
    <svg className="honeycomb" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hexA" width="18" height="20.8" patternUnits="userSpaceOnUse">
          <path d="M9 0 L18 5.2 L18 15.6 L9 20.8 L0 15.6 L0 5.2 Z"
            fill="none" stroke="#2e3d4a" strokeWidth="0.8" />
        </pattern>
        <pattern id="hexB" width="18" height="20.8" patternUnits="userSpaceOnUse"
          patternTransform="translate(9 10.4)">
          <path d="M9 0 L18 5.2 L18 15.6 L9 20.8 L0 15.6 L0 5.2 Z"
            fill="none" stroke="#2e3d4a" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexA)" />
      <rect width="100%" height="100%" fill="url(#hexB)" />
    </svg>
  );
}
```

- [ ] **Step 8: Create temporary stand-in section + chat files so the app compiles**

Create each of these files with this placeholder body (they are fully implemented in Tasks 5–8). Use the matching default export name per file:

`src/sections/Profile.tsx`, `Education.tsx`, `Experience.tsx`, `Research.tsx`, `Leadership.tsx`, `Skills.tsx`, `Certifications.tsx`, `Contact.tsx`:
```tsx
export default function Placeholder() { return null; }
```
(Name each function after the file, e.g. `export default function Profile() { return null; }`.)

`src/chat/ChatPanel.tsx`:
```tsx
export default function ChatPanel() { return null; }
```

The Experience test in Step 5 will still fail until Task 6 — that is expected. Proceed to make the *navigation* assertions pass now.

- [ ] **Step 9: Run the navigation test (partial)**

Run: `docker compose run --rm web npx vitest run src/App.test.tsx`
Expected: the first test (default Profile active + footer hint) PASSES; the second test still fails on the Experience-card assertion (stand-in renders null). This is expected and resolved in Task 6.

- [ ] **Step 10: Commit**

```bash
git add src/data/sections.ts src/components src/App.tsx src/App.test.tsx src/sections src/chat/ChatPanel.tsx
git commit -m "feat: layout shell, sidebar navigation, honeycomb background"
```

---

## Task 5: SkillBar component

**Files:**
- Create: `src/components/SkillBar.tsx`, `src/components/SkillBar.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/components/SkillBar.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SkillBar from "./SkillBar";

describe("SkillBar", () => {
  it("renders the label and a fill sized + colored by props", () => {
    render(<SkillBar name="Python" pct={95} color="#e08010" />);
    expect(screen.getByText("Python")).toBeInTheDocument();
    const fill = document.querySelector(".skill-fill") as HTMLElement;
    expect(fill.style.width).toBe("95%");
    expect(fill.style.background).toBe("rgb(224, 128, 16)");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `docker compose run --rm web npx vitest run src/components/SkillBar.test.tsx`
Expected: FAIL — `Cannot find module './SkillBar'`.

- [ ] **Step 3: Write `src/components/SkillBar.tsx`**

```tsx
interface Props { name: string; pct: number; color: string; }

export default function SkillBar({ name, pct, color }: Props) {
  return (
    <div className="skill-row">
      <span className="skill-label">{name}</span>
      <span className="skill-track">
        <span className="skill-fill" style={{ width: `${pct}%`, background: color }} />
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `docker compose run --rm web npx vitest run src/components/SkillBar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SkillBar.tsx src/components/SkillBar.test.tsx
git commit -m "feat: SkillBar stat-bar component"
```

---

## Task 6: The eight content sections

Implement `Card` and all eight sections from `cv.ts`, replacing the Task 4 stand-ins. This makes the second `App.test.tsx` assertion pass.

**Files:**
- Create: `src/components/Card.tsx`, `src/sections/Sections.test.tsx`
- Modify: `src/sections/Profile.tsx`, `Education.tsx`, `Experience.tsx`, `Research.tsx`, `Leadership.tsx`, `Skills.tsx`, `Certifications.tsx`, `Contact.tsx`

- [ ] **Step 1: Write the failing test** — `src/sections/Sections.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Profile from "./Profile";
import Experience from "./Experience";
import Skills from "./Skills";
import Contact from "./Contact";

describe("sections render CV data", () => {
  it("Profile shows role, bio and three stat pills", () => {
    render(<Profile />);
    expect(screen.getByText("AI Engineer", { selector: ".profile-role" })).toBeInTheDocument();
    expect(document.querySelectorAll(".stat-pill")).toHaveLength(3);
  });

  it("Experience shows all four cards", () => {
    render(<Experience />);
    expect(document.querySelectorAll(".card")).toHaveLength(4);
    expect(screen.getByText("AI Engineer Bootcamp Trainee")).toBeInTheDocument();
  });

  it("Skills renders three groups and all bars", () => {
    render(<Skills />);
    expect(document.querySelectorAll(".skill-group-head")).toHaveLength(3);
    expect(document.querySelectorAll(".skill-row")).toHaveLength(15);
  });

  it("Contact shows four items", () => {
    render(<Contact />);
    expect(document.querySelectorAll(".contact-item")).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `docker compose run --rm web npx vitest run src/sections/Sections.test.tsx`
Expected: FAIL — stand-ins render `null`.

- [ ] **Step 3: Write `src/components/Card.tsx`**

```tsx
import { Entry } from "../data/cv";

export default function Card({ title, org, date, body }: Entry) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="card-sub">{org} · {date}</div>
      <div className="card-body">{body}</div>
    </div>
  );
}
```

- [ ] **Step 4: Write `src/sections/Profile.tsx`**

```tsx
import { cv } from "../data/cv";

export default function Profile() {
  return (
    <div className="profile">
      <div className="diamond">◆</div>
      <div className="profile-role">{cv.role}</div>
      <p className="profile-bio">{cv.bio}</p>
      <div className="stat-row">
        {cv.stats.map((s) => (
          <span className="stat-pill" key={s}>{s}</span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Write `src/sections/Education.tsx`**

```tsx
import { cv } from "../data/cv";
import Card from "../components/Card";

export default function Education() {
  return <Card {...cv.education} />;
}
```

- [ ] **Step 6: Write `src/sections/Experience.tsx`**

```tsx
import { cv } from "../data/cv";
import Card from "../components/Card";

export default function Experience() {
  return <>{cv.experience.map((e) => <Card key={e.title} {...e} />)}</>;
}
```

- [ ] **Step 7: Write `src/sections/Research.tsx`**

```tsx
import { cv } from "../data/cv";
import Card from "../components/Card";

export default function Research() {
  return <>{cv.research.map((e) => <Card key={e.title} {...e} />)}</>;
}
```

- [ ] **Step 8: Write `src/sections/Leadership.tsx`**

```tsx
import { cv } from "../data/cv";
import Card from "../components/Card";

export default function Leadership() {
  return <>{cv.leadership.map((e) => <Card key={e.title} {...e} />)}</>;
}
```

- [ ] **Step 9: Write `src/sections/Skills.tsx`**

```tsx
import { cv } from "../data/cv";
import SkillBar from "../components/SkillBar";

export default function Skills() {
  return (
    <>
      {cv.skillGroups.map((g) => (
        <div key={g.category}>
          <div className="skill-group-head">{g.category}</div>
          {g.skills.map((s) => (
            <SkillBar key={s.name} name={s.name} pct={s.pct} color={g.color} />
          ))}
        </div>
      ))}
    </>
  );
}
```

- [ ] **Step 10: Write `src/sections/Certifications.tsx`**

```tsx
import { cv } from "../data/cv";

export default function Certifications() {
  return (
    <>
      {cv.certifications.map((c) => (
        <div className="card cert" key={c.title}>
          <div className="card-title">{c.title}</div>
          <div className="card-sub">{c.sub}</div>
        </div>
      ))}
    </>
  );
}
```

- [ ] **Step 11: Write `src/sections/Contact.tsx`**

```tsx
import { cv } from "../data/cv";

export default function Contact() {
  return (
    <div className="contact">
      {cv.contact.map((c, i) => (
        <div className="contact-item" key={c.label}>
          {i > 0 && <span className="contact-div">◆</span>}
          <i className={"ti " + c.icon} />
          <span className="contact-label">{c.label}</span>
          {c.href
            ? <a className="contact-value" href={c.href} target="_blank" rel="noopener">{c.value}</a>
            : <span className="contact-value">{c.value}</span>}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 12: Run the section tests + the full suite**

Run: `docker compose run --rm web npm test`
Expected: PASS — `Sections.test.tsx` (4), `App.test.tsx` (both tests now pass), `SkillBar`, `cv` all green.

- [ ] **Step 13: Visual check**

Run: `docker compose up`, open http://localhost:5173, click through all 8 buttons. Confirm cards, skill bars (3 colored groups), contact list render. Stop with `Ctrl+C`.

- [ ] **Step 14: Commit**

```bash
git add src/components/Card.tsx src/sections
git commit -m "feat: eight CV content sections rendering cv data"
```

---

## Task 7: Chatbot — system prompt + engine interface

Build the CV system prompt (TDD) and the `ChatEngine` interface with its `WebLLMEngine` implementation. The engine is exercised through its interface; the real model is **not** loaded in tests.

**Files:**
- Create: `src/chat/systemPrompt.ts`, `src/chat/systemPrompt.test.ts`, `src/chat/engine.ts`

- [ ] **Step 1: Write the failing test** — `src/chat/systemPrompt.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./systemPrompt";

describe("buildSystemPrompt", () => {
  it("embeds key CV facts", () => {
    const p = buildSystemPrompt();
    expect(p).toContain("Faraday Barr Fatahillah");
    expect(p).toContain("AI Engineer");
    expect(p).toContain("3.88");
    expect(p).toContain("AI Engineer Bootcamp Trainee");
  });

  it("instructs the model to answer only from the CV", () => {
    const p = buildSystemPrompt().toLowerCase();
    expect(p).toContain("only");
    expect(p).toContain("cv");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `docker compose run --rm web npx vitest run src/chat/systemPrompt.test.ts`
Expected: FAIL — `Cannot find module './systemPrompt'`.

- [ ] **Step 3: Write `src/chat/systemPrompt.ts`**

```ts
import { cv } from "../data/cv";

function entryLines(label: string, entries: { title: string; org: string; date: string; body: string }[]): string {
  return entries
    .map((e) => `- [${label}] ${e.title} — ${e.org} (${e.date}): ${e.body}`)
    .join("\n");
}

export function buildSystemPrompt(): string {
  const skills = cv.skillGroups
    .map((g) => `${g.category}: ${g.skills.map((s) => s.name).join(", ")}`)
    .join("\n");
  const certs = cv.certifications.map((c) => `- ${c.title} (${c.sub})`).join("\n");
  const contact = cv.contact.map((c) => `${c.label}: ${c.value}`).join("\n");

  return [
    `You are the CV Companion for ${cv.name}, ${cv.role}.`,
    `Answer questions about this person ONLY using the CV below. If the CV does not`,
    `cover something, say you don't have that information. Be concise and professional.`,
    ``,
    `=== CV ===`,
    `Name: ${cv.name}`,
    `Role: ${cv.role}`,
    `Summary: ${cv.bio}`,
    ``,
    `Education:`,
    `- ${cv.education.title} — ${cv.education.org} (${cv.education.date}): ${cv.education.body}`,
    ``,
    `Experience:`,
    entryLines("Experience", cv.experience),
    ``,
    `Research:`,
    entryLines("Research", cv.research),
    ``,
    `Leadership:`,
    entryLines("Leadership", cv.leadership),
    ``,
    `Skills:`,
    skills,
    ``,
    `Certifications:`,
    certs,
    ``,
    `Contact:`,
    contact,
    `=== END CV ===`,
  ].join("\n");
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `docker compose run --rm web npx vitest run src/chat/systemPrompt.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Write `src/chat/engine.ts`** (interface + WebLLM implementation; this is the future-backend seam)

```ts
import { CreateMLCEngine, MLCEngineInterface } from "@mlc-ai/web-llm";

export const MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface InitProgress {
  text: string;
  progress: number; // 0..1
}

export interface ChatEngine {
  init(onProgress: (p: InitProgress) => void): Promise<void>;
  ask(messages: ChatMessage[]): AsyncIterable<string>;
}

/** Detects WebGPU support without instantiating the model. */
export function isWebGpuAvailable(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export class WebLLMEngine implements ChatEngine {
  private engine: MLCEngineInterface | null = null;

  async init(onProgress: (p: InitProgress) => void): Promise<void> {
    this.engine = await CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (r) => onProgress({ text: r.text, progress: r.progress }),
    });
  }

  async *ask(messages: ChatMessage[]): AsyncIterable<string> {
    if (!this.engine) throw new Error("Engine not initialized");
    const stream = await this.engine.chat.completions.create({
      messages,
      stream: true,
      temperature: 0.4,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}
```

- [ ] **Step 6: Type-check (no test for the WebLLM class — it needs a real GPU)**

Run: `docker compose run --rm web npx tsc -b --pretty false`
Expected: no type errors. (If `tsc` reports errors in test files about `vitest/globals`, ensure `tsconfig.json` `types` includes `vitest/globals` as written in Task 1.)

- [ ] **Step 7: Commit**

```bash
git add src/chat/systemPrompt.ts src/chat/systemPrompt.test.ts src/chat/engine.ts
git commit -m "feat: CV system prompt and WebLLM chat engine behind interface"
```

---

## Task 8: ChatPanel UI (Companion section)

Replace the `ChatPanel` stand-in with the real UI: WebGPU fallback, model-load progress, streaming replies. Tested against a **mock** `ChatEngine` injected via props (default is the real `WebLLMEngine`).

**Files:**
- Modify: `src/chat/ChatPanel.tsx`
- Create: `src/chat/ChatPanel.test.tsx`

- [ ] **Step 1: Write the failing test** — `src/chat/ChatPanel.test.tsx`

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPanel from "./ChatPanel";
import type { ChatEngine, InitProgress } from "./engine";

function mockEngine(reply: string): ChatEngine {
  return {
    init: async (onProgress: (p: InitProgress) => void) => {
      onProgress({ text: "loading", progress: 1 });
    },
    ask: async function* () {
      for (const ch of reply.split(" ")) yield ch + " ";
    },
  };
}

describe("ChatPanel", () => {
  it("shows a fallback when WebGPU is unavailable", () => {
    render(<ChatPanel engine={mockEngine("hi")} webGpuAvailable={false} />);
    expect(screen.getByText(/WebGPU/i)).toBeInTheDocument();
  });

  it("loads the model then answers a question by streaming", async () => {
    const user = userEvent.setup();
    render(<ChatPanel engine={mockEngine("Faraday is an AI Engineer")} webGpuAvailable={true} />);
    // wait for init to finish and input to enable
    const input = await screen.findByPlaceholderText(/ask/i);
    await user.type(input, "What does he do?");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(await screen.findByText(/Faraday is an AI Engineer/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `docker compose run --rm web npx vitest run src/chat/ChatPanel.test.tsx`
Expected: FAIL — stand-in renders `null`.

- [ ] **Step 3: Replace `src/chat/ChatPanel.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import {
  ChatEngine, ChatMessage, WebLLMEngine, isWebGpuAvailable,
} from "./engine";
import { buildSystemPrompt } from "./systemPrompt";

interface Props {
  engine?: ChatEngine;
  webGpuAvailable?: boolean;
}

type Status = "idle" | "loading" | "ready" | "thinking";

export default function ChatPanel({
  engine,
  webGpuAvailable = isWebGpuAvailable(),
}: Props) {
  const engineRef = useRef<ChatEngine>(engine ?? new WebLLMEngine());
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState("");
  const [log, setLog] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!webGpuAvailable) return;
    let cancelled = false;
    setStatus("loading");
    engineRef.current
      .init((p) => { if (!cancelled) setProgress(`${p.text} ${Math.round(p.progress * 100)}%`); })
      .then(() => { if (!cancelled) setStatus("ready"); })
      .catch((e) => { if (!cancelled) { setProgress(String(e)); setStatus("idle"); } });
    return () => { cancelled = true; };
  }, [webGpuAvailable]);

  if (!webGpuAvailable) {
    return (
      <div className="chat">
        <p className="chat-fallback">
          The CV Companion needs a WebGPU-capable browser (recent Chrome, Edge, or
          Firefox) to run the on-device model. Meanwhile, browse the sections on the left.
        </p>
      </div>
    );
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const question = draft.trim();
    if (!question || status !== "ready") return;
    setDraft("");
    const history = [...log, { role: "user" as const, text: question }];
    setLog([...history, { role: "assistant", text: "" }]);
    setStatus("thinking");

    const messages: ChatMessage[] = [
      { role: "system", content: buildSystemPrompt() },
      ...history.map((m) => ({ role: m.role, content: m.text })),
    ];

    let acc = "";
    for await (const token of engineRef.current.ask(messages)) {
      acc += token;
      setLog((cur) => {
        const next = [...cur];
        next[next.length - 1] = { role: "assistant", text: acc };
        return next;
      });
    }
    setStatus("ready");
  }

  return (
    <div className="chat">
      {status !== "ready" && status !== "thinking" && (
        <div className="chat-status">Loading Companion… {progress}</div>
      )}
      <div className="chat-log">
        {log.map((m, i) => (
          <div className="chat-msg card" key={i}>
            <div className="card-sub">{m.role === "user" ? "You" : "Companion"}</div>
            <div className="card-body">{m.text || "…"}</div>
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={send}>
        <input
          className="chat-input"
          placeholder="Ask about my experience…"
          value={draft}
          disabled={status !== "ready"}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="chat-send" type="submit" disabled={status !== "ready"}>
          Send
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Run the ChatPanel test to verify it passes**

Run: `docker compose run --rm web npx vitest run src/chat/ChatPanel.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full suite**

Run: `docker compose run --rm web npm test`
Expected: ALL green (cv, App, SkillBar, Sections, systemPrompt, ChatPanel).

- [ ] **Step 6: Real-model smoke test in the browser**

Run: `docker compose up`, open http://localhost:5173, click **Companion**. The model should download (progress shown), then answer a question such as "What is his GPA?" using the CV. (First load downloads ~350 MB once; needs a WebGPU browser.) Stop with `Ctrl+C`.

- [ ] **Step 7: Commit**

```bash
git add src/chat/ChatPanel.tsx src/chat/ChatPanel.test.tsx
git commit -m "feat: Companion chat panel with WebGPU fallback and streaming"
```

---

## Task 9: Production image, Vercel config, and docs

Add the prod serving config, Vercel deployment config, and a README. (The `prod` Dockerfile stage already exists from Task 1.)

**Files:**
- Create: `nginx.conf`, `vercel.json`, `README.md`

- [ ] **Step 1: Write `nginx.conf`** (SPA fallback + long-cache for hashed assets)

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location /assets/ {
    expires 30d;
    add_header Cache-Control "public, immutable";
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

- [ ] **Step 2: Write `vercel.json`** (Vite preset, SPA rewrite, a permissive opener policy; we intentionally do NOT set `COEP: require-corp`, which would block the Cinzel/Tabler CDN assets — WebLLM's WebGPU path does not require cross-origin isolation)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" }
      ]
    }
  ]
}
```

- [ ] **Step 3: Write `README.md`**

````markdown
# Faraday Barr Fatahillah — Interactive CV

A single-page CV styled as the Trails of Cold Steel Camp Menu, built with
React + TypeScript (Vite). Includes a **Companion** chatbot that runs a small
Qwen model entirely in your browser (WebLLM / WebGPU) — no backend, no API keys.

## Develop (no local Node required — uses Docker)

```bash
docker compose build
docker compose run --rm web npm install   # first time only
docker compose up                         # http://localhost:5173 (HMR)
```

Run tests:
```bash
docker compose run --rm web npm test
```

## Production build (optional self-host)

```bash
docker build --target prod -t faraday-cv .
docker run -p 8080:80 faraday-cv          # http://localhost:8080
```

## Deploy (Vercel, free)

Push to GitHub and import the repo in Vercel. It auto-detects Vite and uses
`vercel.json`. The build is fully static; the chatbot runs client-side.

## The Companion chatbot

- Model: `Qwen2.5-0.5B-Instruct` via `@mlc-ai/web-llm`.
- The whole CV (`src/data/cv.ts`) is injected as the system prompt — no vector DB.
- To swap to a server backend later, add a class implementing `ChatEngine`
  (`src/chat/engine.ts`) and pass it to `<ChatPanel engine={...} />`.
- First visit downloads model weights (~350 MB) once; needs a WebGPU browser.
````

- [ ] **Step 4: Verify the production image builds and serves**

Run:
```bash
docker build --target prod -t faraday-cv .
docker run -d -p 8080:80 --name faraday-cv-test faraday-cv
```
Open http://localhost:8080 — the CV renders and sections switch. Then clean up:
```bash
docker rm -f faraday-cv-test
```
Expected: build succeeds; page works at :8080.

- [ ] **Step 5: Final full test run**

Run: `docker compose run --rm web npm test`
Expected: all suites green.

- [ ] **Step 6: Commit**

```bash
git add nginx.conf vercel.json README.md
git commit -m "feat: production nginx image, Vercel config, and README"
```

---

## Self-Review Notes (addressed)

- **Spec coverage:** Camp Menu visual system (Task 3), 8 sections + content from `prompt.md` (Tasks 4/6), single-source `cv.ts` feeding UI + prompt (Tasks 2/7), Path-A WebLLM chatbot with `ChatEngine` seam + WebGPU fallback (Tasks 7/8), Docker dev + prod + Vercel (Tasks 1/9), ARCUS removal (Task 1), testing (Tasks 2,4,5,6,7,8). All spec sections map to a task.
- **No placeholders:** every code step contains complete file contents; the Task 4 stand-ins are explicitly temporary and fully replaced in Tasks 6/8.
- **Type consistency:** `Entry`, `Skill`, `SkillGroup`, `ContactItem` (cv.ts) reused everywhere; `ChatEngine`/`ChatMessage`/`InitProgress` defined in `engine.ts` and consumed identically in `ChatPanel.tsx` and its test; `SectionId` shared by `sections.ts`, `Sidebar`, `App`.
- **Known real-world checks for the implementer:** confirm the exact `@mlc-ai/web-llm` model id string `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` against the installed package's `prebuiltAppConfig` (model ids occasionally change between versions); if absent, pick the nearest `Qwen2.5-*-Instruct-q4f16_1-MLC` and update `MODEL_ID`.
