import httpx
from .config import settings

async def chat_completion(messages, temperature=0.2, max_tokens=512):
    """
    messages: list like [{"role":"system"|"user"|"assistant", "content":"..."}]
    """
    payload = {
        "model": settings.MODEL_NAME,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens
        }
    }
    async with httpx.AsyncClient(timeout=180) as client:
        r = await client.post(f"{settings.OLLAMA_ENDPOINT}/v1/chat/completions", json=payload)
        r.raise_for_status()
        data = r.json()
    return data["choices"][0]["message"]["content"]
