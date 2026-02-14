# UI Guide Backend API

FastAPI service for the UI Guide assistant. Provides chat endpoints and vector store health checks.

## Setup

1. Install dependencies:

```
pip install -r ../requirements.txt
pip install -r requirements-dev.txt
```

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
