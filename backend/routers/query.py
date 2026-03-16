import json
import time
import re
import groq
from collections import deque
from config import settings
from database import get_chroma_collection, supabase
from cache import query_cache, get_cache_key
from services.embeddings import embed_text

SYSTEM_PROMPT = """You are LexRAG, a precise corporate legal document
analysis assistant.

STRICT RULES:
1. Answer ONLY using the provided context blocks below. Do not use any
   outside knowledge.
2. After EVERY factual claim, append a citation in this exact format:
   [SOURCE: {chunk_uuid}]
3. If no retrieved chunk supports a claim, respond with exactly:
   "Insufficient documentary evidence in the provided context."
4. Never speculate, extrapolate, or infer beyond what the context states.
5. If document version or amendment date is ambiguous in the context,
   say so explicitly.

Context blocks:
{context}

Chat history:
{chat_history}
"""

# session_id -> deque(maxlen=10)
session_memory: dict[str, deque] = {}

def get_session_history(session_id: str) -> list[dict]:
    if session_id not in session_memory:
        session_memory[session_id] = deque(maxlen=10)
    return list(session_memory[session_id])

def update_session_memory(session_id: str, query: str, response: str):
    if session_id not in session_memory:
        session_memory[session_id] = deque(maxlen=10)
    session_memory[session_id].append({"role": "user", "content": query})
    session_memory[session_id].append({"role": "assistant", "content": response})

def save_to_audit_log(session_id, user, query, response, retrieved, valid, invalid, latency):
    if not supabase: return
    try:
        supabase.table("audit_log").insert({
            "session_id": session_id,
            "user_id": user["id"],
            "tenant_id": user["tenant_id"],
            "query_text": query,
            "response_text": response,
            "retrieved_chunk_ids": retrieved,
            "valid_citations": valid,
            "unverified_citations": invalid,
            "cache_hit": False,
            "latency_ms": latency,
            "hallucination_flagged": len(invalid) > 0
        }).execute()
    except Exception as e:
        print(f"Failed to save audit log: {e}")

def format_sse(event_type: str, data: dict) -> str:
    data["type"] = event_type
    return f"data: {json.dumps(data)}\n\n"

async def query_pipeline(query: str, session_id: str, user: dict, doc_types: list[str] = None):
    start = time.time()

    # Step 1: Check cache
    cache_key = get_cache_key(query, user["tenant_id"])
    if cache_key in query_cache:
        cached = query_cache[cache_key]
        yield format_sse("cache_hit", {"content": cached})
        yield format_sse("done", {"latency_ms": 10, "cache_hit": True})
        return

    # Step 2: Build embedding
    import asyncio
    loop = asyncio.get_event_loop()
    embedding = await loop.run_in_executor(None, embed_text, query)

    # Step 3: ChromaDB pre-filtered search
    permitted_types = doc_types or user.get("permitted_doc_types", [])
    
    where_clause = {"tenant_id": {"$eq": user["tenant_id"]}}
    if permitted_types:
        where_clause = {
            "$and": [
                {"tenant_id": {"$eq": user["tenant_id"]}},
                {"document_type": {"$in": permitted_types}}
            ]
        }

    def run_chroma_query():
        return get_chroma_collection().query(
            query_embeddings=[embedding],
            n_results=5,
            where=where_clause,
            include=["documents", "metadatas", "distances"]
        )
    
    results = await loop.run_in_executor(None, run_chroma_query)

    # Step 4: Filter by similarity threshold (distance <= 0.65)
    chunks = []
    if results["documents"] and len(results["documents"]) > 0:
        for doc, meta, dist in zip(results["documents"][0], results["metadatas"][0], results["distances"][0]):
            if dist <= 0.65:
                chunks.append({"text": doc, "metadata": meta, "distance": dist})

    if not chunks:
        msg = "Insufficient documentary evidence in the provided context."
        yield format_sse("token", {"content": msg})
        yield format_sse("done", {"latency_ms": int((time.time()-start)*1000)})
        return

    # Step 5: Format context
    context = "\n\n".join([
        f"--- [DOC: {c['metadata']['doc_id']}] "
        f"[UUID: {c['metadata']['chunk_uuid']}] "
        f"[FILE: {c['metadata']['filename']}] "
        f"[PAGE: {c['metadata']['page_number']}] ---\n{c['text']}"
        for c in chunks
    ])

    # Step 6: Build conversation history
    history = get_session_history(session_id)
    history_str = "\n".join([
        f"{'User' if m['role']=='user' else 'Assistant'}: {m['content']}"
        for m in history
    ])

    # Step 7: Build prompt
    prompt = SYSTEM_PROMPT.format(context=context, chat_history=history_str)

    # Step 8: Stream from Groq
    client = groq.AsyncGroq(api_key=settings.GROQ_API_KEY)
    stream = await client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": query}
        ],
        temperature=0,
        max_tokens=1024,
        stream=True
    )

    full_response = ""
    async for chunk_delta in stream:
        token = chunk_delta.choices[0].delta.content or ""
        full_response += token
        yield format_sse("token", {"content": token})

    # Step 9: Citation validation
    cited_uuids = re.findall(r'\[SOURCE:\s*([a-f0-9]+)\]', full_response)
    valid_uuids = {c["metadata"]["chunk_uuid"] for c in chunks}
    invalid = [u for u in cited_uuids if u not in valid_uuids]

    for u in invalid:
        full_response = full_response.replace(f"[SOURCE: {u}]", "[UNVERIFIED ⚠️]")
        yield format_sse("correction", {"original": f"[SOURCE: {u}]", "replacement": "[UNVERIFIED ⚠️]"})

    # Step 10: Cache result
    query_cache[cache_key] = full_response

    # Step 11: Save to Supabase
    latency = int((time.time() - start) * 1000)
    await loop.run_in_executor(None, lambda: save_to_audit_log(
        session_id, user, query, full_response,
        [c["metadata"]["chunk_uuid"] for c in chunks],
        [u for u in cited_uuids if u in valid_uuids],
        invalid, latency
    ))
    update_session_memory(session_id, query, full_response)

    # Step 12: Done event
    yield format_sse("done", {
        "latency_ms": latency,
        "cache_hit": False,
        "retrieved_count": len(chunks),
        "unverified_count": len(invalid),
        "distances": [c["distance"] for c in chunks]
    })
