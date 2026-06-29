from pathlib import Path

CORPUS = Path("rag/corpus")

KNOWLEDGE_FILES = [
    "01_who_am_i.md",
    "02_skills.md",
    "03_events.md",
    "04_certificates.md",
    "05_roles_and_availability.md",
    "06_contact.md",
]


def test_knowledge_files_exist():
    for name in KNOWLEDGE_FILES:
        assert (CORPUS / name).is_file(), f"missing {name}"


def test_subfolders_have_readme_instructions():
    assert (CORPUS / "projects" / "README.md").is_file()
    assert (CORPUS / "publications" / "README.md").is_file()
