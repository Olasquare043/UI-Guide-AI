import os
from functools import lru_cache
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from pydantic import BaseModel

# Load local .env if present (prefer backend/.env, then repo root)
_base_dir = Path(__file__).resolve().parent
load_dotenv(_base_dir / ".env", override=False)
load_dotenv(_base_dir.parent / ".env", override=False)


class Settings(BaseModel):
    openai_api_key: str = ""
    docs_dir: str = "./docs"
    allowed_origins: str = "http://localhost:5173"
    debug: bool = False

    def origins(self) -> List[str]:
        raw = self.allowed_origins.strip()
        if not raw:
            return []
        if raw == "*":
            return ["*"]
        return [origin.strip() for origin in raw.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        openai_api_key=os.getenv("OPENAI_API_KEY", ""),
        docs_dir=os.getenv("DOCS_DIR", "./docs"),
        allowed_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173"),
        debug=os.getenv("DEBUG", "false").lower() in {"1", "true", "yes"},
    )
