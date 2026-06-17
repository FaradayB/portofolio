# CV Companion — Hosted Model Chain (Gemini → Groq)

**Date:** 2026-06-17
**Status:** Approved design, pending spec review

## Goal

Replace the current two-tier chat engine (hosted Gemini with an **in-browser
WebLLM/Qwen** fallback) with a single hosted path that walks an ordered chain of
free models server-side, returning the first that succeeds. This drops the WebGPU
requirement, the ~350 MB browser download, and the `@mlc-ai/web-llm` dependency,
and makes the Companion work identically on every device (including iOS/mobile).

The app stays deployed on **Vercel**, which serves the static site and runs the
`/api/chat` serverless function that holds the API keys.

## Architecture

```
Browser (RemoteEngine)  ──POST /api/chat {messages}──▶  Vercel function (api/chat.ts)
                                                          loops MODEL_CHAIN:
                                                          1. gemini-2.5-flash       (Google)
                                                          2. gemini-2.5-flash-lite  (Google)
                                                          3. gemini-3-flash-preview (Google)
                                                          4. gemini-3.1-flash-lite  (Google)
                                                          5. gemini-3.5-flash       (Google)
                                                          6. llama-3.3-70b-versatile (Groq)
                                                          returns first non-empty reply,
                                                          else 502
```

All fallback logic lives **server-side**. The browser only ever calls `/api/chat`
and renders `{ reply }`. Both keys (`GEMINI_API_KEY`, `GROQ_API_KEY`) stay secret.

### The model chain

A single ordered array drives everything:

```ts
const MODEL_CHAIN: { provider: "gemini" | "groq"; model: string }[] = [
  { provider: "gemini", model: "gemini-2.5-flash" },
  { provider: "gemini", model: "gemini-2.5-flash-lite" },
  { provider: "gemini", model: "gemini-3-flash-preview" },   // VERIFY: not yet released as of cutoff
  { provider: "gemini", model: "gemini-3.1-flash-lite" },    // VERIFY
  { provider: "gemini", model: "gemini-3.5-flash" },         // VERIFY
  { provider: "groq",   model: "llama-3.3-70b-versatile" },
];
```

The handler iterates top-to-bottom, dispatching each entry to the matching helper
(`callGemini` or `callGroq`). The **first** entry that returns a non-empty reply
wins. Adding, removing, or reordering models is a one-line edit to this array.

### Self-healing on unreleased models

Model IDs 3–5 (`gemini-3-flash-preview`, `gemini-3.1-flash-lite`,
`gemini-3.5-flash`) are not confirmed to exist at design time. This is safe
**because the loop advances on *any* failure, including a 404 "model not found".**
Unreleased models are skipped harmlessly and start being used automatically once
Google ships them. Today the chain is satisfied by IDs 1–2 (confirmed Gemini) and
6 (confirmed Groq).

## Fallback trigger

Advance to the next chain entry on **any** non-success from the current model:

- network / fetch error
- HTTP 4xx or 5xx (covers 429 rate-limit *and* 404 unknown-model)
- HTTP 200 with an empty / missing reply

Only after **every** entry fails does the function return a `502` with a friendly
error message.

## Components

### `api/chat.ts` (rewrite)

- Keep request validation (POST-only, `{ messages: {role,content}[] }`,
  `MAX_TURNS`, `MAX_MESSAGE_LENGTH`).
- `buildSystemPrompt()` from `src/chat/systemPrompt.ts` feeds every provider.
- `callGemini(model, history)` — POSTs to
  `generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  using `systemInstruction` + `contents` (role `user`/`model`), reads
  `data.candidates[0].content.parts[0].text`. Throws on non-ok / empty.
- `callGroq(model, history)` — POSTs to
  `https://api.groq.com/openai/v1/chat/completions` (OpenAI-compatible:
  `messages` array with a leading `system` message), `Authorization: Bearer
  ${GROQ_API_KEY}`, reads `data.choices[0].message.content`. Throws on non-ok /
  empty.
- Handler loops `MODEL_CHAIN`, returns first success, else `502`.
- If a provider's key is missing, its entries throw and are skipped (so the app
  still works with only one key configured).

### `src/chat/engine.ts` (slim down)

- Remove `WebLLMEngine`, `MODEL_ID`, `isWebGpuAvailable`, `InitProgress`, and the
  `@mlc-ai/web-llm` import.
- Keep `ChatMessage` and a minimal `ChatEngine` interface:
  `ask(messages: ChatMessage[]): AsyncIterable<string>`. Drop `init`/progress —
  the remote engine needs no warm-up.

### `src/chat/RemoteEngine.ts` (minor)

- Drop the `init` method (no longer in the interface). Keep `ask` as-is: POST to
  `/api/chat`, yield `data.reply` as a single chunk.

### `src/chat/ChatPanel.tsx` (simplify)

- Default engine becomes `new RemoteEngine()`.
- Remove `webGpuAvailable`, the loading/progress state, and the "Start Companion"
  download gate — init is instant, so render the input directly in a `ready`
  state.
- Rewrite the intro/error copy to drop all WebGPU / Qwen / offline-fallback /
  download references. Error copy: "Sorry, the Companion couldn't reach the model
  right now. Please try again in a moment."

## Deletions

- `src/chat/FallbackEngine.ts` and `src/chat/FallbackEngine.test.ts` — client-side
  fallback is gone (logic moved server-side).
- `@mlc-ai/web-llm` from `package.json`.
- Docker / self-host stack: `Dockerfile`, `docker-compose.yml`, `.dockerignore`,
  `nginx.conf` — only existed for local dev / nginx self-host; unused on a
  Vercel-only deploy.

## Config & docs

- `.env.example`: add `GROQ_API_KEY` alongside `GEMINI_API_KEY`.
- `README.md`: remove the WebGPU/WebLLM/Qwen/350 MB and Docker sections; document
  the two env vars, the model chain, and that Groq is the final fallback. Keep the
  Vercel deploy steps.

## Testing

Tests cannot run locally (no Node/Docker on this machine); verification is via the
**Vercel cloud build** plus user review.

- Adapt `RemoteEngine.test.ts` (no more `init`), `systemPrompt.test.ts`,
  `ChatPanel.test.tsx` (no Start gate / progress).
- Add `api/chat.test.ts` (mock `fetch`):
  - first Gemini model succeeds → returns its reply, no further calls.
  - first Gemini fails, second succeeds → returns second's reply.
  - all Gemini fail → Groq is called and its reply returned.
  - every entry fails → `502` with the error body.
  - missing `GROQ_API_KEY` → Groq entry skipped without crashing.

## Out of scope

- Real RAG / embeddings (the full CV fits in the system prompt — not needed).
- Streaming responses (replies are returned whole; chain logic needs the full
  result to decide success before sending anything).
- Any change to CV content, layout, or the Camp Menu theme.
