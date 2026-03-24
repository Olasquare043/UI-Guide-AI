from pathlib import Path

from settings import Settings

BACKEND_DIR = Path(__file__).resolve().parents[1]


def test_settings_resolve_relative_paths_from_backend_dir():
    settings = Settings(docs_dir="./docs", chroma_db_dir="./chroma_db")

    assert settings.docs_path() == (BACKEND_DIR / "docs").resolve()
    assert settings.chroma_db_path() == (BACKEND_DIR / "chroma_db").resolve()


def test_settings_keep_absolute_paths():
    docs_dir = (BACKEND_DIR / "custom-docs").resolve()
    chroma_dir = (BACKEND_DIR.parent / "persistent-data" / "chroma_db").resolve()
    settings = Settings(docs_dir=str(docs_dir), chroma_db_dir=str(chroma_dir))

    assert settings.docs_path() == docs_dir
    assert settings.chroma_db_path() == chroma_dir
