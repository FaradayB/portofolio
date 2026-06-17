# Gemini→Groq Chat Model Chain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the in-browser WebLLM fallback with a server-side ordered chain of free hosted models (5 Gemini → 1 Groq), so the CV Companion works on every device with no WebGPU, no download, and no `web-llm` dependency.

**Architecture:** The browser keeps a single `RemoteEngine` that POSTs `{messages}` to `/api/chat`. The Vercel function walks an ordered `MODEL_CHAIN`, calling Gemini or Groq per entry, and returns the first non-empty reply (or `502` if all fail). All fallback logic and both API keys live server-side.

**Tech Stack:** Vercel serverless (`@vercel/node`), React + TypeScript (Vite), Vitest + React Testing Library, Google Generative Language API, Groq OpenAI-compatible API.

---

## ⚠️ Local verification constraint

Neither Node nor Docker is installed on this machine, so `npm test` / `npm run build` **cannot run locally**. For each "run the test" step:

- If executing where Node *is* available (CI, another machine), run the command shown.
- Otherwise, treat the **TypeScript build on Vercel deploy** (`tsc -b && vite build`) as the compile gate, and rely on careful review of the shown code. The test files are still written and committed so they run wherever Node exists.

Do not claim tests "pass" unless you actually ran them. State which gate was used.

---

## File Structure

- `api/chat.ts` — **rewrite.** Holds `MODEL_CHAIN`, `callGemini`, `callGroq`, `callModel`, and the handler loop.
- `api/chat.test.ts` — **create.** Mocks `fetch`, exercises the chain branches.
- `src/chat/engine.ts` — **slim.** Only `ChatMessage` + `ChatEngine` interface remain.
- `src/chat/RemoteEngine.ts` — **modify.** Drop `init`.
- `src/chat/RemoteEngine.test.ts` — **modify.** Drop `init` references (already minimal).
- `src/chat/ChatPanel.tsx` — **simplify.** Default engine `new RemoteEngine()`; remove Start gate / WebGPU / progress.
- `src/chat/ChatPanel.test.tsx` — **rewrite.** No Start gate, no `webGpuAvailable`, no `init`.
- `src/chat/FallbackEngine.ts` + `FallbackEngine.test.ts` — **delete.**
- `package.json` — **modify.** Remove `@mlc-ai/web-llm`.
- `.env.example` — **modify.** Add `GROQ_API_KEY`.
- `README.md` — **modify.** Remove WebGPU/WebLLM/Docker; document chain + env vars.
- `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `nginx.conf` — **delete.**

---

## Task 1: Rewrite `api/chat.ts` with the model chain

**Files:**
- Modify (rewrite): `api/chat.ts`

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `api/chat.ts` with:

```ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildSystemPrompt } from "../src/chat/systemPrompt";

const MAX_TURNS = 10;
const MAX_MESSAGE_LENGTH = 2000;
const TEMPERATURE = 0.4;

type Provider = "gemini" | "groq";
interface ChainEntry {
  provider: Provider;
  model: string;
}

// Walked top-to-bottom; first non-empty reply wins. Advancing on ANY failure
// (incl. 404 unknown-model) means not-yet-released IDs are skipped harmlessly
// and start being used automatically once the provider ships them.
const MODEL_CHAIN: ChainEntry[] = [
  { provider: "gemini", model: "gemini-2.5-flash" },
  { provider: "gemini", model: "gemini-2.5-flash-lite" },
  { provider: "gemini", model: "gemini-3-flash-preview" }, // VERIFY: unreleased at write time
  { provider: "gemini", model: "gemini-3.1-flash-lite" }, // VERIFY
  { provider: "gemini", model: "gemini-3.5-flash" }, // VERIFY
  { provider: "groq", model: "llama-3.3-70b-versatile" },
];

interface IncomingMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function isIncomingMessage(value: unknown): value is IncomingMessage {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    (m.role === "system" || m.role === "user" || m.role === "assistant") &&
    typeof m.content === "string"
  );
}

async function callGemini(model: string, history: IncomingMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
      generationConfig: { temperature: TEMPERATURE },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${model} failed: ${res.status}`);
  const data = await res.json();
  const reply: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw new Error(`Gemini ${model} returned empty reply`);
  return reply;
}

async function callGroq(model: string, history: IncomingMessage[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  const messages = [
    { role: "system", content: buildSystemPrompt() },
    ...history.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
  ];

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: TEMPERATURE }),
  });
  if (!res.ok) throw new Error(`Groq ${model} failed: ${res.status}`);
  const data = await res.json();
  const reply: string | undefined = data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error(`Groq ${model} returned empty reply`);
  return reply;
}

function callModel(entry: ChainEntry, history: IncomingMessage[]): Promise<string> {
  return entry.provider === "gemini"
    ? callGemini(entry.model, history)
    : callGroq(entry.model, history);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = req.body as { messages?: unknown };
  if (!Array.isArray(body?.messages) || !body.messages.every(isIncomingMessage)) {
    res.status(400).json({ error: "Expected { messages: {role, content}[] }" });
    return;
  }

  const history = (body.messages as IncomingMessage[])
    .filter((m) => m.role !== "system")
    .slice(-MAX_TURNS * 2)
    .map((m) => ({ ...m, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

  for (const entry of MODEL_CHAIN) {
    try {
      const reply = await callModel(entry, history);
      res.status(200).json({ reply });
      return;
    } catch {
      // advance to the next model in the chain
    }
  }

  res.status(502).json({ error: "All models are unavailable right now" });
}
```

- [ ] **Step 2: Commit**

```bash
git add api/chat.ts
git commit -m "feat(api): walk Gemini->Groq model chain in /api/chat"
```

---

## Task 2: Test `api/chat.ts`

**Files:**
- Create: `api/chat.test.ts`

- [ ] **Step 1: Write the test**

Create `api/chat.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import handler from "./chat";

function makeRes() {
  const res: { statusCode: number; body: unknown; status: (c: number) => typeof res; json: (b: unknown) => typeof res } = {
    statusCode: 0,
    body: undefined,
    status(c: number) { this.statusCode = c; return this; },
    json(b: unknown) { this.body = b; return this; },
  };
  return res;
}

function makeReq(method: string, body: unknown) {
  return { method, body } as unknown as Parameters<typeof handler>[0];
}

const userMessages = [{ role: "user", content: "hi" }];
const geminiOk = (text: string) => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) });
const groqOk = (text: string) => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: text } }] }) });
const fail429 = { ok: false, status: 429, json: async () => ({}) };

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "g-key");
  vi.stubEnv("GROQ_API_KEY", "q-key");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("/api/chat handler", () => {
  it("rejects non-POST with 405", async () => {
    const res = makeRes();
    await handler(makeReq("GET", undefined), res as never);
    expect(res.statusCode).toBe(405);
  });

  it("rejects a malformed body with 400", async () => {
    const res = makeRes();
    await handler(makeReq("POST", { messages: "nope" }), res as never);
    expect(res.statusCode).toBe(400);
  });

  it("returns the first Gemini model's reply and stops", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("generativelanguage")) return geminiOk("from gemini") as never;
      throw new Error("groq should not be reached");
    });
    vi.stubGlobal("fetch", fetchMock);
    const res = makeRes();
    await handler(makeReq("POST", { messages: userMessages }), res as never);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ reply: "from gemini" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls through all Gemini models to Groq", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("generativelanguage")) return fail429 as never;
      if (url.includes("api.groq.com")) return groqOk("from groq") as never;
      throw new Error("unexpected url");
    });
    vi.stubGlobal("fetch", fetchMock);
    const res = makeRes();
    await handler(makeReq("POST", { messages: userMessages }), res as never);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ reply: "from groq" });
    expect(fetchMock).toHaveBeenCalledTimes(6); // 5 gemini + 1 groq
  });

  it("returns 502 when every model fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fail429 as never));
    const res = makeRes();
    await handler(makeReq("POST", { messages: userMessages }), res as never);
    expect(res.statusCode).toBe(502);
  });

  it("skips Groq (no fetch) when GROQ_API_KEY is missing", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("generativelanguage")) return fail429 as never;
      throw new Error("groq must not be called without a key");
    });
    vi.stubGlobal("fetch", fetchMock);
    const res = makeRes();
    await handler(makeReq("POST", { messages: userMessages }), res as never);
    expect(res.statusCode).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(5); // only gemini attempts
  });
});
```

- [ ] **Step 2: Run the test (if Node available)**

Run: `npx vitest run api/chat.test.ts`
Expected: 6 passing. If Node is unavailable, note that and rely on the Vercel build gate.

- [ ] **Step 3: Commit**

```bash
git add api/chat.test.ts
git commit -m "test(api): cover model-chain fallthrough in /api/chat"
```

---

## Task 3: Slim `src/chat/engine.ts`

**Files:**
- Modify (rewrite): `src/chat/engine.ts`

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `src/chat/engine.ts` with:

```ts
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatEngine {
  ask(messages: ChatMessage[]): AsyncIterable<string>;
}
```

This removes `WebLLMEngine`, `MODEL_ID`, `isWebGpuAvailable`, `InitProgress`, and the `@mlc-ai/web-llm` import.

- [ ] **Step 2: Commit**

```bash
git add src/chat/engine.ts
git commit -m "refactor(chat): reduce ChatEngine to a remote-only interface"
```

---

## Task 4: Drop `init` from `RemoteEngine`

**Files:**
- Modify (rewrite): `src/chat/RemoteEngine.ts`

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `src/chat/RemoteEngine.ts` with:

```ts
import { ChatEngine, ChatMessage } from "./engine";

/**
 * Calls the hosted /api/chat function, which walks an ordered chain of free
 * models (Gemini -> Groq) server-side. Works on any device.
 */
export class RemoteEngine implements ChatEngine {
  async *ask(messages: ChatMessage[]): AsyncIterable<string> {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error(`Remote chat failed: ${res.status}`);
    const data = await res.json();
    if (typeof data.reply !== "string") throw new Error("Malformed remote reply");
    yield data.reply;
  }
}
```

- [ ] **Step 2: Confirm `RemoteEngine.test.ts` still matches**

`src/chat/RemoteEngine.test.ts` never references `init`, so no change is needed. Read it to confirm; if a future edit added an `init` call, remove it.

- [ ] **Step 3: Run the test (if Node available)**

Run: `npx vitest run src/chat/RemoteEngine.test.ts`
Expected: 3 passing. Else note the build gate.

- [ ] **Step 4: Commit**

```bash
git add src/chat/RemoteEngine.ts
git commit -m "refactor(chat): drop init from RemoteEngine"
```

---

## Task 5: Simplify `ChatPanel`

**Files:**
- Modify (rewrite): `src/chat/ChatPanel.tsx`

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `src/chat/ChatPanel.tsx` with:

```tsx
import { useRef, useState } from "react";
import { ChatEngine, ChatMessage } from "./engine";
import { RemoteEngine } from "./RemoteEngine";
import { buildSystemPrompt } from "./systemPrompt";

interface Props {
  engine?: ChatEngine;
}

type Status = "ready" | "thinking";

export default function ChatPanel({ engine }: Props) {
  const engineRef = useRef<ChatEngine>(engine ?? new RemoteEngine());
  const [status, setStatus] = useState<Status>("ready");
  const [log, setLog] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const question = draft.trim();
    if (!question || status !== "ready") return;
    setError("");
    setDraft("");
    const history = [...log, { role: "user" as const, text: question }];
    setLog([...history, { role: "assistant", text: "" }]);
    setStatus("thinking");

    const messages: ChatMessage[] = [
      { role: "system", content: buildSystemPrompt() },
      ...history.map((m) => ({ role: m.role, content: m.text })),
    ];

    let acc = "";
    try {
      for await (const token of engineRef.current.ask(messages)) {
        acc += token;
        setLog((cur) => {
          const next = [...cur];
          next[next.length - 1] = { role: "assistant", text: acc };
          return next;
        });
      }
    } catch {
      setError(
        "Sorry, the Companion couldn't reach the model right now. Please try again in a moment.",
      );
      setLog((cur) => cur.slice(0, -1));
    }
    setStatus("ready");
  }

  return (
    <div className="chat">
      <p className="chat-fallback">
        Ask the <strong>CV Companion</strong> anything about my experience.
      </p>
      {error && <div className="chat-status chat-error">{error}</div>}
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

- [ ] **Step 2: Commit**

```bash
git add src/chat/ChatPanel.tsx
git commit -m "refactor(chat): remove Start gate and WebGPU from ChatPanel"
```

---

## Task 6: Rewrite `ChatPanel.test.tsx`

**Files:**
- Modify (rewrite): `src/chat/ChatPanel.test.tsx`

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `src/chat/ChatPanel.test.tsx` with:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPanel from "./ChatPanel";
import type { ChatEngine } from "./engine";

function mockEngine(reply: string): ChatEngine {
  return {
    ask: async function* () {
      for (const ch of reply.split(" ")) yield ch + " ";
    },
  };
}

describe("ChatPanel", () => {
  it("shows the input immediately with no Start gate", () => {
    render(<ChatPanel engine={mockEngine("hi")} />);
    expect(screen.getByPlaceholderText(/ask/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start companion/i })).not.toBeInTheDocument();
  });

  it("answers a question", async () => {
    const user = userEvent.setup();
    render(<ChatPanel engine={mockEngine("Faraday is an AI Engineer")} />);
    const input = screen.getByPlaceholderText(/ask/i);
    await user.type(input, "What does he do?");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(await screen.findByText(/Faraday is an AI Engineer/)).toBeInTheDocument();
  });

  it("shows an error and stays usable when the engine fails", async () => {
    const failingEngine: ChatEngine = {
      ask: async function* () {
        throw new Error("network down");
      },
    };
    const user = userEvent.setup();
    render(<ChatPanel engine={failingEngine} />);
    const input = screen.getByPlaceholderText(/ask/i);
    await user.type(input, "What does he do?");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(await screen.findByText(/couldn't reach the model/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).not.toBeDisabled();
  });
});
```

- [ ] **Step 2: Run the test (if Node available)**

Run: `npx vitest run src/chat/ChatPanel.test.tsx`
Expected: 3 passing. Else note the build gate.

- [ ] **Step 3: Commit**

```bash
git add src/chat/ChatPanel.test.tsx
git commit -m "test(chat): update ChatPanel tests for remote-only engine"
```

---

## Task 7: Delete `FallbackEngine` and its test

**Files:**
- Delete: `src/chat/FallbackEngine.ts`
- Delete: `src/chat/FallbackEngine.test.ts`

- [ ] **Step 1: Delete the files**

```bash
git rm src/chat/FallbackEngine.ts src/chat/FallbackEngine.test.ts
```

- [ ] **Step 2: Confirm nothing else imports them**

Search the repo for `FallbackEngine` and `WebLLMEngine`; expect zero remaining references (App.tsx renders `<ChatPanel />` with no props; Task 5 removed the imports).

Run: `git grep -n "FallbackEngine\|WebLLMEngine\|isWebGpuAvailable\|web-llm"` — expect only `package.json` (handled in Task 8) and docs.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(chat): delete client-side FallbackEngine"
```

---

## Task 8: Remove `@mlc-ai/web-llm` dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove the dependency line**

In `package.json`, delete the line:

```json
    "@mlc-ai/web-llm": "^0.2.79",
```

from the `dependencies` block (leave `react` and `react-dom`).

- [ ] **Step 2: Regenerate the lockfile (if Node available)**

Run: `npm install` to update `package-lock.json`. If Node is unavailable, note that Vercel will reconcile the lockfile on deploy; commit `package.json` alone and let the deploy install refresh it, OR have someone with Node run `npm install` before merge.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: drop @mlc-ai/web-llm dependency"
```

---

## Task 9: Delete the Docker / nginx stack

**Files:**
- Delete: `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `nginx.conf`

- [ ] **Step 1: Delete the files**

```bash
git rm Dockerfile docker-compose.yml .dockerignore nginx.conf
```

- [ ] **Step 2: Confirm `vite.config.ts` has no Docker-only settings that break local dev**

`vite.config.ts` sets `usePolling` for Docker bind-mount HMR. It is harmless without Docker (polling still works for plain `npm run dev`), so leave it. No change.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove Docker/nginx self-host stack (Vercel-only)"
```

---

## Task 10: Update `.env.example` and `README.md`

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Update `.env.example`**

Replace the contents of `.env.example` with:

```
# Read server-side only by /api/chat.ts (Vercel function). Never commit real keys.
# The chat walks Gemini models first, then falls back to Groq. Set at least one;
# set both for the full fallback chain.
GEMINI_API_KEY=
GROQ_API_KEY=
```

- [ ] **Step 2: Rewrite the relevant `README.md` sections**

In `README.md`:
- In the intro, replace the WebLLM/Qwen/WebGPU description with: the Companion talks to a hosted chain of free models — Gemini Flash variants first, then Groq (Llama 3.3 70B) — through the `/api/chat` Vercel function, working on every device.
- Delete the "Prerequisites" Docker/Node table's WebGPU paragraph, the entire "Quick start (Docker)" and "Self-host the built site with nginx" sections, and the WebGPU troubleshooting bullets.
- Keep "Quick start (local Node alternative)", "Running tests", "Production build (static)", and "Deploy to Vercel".
- In "Environment variables", document both `GEMINI_API_KEY` and `GROQ_API_KEY` (server-side only) and state that the chain advances on any failure, with Groq as the final fallback.
- In "Project layout", change the `api/chat.ts` line to: `# Vercel function: walks the Gemini->Groq model chain` and remove the Dockerfile/docker-compose/nginx lines.
- Replace the chatbot-model editing instructions (the WebLLM `MODEL_ID` / `GEMINI_MODEL` paragraphs) with: to change models or their order, edit the `MODEL_CHAIN` array in `api/chat.ts`.

- [ ] **Step 3: Commit**

```bash
git add .env.example README.md
git commit -m "docs: document Gemini->Groq env vars and chain; drop WebGPU/Docker"
```

---

## Task 11: Final verification

- [ ] **Step 1: Full test run (if Node available)**

Run: `npx vitest run`
Expected: all suites pass (`cv`, `App`, `SkillBar`, `Sections`, `systemPrompt`, `RemoteEngine`, `ChatPanel`, `chat` [api]). No `FallbackEngine` suite.

- [ ] **Step 2: Type/build check**

Run: `npm run build` (i.e. `tsc -b && vite build`).
Expected: clean compile, no references to removed symbols.

**Scope caveat:** `tsconfig.json` has `"include": ["src"]`, so `tsc -b` only type-checks the frontend (`src/`). It catches the `engine.ts` / `RemoteEngine.ts` / `ChatPanel.tsx` changes, but it does **not** type-check `api/chat.ts` — that file is bundled and validated separately by Vercel's serverless-function build (esbuild) at deploy time. So a green `npm run build` proves the frontend compiles; the **Vercel preview deploy** is the authoritative gate for `api/chat.ts`. (Vitest transpiles rather than type-checks, so `api/chat.test.ts` passing also does not prove `api/chat.ts` is type-clean — only that its runtime behavior is correct.)

If Node is unavailable locally, push the branch and confirm the **Vercel preview build** is green for both the frontend and the function — this is the authoritative gate here.

- [ ] **Step 3: Manual smoke (after deploy)**

On the Vercel preview URL, open the Companion, send a question, confirm a reply renders. In Vercel project settings, confirm `GEMINI_API_KEY` and `GROQ_API_KEY` are set.

---

## Done when

- `/api/chat` returns the first working model's reply and `502` only if all fail.
- The browser has no `web-llm`, no WebGPU code, no Start gate.
- `FallbackEngine` and the Docker stack are gone.
- `README` and `.env.example` describe the two keys and the chain.
- The Vercel build is green (the verification gate, since tests can't run locally).
