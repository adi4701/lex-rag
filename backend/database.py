from supabase import create_client, Client
from config import settings
import chromadb
import os

# Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY) if settings.SUPABASE_URL else None

# ChromaDB client
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
chroma_collection = chroma_client.get_or_create_collection(name="lexrag_chunks")
