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
