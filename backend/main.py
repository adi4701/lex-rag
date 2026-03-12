from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.routers import api_query, documents

app = FastAPI(title="LexRAG API")

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
