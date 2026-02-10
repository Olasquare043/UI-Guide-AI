import logging
import uuid
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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


persist_dir = "./chroma_db"
if not Path(persist_dir).exists():
    logger.warning("Vector store (chroma_db) not found. Run `python build_index.py` first.")

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


class HealthResponse(BaseModel):
    status: str
    message: str
    version: str
    backend: str
    vector_store: Dict[str, Any]


class DocumentsResponse(BaseModel):
    count: int
    documents: List[str]
    status: str


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


@app.get("/", response_model=HealthResponse)
async def root():
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
