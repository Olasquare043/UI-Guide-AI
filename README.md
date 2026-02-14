# UI Guide - University of Ibadan Assistant

UI Guide is a retrieval-augmented assistant that helps students, staff, and prospective students navigate University of Ibadan policies, admissions, courses, and campus services. It pairs a guided walkthrough experience with a reliable chat interface, backed by official documents and clear, step-by-step explanations.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: FastAPI + LangGraph + LangChain
- Vector store: ChromaDB
- LLM: OpenAI or Groq
- Embeddings: OpenAI

## Project Structure

```
UI-Guide-AI/
├── backend/           # FastAPI backend
├── frontend/          # React frontend
├── docs/              # Audit and decision logs
└── requirements.txt   # Backend dependencies
```

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- OpenAI API key

### Backend

1. Install dependencies:

```
cd backend
pip install -r ../requirements.txt
pip install -r requirements-dev.txt
```

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
- `DOCS_DIR`
- `ALLOWED_ORIGINS`
- `DEBUG`

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
 - `OPENAI_API_KEY` is still required for embeddings unless you swap to a different embeddings provider.

## Updating the Knowledge Base

1. Add or replace PDFs in `backend/docs/`.
2. Rebuild the index:

```
cd backend
python build_index.py
```

3. Restart the backend.

## Docs

- `docs/AUDIT.md` - audit findings and upgrade plan
- `docs/DECISIONS.md` - architectural decisions
- `docs/EVALUATION.md` - LLM quality evaluation framework
- `docs/INTERVIEW_ANSWER.md` - interview-ready evaluation response
