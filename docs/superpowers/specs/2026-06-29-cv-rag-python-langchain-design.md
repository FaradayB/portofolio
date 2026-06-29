# CV Companion → Python/LangChain RAG (multi-document) — Design

**Date:** 2026-06-29
**Status:** Draft (pending spec review)

## Goal

Replace the current prompt-stuffing chat companion with a **real, working
Retrieval-Augmented Generation pipeline** built in Python with LangChain, using
the free Google AI Studio API. The primary motivation is to **showcase RAG
skills** as a portfolio credential — the pipeline must perform genuine
chunking, embedding, vector retrieval, and grounded generation.

The corpus is designed to **grow**: it starts with the CV and expands to
papers, project write-ups, and other documents. The architecture therefore
splits **ingestion** (offline) from **serving** (Vercel), the way real RAG
systems are built.

## Constraints

- **Frontend + serving deploy on Vercel** (Python serverless, `@vercel/python`).
- **250 MB unzipped bundle limit** + **read-only filesystem** on Vercel. Local
  embedding models (PyTorch) are out → embeddings come from Google's API.
- **No local Node/Python/Docker** on the dev machine. The ingest step must run
  in the cloud (GitHub Action), not locally. Verification via Vercel preview.
- **Free tier only** — Google AI Studio (`gemini-2.5-flash`, `text-embedding-004`).
- Reuse existing `GEMINI_API_KEY`. The GitHub Action needs the same key as a
  repo secret.

## Current State (being replaced)

- `api/chat.ts` — TS function; stuffs entire CV into the system prompt; Gemini→Groq chain.
- `src/chat/systemPrompt.ts` — builds full-CV prompt from `src/data/cv.ts`. Only consumer is `chat.ts`.
- `src/chat/RemoteEngine.ts` — POSTs `{ messages }` to `/api/chat`, expects `{ reply }`.
- `src/chat/ChatPanel.tsx` — chat UI (unchanged by this work).
- Tests: `api/chat.test.ts`, `src/chat/systemPrompt.test.ts`.

## Architecture: split ingest from serve

```
─────────────── INGEST (offline, runs in GitHub Action — no local Python) ───────────────
  rag/corpus/**         (cv.md, papers/*.pdf|*.md, projects/*.md, …)
     │  document loaders (markdown + PDF)
     │  RecursiveCharacterTextSplitter  → chunks + metadata { source, type }
     │  Google text-embedding-004 (batched)
     ▼
  api/_index/vectors.json     ← precomputed index, committed by the Action

─────────────── SERVE (Vercel, per request — HTTP contract UNCHANGED) ───────────────
  Browser → POST /api/chat { messages:[{role,content}] }
     └─ api/chat.py
          load api/_index/vectors.json → InMemoryVectorStore   [cached in module global]
          embed latest question → retrieve top-k chunks (with source metadata)
          build grounded prompt (context + sources + guardrail + recent turns)
          ChatGoogleGenerativeAI(gemini-2.5-flash) → { reply }
```

The serving function **never re-embeds the corpus** — it loads precomputed
vectors and only embeds the user's question. Adding documents = drop files in
`rag/corpus/`, push, and the Action regenerates `vectors.json`.

### Key decisions

| Decision | Choice | Rationale |
|---|---|---|
| LLM | `gemini-2.5-flash` via `langchain-google-genai` | Free Google AI Studio; already in use |
| Embeddings | Google `text-embedding-004` (API) | Avoids PyTorch; stays under 250 MB |
| Vector store | LangChain `InMemoryVectorStore` (`dump`/`load`) | Pure-Python; precomputed JSON loads fast; scales to low-thousands of chunks in RAM |
| Index build | **Precomputed** by GitHub Action, committed as `api/_index/vectors.json` | No re-embed per cold start; solves "no local Python"; version-controlled |
| Loaders | Markdown + PDF (`pypdf`) — **ingest only** | PDF deps live in the Action, not the Vercel bundle |
| Splitter | `RecursiveCharacterTextSplitter` (~700 chars, ~100 overlap) | Standard; tuned for prose + papers |
| Metadata | `{ source, type }` per chunk | Enables source attribution and future filtering |
| Retrieval | `as_retriever(search_kwargs={"k": 5})` | Top-5 across all documents |
| Provider | Gemini-only (no Groq fallback) | Simpler; matches "free Google AI Studio" goal |
| HTTP contract | Identical to current `/api/chat` | Frontend needs **zero** changes |
| Env | `GEMINI_API_KEY` (Vercel env + GitHub Action secret) | No new provider |

## File Layout

```
rag/
  corpus/
    cv.md                 # curated CV (authored from src/data/cv.ts)
    papers/               # *.pdf or *.md — add anytime
    projects/             # *.md — add anytime
  ingest.py               # build script: load → split → embed → dump vectors.json
  requirements.txt        # ingest deps (incl. pypdf, text-splitters) — NOT deployed
api/
  _index/
    vectors.json          # committed precomputed index (deployed with the function)
  chat.py                 # serving function
  requirements.txt        # serving deps (minimal) — deployed to Vercel
.github/workflows/
  build-rag-index.yml     # regenerates vectors.json on corpus changes
.env.example              # documents required env vars (GEMINI_API_KEY)
```

`api/_index/` uses the `_` prefix so Vercel does not treat it as a route.
`rag/` is build-time only and is never deployed to Vercel.

## Components

### `rag/ingest.py` (offline, CI)
Self-contained build script.
- **`load_documents(corpus_dir)`** — walks `rag/corpus/`; markdown via text
  loader, PDF via `PyPDFLoader`; attaches `{ source: <relative path>, type:
  cv|paper|project }` metadata (type inferred from subfolder).
- **`build_index(docs)`** — `RecursiveCharacterTextSplitter` → chunks →
  `GoogleGenerativeAIEmbeddings(text-embedding-004)` → `InMemoryVectorStore`.
- **`main()`** — builds and `dump()`s to `api/_index/vectors.json`. Reads
  `GEMINI_API_KEY` from env.

### `api/chat.py` (Vercel)
Vercel Python serverless handler (the `BaseHTTPRequestHandler` `handler` form).
- **`get_retriever()`** — module-level singleton. First call: `InMemoryVectorStore.load("api/_index/vectors.json", embeddings)` → retriever; cached in a global for warm reuse. Self-contained: input = index file + API key, output = retriever.
- **`build_prompt(chunks, history)`** — grounded prompt: retrieved chunks with
  their `source`, an "answer ONLY from the context; if not covered, say you
  don't have that information" guardrail, and recent conversation turns.
- **`handler`** — validates body (`{ messages: {role, content}[] }`; reject
  non-POST/malformed; cap `MAX_TURNS=10`, `MAX_MESSAGE_LENGTH=2000`), runs
  retrieval + generation at `TEMPERATURE=0.4`, returns `{ reply }` or error.

### `rag/corpus/cv.md`
Curated markdown CV authored from `src/data/cv.ts`. Hand-maintained (edit
alongside `cv.ts` when facts change). First document in the growing corpus.

### `api/requirements.txt` (deployed — minimal)
- `langchain-core` (provides `InMemoryVectorStore`)
- `langchain-google-genai`

No PDF parser, no splitter, no torch → bundle well under 250 MB.

### `rag/requirements.txt` (CI only)
- `langchain-core`, `langchain-google-genai`, `langchain-text-splitters`,
  `langchain-community` (loaders), `pypdf`

### `.env.example`
Documents the one required secret so contributors/CI know what to set:
```
# Google AI Studio API key — https://aistudio.google.com/app/apikey
# Used by api/chat.py (Vercel env) and rag/ingest.py (GitHub Action secret)
GEMINI_API_KEY=
```
Committed; the real `.env` stays gitignored.

### `.github/workflows/build-rag-index.yml`
- **Trigger:** push touching `rag/corpus/**` or `rag/ingest.py`, plus
  `workflow_dispatch`.
- **Steps:** checkout → setup Python → `pip install -r rag/requirements.txt` →
  `python rag/ingest.py` (with `GEMINI_API_KEY` secret) → commit updated
  `api/_index/vectors.json` back to the branch (`contents: write`).
- This auto-commit is CI-owned and expected (distinct from the human dev
  workflow of staging changes manually).

### `vercel.json`
Ensure `api/_index/vectors.json` is bundled with the function (`functions` →
`includeFiles` if Vercel does not pick it up automatically) and set a
reasonable `maxDuration`. Verify on first preview deploy.

## Data Flow (serving)

1. `ChatPanel` → `RemoteEngine.ask()` → `POST /api/chat { messages }`.
2. `chat.py` validates, trims history, extracts latest user question.
3. `get_retriever()` (loaded once per warm instance) embeds the question.
4. Retriever returns top-5 chunks (any document) with `source` metadata.
5. `build_prompt` injects chunks + sources + guardrail + recent turns.
6. `gemini-2.5-flash` generates a grounded reply (may cite sources).
7. `{ reply }` → `RemoteEngine` yields it → UI renders.

## Error Handling

- Non-POST → 405; malformed body → 400.
- Missing `GEMINI_API_KEY` → 500 with clear message.
- Missing/corrupt `vectors.json` → 500 (index not built — run the Action).
- Embedding/generation failure or empty reply → 502 (`The assistant is
  unavailable right now`). No Groq fallback.
- Question not covered by corpus → model instructed to say so (prompt, not code).

## Removals / Cleanup

- Delete `api/chat.ts`, `api/chat.test.ts`.
- Delete `src/chat/systemPrompt.ts`, `src/chat/systemPrompt.test.ts` (orphaned).
- Keep `src/chat/engine.ts`, `RemoteEngine.ts`, `ChatPanel.tsx` untouched.
- `src/data/cv.ts` stays as the site's data source (unchanged).

## Testing Strategy

- **Python (`pytest`):** ingest — loader attaches correct metadata, splitter
  produces chunks, `dump`/`load` round-trips (embeddings mocked). Serve —
  request validation, retrieval returns relevant chunks for a known question,
  prompt-builder includes guardrail + sources, graceful errors on missing
  key/index. All Google calls mocked → runs offline.
- **CI:** tests + ingest run in GitHub Actions (no local Python). The index
  build doubles as an integration smoke test.
- **Vercel preview:** manual smoke test of the live chat after deploy, matching
  the project's existing cloud-verification workflow.
- Existing frontend tests stay green (HTTP contract unchanged).

## Out of Scope (YAGNI)

- Streaming responses (`RemoteEngine` yields a single chunk; keep it).
- Hosted vector DB (Pinecone / pgvector) — documented upgrade path for
  many-thousands / fast-changing corpora; the vector store sits behind
  LangChain's interface so swapping later is localized.
- Re-ranking, hybrid/keyword search, per-source UI filters.
- Auto-generating `cv.md` from `cv.ts` (hand-maintained for now).

## Open Risks

- **Index file size:** `vectors.json` grows with the corpus (~768 floats/chunk).
  Fine for hundreds–low-thousands of chunks; compress (gzip) or move to a hosted
  DB if it gets large.
- **Vercel file bundling:** confirm `api/_index/vectors.json` is included in the
  Python function bundle on first deploy (`includeFiles` if needed).
- **Mixed-runtime project:** confirm the Python function deploys cleanly once
  the TS function is removed.
- **CI auto-commit loop:** the Action commits only the index and triggers on
  corpus changes, so it will not loop on its own commit.
- **Free-tier quota:** per-request embedding + generation stay within Google AI
  Studio free limits for portfolio traffic; ingest re-embeds only on corpus
  changes.
