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
- `OPENAI_API_KEY` is still required for OpenAI embeddings.
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

- `GET /` health with vector store status
- `POST /chat` main chat endpoint
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
- `CHROMA_DB_URL=<github-release-direct-url>`
- `LLM_PROVIDER` / `EMBEDDINGS_PROVIDER` / API keys
- `ANONYMIZED_TELEMETRY=false`

5. Add a persistent volume and mount it at `/app/chroma_db`.
6. `start.py` will install runtime deps from `requirements.railway.txt` if modules like
   `uvicorn` are missing in the container image.
