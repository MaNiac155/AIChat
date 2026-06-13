from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: str = Field(default="default", min_length=1, max_length=128)
    history: list[ChatMessage] = Field(default_factory=list, max_length=40)
    visual_context: str | None = Field(default=None, max_length=4000)


class ChatResponse(BaseModel):
    reply: str
    emotion: str = "happy"
    action: str = "talking"
    session_id: str
    memory_turns: int
    mock_mode: bool


class ClearMemoryResponse(BaseModel):
    status: Literal["ok"] = "ok"
    session_id: str
