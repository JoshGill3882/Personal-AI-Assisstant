"""Pydantic models that define the public API contract."""

from typing import List, Literal, Optional

from pydantic import BaseModel


class ChatMessage(BaseModel):
    """Single conversational exchange formatted for the LLM."""

    role: Literal["system", "user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    """Payload accepted by the ``/chat`` endpoint."""

    messages: List[ChatMessage]
    # Reserved for future structured tool calls; currently unused.
    tools: Optional[list] = None


class ScheduleRequest(BaseModel):
    """Details required to create a calendar event."""

    title: str
    start_iso: str
    end_iso: str
    description: Optional[str] = None
