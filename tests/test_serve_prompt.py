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
