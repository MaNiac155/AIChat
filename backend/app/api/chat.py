from fastapi import APIRouter, HTTPException

from app.schemas.chat import ChatRequest, ChatResponse, ClearMemoryResponse
from app.services.chat_service import chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def create_chat_response(request: ChatRequest) -> ChatResponse:
    try:
        return await chat_service.chat(request)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error


@router.delete(
    "/sessions/{session_id}",
    response_model=ClearMemoryResponse,
)
async def clear_chat_memory(session_id: str) -> ClearMemoryResponse:
    await chat_service.clear_memory(session_id)
    return ClearMemoryResponse(session_id=session_id)
