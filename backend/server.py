from fastapi import FastAPI, APIRouter, HTTPException, Request, UploadFile, File, Header, Query
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import re
import json as jsonlib
import secrets
import bcrypt
import jwt as pyjwt
import requests as http_requests
import httpx
from html import escape as html_escape
from html.parser import HTMLParser
from urllib.parse import urlparse
import ipaddress
import asyncio

from google import genai

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY")

class UserMessage:
    def __init__(self, text: str):
        self.text = text

class TextDelta:
    def __init__(self, content: str):
        self.content = content

class StreamDone:
    pass

class LlmChat:
    def __init__(self, api_key=None, session_id=None, system_message=None):
        raw_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""
        resolved_key = raw_key.strip().strip('"').strip("'")
        
        self.client = genai.Client(api_key=resolved_key)
        self.session_id = session_id
        self.system_message = system_message
        self.model = "gemini-2.5-flash"

    def with_model(self, provider, model):
        return self

    async def send_message(self, message):
        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=message.text,
            config={
                "system_instruction": self.system_message or "",
            },
        )
        return response.text or ""

    async def stream_message(self, message):
        stream = await self.client.aio.models.generate_content_stream(
            model=self.model,
            contents=message.text,
            config={
                "system_instruction": self.system_message or "",
            },
        )

        async for chunk in stream:
            if chunk.text:
                yield TextDelta(chunk.text)

        yield StreamDone()

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'wedora')]

WEDORA_SYSTEM_PROMPT = """You are WEDORA — a premium AI assistant with deep specialization in weddings (planning, design, budgeting, vendor & venue discovery, culture-specific ceremonies) and full general intelligence for everything else (writing, research, calculations, code, business, travel, food, creative)."""

app = FastAPI(title="WEDORA AI")
api_router = APIRouter(prefix="/api")

# ---------- Models ----------
class ChatMessageIn(BaseModel):
    session_id: Optional[str] = None
    message: str

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str  # 'user' | 'assistant'
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BudgetIn(BaseModel):
    total_budget: float
    guest_count: int
    city: str = "Jaipur"
    functions: int = 3

class BudgetCategory(BaseModel):
    name: str
    percent: float
    amount: float
    note: str

class BudgetOut(BaseModel):
    total: float
    guest_count: int
    city: str
    functions: int
    per_head: float
    categories: List[BudgetCategory]

# ---------- Chat (SSE streaming) ----------
@api_router.post("/chat/stream")
async def chat_stream(payload: ChatMessageIn):
    session_id = payload.session_id or str(uuid.uuid4())
    user_doc = ChatMessage(session_id=session_id, role="user", content=payload.message).model_dump()
    await db.chat_messages.insert_one(user_doc)

    history = await db.chat_messages.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("timestamp", 1).to_list(200)

    chat = LlmChat(
        session_id=session_id,
        system_message=WEDORA_SYSTEM_PROMPT,
    )

    prior = history[:-1] if history and history[-1]["role"] == "user" else history
    context_prefix = ""
    if len(prior) > 0:
        recent = prior[-8:]
        context_lines = [f"{'User' if m['role'] == 'user' else 'WEDORA'}: {m['content']}" for m in recent]
        context_prefix = "Prior conversation:\n" + "\n".join(context_lines) + "\n\nCurrent message:\n"

    final_user_text = context_prefix + payload.message

    async def event_generator():
        collected = []
        try:
            async for event in chat.stream_message(UserMessage(text=final_user_text)):
                if isinstance(event, TextDelta):
                    collected.append(event.content)
                    data = event.content.replace("\r", "").replace("\n", "\\n")
                    yield f"data: {data}\n\n"
                elif isinstance(event, StreamDone):
                    break
            full = "".join(collected)
            asst = ChatMessage(session_id=session_id, role="assistant", content=full).model_dump()
            await db.chat_messages.insert_one(asst)
            yield f"event: done\ndata: {session_id}\n\n"
        except Exception as e:
            logging.exception("chat stream failed")
            yield f"event: error\ndata: {str(e)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )

@api_router.post("/chat", response_model=dict)
async def chat_send(payload: ChatMessageIn):
    session_id = payload.session_id or str(uuid.uuid4())
    user_doc = ChatMessage(session_id=session_id, role="user", content=payload.message).model_dump()
    await db.chat_messages.insert_one(user_doc)

    history = await db.chat_messages.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("timestamp", 1).to_list(200)
    prior = history[:-1] if history and history[-1]["role"] == "user" else history

    context_prefix = ""
    if len(prior) > 0:
        recent = prior[-8:]
        lines = [f"{'User' if m['role']=='user' else 'WEDORA'}: {m['content']}" for m in recent]
        context_prefix = "Prior conversation:\n" + "\n".join(lines) + "\n\nCurrent message:\n"

    chat = LlmChat(
        session_id=session_id,
        system_message=WEDORA_SYSTEM_PROMPT,
    )

    try:
        reply = await chat.send_message(UserMessage(text=context_prefix + payload.message))
        reply_text = reply if isinstance(reply, str) else str(reply)
    except Exception as e:
        logging.exception("chat failed")
        raise HTTPException(status_code=500, detail=str(e))

    asst = ChatMessage(session_id=session_id, role="assistant", content=reply_text).model_dump()
    await db.chat_messages.insert_one(asst)

    return {"session_id": session_id, "reply": reply_text}

@api_router.get("/chat/history/{session_id}")
async def chat_history(session_id: str):
    msgs = await db.chat_messages.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("timestamp", 1).to_list(500)
    return {"session_id": session_id, "messages": msgs}

# ================= AUTH =================
JWT_SECRET = os.environ.get("JWT_SECRET", "super-secret-key")
JWT_ALG = "HS256"
TOKEN_TTL_DAYS = 7

def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def create_token(user_id: str, role: str) -> str:
    return pyjwt.encode(
        {"sub": user_id, "role": role, "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_TTL_DAYS)},
        JWT_SECRET, algorithm=JWT_ALG,
    )

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization[7:]
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Other chat & auth routes here...

# ================= VENUES & VENDORS =================
@api_router.get("/venues")
async def get_venues():
    return [
        {"id": "1", "name": "The Oberoi Rajvilas", "city": "Jaipur", "capacity": "500"},
        {"id": "2", "name": "Rambagh Palace", "city": "Jaipur", "capacity": "800"}
    ]

@api_router.get("/vendors")
async def get_vendors():
    return [
        {"id": "1", "name": "Royal Photography", "category": "Photography"},
        {"id": "2", "name": "Shaadi Caterers", "category": "Catering"}
    ]

# ================= HEALTH =================
@api_router.get("/")
async def root():
    return {"service": "WEDORA AI", "status": "ok"}

# REGISTER THE ROUTER HERE (Must be after all api_router definitions)
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
