import os
from pathlib import Path
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter

CHUNK_SIZE = 700
CHUNK_OVERLAP = 100


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


def split_documents(docs: list[Document]) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
    )
    return splitter.split_documents(docs)


def build_index(docs: list[Document], embeddings: Embeddings) -> InMemoryVectorStore:
    chunks = split_documents(docs)
    return InMemoryVectorStore.from_documents(chunks, embeddings)


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
