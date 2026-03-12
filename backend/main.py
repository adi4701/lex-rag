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
    def warmup():
        try:
            get_chroma_collection()
            get_model()
        except Exception as e:
            print(f"Warmup failed: {e}")
    
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, warmup)

origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
# Ensure the Vercel deployment is always allowed
if "https://lex-rag-v1dk-adihhs-projects.vercel.app" not in origins:
    origins.append("https://lex-rag-v1dk-adihhs-projects.vercel.app")

if "*" in origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_query.router)
app.include_router(documents.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
