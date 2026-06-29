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
