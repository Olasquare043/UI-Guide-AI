import hashlib
import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyMuPDFLoader
try:
    from langchain_community.embeddings import HuggingFaceEmbeddings
except ImportError:  # pragma: no cover - optional dependency
    HuggingFaceEmbeddings = None
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

try:
    from .settings import get_settings
except ImportError:
    from settings import get_settings

# Load environment variables
load_dotenv()

# Configuration
MAX_MB = 350
persist_dir = "./chroma_db"


def load_pdf_with_metadata(
    file_path: str,
    document_name: str,
    institution: str = "University of Ibadan",
):
    """Load PDF and add custom metadata"""
    loader = PyMuPDFLoader(file_path)
    pages = loader.load()

    for page in pages:
        page.metadata.update(
            {
                "document_name": document_name,
                "institution": institution,
                "page_no": (page.metadata.get("page") or 0) + 1,
                "source_file": str(file_path),
            }
        )
    return pages


def chunking(documents):
    """Split documents into chunks"""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(documents=documents)
    return chunks


def add_chunk_id(chunk):
    """Generate unique ID for each chunk"""
    key = (
        f"{chunk.metadata.get('document_name')}|"
        f"{chunk.metadata.get('page_no')}|"
        f"{chunk.page_content}"
    )
    return hashlib.sha1(key.encode("utf-8")).hexdigest()


def build_vector_store():
    """Main function to build the vector store from PDFs"""
    print("\n" + "=" * 70)
    print("UI Guide - Building Vector Store")
    print("=" * 70 + "\n")

    # Get documents directory
    doc_dir = Path(os.getenv("DOCS_DIR", "./docs"))

    if not doc_dir.exists():
        print(f"âŒ Error: Directory '{doc_dir}' does not exist!")
        print("Please create it and add your PDF files there.")
        return

    pdfs = sorted(doc_dir.glob("*.pdf"))

    if not pdfs:
        print(f"âŒ Error: No PDF files found in '{doc_dir}'")
        print("Please add PDF files to this directory.")
        return

    print(f"ðŸ“‚ Found {len(pdfs)} PDF file(s) in '{doc_dir}'\n")

    # Load PDFs
    documents = []
    skipped = []

    for i, pdf in enumerate(pdfs, 1):
        size_mb = pdf.stat().st_size / (1024 * 1024)
        print(
            f"[{i}/{len(pdfs)}] Loading: {pdf.name} ({size_mb:.1f} MB)...",
            flush=True,
        )

        if size_mb > MAX_MB:
            skipped.append((pdf.name, f"Too large ({size_mb:.1f} MB)"))
            print("   âš ï¸  SKIP (too large)", flush=True)
            continue

        try:
            pages = load_pdf_with_metadata(pdf, pdf.name)
            documents += pages
            print(f"   âœ… Loaded: {len(pages)} pages", flush=True)
        except Exception as e:
            skipped.append((pdf.name, str(e)))
            print(f"   âŒ SKIP: {e}", flush=True)

    if not documents:
        print("\nâŒ Error: No documents were loaded successfully!")
        return

    print(f"\nâœ… Total loaded pages: {len(documents)}")

    if skipped:
        print("\nâš ï¸  Skipped files:")
        for name, reason in skipped:
            print(f"   - {name}: {reason}")

    # Chunk documents
    print("\nðŸ“ Chunking documents...")
    chunks = chunking(documents)
    print(f"âœ… Created {len(chunks)} chunks")

    # Generate IDs
    print("\nðŸ”‘ Generating chunk IDs...")
    ids = [add_chunk_id(chunk) for chunk in chunks]
    print(f"âœ… Generated {len(ids)} unique IDs")

    # Initialize embeddings and vector store
    print("\nðŸ”„ Creating embeddings and vector store...")
    print("   (This may take a few minutes depending on the number of chunks)")

    settings = get_settings()
    provider = (settings.embeddings_provider or "auto").lower()
    if provider == "auto":
        provider = "openai" if settings.openai_api_key else "local"

    if provider == "openai":
        if not settings.openai_api_key:
            print("❌ Error: OPENAI_API_KEY is required for embeddings")
            return
        embed = OpenAIEmbeddings(model="text-embedding-3-small")
    elif provider == "local":
        if HuggingFaceEmbeddings is None:
            print("❌ Error: sentence-transformers is not installed")
            return
        embed = HuggingFaceEmbeddings(model_name=settings.embeddings_model)
    else:
        print(f"❌ Error: Unsupported embeddings provider: {provider}")
        return
    vectorstore = Chroma(
        collection_name="UI_Policies",
        embedding_function=embed,
        persist_directory=persist_dir,
    )

    # Add documents in batches to avoid rate limits
    batch_size = 100
    for i in range(0, len(chunks), batch_size):
        batch_chunks = chunks[i : i + batch_size]
        batch_ids = ids[i : i + batch_size]
        vectorstore.add_documents(documents=batch_chunks, ids=batch_ids)
        print(f"   Processed {min(i + batch_size, len(chunks))}/{len(chunks)} chunks...")

    vec_count = vectorstore._collection.count()

    print("\nâœ… SUCCESS!")
    print(f"   - {len(chunks)} chunks added to Chroma")
    print(f"   - {vec_count} vectors created")
    print(f"   - Vector store saved to: {persist_dir}")
    print("\n" + "=" * 70)
    print("You can now run the API server!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    # Check for OpenAI API key
    if not os.getenv("OPENAI_API_KEY"):
        print("âŒ Error: OPENAI_API_KEY not found in environment variables!")
        print("Please set it in your .env file")
    else:
        build_vector_store()
