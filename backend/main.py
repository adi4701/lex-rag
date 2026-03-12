import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import api_query, documents
from database import get_chroma_collection
from services.embeddings import get_model

app = FastAPI(title="LexRAG API")

@app.on_event("startup")
async def startup_event():
    # Warm up models and DB in the background so it doesn't block port binding
    async def warmup():
        get_chroma_collection()
        get_model()
    
    asyncio.create_task(warmup())

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_query.router)
app.include_router(documents.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
