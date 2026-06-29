from unittest.mock import MagicMock, patch
from langchain_core.documents import Document
from langchain_core.embeddings import FakeEmbeddings
from rag.ingest import upsert_to_pinecone


def test_upsert_clears_index_then_adds_chunks_with_stable_ids():
    docs = [Document(page_content="AI Engineer at Telkom University",
                     metadata={"source": "cv.md", "type": "cv"})]
    fake_index = MagicMock()
    fake_pc = MagicMock()
    fake_pc.Index.return_value = fake_index
    fake_store = MagicMock()

    with patch("pinecone.Pinecone", return_value=fake_pc) as PC, \
         patch("langchain_pinecone.PineconeVectorStore", return_value=fake_store):
        n = upsert_to_pinecone(docs, FakeEmbeddings(size=8), "cv-rag", "key-123")

    PC.assert_called_once_with(api_key="key-123")
    fake_pc.Index.assert_called_once_with("cv-rag")
    fake_index.delete.assert_called_once_with(delete_all=True)

    _, kwargs = fake_store.add_documents.call_args
    assert kwargs["ids"][0] == "cv.md#0"
    assert n == len(kwargs["ids"]) >= 1
