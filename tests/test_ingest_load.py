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


def test_ignores_readme_instruction_files(tmp_path):
    _write(tmp_path / "projects" / "README.md", "how to add projects")
    _write(tmp_path / "projects" / "project-x.md", "Project X content")
    docs = load_documents(str(tmp_path))
    assert [d.metadata["source"] for d in docs] == ["projects/project-x.md"]
