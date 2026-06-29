from langchain_core.embeddings import FakeEmbeddings
from rag.ingest import build_and_dump


def test_build_and_dump_writes_index(tmp_path):
    corpus = tmp_path / "corpus"
    corpus.mkdir()
    (corpus / "cv.md").write_text("AI Engineer at Telkom University", encoding="utf-8")
    out = tmp_path / "idx" / "vectors.json"
    build_and_dump(str(corpus), str(out), FakeEmbeddings(size=8))
    assert out.is_file()
    assert out.stat().st_size > 0
