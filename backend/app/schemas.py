from pydantic import BaseModel
from typing import List, Literal, Optional

class ChatMessage(BaseModel):
    role: Literal["system","user","assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    tools: Optional[list] = None

class ScheduleRequest(BaseModel):
    title: str
    start_iso: str
    end_iso: str
    description: Optional[str] = None
