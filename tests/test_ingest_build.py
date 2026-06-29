from langchain_core.documents import Document
from rag.ingest import split_documents, make_chunk_ids


def test_split_preserves_metadata_and_chunks():
    long_text = "sentence. " * 200  # ~2000 chars -> multiple chunks
    docs = [Document(page_content=long_text, metadata={"source": "cv.md", "type": "cv"})]
    chunks = split_documents(docs)
    assert len(chunks) > 1
    assert all(c.metadata["source"] == "cv.md" for c in chunks)


def test_make_chunk_ids_are_stable_and_namespaced_by_source():
    chunks = [
        Document(page_content="a", metadata={"source": "cv.md"}),
        Document(page_content="b", metadata={"source": "cv.md"}),
        Document(page_content="c", metadata={"source": "projects/p.md"}),
    ]
    ids = make_chunk_ids(chunks)
    assert ids == ["cv.md#0", "cv.md#1", "projects/p.md#0"]
    # deterministic: re-running yields identical ids (overwrite, not duplicate)
    assert make_chunk_ids(chunks) == ids
