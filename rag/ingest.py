import os
from pathlib import Path
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

CHUNK_SIZE = 700
CHUNK_OVERLAP = 100
DEFAULT_INDEX = "cv-rag"


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
        if path.name.lower() == "readme.md":
            continue  # folder instructions, not knowledge-base content
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


def split_documents(docs: list[Document]) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
    )
    return splitter.split_documents(docs)


def make_chunk_ids(chunks: list[Document]) -> list[str]:
    """Deterministic, stable id per chunk: "<source>#<n>".

    Re-running ingest overwrites the same ids instead of creating duplicates.
    """
    ids: list[str] = []
    counters: dict[str, int] = {}
    for c in chunks:
        src = c.metadata.get("source", "doc")
        n = counters.get(src, 0)
        counters[src] = n + 1
        ids.append(f"{src}#{n}")
    return ids


def make_embeddings() -> Embeddings:
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing GEMINI_API_KEY")
    return GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004", google_api_key=api_key
    )


def upsert_to_pinecone(
    docs: list[Document], embeddings: Embeddings, index_name: str, api_key: str
) -> int:
    """Full rebuild: clear the index, then embed + upsert every chunk.

    Returns the number of chunks upserted.
    """
    from langchain_pinecone import PineconeVectorStore
    from pinecone import Pinecone

    chunks = split_documents(docs)
    ids = make_chunk_ids(chunks)

    index = Pinecone(api_key=api_key).Index(index_name)
    try:
        index.delete(delete_all=True)  # raises on an empty index — safe to ignore
    except Exception:
        pass

    store = PineconeVectorStore(index=index, embedding=embeddings)
    store.add_documents(chunks, ids=ids)
    return len(chunks)


def main() -> None:
    pinecone_key = os.environ.get("PINECONE_API_KEY")
    if not pinecone_key:
        raise RuntimeError("Missing PINECONE_API_KEY")
    index_name = os.environ.get("PINECONE_INDEX") or DEFAULT_INDEX

    docs = load_documents("rag/corpus")
    if not docs:
        raise RuntimeError("No documents found in rag/corpus")

    n = upsert_to_pinecone(docs, make_embeddings(), index_name, pinecone_key)
    print(f"Upserted {n} chunks from {len(docs)} document(s) to index '{index_name}'")


if __name__ == "__main__":
    main()
