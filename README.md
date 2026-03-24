# UI Guide - University of Ibadan Assistant

UI Guide is a retrieval-augmented assistant that helps students, staff, and prospective students navigate University of Ibadan policies, admissions, courses, and campus services. It pairs a guided walkthrough experience with a reliable chat interface, backed by official documents and clear, step-by-step explanations.

Highlights:

- Guided and free-form chat experiences
- Official-document retrieval with citations
- Adjustable response verbosity
- Voice dictation, animated listening states, and auto-read voice mode across chat and guided walkthroughs

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: FastAPI + LangGraph + LangChain
- Vector store: ChromaDB
- LLM: OpenAI or Groq
- Embeddings: OpenAI (or local sentence-transformers fallback)

## Project Structure

```
UI-Guide-AI/
├── backend/           # FastAPI backend + bundled ChromaDB
├── frontend/          # React frontend
├── render.yaml        # Render Blueprint deployment
├── Dockerfile         # One-service Docker deployment
├── EVALUATION/        # Audit and evaluation notes
└── requirements.txt   # Full backend dependencies (local dev/indexing)
```

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- OpenAI API key or Groq API key
- Optional for OCR fallback: Tesseract OCR installed on host

### Backend

1. Install dependencies:

```
cd backend
python -m pip install -r ../requirements.txt
python -m pip install -r requirements-dev.txt
```

Tip: use your virtualenv interpreter (`.\venv\Scripts\python` on Windows) so installs do not go to user/global site-packages.

2. Create environment file:

```
cp .env.example .env
```

3. Add your PDF documents to `backend/docs/`, then build the vector store:

```
python build_index.py
```

4. Run the API:

```
python main.py
```

The API runs at `http://localhost:8000`.

You can also run with Uvicorn for auto-reload:

```
uvicorn main:app --reload
```

### Frontend

1. Install dependencies:

```
cd frontend
npm install
```

2. Create environment file:

```
cp .env.example .env
```

3. Run the dev server:

```
npm run dev
```

The app runs at `http://localhost:5173`.

## Environment Variables

Backend (`backend/.env.example`):

- `OPENAI_API_KEY`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `LLM_PROVIDER` (auto | groq | openai)
- `EMBEDDINGS_PROVIDER` (auto | openai | local)
- `EMBEDDINGS_MODEL` (for local embeddings)
- `SPEECH_TO_TEXT_MODEL`
- `TEXT_TO_SPEECH_MODEL`
- `SPEECH_VOICE`
- `INDEX_CHUNK_SIZE`
- `INDEX_CHUNK_OVERLAP`
- `INDEX_BATCH_SIZE`
- `INDEX_MIN_CHARS`
- `INDEX_MAX_MB`
- `INDEX_OCR_ENABLED` (true | false)
- `INDEX_OCR_LANG`
- `INDEX_OCR_DPI`
- `DOCS_DIR`
- `CHROMA_DB_DIR`
- `CHROMA_DB_URL`
- `ALLOWED_ORIGINS`
- `DEBUG`
- `ANONYMIZED_TELEMETRY` (false recommended to disable Chroma telemetry)

Frontend (`frontend/.env.example`):

- `VITE_API_URL`
- `VITE_APP_TITLE`
- `VITE_DEBUG`

## Scripts

Frontend:

- `npm run build`
- `npm run lint`
- `npm run format`
- `npm test`
- `npm run test:e2e`

Backend:

- `python -m pytest`
- `ruff check .`
- `black --check .`

## Deployment Notes

- Build the ChromaDB index before deploying.
- This repo currently bundles `backend/chroma_db` because the dataset is small and mostly static. For larger or frequently updated datasets, prefer persistent storage or a release asset instead of committing the vector store.
- Configure `OPENAI_API_KEY` and `ALLOWED_ORIGINS` in your hosting provider.
- Server-side speech fallback uses `OPENAI_API_KEY` for transcription and TTS. Without it, browser-native voice still works on supported browsers.
- Voice mode is stored locally in the browser, so users can keep auto-read enabled between sessions.
- The frontend now checks backend capabilities before enabling server speech fallback, so `GET /capabilities` should be available anywhere you deploy the API.
- For frontend hosting (Vercel, Netlify), set `VITE_API_URL` to your API URL.
- If `OPENAI_API_KEY` is missing, the backend will use Groq for chat (if set) and local embeddings.
- If you switch embeddings provider, rebuild the vector store.
- `CHROMA_DB_DIR` controls where the backend reads and writes the Chroma data. Relative paths are resolved from `backend/`.

### Render Blueprint (Recommended)

This repo now includes `render.yaml` for the recommended Render setup:

- `ui-guide-api`: Python web service rooted at `backend/`
- `ui-guide-web`: static site rooted at `frontend/`
- uses the bundled `backend/chroma_db` directly

How to use it:

1. In Render, create a new Blueprint service from this repo.
2. Set the secret env vars Render asks for:
   - `OPENAI_API_KEY` and/or `GROQ_API_KEY`
   - `VITE_API_URL` for the frontend, using your backend public URL
3. Deploy.

Notes:

- The blueprint defaults `ALLOWED_ORIGINS` to `*` so the frontend works immediately. Tighten this later if you want stricter CORS.
- The backend uses `backend/requirements.render.txt` so Render can deploy from the `backend/` root directory without depending on repo-root files.
- No `CHROMA_DB_URL` or mounted disk is required for the current bundled-DB setup.

### Render Docker (One Service)

If you want Render to auto-detect a Docker deploy and run everything as one service, use the root `Dockerfile`.

- It builds the React app, copies the compiled frontend into the final image, and starts FastAPI.
- The backend now serves the built frontend automatically when `FRONTEND_DIST_DIR` exists, so the same container can serve both the UI and API.
- In this mode the frontend can use same-origin API calls, so `VITE_API_URL` is optional.
- If `backend/chroma_db` is committed, no persistent disk or `CHROMA_DB_URL` is required.

### Railway

- Free plan recommendation:
  - Use backend root directory (`backend`)
  - Use the slim runtime deps file (`requirements.railway.txt`)
  - Pin Python to 3.11 (set `RAILPACK_PYTHON_VERSION=3.11`)
- Build command:

```
python -m pip install -r requirements.railway.txt
```

- Start command:

```
python start.py
```

- `CHROMA_DB_DIR` is optional and only needed if you do not want to use the bundled `backend/chroma_db`.
- `CHROMA_DB_URL` is optional and only needed if you want startup to seed an empty runtime volume automatically.
- Configure `LLM_PROVIDER=auto` and `EMBEDDINGS_PROVIDER=auto` to allow fallback to Groq + local embeddings when OpenAI is not available.
- `start.py` self-heals missing runtime deps (like `uvicorn`) before booting.

### Render

- Best option for this repo: use the included `render.yaml` Blueprint and keep frontend + backend as separate Render services.
- Best option if you insist on one deployable unit: use the root `Dockerfile`.
- Since your ChromaDB is small and static, bundling `backend/chroma_db` in the repo is fine and means you do not need a mounted disk.
- Tradeoff: every knowledge-base update means rebuilding the index locally and committing the updated `backend/chroma_db`.

## Updating the Knowledge Base

1. Add or replace PDFs in `backend/docs/`.
2. Rebuild the index:

```
cd backend
python build_index.py
```

3. Restart the backend.

### Indexing performance notes

- `build_index.py` now uses direct PyMuPDF extraction with optional OCR fallback on empty pages.
- Empty and very short pages are skipped by default to reduce noisy chunks and speed up embedding.
- For faster indexing, increase `INDEX_CHUNK_SIZE` slightly and lower `INDEX_CHUNK_OVERLAP`.
- OCR is quality-first and slower; keep `INDEX_OCR_ENABLED=false` unless your PDFs are scanned/image-heavy.

## Docs

- `EVALUATION/AUDIT.md` - audit findings and upgrade plan
- `EVALUATION/DECISIONS.md` - architectural decisions
- `EVALUATION/EVALUATION.md` - LLM quality evaluation framework
- `EVALUATION/INTERVIEW_ANSWER.md` - interview-ready evaluation response
