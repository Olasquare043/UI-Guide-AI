import io
from functools import lru_cache
from typing import Optional, Tuple

try:
    from openai import OpenAI
except ImportError as exc:  # pragma: no cover - dependency is required in runtime
    OpenAI = None
    _openai_import_error = exc
else:
    _openai_import_error = None

try:
    from .settings import get_settings
except ImportError:
    from settings import get_settings


def _require_openai_audio() -> None:
    settings = get_settings()
    if OpenAI is None:
        raise RuntimeError(f"OpenAI client is unavailable: {_openai_import_error}")
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required for server speech features")


@lru_cache(maxsize=1)
def get_audio_client():
    _require_openai_audio()
    return OpenAI(api_key=get_settings().openai_api_key)


def transcribe_audio(
    audio_bytes: bytes,
    filename: str = "recording.webm",
    language: Optional[str] = None,
    prompt: Optional[str] = None,
) -> str:
    _require_openai_audio()

    if not audio_bytes:
        raise RuntimeError("Audio file is empty")

    buffer = io.BytesIO(audio_bytes)
    buffer.name = filename or "recording.webm"

    request = {
        "file": buffer,
        "model": get_settings().speech_to_text_model,
        "response_format": "json",
    }
    if language:
        request["language"] = language
    if prompt:
        request["prompt"] = prompt

    result = get_audio_client().audio.transcriptions.create(**request)
    return getattr(result, "text", str(result)).strip()


def synthesize_speech(
    text: str,
    voice: Optional[str] = None,
    speed: float = 1.0,
    response_format: str = "mp3",
) -> Tuple[bytes, str]:
    _require_openai_audio()

    cleaned = (text or "").strip()
    if not cleaned:
        raise RuntimeError("Text is empty")

    clipped = cleaned[:4000]
    response = get_audio_client().audio.speech.create(
        model=get_settings().text_to_speech_model,
        voice=(voice or get_settings().speech_voice),
        input=clipped,
        response_format=response_format,
        speed=speed,
    )

    content_types = {
        "aac": "audio/aac",
        "flac": "audio/flac",
        "mp3": "audio/mpeg",
        "opus": "audio/opus",
        "pcm": "audio/pcm",
        "wav": "audio/wav",
    }
    return response.content, content_types.get(response_format, "audio/mpeg")
