from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from auth import get_current_user
from routers.query import query_pipeline

router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    session_id: str
    doc_types: Optional[list[str]] = None

@router.post("/api/query")
async def handle_query(req: QueryRequest, user: dict = Depends(get_current_user)):
    return StreamingResponse(
        query_pipeline(req.query, req.session_id, user, req.doc_types),
        media_type="text/event-stream"
    )
