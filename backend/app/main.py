from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .llm_client import chat_completion
from .schemas import ChatRequest, ScheduleRequest
from . import calendar_tool

app = FastAPI(title="Pi Assistant API")

origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT = (
    "You are a concise personal assistant. "
    "If the user asks about schedule/calendar, say what you will do, then rely on tool results."
)

@app.post("/chat")
async def chat(req: ChatRequest):
    # Minimal example: prepend system prompt, pass to LLM
    messages = [{"role":"system","content":SYSTEM_PROMPT}] + [m.dict() for m in req.messages]
    out = await chat_completion(messages)
    return {"reply": out}

@app.get("/calendar/upcoming")
def upcoming(days: int = 7):
    return {"text": calendar_tool.list_events(days)}

@app.post("/calendar/create")
def create(ev: ScheduleRequest):
    link = calendar_tool.create_event(ev.title, ev.start_iso, ev.end_iso, ev.description)
    return {"status":"ok", "link": link}
