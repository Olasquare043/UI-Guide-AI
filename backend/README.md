# UI Guide - Backend API

Your intelligent guide to University of Ibadan policies and information.

## Local Development

### Prerequisites
- Python 3.11+
- OpenAI API Key

### Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Create `.env` file:**
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   DOCS_DIR=./docs
   ```

3. **Build the vector store:**
   ```bash
   python build_index.py
   ```
   
   Make sure your PDF files are in the `docs/` folder.

4. **Run the server:**
   ```bash
   python main.py
   ```
   
   Or with auto-reload:
   ```bash
   uvicorn main:app --reload
   ```

5. **Test the API:**
   - Health check: `http://localhost:8000/`
   - API docs: `http://localhost:8000/docs`

## Deployment to Render

### Important: Handling Vector Database

⚠️ **The `chroma_db` folder is too large to push to GitHub.** 

You have two options:

#### Option 1: Upload chroma_db separately (Recommended for production)
1. Use a cloud storage service (AWS S3, Google Cloud Storage, etc.)
2. Modify `agent.py` to download the database on startup
3. This requires additional configuration

#### Option 2: Rebuild on Render (Simple but slower)
1. Include your PDF files in the repo (if they're not too large)
2. Add a build hook to run `build_index.py` during deployment
3. Modify `render.yaml` build command:
   ```yaml
   buildCommand: pip install -r requirements.txt && python build_index.py
   ```

### Deployment Steps

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect the `render.yaml` configuration
   - Add your `OPENAI_API_KEY` in the Environment Variables section
   - Click "Create Web Service"

3. **Your API will be available at:**
   ```
   https://ui-guide-api.onrender.com
   ```

## API Endpoints

### `GET /`
Health check endpoint
```json
{
  "status": "healthy",
  "message": "UI Guide API is running",
  "app": "UI Guide - Your intelligent guide to University of Ibadan",
  "version": "1.0.0"
}
```

### `POST /chat`
Send a message to the chatbot
```json
{
  "message": "What are the admission requirements?",
  "thread_id": "optional-session-id"
}
```

Response:
```json
{
  "answer": "The admission requirements...",
  "used_retriever": true,
  "thread_id": "session-id"
}
```

### `GET /health`
Simple health check
```json
{
  "status": "healthy"
}
```

## Project Structure

```
backend/
├── main.py              # FastAPI application
├── agent.py             # LangGraph agent logic
├── build_index.py       # Script to build vector store
├── requirements.txt     # Python dependencies
├── render.yaml          # Render deployment config
├── runtime.txt          # Python version
├── .env                 # Environment variables (not in git)
├── .gitignore          # Git ignore rules
├── docs/               # PDF documents (not in git)
└── chroma_db/          # Vector store (not in git)
```

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `DOCS_DIR`: Path to documents folder (default: `./docs`)

## License

MIT