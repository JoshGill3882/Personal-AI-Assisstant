"""Async helper for issuing chat completion requests to Ollama."""

from typing import Any, Dict, Iterable, Optional

import httpx

from .config import settings

Message = Dict[str, Any]


async def chat_completion(
    messages: Iterable[Message],
    temperature: float = 0.2,
    max_tokens: Optional[int] = None,
) -> str:
    """Ask the local Ollama instance to generate a chat reply.

    Args:
        messages: OpenAI-style message payload already ordered for inference.
        temperature: Controls randomness; lower values keep responses focused.
        max_tokens: Optional override for the maximum number of tokens to predict.

    Returns:
        The assistant's reply text taken from the first choice in the response.
    """
    predict_tokens = max_tokens or settings.LLM_MAX_TOKENS
    payload = {
        "model": settings.MODEL_NAME,
        "messages": list(messages),
        "stream": False,
        "options": {"temperature": temperature, "num_predict": predict_tokens},
    }
    # Grant generous timeout so longer generations can complete when needed.
    async with httpx.AsyncClient(timeout=180) as client:
        response = await client.post(
            f"{settings.OLLAMA_ENDPOINT}/v1/chat/completions",
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
    return data["choices"][0]["message"]["content"]
