"""Async OpenAI client that mirrors the local LLM helper interface.

The module inspects incoming chat prompts and chooses between a fast and a
larger OpenAI model before issuing the completion request.
"""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

from openai import AsyncOpenAI

from .config import settings

Message = Dict[str, Any]

# Terms that usually hint at reasoning-heavy or multi-step answers.
_COMPLEXITY_KEYWORDS = {
    "analyze",
    "analysis",
    "compare",
    "design",
    "explain",
    "investigate",
    "plan",
    "research",
    "step-by-step",
    "strategy",
    "summarize",
}

_client: Optional[AsyncOpenAI] = None


def _ensure_client() -> AsyncOpenAI:
    """Initialise the OpenAI client lazily."""
    global _client
    if not settings.OPENAI_API_KEY:
        raise RuntimeError("OpenAI API key missing; set OPEN_AI_KEY in the backend environment.")
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)
    return _client


def _normalize_messages(messages: Iterable[Message]) -> List[Message]:
    """Copy message payloads into concrete dicts so they can be reused."""
    normalised: List[Message] = []
    for message in messages:
        role = message.get("role")
        content = message.get("content")
        normalised.append({"role": role, "content": content})
    return normalised


def _score_complexity(messages: Sequence[Message]) -> float:
    """Estimate how demanding the prompt is to drive model selection."""
    total_chars = 0
    question_marks = 0
    keyword_hits = 0

    for message in messages:
        content = message.get("content")
        if content is None: continue
        if isinstance(content, str): text = content
        else: text = str(content)
        total_chars += len(text)
        question_marks += text.count("?")

        lowered = text.lower()
        if any(keyword in lowered for keyword in _COMPLEXITY_KEYWORDS): keyword_hits += 1

    score = (
        total_chars * settings.OPENAI_COMPLEXITY_LENGTH_WEIGHT
        + question_marks * settings.OPENAI_COMPLEXITY_QUESTION_WEIGHT
        + keyword_hits * settings.OPENAI_COMPLEXITY_KEYWORD_BONUS
    )
    return score


def _choose_model(messages: Sequence[Message]) -> Tuple[str, float]:
    """Return the appropriate model name based on the prompt score."""
    score = _score_complexity(messages)
    if score >= settings.OPENAI_COMPLEXITY_THRESHOLD:
        return settings.OPENAI_COMPLEX_MODEL, score
    return settings.OPENAI_SIMPLE_MODEL, score


async def chat_completion(
    messages: Iterable[Message],
    temperature: float = 0.2,
    max_tokens: Optional[int] = None,
) -> str:
    """Request a chat completion from OpenAI after picking an appropriate model."""
    prepared = _normalize_messages(messages)
    model_name, _ = _choose_model(prepared)
    client = _ensure_client()

    completion = await client.chat.completions.create(
        model=model_name,
        messages=prepared,
        temperature=temperature,
        max_tokens=max_tokens or settings.LLM_MAX_TOKENS,
    )
    # Fall back to empty string when OpenAI does not return any text.
    return completion.choices[0].message.content or ""


__all__ = ["chat_completion"]
