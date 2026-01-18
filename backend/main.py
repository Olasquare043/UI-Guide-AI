from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid
import os
from pathlib import Path
from agent import query_agent

# Check if vector store exists, if not, warn user
persist_dir = "./chroma_db"
if not Path(persist_dir).exists():
    print("⚠️  WARNING: Vector store (chroma_db) not found!")
    print("   You need to run 'python build_index.py' first")
    print("   Or the vector store will be built on first request (if docs exist)")

# Initialize FastAPI app
app = FastAPI(
    title="UI Guide API",
    description="Your intelligent guide to University of Ibadan policies and information",
    version="1.0.0"
)

# CORS configuration - Allow frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class QueryRequest(BaseModel):
    message: str
    thread_id: Optional[str] = None

class QueryResponse(BaseModel):
    answer: str
    used_retriever: bool
    thread_id: str

# Health check endpoint
@app.get("/")
async def root():
    return {
        "status": "healthy",
        "message": "UI Guide API is running",
        "app": "UI Guide - Your intelligent guide to University of Ibadan",
        "version": "1.0.0"
    }

# Chat endpoint
@app.post("/chat", response_model=QueryResponse)
async def chat(request: QueryRequest):
    """
    Process a chat message and return the agent's response
    """
    try:
        # Generate thread_id if not provided
        thread_id = request.thread_id or str(uuid.uuid4())
        
        # Query the agent
        result = query_agent(request.message, thread_id)
        
        return QueryResponse(
            answer=result["answer"],
            used_retriever=result["used_retriever"],
            thread_id=result["thread_id"]
        )
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"ERROR in /chat endpoint: {error_detail}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# Health check endpoint for monitoring
@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)