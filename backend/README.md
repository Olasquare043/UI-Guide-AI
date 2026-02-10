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
