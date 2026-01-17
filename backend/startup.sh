#!/bin/bash

echo "Starting UI Guide API..."

# Check if chroma_db exists
if [ ! -d "./chroma_db" ]; then
    echo "Vector database not found. Downloading from cloud storage..."
    
    # Download the pre-built chroma_db from your cloud storage
    # Replace CHROMA_DB_URL with your actual URL
    if [ -n "$CHROMA_DB_URL" ]; then
        echo "Downloading chroma_db.tar.gz..."
        curl -L -o chroma_db.tar.gz "$CHROMA_DB_URL"
        
        echo "Extracting chroma_db..."
        tar -xzf chroma_db.tar.gz
        
        echo "Cleaning up..."
        rm chroma_db.tar.gz
        
        echo "✅ Vector database ready!"
    else
        echo "❌ ERROR: CHROMA_DB_URL environment variable not set!"
        echo "Please set it in Render dashboard to your cloud storage URL"
        exit 1
    fi
else
    echo "✅ Vector database already exists."
fi

# Start the FastAPI server
echo "Starting FastAPI server..."
uvicorn main:app --host 0.0.0.0 --port $PORT