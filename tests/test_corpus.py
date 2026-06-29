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
