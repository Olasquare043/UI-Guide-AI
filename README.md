# UI Guide - University of Ibadan Assistant

UI Guide is a retrieval-augmented assistant that helps students, staff, and prospective students navigate University of Ibadan policies, admissions, courses, and campus services. It pairs a guided walkthrough experience with a reliable chat interface, backed by official documents and clear, step-by-step explanations.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: FastAPI + LangGraph + LangChain
- Vector store: ChromaDB
- LLM: OpenAI or Groq
- Embeddings: OpenAI (or local sentence-transformers fallback)

## Project Structure

```
UI-Guide-AI/
├── backend/           # FastAPI backend
├── frontend/          # React frontend
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
- `INDEX_CHUNK_SIZE`
- `INDEX_CHUNK_OVERLAP`
- `INDEX_BATCH_SIZE`
- `INDEX_MIN_CHARS`
- `INDEX_MAX_MB`
- `INDEX_OCR_ENABLED` (true | false)
- `INDEX_OCR_LANG`
- `INDEX_OCR_DPI`
- `DOCS_DIR`
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

Backend:

- `python -m pytest`
- `ruff check .`
- `black --check .`

## Deployment Notes

- Build the ChromaDB index before deploying. The `chroma_db` folder is large and should be stored outside git.
- Configure `OPENAI_API_KEY` and `ALLOWED_ORIGINS` in your hosting provider.
- For frontend hosting (Vercel, Netlify), set `VITE_API_URL` to your API URL.
- If `OPENAI_API_KEY` is missing, the backend will use Groq for chat (if set) and local embeddings.
- If you switch embeddings provider, rebuild the vector store.

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
python download_db.py && uvicorn main:app --host 0.0.0.0 --port $PORT
```

- Add a persistent volume mounted at `/app/chroma_db`.
- Set `CHROMA_DB_URL` to your `chroma_db.tar.gz` GitHub release asset URL.
- Configure `LLM_PROVIDER=auto` and `EMBEDDINGS_PROVIDER=auto` to allow fallback to Groq + local embeddings when OpenAI is not available.

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
