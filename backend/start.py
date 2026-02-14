import importlib.util
import os
import subprocess
import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
REQUIREMENTS_FILE = BASE_DIR / "requirements.railway.txt"


def _has_module(module_name: str) -> bool:
    return importlib.util.find_spec(module_name) is not None


def _ensure_runtime_dependencies() -> None:
    required_modules = ("uvicorn", "fastapi")
    missing = [name for name in required_modules if not _has_module(name)]
    if not missing:
        return

    if not REQUIREMENTS_FILE.exists():
        raise RuntimeError(
            f"Missing dependencies ({', '.join(missing)}) and "
            f"{REQUIREMENTS_FILE.name} was not found."
        )

    print(
        "Missing runtime dependencies detected: "
        f"{', '.join(missing)}. Installing from {REQUIREMENTS_FILE.name}..."
    )
    subprocess.check_call(
        [
            sys.executable,
            "-m",
            "pip",
            "install",
            "--no-cache-dir",
            "-r",
            str(REQUIREMENTS_FILE),
        ]
    )


def main() -> None:
    _ensure_runtime_dependencies()
    subprocess.check_call([sys.executable, "download_db.py"])

    port = os.getenv("PORT", "8000")
    os.execvp(
        sys.executable,
        [
            sys.executable,
            "-m",
            "uvicorn",
            "main:app",
            "--host",
            "0.0.0.0",
            "--port",
            port,
        ],
    )


if __name__ == "__main__":
    main()
