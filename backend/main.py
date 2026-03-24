import logging
import os
import uuid
from pathlib import Path
from typing import List, Literal, Optional

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from pydantic import BaseModel, Field

try:
    from .settings import get_settings
except ImportError:
    from settings import get_settings


logger = logging.getLogger("ui_guide_api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

settings = get_settings()


def _missing_dependency_error(exc: Exception):
    def _handler(*_args, **_kwargs):
        raise RuntimeError(f"Backend dependencies are missing: {exc}")

    return _handler


try:
    try:
        from .agent import get_available_documents, query_agent, test_vector_store
    except ImportError:
        from agent import get_available_documents, query_agent, test_vector_store
except Exception as exc:
    logger.warning("Agent dependencies failed to load: %s", exc)
    get_available_documents = _missing_dependency_error(exc)
    query_agent = _missing_dependency_error(exc)
    test_vector_store = _missing_dependency_error(exc)

try:
    try:
        from .speech import server_speech_available, synthesize_speech, transcribe_audio
    except ImportError:
        from speech import server_speech_available, synthesize_speech, transcribe_audio
except Exception as exc:
    logger.warning("Speech dependencies failed to load: %s", exc)
    server_speech_available = _missing_dependency_error(exc)
    synthesize_speech = _missing_dependency_error(exc)
    transcribe_audio = _missing_dependency_error(exc)


def _frontend_dist_dir() -> Optional[Path]:
    env_path = os.getenv("FRONTEND_DIST_DIR", "").strip()
    if not env_path:
        return None

    candidate = Path(env_path)
    if (candidate / "index.html").exists():
        return candidate.resolve()
    return None


def _safe_frontend_file(dist_dir: Path, relative_path: str) -> Optional[Path]:
    requested = (dist_dir / relative_path).resolve()
    resolved_dist = dist_dir.resolve()
    if requested == resolved_dist or resolved_dist in requested.parents:
        if requested.is_file():
            return requested
    return None


persist_dir = settings.chroma_db_path()
if not persist_dir.exists():
    logger.warning("Vector store not found at %s. Run `python build_index.py` first.", persist_dir)

app = FastAPI(
    title="UI Guide API",
    description="Your intelligent guide to University of Ibadan policies and information",
    version="2.1.0",
)

origins = settings.origins()
allow_all = origins == ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["http://localhost:5173"],
    allow_credentials=False if allow_all else True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=2000,
        examples=["What are the admission requirements?"],
    )
    thread_id: Optional[str] = Field(default=None, max_length=64, examples=["user1"])
    mode: Optional[Literal["chat", "guide"]] = Field(default="chat")
    context: Optional[str] = Field(default=None, max_length=2000)
    verbosity: Optional[Literal["concise", "normal", "detailed"]] = Field(default="normal")

    model_config = {"extra": "ignore"}


class SourceItem(BaseModel):
    content: str
    document: str
    page: str
    date: Optional[str] = None
    source: Optional[str] = None


class QueryResponse(BaseModel):
    answer: str
    used_retriever: bool
    thread_id: str
    sources: List[SourceItem]


class DocumentsResponse(BaseModel):
    count: int
    documents: List[str]
    status: str


class SpeechTranscriptionResponse(BaseModel):
    text: str


class SpeechSynthesisRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    voice: Optional[Literal["alloy", "echo", "fable", "nova", "onyx", "shimmer"]] = None
    speed: float = Field(default=1.0, ge=0.25, le=4.0)


class CapabilitiesResponse(BaseModel):
    server_speech_transcription: bool
    server_speech_synthesis: bool
    vector_store_ready: bool


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    trace_id = str(uuid.uuid4())
    message = "Request failed."
    details = None

    if isinstance(exc.detail, dict):
        message = exc.detail.get("message") or exc.detail.get("error") or message
        details = exc.detail.get("details")
    elif isinstance(exc.detail, str):
        message = exc.detail

    payload = {"error": {"message": message, "trace_id": trace_id}}
    if settings.debug and details:
        payload["error"]["details"] = details

    return JSONResponse(status_code=exc.status_code, content=payload)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    trace_id = str(uuid.uuid4())
    logger.exception("Unhandled error %s", trace_id)

    payload = {
        "error": {
            "message": "Failed to process your request. Please try again.",
            "trace_id": trace_id,
        }
    }
    if settings.debug:
        payload["error"]["details"] = str(exc)

    return JSONResponse(status_code=500, content=payload)


@app.get("/")
async def root():
    frontend_dist = _frontend_dist_dir()
    if frontend_dist is not None:
        return FileResponse(frontend_dist / "index.html")

    vector_status = test_vector_store()
    return {
        "status": "healthy",
        "message": "UI Guide API is running",
        "version": "2.1.0",
        "backend": "FastAPI + LangGraph",
        "vector_store": vector_status,
    }


@app.post("/chat", response_model=QueryResponse)
async def chat(request: QueryRequest):
    try:
        thread_id = request.thread_id or str(uuid.uuid4())
        result = query_agent(request.message, thread_id)
        return QueryResponse(
            answer=result["answer"],
            used_retriever=result["used_retriever"],
            thread_id=result["thread_id"],
            sources=result["sources"],
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail={"message": str(exc)})


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/capabilities", response_model=CapabilitiesResponse)
async def capabilities():
    speech_enabled = False
    try:
        speech_enabled = bool(server_speech_available())
    except Exception:
        speech_enabled = False

    return {
        "server_speech_transcription": speech_enabled,
        "server_speech_synthesis": speech_enabled,
        "vector_store_ready": persist_dir.exists(),
    }


@app.post("/speech/transcribe", response_model=SpeechTranscriptionResponse)
async def speech_transcribe(
    file: UploadFile = File(...),
    language: Optional[str] = Form(default=None),
):
    try:
        audio_bytes = await file.read()
        text = await run_in_threadpool(
            transcribe_audio,
            audio_bytes,
            file.filename or "recording.webm",
            language,
            None,
        )
        return {"text": text}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail={"message": str(exc)})


@app.post("/speech/synthesize")
async def speech_synthesize(request: SpeechSynthesisRequest):
    try:
        audio_bytes, media_type = await run_in_threadpool(
            synthesize_speech,
            request.text,
            request.voice,
            request.speed,
            "mp3",
        )
        return Response(
            content=audio_bytes,
            media_type=media_type,
            headers={"Content-Disposition": 'inline; filename="ui-guide-response.mp3"'},
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail={"message": str(exc)})


@app.get("/documents", response_model=DocumentsResponse)
async def documents():
    try:
        docs = get_available_documents()
        status = "success" if docs else "empty"
        return {
            "count": len(docs),
            "documents": docs,
            "status": status,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail={"message": str(exc)})


@app.get("/test-vector")
async def test_vector():
    try:
        return test_vector_store()
    except Exception as exc:
        raise HTTPException(status_code=500, detail={"message": str(exc)})


@app.get("/{full_path:path}", include_in_schema=False)
async def frontend(full_path: str):
    frontend_dist = _frontend_dist_dir()
    if frontend_dist is None:
        raise HTTPException(status_code=404, detail={"message": "Not found"})

    if full_path:
        candidate = _safe_frontend_file(frontend_dist, full_path)
        if candidate is not None:
            return FileResponse(candidate)

    return FileResponse(frontend_dist / "index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
