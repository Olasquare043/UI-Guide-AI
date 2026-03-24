import os
from functools import lru_cache
from pathlib import Path
from typing import List

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional in managed runtimes

    def load_dotenv(*_args, **_kwargs):
        return False


from pydantic import BaseModel

# Load local .env if present (prefer backend/.env, then repo root)
_base_dir = Path(__file__).resolve().parent
load_dotenv(_base_dir / ".env", override=False)
load_dotenv(_base_dir.parent / ".env", override=False)


def _resolve_backend_path(value: str, default_relative_path: str) -> Path:
    path = Path(value or default_relative_path)
    if not path.is_absolute():
        path = _base_dir / path
    return path.resolve()


class Settings(BaseModel):
    openai_api_key: str = ""
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    llm_provider: str = "auto"
    embeddings_provider: str = "auto"
    embeddings_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    speech_to_text_model: str = "whisper-1"
    text_to_speech_model: str = "tts-1"
    speech_voice: str = "alloy"
    docs_dir: str = "./docs"
    chroma_db_dir: str = "./chroma_db"
    allowed_origins: str = "http://localhost:5173"
    debug: bool = False

    def origins(self) -> List[str]:
        raw = self.allowed_origins.strip()
        if not raw:
            return []
        if raw == "*":
            return ["*"]
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    def docs_path(self) -> Path:
        return _resolve_backend_path(self.docs_dir, "./docs")

    def chroma_db_path(self) -> Path:
        return _resolve_backend_path(self.chroma_db_dir, "./chroma_db")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        openai_api_key=os.getenv("OPENAI_API_KEY", ""),
        groq_api_key=os.getenv("GROQ_API_KEY", ""),
        groq_model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        llm_provider=os.getenv("LLM_PROVIDER", "auto").lower(),
        embeddings_provider=os.getenv("EMBEDDINGS_PROVIDER", "auto").lower(),
        embeddings_model=os.getenv("EMBEDDINGS_MODEL", "sentence-transformers/all-MiniLM-L6-v2"),
        speech_to_text_model=os.getenv("SPEECH_TO_TEXT_MODEL", "whisper-1"),
        text_to_speech_model=os.getenv("TEXT_TO_SPEECH_MODEL", "tts-1"),
        speech_voice=os.getenv("SPEECH_VOICE", "alloy"),
        docs_dir=os.getenv("DOCS_DIR", "./docs"),
        chroma_db_dir=os.getenv("CHROMA_DB_DIR", "./chroma_db"),
        allowed_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173"),
        debug=os.getenv("DEBUG", "false").lower() in {"1", "true", "yes"},
    )
