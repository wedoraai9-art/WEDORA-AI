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
        self.model = "gemini-3.5-flash-lite"

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
        max_retries = 3
        retry_delays = [2, 4, 8]

        for attempt in range(max_retries):
            yielded_text = False

            try:
                stream = await self.client.aio.models.generate_content_stream(
                    model=self.model,
                    contents=message.text,
                    config={
                        "system_instruction": self.system_message or "",
                    },
                )

                async for chunk in stream:
                    if chunk.text:
                        yielded_text = True
                        yield TextDelta(chunk.text)

                yield StreamDone()
                return

            except Exception as e:
                error_text = str(e)

                is_retryable = (
                    "503" in error_text
                    or "UNAVAILABLE" in error_text
                    or "Service Unavailable" in error_text
                )

                if not is_retryable or yielded_text or attempt == max_retries - 1:
                    raise

                await asyncio.sleep(retry_delays[attempt])

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


# ---------- Budget Planner ----------
DEFAULT_SPLIT = [
    ("Venue", 0.22, "Halls, palace grounds, resort takeover, décor-inclusive"),
    ("Food & Catering", 0.22, "Per-plate multi-cuisine, live counters, bar service"),
    ("Décor & Florals", 0.15, "Mandap, stage, entrance, table florals, drapes"),
    ("Photography & Video", 0.10, "Candid, cinematic film, pre-wedding shoot"),
    ("Bridal & Groom Wear", 0.08, "Lehenga, sherwani, jewellery, accessories"),
    ("Makeup & Styling", 0.04, "HD makeup, hair, family styling touch-ups"),
    ("Entertainment", 0.05, "DJ, sangeet choreo, live band, dhol"),
    ("Invitations & Gifting", 0.03, "Digital + boxed invites, welcome hampers"),
    ("Transportation & Stay", 0.06, "Guest transfers, family stay, honeymoon start"),
    ("Miscellaneous", 0.05, "Buffer for last-minute magic ✿"),
]


@api_router.post("/budget/estimate", response_model=BudgetOut)
async def budget_estimate(payload: BudgetIn):
    total = float(payload.total_budget)

    categories = [
        BudgetCategory(
            name=name,
            percent=round(pct * 100, 1),
            amount=round(total * pct, 0),
            note=note,
        )
        for name, pct, note in DEFAULT_SPLIT
    ]

    per_head = round(
        total * 0.22 / max(payload.guest_count, 1),
        0,
    )

    return BudgetOut(
        total=total,
        guest_count=payload.guest_count,
        city=payload.city,
        functions=payload.functions,
        per_head=per_head,
        categories=categories,
    )


# ---------- WEDORA DESIGNER ----------
class DesignerIn(BaseModel):
    dream_description: str


@api_router.post("/designer/generate")
async def designer_generate(payload: DesignerIn):
    """
    Generate a custom wedding design from the user's description.
    Uses the same Gemini setup as the working WEDORA chat.
    """
    if not payload.dream_description.strip():
        raise HTTPException(status_code=400, detail="Please describe the wedding design.")

    session_id = f"designer-{uuid.uuid4()}"

    designer_system = """
You are WEDORA Designs It — a premium Indian wedding design intelligence.

Your job is to turn the client's exact design request into a CUSTOM wedding design.
Never return a generic default design. Every request must produce a fresh design based
on the client's colors, mood, style, culture, venue, season, or other details.

Return ONLY valid JSON with exactly these keys:
{
  "theme": "unique theme name",
  "palette": ["#HEX", "#HEX", "#HEX", "#HEX", "#HEX"],
  "mandap": "specific mandap design",
  "stage": "specific stage design",
  "entrance": "specific entrance design",
  "table_decor": "specific table decor design",
  "lighting": "specific lighting design",
  "florals": "specific floral design",
  "design_summary": "short summary of the complete design",
  "image_prompt": "detailed photorealistic prompt describing this exact wedding design"
}

IMPORTANT:
- Follow the client's request exactly.
- If the client says red and gold, the palette must be red/gold-led.
- Do not use the same pastel palette for every request.
- Create a different theme and design details for different requests.
- Use Indian wedding design knowledge when appropriate.
- The image_prompt must describe the same design you created.
"""

    prompt = f"""
Client's wedding design request:

{payload.dream_description}

Create the complete custom design now.
"""

    try:
        chat = LlmChat(
            api_key=GEMINI_API_KEY,
            session_id=session_id,
            system_message=designer_system,
        )

        raw = await chat.send_message(UserMessage(text=prompt))
        text = raw.strip()

        # Safely extract a JSON object even if the model adds code fences.
        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            raise ValueError("Gemini did not return a JSON design.")

        parsed = jsonlib.loads(match.group(0))

        required = [
            "theme", "palette", "mandap", "stage", "entrance",
            "table_decor", "lighting", "florals",
            "design_summary", "image_prompt"
        ]

        for key in required:
            if key not in parsed:
                raise ValueError(f"Missing design field: {key}")

        if not isinstance(parsed["palette"], list) or len(parsed["palette"]) < 3:
            raise ValueError("Invalid design palette.")

    except Exception as e:
        logging.exception("Designer AI failed")
        raise HTTPException(status_code=500, detail=f"Designer AI failed: {str(e)}")

    # Optional visual references. This does NOT control the AI design itself.
    hero_image = None
    reference_images = []

    if PEXELS_API_KEY:
        try:
            search_query = f"{parsed['theme']} Indian wedding {payload.dream_description}"

            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(
                    "https://api.pexels.com/v1/search",
                    headers={"Authorization": PEXELS_API_KEY},
                    params={
                        "query": search_query[:180],
                        "per_page": 6,
                        "orientation": "landscape",
                    },
                )
                response.raise_for_status()
                data = response.json()

                for photo in data.get("photos", []):
                    src = photo.get("src", {})
                    image_url = src.get("large2x") or src.get("large")
                    if image_url:
                        reference_images.append(image_url)

                if reference_images:
                    hero_image = reference_images[0]

        except Exception:
            logging.exception("Pexels reference search failed")
            # Design generation still succeeds if Pexels is unavailable.

    parsed["hero_image"] = hero_image
    parsed["reference_images"] = reference_images
    parsed["session_id"] = session_id

    return parsed


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

# ================= AUTH ROUTES =================

class AuthLoginIn(BaseModel):
    email: str
    password: str


@api_router.post("/auth/login")
async def auth_login(payload: AuthLoginIn):
    email = payload.email.strip().lower()

    user = await db.users.find_one({"email": email})

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        payload.password,
        user.get("password_hash", "")
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_token(
        user["id"],
        user.get("role", "couple")
    )

    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": email,
            "name": user.get("name"),
            "role": user.get("role", "couple")
        }
    }


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
