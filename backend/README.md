# UI Guide Backend API

FastAPI service for the UI Guide assistant. Provides chat endpoints and vector store health checks.

## Setup

1. Install dependencies:

```
python -m pip install -r ../requirements.txt
python -m pip install -r requirements-dev.txt
```

Tip: run with your virtualenv interpreter (`.\venv\Scripts\python` on Windows) to avoid installing into user/global Python.

2. Configure environment variables:

```
cp .env.example .env
```

Notes:

- Set `GROQ_API_KEY` (and optionally `GROQ_MODEL`) to use Groq for chat.
- `LLM_PROVIDER` can be `auto`, `groq`, or `openai`.
- `EMBEDDINGS_PROVIDER` can be `auto`, `openai`, or `local`.
- `EMBEDDINGS_MODEL` sets the local sentence-transformers model.
- `SPEECH_TO_TEXT_MODEL` and `TEXT_TO_SPEECH_MODEL` control the OpenAI audio models used for server voice features.
- `SPEECH_VOICE` sets the default TTS voice for read-aloud responses.
- `OPENAI_API_KEY` is still required for OpenAI embeddings.
- `CHROMA_DB_DIR` controls where the vector store is read from and written to.
- Set `ANONYMIZED_TELEMETRY=false` to disable Chroma telemetry in local/dev.
- `INDEX_OCR_ENABLED=true` enables OCR fallback on pages with empty extracted text.
- `INDEX_CHUNK_SIZE`, `INDEX_CHUNK_OVERLAP`, and `INDEX_BATCH_SIZE` control indexing speed vs recall.
- OCR requires Tesseract installed on the machine.

3. Build the vector store:

```
python build_index.py
```

4. Run the API:

```
python main.py
```

## Endpoints

- `GET /` health with vector store status in API-only mode, or the frontend app when `FRONTEND_DIST_DIR` is set
- `GET /health` liveness endpoint
- `POST /chat` main chat endpoint
- `POST /speech/transcribe` server-side audio transcription fallback
- `POST /speech/synthesize` server-side speech generation for read-aloud
- `GET /documents` list indexed documents
- `GET /test-vector` vector store diagnostics

## Railway (Free Plan)

Use this setup to avoid heavy optional packages during deploy:

1. Set Railway service root directory to `backend`.
2. Build command:

```
python -m pip install -r requirements.railway.txt
```

3. Start command:

```
python start.py
```

4. Environment:
- `RAILPACK_PYTHON_VERSION=3.11`
- `CHROMA_DB_DIR=<mounted-volume-path-or-./chroma_db>` if you are not using the bundled vector store
- `CHROMA_DB_URL=<archive-url-if-you-want-startup-seeding>` only if you want runtime download/seeding
- `LLM_PROVIDER` / `EMBEDDINGS_PROVIDER` / API keys
- `ANONYMIZED_TELEMETRY=false`

5. Add a persistent volume and point `CHROMA_DB_DIR` at it only if you do not want to keep the vector store in the repo.
6. `start.py` will install runtime deps from `requirements.railway.txt` if modules like
   `uvicorn` are missing in the container image.

## Render

If you deploy only the backend on Render, use `backend` as the service root. Since this project's Chroma data is small and static, bundling `backend/chroma_db` with the service is a reasonable choice and means you do not need a persistent disk. The tradeoff is that each knowledge-base update becomes a repo change.

This repo also includes:

- `../render.yaml` for the recommended Render Blueprint setup
- `../Dockerfile` for a one-service Docker deployment that serves both the built frontend and the API
