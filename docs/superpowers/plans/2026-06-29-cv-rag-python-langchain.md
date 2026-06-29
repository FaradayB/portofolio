# CV RAG (Python / LangChain, multi-document) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the prompt-stuffing TS chat function with a real Python/LangChain RAG (chunk → embed → retrieve → grounded Gemini answer) over a growable multi-document corpus, deployed on Vercel.

**Architecture:** Ingest is split from serve. An offline GitHub Action loads `rag/corpus/**` (markdown + PDF), chunks + embeds with Google `text-embedding-004`, and commits a precomputed `api/_index/vectors.json`. The Vercel Python function `api/chat.py` loads that index into a LangChain `InMemoryVectorStore`, retrieves the top-k chunks for the user's question, and answers with `gemini-2.5-flash`. The `/api/chat` HTTP contract is unchanged, so the React frontend is untouched.

**Tech Stack:** Python 3.12, LangChain (`langchain-core`, `langchain-google-genai`, `langchain-text-splitters`, `langchain-community`), `pypdf`, Google AI Studio (Gemini + text-embedding-004), Vercel `@vercel/python`, GitHub Actions, pytest.

## Global Constraints

- **No local Python/Node runtime.** Python tests run via the `python-rag` GitHub Actions workflow created in Task 1. Each "run tests" step = push the branch and confirm the workflow is green (or run `pytest` locally only if Python happens to be available). Frontend `vitest` tests are not run locally; they stay valid because the `/api/chat` contract is unchanged.
- **Commit workflow:** the assistant only stages (`git add`); the human performs `git commit` + `git push`. Every "Commit" step below means **stage the listed files and hand off to the user** with a short suggested message.
- **Vercel 250 MB unzipped function limit + read-only filesystem.** Deployed serving deps (`api/requirements.txt`) MUST stay minimal: `langchain-core`, `langchain-google-genai` only. No `torch`, no `pypdf`, no splitters in the deployed bundle. Heavy parsing deps live only in `rag/requirements.txt` (CI).
- **Free tier only.** Models: `gemini-2.5-flash` (generation), `models/text-embedding-004` (embeddings). Single provider — Gemini only, no Groq fallback.
- **Secrets:** API key is `GEMINI_API_KEY`, read from env in both `api/chat.py` (Vercel env var) and `rag/ingest.py` (GitHub Actions repo secret). Never commit real keys.
- **Serving limits (carry over from old `api/chat.ts`):** `MAX_TURNS = 10`, `MAX_MESSAGE_LENGTH = 2000`, `TEMPERATURE = 0.4`.
- **Retrieval:** top `k = 5` chunks. **Splitter:** `RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=100)`.
- **Routing:** files/dirs under `api/` starting with `_` (e.g. `api/_index/`) are not treated as routes by Vercel.

---

## File Structure

- `.github/workflows/python-rag.yml` — runs pytest on push (the test runner).
- `.github/workflows/build-rag-index.yml` — regenerates `api/_index/vectors.json` on corpus changes.
- `rag/corpus/cv.md` — curated CV (first corpus document).
- `rag/corpus/papers/`, `rag/corpus/projects/` — drop-in dirs for growth (`.keep` placeholders).
- `rag/ingest.py` — load → split → embed → dump `vectors.json`.
- `rag/requirements.txt` — ingest/CI deps (incl. `pypdf`, splitters, loaders, pytest).
- `api/chat.py` — serving function (retriever + prompt + Gemini).
- `api/_index/vectors.json` — committed precomputed index (deployed with the function).
- `api/requirements.txt` — minimal serving deps.
- `tests/test_*.py` — pytest suite (ingest + serve, Google calls mocked).
- `.env.example` — updated (Gemini-only).
- `.gitignore` — add plain `.env`.
- `vercel.json` — ensure index is bundled; set `maxDuration`.
- **Deleted:** `api/chat.ts`, `api/chat.test.ts`, `src/chat/systemPrompt.ts`, `src/chat/systemPrompt.test.ts`.

---

## Task 1: CI test runner + scaffolding

**Files:**
- Create: `.github/workflows/python-rag.yml`
- Create: `api/requirements.txt`, `rag/requirements.txt`
- Create: `rag/corpus/papers/.keep`, `rag/corpus/projects/.keep`, `api/_index/.keep`
- Create: `tests/__init__.py`, `tests/test_smoke.py`
- Modify: `.gitignore`, `.env.example`

**Interfaces:**
- Consumes: nothing.
- Produces: a green `python-rag` workflow that runs `pytest` against `tests/`; the dependency manifests every later task relies on.

- [ ] **Step 1: Create the deployed serving requirements** — `api/requirements.txt`:

```
langchain-core==0.3.29
langchain-google-genai==2.0.8
```

- [ ] **Step 2: Create the CI/ingest requirements** — `rag/requirements.txt`:

```
langchain-core==0.3.29
langchain-google-genai==2.0.8
langchain-text-splitters==0.3.5
langchain-community==0.3.14
pypdf==5.1.0
pytest==8.3.4
```

- [ ] **Step 3: Add placeholder dirs** — create empty files `rag/corpus/papers/.keep`, `rag/corpus/projects/.keep`, `api/_index/.keep` (so the dirs exist before the index/corpus are built).

- [ ] **Step 4: Add `.env` to `.gitignore`** — append a line so a real key file is never committed (current `.gitignore` only ignores `.env*.local`):

```
.env
```

- [ ] **Step 5: Update `.env.example`** — replace contents with the Gemini-only version:

```
# Google AI Studio API key — https://aistudio.google.com/app/apikey
# Read server-side by api/chat.py (set as a Vercel env var) and by
# rag/ingest.py (set as a GitHub Actions repo secret named GEMINI_API_KEY).
# Never commit real keys.
GEMINI_API_KEY=
```

- [ ] **Step 6: Write the smoke test** — `tests/__init__.py` (empty) and `tests/test_smoke.py`:

```python
def test_ci_runs():
    assert True
```

- [ ] **Step 7: Create the test workflow** — `.github/workflows/python-rag.yml`:

```yaml
name: python-rag
on:
  push:
    paths: ["api/**", "rag/**", "tests/**", ".github/workflows/python-rag.yml"]
  pull_request:
  workflow_dispatch:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r rag/requirements.txt
      - run: pytest tests/ -v
```

- [ ] **Step 8: Stage and hand off (Commit)**

```bash
git add .github/workflows/python-rag.yml api/requirements.txt rag/requirements.txt \
  rag/corpus/papers/.keep rag/corpus/projects/.keep api/_index/.keep \
  tests/__init__.py tests/test_smoke.py .gitignore .env.example
# Suggested message: "chore: scaffold python rag (ci, deps, env)"
```

- [ ] **Step 9: Verify** — after the user pushes, confirm the `python-rag` Action is green (smoke test passes). This proves the test runner works.

---

## Task 2: Author the CV corpus

**Files:**
- Create: `rag/corpus/cv.md`
- Create: `tests/test_corpus.py`

**Interfaces:**
- Consumes: nothing (content derived from `src/data/cv.ts`).
- Produces: `rag/corpus/cv.md` — the first ingest input. Section headers (`## Education`, `## Experience`, etc.) drive chunk boundaries.

- [ ] **Step 1: Write the corpus test** — `tests/test_corpus.py`:

```python
from pathlib import Path

CV = Path("rag/corpus/cv.md")

def test_corpus_exists():
    assert CV.is_file()

def test_corpus_has_sections():
    text = CV.read_text(encoding="utf-8")
    for header in ["# Faraday Barr Fatahillah", "## Education",
                   "## Experience", "## Projects", "## Skills",
                   "## Certifications", "## Contact"]:
        assert header in text

def test_corpus_has_key_facts():
    text = CV.read_text(encoding="utf-8")
    assert "AI Engineer" in text
    assert "Telkom University" in text
    assert "3.88" in text
    assert "faradaybarrf@gmail.com" in text
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_corpus.py -v`
Expected: FAIL (file missing).

- [ ] **Step 3: Author the corpus** — create `rag/corpus/cv.md` from `src/data/cv.ts` (verbatim facts):

```markdown
# Faraday Barr Fatahillah

**Role:** AI Engineer

## Summary

I build end-to-end AI systems from model training to cloud deployment.
Experienced across LLM / RAG, computer vision (YOLOv8), and IoT, with production
MLOps on FastAPI, Docker, GCP, Prometheus and Grafana. Computer Engineering,
Telkom University — highest GPA in my major. GPA 3.88, top of major.

## Education

**Bachelor of Computer Engineering — Telkom University, Bandung, Indonesia
(Sep 2021 – Aug 2025).** GPA: 3.88 / 4.00. Highest GPA in major. Led 15 teaching
assistants. Mentored 250+ students.

## Experience

**AI Engineer Bootcamp Trainee — PT. Berlian Sistem Informasi, Jakarta
(Apr 2026 – Sep 2026).** Built an end-to-end AI predictive maintenance system on
GCP with Docker, FastAPI, Prometheus, Grafana. Built a RAG chatbot using Azure
AI Foundry, LangChain, Azure AI Search. Engineered prompts for grounding and
token efficiency, validated via Azure Evaluations.

**Deputy Assistant Coordinator — i-Smile Laboratory, Bandung
(Jul 2024 – Jun 2025).** Designed and delivered 7 hands-on AI practicum sessions
in Python. Led an ML study group for 50+ students.

**Machine Learning Cohort — Bangkit Academy (Sep 2024 – Dec 2024).** Built
SugarCare diabetes prediction app — 83% accuracy. Studied deep learning and
GANs. Recognized as Active Participant.

**Teaching Assistant — Telkom University, Bandung (Sep 2024 – Aug 2025).**
Assisted 5 courses including IoT and Control Systems. Contributed to course
materials, assessments, and grading.

**Assistant Coordinator — SEA Laboratory, Bandung (Jul 2023 – Jun 2024).**
Designed and delivered 7 hands-on AI practicum sessions in Python. Led an ML
study group for 50+ students.

## Projects

**AI Predictive Maintenance** (GCP, Docker, FastAPI, Prometheus, Grafana):
End-to-end predictive maintenance system on GCP with a containerized FastAPI
service, monitored via Prometheus and Grafana dashboards.

**RAG Chatbot** (Azure AI Foundry, LangChain, Azure AI Search, Blob Storage):
Retrieval-augmented chatbot grounded on document search, with prompt engineering
for grounding and token efficiency validated via Azure Evaluations.

**SugarCare** (TensorFlow, Python, Streamlit): Diabetes prediction app reaching
83% accuracy — Bangkit Academy ML capstone.

**Fall Detection** (YOLOv8, Computer Vision, Android): Real-time fall detection
research using YOLOv8, with debugging support and hardware-software coordination.

**RFID Inventory Management** (RFID, Android/Kotlin): RFID-based inventory system
with a companion Android app; led the system experiments end to end.

## Research

**Student Researcher — Telkom University (Feb 2024 – Aug 2025).** Led RFID-based
inventory management research, built an Android Kotlin app, led system
experiments. Supported fall detection research through debugging, knowledge
transfer, and hardware-software coordination.

## Leadership

**Head of Academics & Profession Dept. — HMTK (Computer Engineering Student
Assoc.), Bandung (Dec 2024 – Aug 2025).** Managed department activities,
coordinated company visits, led academic study groups for 100+ students.

**Organizer — AWS Gen-AI Tour (Aug 2024).** Led the student organizer team
across Telkom University and Binus University. Managed speakers, materials, and
technical operations for an AWS generative AI hands-on event.

## Skills

**AI & Machine Learning:** Python, TensorFlow/PyTorch, Scikit-learn, YOLO / CV,
RAG / LLM, LangChain.
**MLOps & Cloud:** Docker, GCP, Azure AI Foundry, FastAPI, Prometheus/Grafana.
**Other & Hardware:** Android (Kotlin), Arduino / ESP32, C, Streamlit.

## Certifications

- Generative AI for Everyone — Coursera, 2024
- DeepLearning.AI TensorFlow Developer Specialization — 2024
- Structuring Machine Learning Projects — DeepLearning.AI, 2024
- Machine Learning Specialization — DeepLearning.AI, 2024

## Contact

- Email: faradaybarrf@gmail.com
- LinkedIn: linkedin.com/in/faradaybarr
- GitHub: github.com/FaradayB
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_corpus.py -v`
Expected: PASS (3 tests).

- [ ] **Step 5: Stage and hand off (Commit)**

```bash
git add rag/corpus/cv.md tests/test_corpus.py
# Suggested message: "feat: add CV corpus for RAG"
```

---

## Task 3: Ingest — document loading with metadata

**Files:**
- Create: `rag/ingest.py`
- Create: `tests/test_ingest_load.py`

**Interfaces:**
- Consumes: `rag/corpus/**`.
- Produces:
  - `load_documents(corpus_dir: str) -> list[langchain_core.documents.Document]` — each Document has `metadata["source"]` (path relative to `corpus_dir`) and `metadata["type"]` (`"cv"` for top-level files, else the first subfolder name, e.g. `"papers"`, `"projects"`). Markdown via direct read; `.pdf` via `langchain_community.document_loaders.PyPDFLoader`.

- [ ] **Step 1: Write the failing test** — `tests/test_ingest_load.py`:

```python
from pathlib import Path
from rag.ingest import load_documents

def _write(p: Path, text: str):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")

def test_loads_markdown_with_type_cv(tmp_path):
    _write(tmp_path / "cv.md", "# Me\nAI Engineer")
    docs = load_documents(str(tmp_path))
    assert len(docs) == 1
    assert "AI Engineer" in docs[0].page_content
    assert docs[0].metadata["source"] == "cv.md"
    assert docs[0].metadata["type"] == "cv"

def test_subfolder_sets_type(tmp_path):
    _write(tmp_path / "projects" / "p.md", "Project X")
    docs = load_documents(str(tmp_path))
    assert docs[0].metadata["type"] == "projects"
    assert docs[0].metadata["source"] == "projects/p.md"

def test_ignores_keep_files(tmp_path):
    _write(tmp_path / "papers" / ".keep", "")
    _write(tmp_path / "cv.md", "hi")
    docs = load_documents(str(tmp_path))
    assert [d.metadata["source"] for d in docs] == ["cv.md"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_ingest_load.py -v`
Expected: FAIL (`ModuleNotFoundError: rag.ingest`).

- [ ] **Step 3: Write minimal implementation** — `rag/ingest.py`:

```python
from pathlib import Path
from langchain_core.documents import Document


def _doc_type(rel_path: Path) -> str:
    return rel_path.parts[0] if len(rel_path.parts) > 1 else "cv"


def load_documents(corpus_dir: str) -> list[Document]:
    """Load every markdown/PDF file under corpus_dir into Documents.

    metadata: source = path relative to corpus_dir (posix);
              type   = first subfolder name, or "cv" for top-level files.
    """
    root = Path(corpus_dir)
    docs: list[Document] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.name == ".keep":
            continue
        rel = path.relative_to(root)
        meta = {"source": rel.as_posix(), "type": _doc_type(rel)}
        if path.suffix.lower() == ".pdf":
            from langchain_community.document_loaders import PyPDFLoader
            for page in PyPDFLoader(str(path)).load():
                page.metadata.update(meta)
                docs.append(page)
        elif path.suffix.lower() in {".md", ".markdown", ".txt"}:
            docs.append(Document(page_content=path.read_text(encoding="utf-8"),
                                 metadata=meta))
    return docs
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_ingest_load.py -v`
Expected: PASS (3 tests).

- [ ] **Step 5: Stage and hand off (Commit)**

```bash
git add rag/ingest.py tests/test_ingest_load.py
# Suggested message: "feat: ingest document loader with metadata"
```

---

## Task 4: Ingest — build index + dump/load round-trip

**Files:**
- Modify: `rag/ingest.py`
- Create: `tests/test_ingest_build.py`

**Interfaces:**
- Consumes: `load_documents` (Task 3); `langchain_core.vectorstores.InMemoryVectorStore`.
- Produces:
  - `split_documents(docs) -> list[Document]` — `RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=100)`, preserving metadata.
  - `build_index(docs, embeddings) -> InMemoryVectorStore` — splits then `InMemoryVectorStore.from_documents(chunks, embeddings)`. `embeddings` is injected so tests pass a fake.

- [ ] **Step 1: Write the failing test** — `tests/test_ingest_build.py`:

```python
from langchain_core.documents import Document
from langchain_core.embeddings import FakeEmbeddings
from langchain_core.vectorstores import InMemoryVectorStore
from rag.ingest import split_documents, build_index


def test_split_preserves_metadata_and_chunks():
    long_text = "sentence. " * 200  # ~2000 chars -> multiple chunks
    docs = [Document(page_content=long_text, metadata={"source": "cv.md", "type": "cv"})]
    chunks = split_documents(docs)
    assert len(chunks) > 1
    assert all(c.metadata["source"] == "cv.md" for c in chunks)


def test_build_index_roundtrip(tmp_path):
    emb = FakeEmbeddings(size=8)
    docs = [Document(page_content="AI Engineer at Telkom", metadata={"source": "cv.md", "type": "cv"})]
    store = build_index(docs, emb)
    path = tmp_path / "vectors.json"
    store.dump(str(path))
    loaded = InMemoryVectorStore.load(str(path), emb)
    hits = loaded.similarity_search("engineer", k=1)
    assert hits and "AI Engineer" in hits[0].page_content
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_ingest_build.py -v`
Expected: FAIL (`ImportError: cannot import name 'split_documents'`).

- [ ] **Step 3: Extend `rag/ingest.py`** — add at the top with the other imports and below `load_documents`:

```python
from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter

CHUNK_SIZE = 700
CHUNK_OVERLAP = 100


def split_documents(docs: list[Document]) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
    )
    return splitter.split_documents(docs)


def build_index(docs: list[Document], embeddings: Embeddings) -> InMemoryVectorStore:
    chunks = split_documents(docs)
    return InMemoryVectorStore.from_documents(chunks, embeddings)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_ingest_build.py -v`
Expected: PASS (2 tests).

- [ ] **Step 5: Stage and hand off (Commit)**

```bash
git add rag/ingest.py tests/test_ingest_build.py
# Suggested message: "feat: chunk + build in-memory vector index"
```

---

## Task 5: Ingest — `main()` + build-index workflow

**Files:**
- Modify: `rag/ingest.py`
- Create: `tests/test_ingest_main.py`
- Create: `.github/workflows/build-rag-index.yml`

**Interfaces:**
- Consumes: `load_documents`, `build_index`; env `GEMINI_API_KEY`.
- Produces:
  - `make_embeddings() -> GoogleGenerativeAIEmbeddings` — `model="models/text-embedding-004"`, key from `GEMINI_API_KEY`.
  - `build_and_dump(corpus_dir: str, out_path: str, embeddings: Embeddings) -> None` — load → build → `store.dump(out_path)` (creates parent dirs).
  - `main()` — calls `build_and_dump("rag/corpus", "api/_index/vectors.json", make_embeddings())`.

- [ ] **Step 1: Write the failing test** — `tests/test_ingest_main.py` (no real API key needed; inject fake embeddings):

```python
from pathlib import Path
from langchain_core.embeddings import FakeEmbeddings
from rag.ingest import build_and_dump


def test_build_and_dump_writes_index(tmp_path):
    corpus = tmp_path / "corpus"
    (corpus).mkdir()
    (corpus / "cv.md").write_text("AI Engineer at Telkom University", encoding="utf-8")
    out = tmp_path / "idx" / "vectors.json"
    build_and_dump(str(corpus), str(out), FakeEmbeddings(size=8))
    assert out.is_file()
    assert out.stat().st_size > 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_ingest_main.py -v`
Expected: FAIL (`ImportError: cannot import name 'build_and_dump'`).

- [ ] **Step 3: Extend `rag/ingest.py`** — add:

```python
import os


def make_embeddings() -> Embeddings:
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing GEMINI_API_KEY")
    return GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004", google_api_key=api_key
    )


def build_and_dump(corpus_dir: str, out_path: str, embeddings: Embeddings) -> None:
    docs = load_documents(corpus_dir)
    if not docs:
        raise RuntimeError(f"No documents found in {corpus_dir}")
    store = build_index(docs, embeddings)
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    store.dump(str(out))
    print(f"Wrote {out} from {len(docs)} document(s)")


def main() -> None:
    build_and_dump("rag/corpus", "api/_index/vectors.json", make_embeddings())


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_ingest_main.py -v`
Expected: PASS.

- [ ] **Step 5: Create the index-build workflow** — `.github/workflows/build-rag-index.yml`:

```yaml
name: build-rag-index
on:
  push:
    paths: ["rag/corpus/**", "rag/ingest.py"]
  workflow_dispatch:
permissions:
  contents: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r rag/requirements.txt
      - run: python rag/ingest.py
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      - name: Commit updated index
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add api/_index/vectors.json
          git diff --cached --quiet || git commit -m "chore: rebuild RAG index [skip ci]"
          git push
```

- [ ] **Step 6: Stage and hand off (Commit)**

```bash
git add rag/ingest.py tests/test_ingest_main.py .github/workflows/build-rag-index.yml
# Suggested message: "feat: ingest entrypoint + index-build workflow"
```

- [ ] **Step 7: Verify the real index builds** — the user adds `GEMINI_API_KEY` as a GitHub Actions repo secret (Settings → Secrets and variables → Actions → New repository secret), then triggers `build-rag-index` (push or "Run workflow"). Confirm the Action commits a non-empty `api/_index/vectors.json`.

---

## Task 6: Serve — retriever + prompt builder

**Files:**
- Create: `api/chat.py`
- Create: `tests/test_serve_prompt.py`

**Interfaces:**
- Consumes: committed `api/_index/vectors.json`; env `GEMINI_API_KEY`.
- Produces:
  - `INDEX_PATH = "api/_index/vectors.json"`, `K = 5`, `MAX_TURNS = 10`, `MAX_MESSAGE_LENGTH = 2000`, `TEMPERATURE = 0.4`.
  - `get_retriever()` — module-cached; loads `InMemoryVectorStore.load(INDEX_PATH, embeddings)` once, returns `.as_retriever(search_kwargs={"k": K})`.
  - `build_prompt(question: str, chunks: list[Document], history: list[dict]) -> str` — grounded prompt: numbered context blocks with their `source`, the guardrail, recent turns, and the question.

- [ ] **Step 1: Write the failing test** — `tests/test_serve_prompt.py`:

```python
from langchain_core.documents import Document
import api.chat as chat


def test_build_prompt_includes_context_sources_and_guardrail():
    chunks = [
        Document(page_content="GPA 3.88 at Telkom", metadata={"source": "cv.md", "type": "cv"}),
    ]
    history = [{"role": "user", "content": "what's his GPA?"}]
    prompt = chat.build_prompt("what's his GPA?", chunks, history)
    assert "GPA 3.88 at Telkom" in prompt
    assert "cv.md" in prompt
    assert "only" in prompt.lower()          # guardrail present
    assert "what's his GPA?" in prompt
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_serve_prompt.py -v`
Expected: FAIL (`ModuleNotFoundError: api.chat`).

- [ ] **Step 3: Write `api/chat.py` (retriever + prompt only for now)**:

```python
import os
from langchain_core.documents import Document

INDEX_PATH = "api/_index/vectors.json"
K = 5
MAX_TURNS = 10
MAX_MESSAGE_LENGTH = 2000
TEMPERATURE = 0.4

_retriever = None


def _make_embeddings():
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing GEMINI_API_KEY")
    return GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004", google_api_key=api_key
    )


def get_retriever():
    global _retriever
    if _retriever is None:
        from langchain_core.vectorstores import InMemoryVectorStore
        store = InMemoryVectorStore.load(INDEX_PATH, _make_embeddings())
        _retriever = store.as_retriever(search_kwargs={"k": K})
    return _retriever


def build_prompt(question: str, chunks: list[Document], history: list[dict]) -> str:
    context = "\n\n".join(
        f"[{i + 1}] (source: {c.metadata.get('source', '?')})\n{c.page_content}"
        for i, c in enumerate(chunks)
    )
    convo = "\n".join(f"{m['role']}: {m['content']}" for m in history[-MAX_TURNS * 2:])
    return (
        "You are the CV Companion for Faraday Barr Fatahillah, AI Engineer.\n"
        "Answer the question using ONLY the context below. If the context does "
        "not cover it, say you don't have that information. Be concise and "
        "professional. You may cite sources by their filename.\n\n"
        f"=== CONTEXT ===\n{context}\n=== END CONTEXT ===\n\n"
        f"Conversation so far:\n{convo}\n\n"
        f"Question: {question}"
    )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_serve_prompt.py -v`
Expected: PASS.

- [ ] **Step 5: Stage and hand off (Commit)**

```bash
git add api/chat.py tests/test_serve_prompt.py
# Suggested message: "feat: serving retriever + grounded prompt builder"
```

---

## Task 7: Serve — request handler + remove old TS function

**Files:**
- Modify: `api/chat.py`
- Create: `tests/test_serve_handler.py`
- Delete: `api/chat.ts`, `api/chat.test.ts`

**Interfaces:**
- Consumes: `get_retriever`, `build_prompt` (Task 6).
- Produces:
  - `answer(messages: list[dict]) -> str` — validates/trims, retrieves, calls `_generate(prompt)`, returns reply text. Raises `ValueError` on bad input.
  - `_generate(prompt: str) -> str` — `ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=TEMPERATURE, google_api_key=...)`.invoke; returns `.content`. (Isolated so tests monkeypatch it.)
  - `handle_request(method: str, body: dict) -> tuple[int, dict]` — pure router: `405` non-POST, `400` malformed, `200 {"reply": ...}`, `502` on generation failure, `500` on missing key. The Vercel `handler` class wraps this.

- [ ] **Step 1: Write the failing test** — `tests/test_serve_handler.py`:

```python
import api.chat as chat


def _patch(monkeypatch, reply="Faraday has a GPA of 3.88."):
    monkeypatch.setattr(chat, "get_retriever", lambda: type("R", (), {
        "invoke": lambda self, q: []})())
    monkeypatch.setattr(chat, "_generate", lambda prompt: reply)


def test_rejects_non_post():
    status, body = chat.handle_request("GET", {})
    assert status == 405


def test_rejects_malformed_body():
    status, body = chat.handle_request("POST", {"nope": 1})
    assert status == 400


def test_happy_path(monkeypatch):
    _patch(monkeypatch)
    status, body = chat.handle_request("POST", {"messages": [
        {"role": "user", "content": "what's his GPA?"}]})
    assert status == 200
    assert "3.88" in body["reply"]


def test_generation_failure_returns_502(monkeypatch):
    monkeypatch.setattr(chat, "get_retriever", lambda: type("R", (), {
        "invoke": lambda self, q: []})())
    def boom(prompt): raise RuntimeError("gemini down")
    monkeypatch.setattr(chat, "_generate", boom)
    status, body = chat.handle_request("POST", {"messages": [
        {"role": "user", "content": "hi"}]})
    assert status == 502
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_serve_handler.py -v`
Expected: FAIL (`AttributeError: module 'api.chat' has no attribute 'handle_request'`).

- [ ] **Step 3: Extend `api/chat.py`** — add below `build_prompt`:

```python
import json


def _generate(prompt: str) -> str:
    from langchain_google_genai import ChatGoogleGenerativeAI
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing GEMINI_API_KEY")
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", temperature=TEMPERATURE, google_api_key=api_key
    )
    reply = llm.invoke(prompt).content
    if not isinstance(reply, str) or not reply.strip():
        raise RuntimeError("Empty reply")
    return reply


def _valid(messages) -> bool:
    return isinstance(messages, list) and all(
        isinstance(m, dict)
        and m.get("role") in ("system", "user", "assistant")
        and isinstance(m.get("content"), str)
        for m in messages
    )


def answer(messages: list[dict]) -> str:
    history = [
        {"role": m["role"], "content": m["content"][:MAX_MESSAGE_LENGTH]}
        for m in messages if m["role"] != "system"
    ][-MAX_TURNS * 2:]
    if not history:
        raise ValueError("No user message")
    question = history[-1]["content"]
    chunks = get_retriever().invoke(question)
    return _generate(build_prompt(question, chunks, history))


def handle_request(method: str, body: dict) -> tuple[int, dict]:
    if method != "POST":
        return 405, {"error": "Method not allowed"}
    messages = (body or {}).get("messages")
    if not _valid(messages) or not messages:
        return 400, {"error": "Expected { messages: {role, content}[] }"}
    try:
        return 200, {"reply": answer(messages)}
    except ValueError as e:
        return 400, {"error": str(e)}
    except RuntimeError as e:
        if "GEMINI_API_KEY" in str(e):
            return 500, {"error": "Server missing GEMINI_API_KEY"}
        return 502, {"error": "The assistant is unavailable right now"}
    except Exception:
        return 502, {"error": "The assistant is unavailable right now"}
```

- [ ] **Step 4: Add the Vercel HTTP shell** — append to `api/chat.py`:

```python
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def _send(self, status: int, payload: dict):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw or b"{}")
        except json.JSONDecodeError:
            self._send(400, {"error": "Invalid JSON"})
            return
        status, payload = handle_request("POST", body)
        self._send(status, payload)

    def do_GET(self):
        self._send(405, {"error": "Method not allowed"})
```

- [ ] **Step 5: Delete the old TS function**

```bash
git rm api/chat.ts api/chat.test.ts
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pytest tests/test_serve_handler.py tests/test_serve_prompt.py -v`
Expected: PASS (all).

- [ ] **Step 7: Stage and hand off (Commit)**

```bash
git add api/chat.py tests/test_serve_handler.py
# (git rm already staged the deletions)
# Suggested message: "feat: RAG chat handler; remove old TS function"
```

---

## Task 8: Cleanup, Vercel config, and deploy verification

**Files:**
- Delete: `src/chat/systemPrompt.ts`, `src/chat/systemPrompt.test.ts`
- Modify: `vercel.json`

**Interfaces:**
- Consumes: everything above.
- Produces: a deployable project — old prompt-builder removed, Python function bundled with its index.

- [ ] **Step 1: Confirm `systemPrompt` is orphaned** — verify nothing imports it now that `api/chat.ts` is gone.

Run: `grep -rn "systemPrompt" src api` (expect: no results, or only the files about to be deleted).
Expected: only `src/chat/systemPrompt.ts` / `src/chat/systemPrompt.test.ts` themselves.

- [ ] **Step 2: Delete the orphaned files**

```bash
git rm src/chat/systemPrompt.ts src/chat/systemPrompt.test.ts
```

- [ ] **Step 3: Ensure the index is bundled with the function** — edit `vercel.json`, adding a `functions` block so the precomputed index ships inside the Python function (leave existing keys intact):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/chat.py": {
      "includeFiles": "api/_index/**",
      "maxDuration": 30
    }
  },
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

- [ ] **Step 4: Stage and hand off (Commit)**

```bash
git add vercel.json
# (git rm already staged the deletions)
# Suggested message: "chore: bundle RAG index, drop legacy prompt builder"
```

- [ ] **Step 5: Full CI check** — after push, confirm the `python-rag` workflow runs the whole suite green:

Run (CI): `pytest tests/ -v`
Expected: PASS — `test_smoke`, `test_corpus` (3), `test_ingest_load` (3), `test_ingest_build` (2), `test_ingest_main` (1), `test_serve_prompt` (1), `test_serve_handler` (4).

- [ ] **Step 6: Confirm prerequisites for live deploy**
  - `GEMINI_API_KEY` set in **Vercel** project env vars (Production + Preview).
  - `GEMINI_API_KEY` set as a **GitHub Actions** repo secret.
  - `build-rag-index` has run and committed a non-empty `api/_index/vectors.json` (Task 5, Step 7).

- [ ] **Step 7: Vercel preview smoke test** — after the user pushes/opens a PR, on the Vercel preview URL open the chat panel and ask: "What is Faraday's GPA?" Expected: a grounded answer containing "3.88". Then ask something off-corpus ("What is his favorite movie?") Expected: a polite "I don't have that information." This confirms retrieval + grounding end to end.

---

## Notes for the implementer

- **Test execution reality:** with no local Python, treat each task's final "run tests" as: push the branch and read the `python-rag` Action result. Group a task's edits into one push to minimize round-trips.
- **`InMemoryVectorStore.load`/`dump`** are real `langchain_core` APIs (`store.dump(path)`, `InMemoryVectorStore.load(path, embedding)`); they serialize to JSON. Keep the same `embeddings` model on load as on dump.
- **Do not** add `pypdf`, splitters, or `langchain-community` to `api/requirements.txt` — the serving function only loads the index and embeds the question.
- If LangChain pins in Task 1 fail to resolve in CI, bump to the latest compatible `0.3.x` line for all four `langchain-*` packages together and re-push.
