import hashlib
import os
from pathlib import Path
from time import perf_counter

import fitz
try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional in some deploy environments
    def load_dotenv(*_args, **_kwargs):
        return False
from langchain_chroma import Chroma
try:
    from langchain_community.embeddings import HuggingFaceEmbeddings
except ImportError:  # pragma: no cover - optional dependency
    HuggingFaceEmbeddings = None
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

try:
    import pytesseract
except ImportError:  # pragma: no cover - optional dependency
    pytesseract = None

try:
    from PIL import Image
except ImportError:  # pragma: no cover - optional dependency
    Image = None

try:
    from .settings import get_settings
except ImportError:
    from settings import get_settings

load_dotenv()


def _as_bool(value: str) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


MAX_MB = int(os.getenv("INDEX_MAX_MB", "350"))
CHUNK_SIZE = int(os.getenv("INDEX_CHUNK_SIZE", "1200"))
CHUNK_OVERLAP = int(os.getenv("INDEX_CHUNK_OVERLAP", "120"))
BATCH_SIZE = int(os.getenv("INDEX_BATCH_SIZE", "120"))
MIN_CHARS = int(os.getenv("INDEX_MIN_CHARS", "20"))
OCR_ENABLED = _as_bool(os.getenv("INDEX_OCR_ENABLED", "false"))
OCR_LANG = os.getenv("INDEX_OCR_LANG", "eng")
OCR_DPI = int(os.getenv("INDEX_OCR_DPI", "180"))
PERSIST_DIR = str(Path(__file__).resolve().parent / "chroma_db")


def _extract_text_with_optional_ocr(page):
    text = page.get_text("text").strip()
    if text:
        return text, False

    if not OCR_ENABLED:
        return "", False

    if pytesseract is None or Image is None:
        return "", False

    pix = page.get_pixmap(dpi=OCR_DPI, alpha=False)
    image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    ocr_text = pytesseract.image_to_string(image, lang=OCR_LANG).strip()
    return ocr_text, bool(ocr_text)


def load_pdf_with_metadata(
    file_path: str,
    document_name: str,
    institution: str = "University of Ibadan",
):
    """Load PDF pages and apply OCR fallback for empty text pages."""
    documents = []
    stats = {
        "pages_total": 0,
        "pages_text": 0,
        "pages_ocr": 0,
        "pages_empty": 0,
        "pages_short": 0,
    }

    doc = fitz.open(file_path)
    pdf_meta = doc.metadata or {}
    total_pages = doc.page_count

    for page_index in range(total_pages):
        page = doc.load_page(page_index)
        stats["pages_total"] += 1

        text, from_ocr = _extract_text_with_optional_ocr(page)
        if not text:
            stats["pages_empty"] += 1
            continue

        if len(text) < MIN_CHARS:
            stats["pages_short"] += 1
            continue

        if from_ocr:
            stats["pages_ocr"] += 1
        else:
            stats["pages_text"] += 1

        metadata = {
            "document_name": document_name,
            "institution": institution,
            "page": page_index,
            "page_no": page_index + 1,
            "source_file": str(file_path),
            "file_path": str(file_path),
            "source": str(file_path),
            "total_pages": total_pages,
            "author": pdf_meta.get("author", ""),
            "title": pdf_meta.get("title", ""),
            "subject": pdf_meta.get("subject", ""),
            "creator": pdf_meta.get("creator", ""),
            "producer": pdf_meta.get("producer", ""),
            "creationDate": pdf_meta.get("creationDate", ""),
            "modDate": pdf_meta.get("modDate", ""),
            "keywords": pdf_meta.get("keywords", ""),
            "format": pdf_meta.get("format", ""),
            "trapped": pdf_meta.get("trapped", ""),
            "ocr_used": from_ocr,
        }
        documents.append(Document(page_content=text, metadata=metadata))

    doc.close()
    return documents, stats


def chunking(documents):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_documents(documents=documents)


def add_chunk_id(chunk):
    key = (
        f"{chunk.metadata.get('document_name')}|"
        f"{chunk.metadata.get('page_no')}|"
        f"{chunk.page_content}"
    )
    return hashlib.sha1(key.encode("utf-8")).hexdigest()


def _init_embeddings():
    settings = get_settings()
    provider = (settings.embeddings_provider or "auto").lower()
    if provider == "auto":
        provider = "openai" if settings.openai_api_key else "local"

    if provider == "openai":
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is required for openai embeddings")
        return OpenAIEmbeddings(model="text-embedding-3-small"), provider

    if provider == "local":
        if HuggingFaceEmbeddings is None:
            raise RuntimeError("sentence-transformers is not installed")
        return HuggingFaceEmbeddings(model_name=settings.embeddings_model), provider

    raise RuntimeError(f"Unsupported embeddings provider: {provider}")


def build_vector_store():
    print("\n" + "=" * 70)
    print("UI Guide - Building Vector Store")
    print("=" * 70 + "\n")

    settings = get_settings()
    doc_dir = Path(settings.docs_dir)
    if not doc_dir.exists():
        print(f"ERROR: Directory '{doc_dir}' does not exist.")
        return

    pdfs = sorted(doc_dir.glob("*.pdf"))
    if not pdfs:
        print(f"ERROR: No PDF files found in '{doc_dir}'.")
        return

    print(f"Found {len(pdfs)} PDF file(s) in '{doc_dir}'")
    print(
        "Index config:"
        f" chunk={CHUNK_SIZE}/{CHUNK_OVERLAP}, batch={BATCH_SIZE}, min_chars={MIN_CHARS},"
        f" ocr_enabled={OCR_ENABLED}"
    )
    if OCR_ENABLED:
        print(f"OCR config: lang={OCR_LANG}, dpi={OCR_DPI}")
    print("")

    documents = []
    skipped = []
    totals = {
        "pages_total": 0,
        "pages_text": 0,
        "pages_ocr": 0,
        "pages_empty": 0,
        "pages_short": 0,
    }

    extract_start = perf_counter()

    for index, pdf in enumerate(pdfs, 1):
        size_mb = pdf.stat().st_size / (1024 * 1024)
        print(f"[{index}/{len(pdfs)}] Loading: {pdf.name} ({size_mb:.1f} MB)...", flush=True)

        if size_mb > MAX_MB:
            skipped.append((pdf.name, f"Too large ({size_mb:.1f} MB)"))
            print("   SKIP (too large)")
            continue

        doc_start = perf_counter()
        try:
            pages, stats = load_pdf_with_metadata(str(pdf), pdf.name)
            documents.extend(pages)
            for key in totals:
                totals[key] += stats[key]
            elapsed = perf_counter() - doc_start
            print(
                "   Loaded:"
                f" kept={len(pages)}, text={stats['pages_text']}, ocr={stats['pages_ocr']},"
                f" empty={stats['pages_empty']}, short={stats['pages_short']},"
                f" time={elapsed:.1f}s"
            )
        except Exception as exc:
            skipped.append((pdf.name, str(exc)))
            print(f"   SKIP: {exc}")

    if not documents:
        print("\nERROR: No pages with usable text were loaded.")
        return

    extract_elapsed = perf_counter() - extract_start
    print("")
    print("Extraction summary:")
    print(f"  pages_total={totals['pages_total']}")
    print(f"  pages_kept={len(documents)}")
    print(f"  pages_text={totals['pages_text']}")
    print(f"  pages_ocr={totals['pages_ocr']}")
    print(f"  pages_empty={totals['pages_empty']}")
    print(f"  pages_short={totals['pages_short']}")
    print(f"  extraction_time={extract_elapsed:.1f}s")

    if skipped:
        print("\nSkipped files:")
        for name, reason in skipped:
            print(f"  - {name}: {reason}")

    print("\nChunking documents...")
    chunk_start = perf_counter()
    chunks = chunking(documents)
    chunk_elapsed = perf_counter() - chunk_start
    print(f"Created {len(chunks)} chunks in {chunk_elapsed:.1f}s")

    print("\nGenerating chunk IDs...")
    ids = [add_chunk_id(chunk) for chunk in chunks]
    print(f"Generated {len(ids)} IDs")

    print("\nCreating embeddings and vector store...")
    print("This can take a few minutes for large collections.")

    embed, provider = _init_embeddings()
    print(f"Embeddings provider: {provider}")
    vectorstore = Chroma(
        collection_name="UI_Policies",
        embedding_function=embed,
        persist_directory=PERSIST_DIR,
    )

    ingest_start = perf_counter()
    for start in range(0, len(chunks), BATCH_SIZE):
        batch_chunks = chunks[start : start + BATCH_SIZE]
        batch_ids = ids[start : start + BATCH_SIZE]
        vectorstore.add_documents(documents=batch_chunks, ids=batch_ids)
        done = min(start + BATCH_SIZE, len(chunks))
        print(f"  Processed {done}/{len(chunks)} chunks...")
    ingest_elapsed = perf_counter() - ingest_start

    vec_count = vectorstore._collection.count()
    print("\nSUCCESS")
    print(f"  chunks_added={len(chunks)}")
    print(f"  vectors_in_collection={vec_count}")
    print(f"  vector_store={PERSIST_DIR}")
    print(f"  ingest_time={ingest_elapsed:.1f}s")
    print("\n" + "=" * 70)
    print("Index build complete.")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    build_vector_store()
