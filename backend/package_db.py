import tarfile
from pathlib import Path

try:
    from .settings import get_settings
except ImportError:
    from settings import get_settings


BASE_DIR = Path(__file__).resolve().parent
ARCHIVE_NAME = "chroma_db.tar.gz"


def package_chroma_db() -> None:
    """Package the Chroma database folder into a compressed archive."""

    chroma_dir = get_settings().chroma_db_path()
    output_file = BASE_DIR / ARCHIVE_NAME

    if not chroma_dir.exists():
        print(f"Error: Chroma database folder not found at {chroma_dir}.")
        print("Run `python build_index.py` first to create the vector store.")
        return

    print("\n" + "=" * 70)
    print("Packaging Vector Database for Deployment")
    print("=" * 70 + "\n")

    print(f"Compressing {chroma_dir} to {output_file}...")

    with tarfile.open(output_file, "w:gz") as tar:
        tar.add(chroma_dir, arcname=chroma_dir.name)

    size_mb = output_file.stat().st_size / (1024 * 1024)

    print("Success.")
    print(f"  Output file: {output_file}")
    print(f"  Size: {size_mb:.2f} MB")
    print("\n" + "=" * 70)
    print("Next Steps:")
    print("=" * 70)
    print("\n1. Upload this file to a storage service or attach it to a release.")
    print("2. Get a direct download URL for the file.")
    print("3. Set CHROMA_DB_URL to that archive URL in your host.")
    print(f"4. Set CHROMA_DB_DIR to the runtime target path if it is not `./{chroma_dir.name}`.")
    print("\n" + "=" * 70 + "\n")


if __name__ == "__main__":
    package_chroma_db()
