from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks, HTTPException
from auth import get_current_user
from database import supabase, get_chroma_collection
from services.parser import extract_text
from services.chunker import get_text_chunks
from services.embeddings import embed_text
from datetime import datetime
import hashlib
import uuid

router = APIRouter()

async def ingest_document(doc_id: str, tenant_id: str):
    if not supabase: return
    try:
        # 1. Fetch doc record
        doc = supabase.table("documents").select("*").eq("id", doc_id).single().execute()
        
        # 2. Download file
        file_bytes = supabase.storage.from_("legal-documents").download(doc.data["file_path"])
        
        # 3. Extract text
        pages = extract_text(file_bytes, doc.data["filename"])
            
        full_text = "\n".join([text for _, text in pages])
        
        # 4. Chunk text
        text_chunks = get_text_chunks(full_text)
        
        # 5. Embed and store
        chunk_records = []
        for i, chunk_text in enumerate(text_chunks):
            chunk_uuid = hashlib.sha256((chunk_text + doc_id).encode()).hexdigest()[:32]
            embedding = embed_text(chunk_text)
            
            page_num = 1
            for pg_num, pg_text in pages:
                if chunk_text[:50] in pg_text:
                    page_num = pg_num
                    break
                    
            metadata = {
                "doc_id": doc_id,
                "tenant_id": tenant_id,
                "upload_timestamp": datetime.utcnow().isoformat(),
                "document_type": doc.data["document_type"],
                "chunk_uuid": chunk_uuid,
                "page_number": page_num,
                "chunk_index": i,
                "filename": doc.data["filename"]
            }
            
            get_chroma_collection().upsert(
                ids=[chunk_uuid],
                embeddings=[embedding],
                documents=[chunk_text],
                metadatas=[metadata]
            )
            
            chunk_records.append({
                "doc_id": doc_id,
                "chunk_uuid": chunk_uuid,
                "chunk_index": i,
                "page_number": page_num,
                "token_count": len(chunk_text.split())
            })
            
        # 6. Insert chunk records
        supabase.table("document_chunks").insert(chunk_records).execute()
        
        # 7. Update status
        supabase.table("documents").update({
            "status": "ready",
            "chunk_count": len(text_chunks),
            "page_count": len(pages)
        }).eq("id", doc_id).execute()
        
    except Exception as e:
        print(f"Ingestion failed: {e}")
        supabase.table("documents").update({"status": "failed"}).eq("id", doc_id).execute()

@router.post("/api/documents/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    document_type: str = Form(...),
    user: dict = Depends(get_current_user)
):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
        
    doc_id = str(uuid.uuid4())
    file_path = f"{user['tenant_id']}/{doc_id}/{file.filename}"
    
    file_bytes = await file.read()
    
    # Upload to storage
    supabase.storage.from_("legal-documents").upload(file_path, file_bytes)
    
    # Insert record
    doc_record = {
        "id": doc_id,
        "tenant_id": user["tenant_id"],
        "uploaded_by": user["id"],
        "filename": file.filename,
        "document_type": document_type,
        "file_path": file_path,
        "file_size_bytes": len(file_bytes),
        "status": "processing"
    }
    supabase.table("documents").insert(doc_record).execute()
    
    background_tasks.add_task(ingest_document, doc_id, user["tenant_id"])
    
    return {"doc_id": doc_id, "status": "processing"}

@router.get("/api/documents")
async def list_documents(user: dict = Depends(get_current_user)):
    if not supabase: return []
    res = supabase.table("documents").select("*").eq("tenant_id", user["tenant_id"]).order("created_at", desc=True).execute()
    return res.data

@router.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
        
    if not supabase: return {"status": "ok"}
    
    doc = supabase.table("documents").select("*").eq("id", doc_id).eq("tenant_id", user["tenant_id"]).single().execute()
    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete from ChromaDB
    get_chroma_collection().delete(where={"doc_id": doc_id})
    
    # Delete from Storage
    supabase.storage.from_("legal-documents").remove([doc.data["file_path"]])
    
    # Delete from DB (cascade deletes chunks)
    supabase.table("documents").delete().eq("id", doc_id).execute()
    
    return {"status": "deleted"}
