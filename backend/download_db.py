import os
import tarfile
import urllib.request
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional in container envs

    def load_dotenv(*_args, **_kwargs):
        return False


try:
    from .settings import get_settings
except ImportError:
    from settings import get_settings


BASE_DIR = Path(__file__).resolve().parent
ARCHIVE_NAME = "chroma_db.tar.gz"

# Load local .env if present (prefer backend/.env, then repo root)
load_dotenv(BASE_DIR / ".env", override=False)
load_dotenv(BASE_DIR.parent / ".env", override=False)


def _archive_path() -> Path:
    return BASE_DIR / ARCHIVE_NAME


def _has_existing_database(chroma_dir: Path) -> bool:
    return (chroma_dir / "chroma.sqlite3").exists()


def _safe_extract(tar: tarfile.TarFile, destination: Path) -> None:
    destination = destination.resolve()
    for member in tar.getmembers():
        member_path = (destination / member.name).resolve()
        if member_path != destination and destination not in member_path.parents:
            raise RuntimeError(f"Unsafe archive member detected: {member.name}")
    tar.extractall(destination)


def download_and_extract_db() -> bool:
    """Download and extract the Chroma database if it does not already exist."""

    chroma_dir = get_settings().chroma_db_path()
    if _has_existing_database(chroma_dir):
        print(f"Vector database already exists at {chroma_dir}.")
        return True

    db_url = os.getenv("CHROMA_DB_URL", "").strip()
    if not db_url:
        print(
            "CHROMA_DB_URL is not set. Skipping database download. "
            f"Expected database path: {chroma_dir}"
        )
        return False

    archive_path = _archive_path()
    print(f"Downloading vector database from: {db_url}")

    try:
        chroma_dir.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(db_url, archive_path)
        print("Download complete.")

        print(f"Extracting vector database into {chroma_dir.parent}...")
        with tarfile.open(archive_path, "r:gz") as tar:
            _safe_extract(tar, chroma_dir.parent)

        if not _has_existing_database(chroma_dir):
            raise RuntimeError(
                f"Extraction completed, but no Chroma database was found at {chroma_dir}."
            )

        print("Vector database ready.")
        return True
    finally:
        if archive_path.exists():
            os.remove(archive_path)


if __name__ == "__main__":
    try:
        download_and_extract_db()
    except Exception as exc:  # pragma: no cover - script entry point
        print(f"Error: {exc}")
        raise SystemExit(1)
