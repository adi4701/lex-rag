from supabase import create_client, Client
from config import settings
import chromadb
from chromadb.config import Settings as ChromaSettings
import os

# Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY) if settings.SUPABASE_URL else None

# ChromaDB client lazy initialization
_chroma_client = None
_chroma_collection = None

def get_chroma_collection():
    global _chroma_client, _chroma_collection
    if _chroma_collection is None:
        os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        _chroma_collection = _chroma_client.get_or_create_collection(name="lexrag_chunks")
    return _chroma_collection
