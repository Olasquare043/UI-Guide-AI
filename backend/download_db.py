import os
import tarfile
import urllib.request
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional in container envs
    def load_dotenv(*_args, **_kwargs):
        return False

# Load local .env if present (prefer backend/.env, then repo root)
_base_dir = Path(__file__).resolve().parent
load_dotenv(_base_dir / ".env", override=False)
load_dotenv(_base_dir.parent / ".env", override=False)

def download_and_extract_db():
    """Download and extract the chroma database if it doesn't exist"""

    chroma_dir = Path("./chroma_db")

    if chroma_dir.exists():
        print("✅ Vector database already exists.")
        return

    db_url = os.getenv("CHROMA_DB_URL")

    if not db_url:
        print("❌ ERROR: CHROMA_DB_URL environment variable not set!")
        exit(1)

    print(f"📥 Downloading vector database from: {db_url}")

    try:
        # Download the file
        tar_file = "chroma_db.tar.gz"
        urllib.request.urlretrieve(db_url, tar_file)
        print("✅ Download complete!")

        # Extract the file
        print("📦 Extracting vector database...")
        with tarfile.open(tar_file, "r:gz") as tar:
            tar.extractall()

        # Clean up
        os.remove(tar_file)
        print("✅ Vector database ready!")

    except Exception as e:
        print(f"❌ Error: {e}")
        exit(1)


if __name__ == "__main__":
    download_and_extract_db()
