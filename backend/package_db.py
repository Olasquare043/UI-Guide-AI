import os
import tarfile
from pathlib import Path

def package_chroma_db():
    """Package the chroma_db folder into a compressed archive"""
    
    chroma_dir = Path("./chroma_db")
    output_file = "chroma_db.tar.gz"
    
    if not chroma_dir.exists():
        print("❌ Error: chroma_db folder not found!")
        print("Please run 'python build_index.py' first to create the vector store.")
        return
    
    print("\n" + "="*70)
    print("Packaging Vector Database for Deployment")
    print("="*70 + "\n")
    
    print(f"📦 Compressing {chroma_dir} to {output_file}...")
    
    with tarfile.open(output_file, "w:gz") as tar:
        tar.add(chroma_dir, arcname="chroma_db")
    
    # Get file size
    size_mb = Path(output_file).stat().st_size / (1024 * 1024)
    
    print(f"✅ Success!")
    print(f"   - Output file: {output_file}")
    print(f"   - Size: {size_mb:.2f} MB")
    print("\n" + "="*70)
    print("Next Steps:")
    print("="*70)
    print("\n1. Upload this file to a cloud storage service:")
    print("   - GitHub Releases (if < 2GB)")
    print("\n2. Get a direct download URL for the file")
    print("\n3. Set CHROMA_DB_URL environment variable in Render:")
    print("   CHROMA_DB_URL=https://your-storage-url/chroma_db.tar.gz")
    print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    package_chroma_db()