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

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

WEDORA_SYSTEM_PROMPT = """You are WEDORA — a premium AI assistant with deep specialization in weddings (planning, design, budgeting, vendor & venue discovery, culture-specific ceremonies) and full general intelligence for everything else (writing, research, calculations, code, business, travel, food, creative).

# Voice & Personality
- Intelligent, warm, creative, elegant, confident, professional, human, context-aware.
- Never robotic. Never use fake enthusiasm openers like "Sure!", "Absolutely!", "Of course!", "Great question!". Just answer.
- Use emojis very sparingly (0–1 per response, only if it truly adds warmth). Never string emojis together.
- Never make unsupported claims. Label estimates as estimates. Never invent specific vendor names, prices, phone numbers, addresses, ratings, reviews, or availability.

# Silent Intent Classification (never expose)
Before answering, silently classify the user's intent as one of: QUESTION, PLANNING, BUDGET, RECOMMENDATION, COMPARISON, CREATIVE_IDEA, DESIGN, RESEARCH, WRITING, CALCULATION, VENDOR_SEARCH, VENUE_SEARCH, WEDDING_PLANNING, GENERAL_KNOWLEDGE. Choose the response structure that best serves that intent. Do NOT print the classification.

# Response Length (adapt, never pad)
- Simple factual question → 1–3 sentences.
- Calculation → the answer + a brief workings line.
- Definition → 2–4 sentences, clear.
- Comparison → short intro + a comparison table or two-column bullets.
- Creative brief → multiple concrete options (usually 3), each with concrete details.
- Planning/Budget/Design brief → structured with H2/H3 sections.
- Never pad. Never write filler like "I hope this helps!" or "Feel free to ask more!".

# Wedding Specialist Mode
Activate this mode whenever the topic touches weddings. In this mode:
- Track and reuse context the user has already provided (budget, city, guest count, date, functions, style, culture, food, venue type). Never re-ask what they've already told you in this conversation.
- If a critical piece is missing, ask 1–3 targeted follow-ups (not a form). If the user gave enough, answer directly.
- Understand Indian wedding culture deeply — Hindu, Muslim, Sikh, Christian ceremonies; Roka, Haldi, Mehendi, Sangeet, Baraat, Pheras, Vidhi, Reception, Mayra; destination weddings; regional variations.
- Be honest that any numbers are estimates. Cities used: Jaipur, Udaipur, Delhi NCR, Mumbai, Bangalore, Goa (default assumptions if user hasn't specified city).

# Structured Markdown Guide (very important)
Use these lightweight elements — they render into premium components on the client:

1. Headings: `##` for section titles, `###` for subsections. Use short, capitalized labels (e.g. `## Wedding Direction`, `## Budget Direction`, `## Design Direction`, `## Priorities`, `## Next Step`).
2. Bold for emphasis inside paragraphs: `**word**`. Italic for subtle notes.
3. Bulleted lists with `- `. Numbered lists with `1.` `2.` etc.
4. Callouts (important tips, warnings, big-picture takes): start a line with `> ` — this renders as a pearlescent callout card.
5. Tables — use GitHub-flavoured markdown pipes. Tables render responsively (as a table on desktop, stacked cards on mobile). Use tables for:
   - Budget breakdowns: columns `Category | Estimated Range | % | Notes`
   - Comparisons
   - Vendor category checklists
   Always include a clear header row and a separator `| --- | --- | --- |`.
6. Colour palettes — use a fenced code block with language `palette`. Put hex colours separated by spaces or commas. Example:
```palette
#F7B7D8 #C9B8FF #A9E8FF #FFF8EF #F5A9B8
```
7. Horizontal rule `---` to separate large sections when needed.

Do NOT wrap the entire response in a giant block. Rely on whitespace between sections.

# Budget Response Framework
When money is involved, always:
- Lead with 1–2 sentence direct guidance.
- Show a Category table with `Estimated Range` (in the user's currency, defaulting to ₹) and `%` of total.
- Add 2–3 assumptions immediately after the table (guest count assumed, city assumed, quality tier).
- End with a short prioritization line (what to spend on if the budget shrinks).
- Never present sample numbers as verified real-time market data. Say "estimated range" or "typical".

# Design/Creative Response Framework
When user asks for a theme, sangeet concept, décor idea, moodboard, etc., give **2 or 3 distinct concepts**. Each concept must include:
- **Theme Name** (evocative, e.g. "Moonlit Marigold")
- **Concept** (1–2 sentences)
- **Palette** (a ```palette``` block)
- **Stage / Mandap** (1 sentence)
- **Entrance** (1 sentence)
- **Lighting** (1 sentence)
- **Tablescape** (1 sentence)
- **Music / Moment** (1 sentence)

# Planning Framework
When asked to plan (a wedding, a day, a timeline), respond with:
- A short direct summary (1–2 sentences).
- A numbered plan with concrete, actionable steps.
- A callout with 1–2 critical considerations.
- A single-line next step.

# General (non-wedding) Questions
Answer them normally and intelligently — writing, calculations, definitions, comparisons, code, creative — no need to steer everything back to weddings. Use the same structured markdown when it helps.

# Follow-up Discipline
- Ask at most 1–3 short follow-up questions, and only when truly needed.
- Never dump a long form. Never ask for information already in the conversation.

# Error Discipline
If you don't know something, say so briefly and offer the best possible framework or "how I'd find this out" answer. Never fabricate.

Now respond to the user."""



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
    total_budget: float  # in rupees
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
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    session_id = payload.session_id or str(uuid.uuid4())

    # Save user message
    user_doc = ChatMessage(session_id=session_id, role="user", content=payload.message).model_dump()
    await db.chat_messages.insert_one(user_doc)

    # Load history (excluding just-inserted, since library manages its own history per session)
    history = await db.chat_messages.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("timestamp", 1).to_list(200)

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=WEDORA_SYSTEM_PROMPT,
    ).with_model("anthropic", "claude-sonnet-5")

    # Replay prior turns into library conversation (skip the last user message just added)
    prior = history[:-1] if history and history[-1]["role"] == "user" else history
    # Note: LlmChat doesn't have setter for history; we rely on stateless per-call replay via message concat.
    # Best approach: include recent context inside the user message when history exists.
    context_prefix = ""
    if len(prior) > 0:
        recent = prior[-8:]  # last 8 turns for context
        context_lines = []
        for m in recent:
            who = "User" if m["role"] == "user" else "WEDORA"
            context_lines.append(f"{who}: {m['content']}")
        context_prefix = "Prior conversation:\n" + "\n".join(context_lines) + "\n\nCurrent message:\n"

    final_user_text = context_prefix + payload.message

    async def event_generator():
        collected = []
        try:
            async for event in chat.stream_message(UserMessage(text=final_user_text)):
                if isinstance(event, TextDelta):
                    collected.append(event.content)
                    # SSE data frame
                    data = event.content.replace("\r", "").replace("\n", "\\n")
                    yield f"data: {data}\n\n"
                elif isinstance(event, StreamDone):
                    break
            full = "".join(collected)
            # Persist assistant message
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
    """Non-streaming fallback — returns full reply as JSON."""
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

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
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=WEDORA_SYSTEM_PROMPT,
    ).with_model("anthropic", "claude-sonnet-5")

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


# ---------- Budget planner ----------
DEFAULT_SPLIT = [
    ("Venue",          0.22, "Halls, palace grounds, resort takeover, décor-inclusive"),
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
        for (name, pct, note) in DEFAULT_SPLIT
    ]
    per_head = round(total * 0.22 / max(payload.guest_count, 1), 0)  # food-portion per head
    return BudgetOut(
        total=total,
        guest_count=payload.guest_count,
        city=payload.city,
        functions=payload.functions,
        per_head=per_head,
        categories=categories,
    )


# ---------- Venue & Vendor Discovery (curated sample) ----------
VENUES = [
    {"id": "v1", "name": "Amber Haveli Palace", "type": "Palace", "city": "Jaipur", "capacity": 500, "price_tier": "Luxury", "starting_price": 1200000, "image": "https://images.pexels.com/photos/33485957/pexels-photo-33485957.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "tags": ["Royal", "Heritage", "Outdoor"]},
    {"id": "v2", "name": "Lily & Ivory Farm", "type": "Farmhouse", "city": "Delhi NCR", "capacity": 300, "price_tier": "Premium", "starting_price": 650000, "image": "https://images.pexels.com/photos/37828118/pexels-photo-37828118.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "tags": ["Garden", "Pastel", "Intimate"]},
    {"id": "v3", "name": "Serene Sands Resort", "type": "Beach Resort", "city": "Goa", "capacity": 220, "price_tier": "Premium", "starting_price": 850000, "image": "https://images.unsplash.com/photo-1757283588394-ebafdbfffcc9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHw0fHxlbGVnYW50JTIwd2VkZGluZyUyMHZlbnVlJTIwbHV4dXJ5JTIwcGFzdGVsfGVufDB8fHx8MTc5MDA1ODAyN3ww&ixlib=rb-4.1.0&q=85", "tags": ["Beach", "Destination"]},
    {"id": "v4", "name": "Moonlit Banquet House", "type": "Banquet", "city": "Mumbai", "capacity": 450, "price_tier": "Mid", "starting_price": 380000, "image": "https://images.unsplash.com/photo-1782038522861-22e8c23c96e5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBwYXN0ZWwlMjB3ZWRkaW5nJTIwZmxvcmFsJTIwZGVjb3J8ZW58MHx8fHwxNzkwMDU4MDI3fDA&ixlib=rb-4.1.0&q=85", "tags": ["City", "Modern"]},
    {"id": "v5", "name": "Udaipur Lake Pavilion", "type": "Palace", "city": "Udaipur", "capacity": 180, "price_tier": "Ultra Luxury", "starting_price": 2200000, "image": "https://images.unsplash.com/photo-1644426358808-d5db8b4735a0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwzfHxpcmlkZXNjZW50JTIwcGFzdGVsJTIwZmx1aWQlMjBncmFkaWVudCUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzkwMDU4MDI3fDA&ixlib=rb-4.1.0&q=85", "tags": ["Lakefront", "Royal"]},
    {"id": "v6", "name": "The Blossom Yard", "type": "Garden", "city": "Bangalore", "capacity": 250, "price_tier": "Premium", "starting_price": 520000, "image": "https://images.unsplash.com/photo-1751257547111-9641cb540f4d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBwYXN0ZWwlMjB3ZWRkaW5nJTIwZmxvcmFsJTIwZGVjb3J8ZW58MHx8fHwxNzkwMDU4MDI3fDA&ixlib=rb-4.1.0&q=85", "tags": ["Garden", "Pastel"]},
]

VENDORS = [
    {"id": "vn1", "name": "Aisha Mehra", "role": "Photographer", "city": "Jaipur", "price": 250000, "rating": 4.9, "tags": ["Candid", "Cinematic"]},
    {"id": "vn2", "name": "Saffron Kitchens", "role": "Caterer", "city": "Delhi NCR", "price": 1800, "rating": 4.8, "tags": ["Multi-cuisine", "Live"]},
    {"id": "vn3", "name": "Petal & Veil Décor", "role": "Decorator", "city": "Mumbai", "price": 450000, "rating": 4.9, "tags": ["Pastel", "Florals"]},
    {"id": "vn4", "name": "Meher's Makeup Studio", "role": "Makeup Artist", "city": "Bangalore", "price": 75000, "rating": 4.9, "tags": ["HD", "Airbrush"]},
    {"id": "vn5", "name": "DJ Nova", "role": "DJ", "city": "Goa", "price": 90000, "rating": 4.7, "tags": ["Bollywood", "House"]},
    {"id": "vn6", "name": "Wildflower Florals", "role": "Florist", "city": "Udaipur", "price": 220000, "rating": 4.8, "tags": ["Fresh", "Imported"]},
    {"id": "vn7", "name": "Rhythm Choreo Co.", "role": "Choreographer", "city": "Delhi NCR", "price": 60000, "rating": 4.6, "tags": ["Sangeet"]},
    {"id": "vn8", "name": "Papercrane Invitations", "role": "Invitation Designer", "city": "Mumbai", "price": 40000, "rating": 4.7, "tags": ["Digital", "Boxed"]},
]

@api_router.get("/venues")
async def get_venues(city: Optional[str] = None, vtype: Optional[str] = None, capacity: Optional[int] = None):
    results = VENUES
    if city:
        results = [v for v in results if v["city"].lower() == city.lower()]
    if vtype:
        results = [v for v in results if v["type"].lower() == vtype.lower()]
    if capacity:
        results = [v for v in results if v["capacity"] >= capacity]
    return {"count": len(results), "results": results}


@api_router.get("/vendors")
async def get_vendors(role: Optional[str] = None, city: Optional[str] = None):
    results = VENDORS
    if role:
        results = [v for v in results if v["role"].lower() == role.lower()]
    if city:
        results = [v for v in results if v["city"].lower() == city.lower()]
    return {"count": len(results), "results": results}


# ---------- AI Wedding Designer ----------
class DesignerIn(BaseModel):
    dream_description: str


@api_router.post("/designer/generate")
async def designer_generate(payload: DesignerIn):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    session_id = f"designer-{uuid.uuid4()}"
    prompt = f"""A user described their dream wedding:

"{payload.dream_description}"

Return a JSON object with these keys (no markdown, no code fences, pure JSON):
{{
  "theme": "one-line theme name",
  "palette": ["#hex", "#hex", "#hex", "#hex", "#hex"],
  "mandap": "1–2 sentence sensory description",
  "stage": "1–2 sentence description",
  "entrance": "1–2 sentence description",
  "table_decor": "1–2 sentences",
  "lighting": "1–2 sentences",
  "florals": "1–2 sentences"
}}

Use dreamy, elegant, sensory language. Only pure JSON — nothing else."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message="You are a luxury wedding designer AI that outputs pure JSON only.",
    ).with_model("anthropic", "claude-sonnet-5")

    try:
        raw = await chat.send_message(UserMessage(text=prompt))
        text = raw if isinstance(raw, str) else str(raw)
    except Exception as e:
        logging.exception("designer failed")
        raise HTTPException(status_code=500, detail=str(e))

    text_stripped = text.strip()
    # Strip code fences if any
    m = re.search(r"\{[\s\S]*\}", text_stripped)
    if m:
        text_stripped = m.group(0)
    try:
        parsed = jsonlib.loads(text_stripped)
    except Exception:
        parsed = {
            "theme": "Pastel Luxury Garden",
            "palette": ["#F7B7D8", "#C9B8FF", "#A9E8F4", "#FFF8EF", "#F5A9B8"],
            "mandap": "A floating floral pavilion of ivory roses and blush peonies veiled in soft candlelight.",
            "stage": "A gentle arc of pearl drapes crowned with lavender wisteria and cascading orchids.",
            "entrance": "A mirror-lit corridor of tulle arches with dusted rose petals underfoot.",
            "table_decor": "Iridescent glassware, low ivory florals, hand-lettered menus on blush linen.",
            "lighting": "Warm fairy strands, hurricane candles, and moon-glow uplights.",
            "florals": "Ranunculus, garden roses, hydrangeas and imported peonies in dreamy pastels.",
            "_note": "Fallback design — parser could not read the AI response."
        }
    return parsed


# ================= AUTH =================
JWT_SECRET = os.environ.get("JWT_SECRET", "")
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


async def get_vendor_user(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user["role"] not in ("vendor", "admin"):
        raise HTTPException(status_code=403, detail="Vendor access only")
    return user


async def get_admin_user(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access only")
    return user


class LoginIn(BaseModel):
    email: str
    password: str


class RegisterIn(BaseModel):
    email: str
    password: str
    name: str


@api_router.post("/auth/register")
async def auth_register(payload: RegisterIn):
    email = payload.email.strip().lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Email already registered")
    uid = str(uuid.uuid4())
    await db.users.insert_one({
        "id": uid, "email": email, "name": payload.name.strip(),
        "password_hash": hash_password(payload.password),
        "role": "couple", "created_at": datetime.now(timezone.utc).isoformat(),
    })
    token = create_token(uid, "couple")
    return {"token": token, "user": {"id": uid, "email": email, "name": payload.name, "role": "couple"}}


@api_router.post("/auth/login")
async def auth_login(payload: LoginIn):
    email = payload.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], user["role"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user.get("name"), "role": user["role"]}}


@api_router.get("/auth/me")
async def auth_me(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    out = {**user}
    if user["role"] == "vendor":
        vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
        out["vendor"] = vendor
    return out


# ================= VENDOR MARKETPLACE =================
PLANS = {
    "free":    {"label": "Free",    "price": 0,    "photo_limit": 5,    "featured": False, "ai_profile": False, "priority_leads": False, "badge": None},
    "pro":     {"label": "Pro",     "price": 999,  "photo_limit": 30,   "featured": True,  "ai_profile": False, "priority_leads": False, "badge": None},
    "premium": {"label": "Premium", "price": 2999, "photo_limit": 9999, "featured": True,  "ai_profile": True,  "priority_leads": True,  "badge": "PREMIUM VENDOR"},
}
VALID_CATEGORIES = [
    "Wedding Decor", "Wedding Planner", "Photographer", "Videographer", "Caterer",
    "Florist", "Makeup Artist", "Mehendi Artist", "DJ", "Music/Band", "Choreographer",
    "Venue", "Hotel", "Resort", "Farmhouse", "Invitation Designer", "Furniture/Rental",
    "Bridal Wear", "Groom Wear", "Jewellery", "Transportation", "Other",
]


def make_slug(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "vendor"
    return base


async def unique_slug(base: str) -> str:
    slug = base
    n = 2
    while await db.vendors.find_one({"slug": slug}):
        slug = f"{base}-{n}"
        n += 1
    return slug


def vendor_public(v: dict) -> dict:
    out = {k: v.get(k) for k in [
        "id", "slug", "business_name", "category", "city", "starting_price",
        "description", "logo", "portfolio", "services", "years_experience",
        "instagram", "website", "plan", "phone", "whatsapp", "address",
        "is_featured", "created_at",
    ]}
    out["plan_badge"] = PLANS.get(v.get("plan", "free"), {}).get("badge")
    out["plan_label"] = PLANS.get(v.get("plan", "free"), {}).get("label")
    return out


class VendorRegisterIn(BaseModel):
    business_name: str
    contact_person: str
    phone: str
    whatsapp: Optional[str] = ""
    email: str
    password: str
    category: str
    city: str
    address: Optional[str] = ""
    years_experience: Optional[int] = 0
    starting_price: Optional[float] = 0
    instagram: Optional[str] = ""
    website: Optional[str] = ""
    description: Optional[str] = ""


@api_router.post("/vendor/register")
async def vendor_register(payload: VendorRegisterIn):
    email = payload.email.strip().lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Email already registered")
    if payload.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=422, detail="Invalid category")
    uid = str(uuid.uuid4())
    vid = str(uuid.uuid4())
    await db.users.insert_one({
        "id": uid, "email": email, "name": payload.contact_person.strip(),
        "password_hash": hash_password(payload.password),
        "role": "vendor", "vendor_id": vid,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    slug = await unique_slug(make_slug(payload.business_name))
    vendor = {
        "id": vid, "user_id": uid, "slug": slug,
        "business_name": payload.business_name.strip(),
        "contact_person": payload.contact_person.strip(),
        "phone": payload.phone, "whatsapp": payload.whatsapp or payload.phone,
        "email": email,
        "category": payload.category, "city": payload.city.strip(),
        "address": payload.address or "",
        "years_experience": int(payload.years_experience or 0),
        "starting_price": float(payload.starting_price or 0),
        "instagram": payload.instagram or "", "website": payload.website or "",
        "description": payload.description or "",
        "logo": "", "portfolio": [], "services": [],
        "plan": "free", "plan_status": "demo",
        "is_featured": False, "is_published": True,
        "stats": {"profile_views": 0, "whatsapp_clicks": 0, "contact_requests": 0, "portfolio_views": 0},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.vendors.insert_one(vendor)
    token = create_token(uid, "vendor")
    return {"token": token, "user": {"id": uid, "email": email, "name": payload.contact_person, "role": "vendor"}, "vendor": vendor_public(vendor)}


class VendorUpdateIn(BaseModel):
    business_name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    category: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    years_experience: Optional[int] = None
    starting_price: Optional[float] = None
    instagram: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    services: Optional[List[str]] = None


async def my_vendor(authorization: str):
    user = await get_vendor_user(authorization)
    if user["role"] == "admin":
        vid = user.get("vendor_id")
        v = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
        if not v:
            raise HTTPException(status_code=400, detail="Admin has no vendor profile")
        return user, v
    v = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})
    if not v:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    return user, v


@api_router.get("/vendor/me")
async def vendor_me(authorization: str = Header(None)):
    user, v = await my_vendor(authorization)
    return {"user": user, "vendor": vendor_public(v), "plan_details": PLANS.get(v.get("plan", "free"))}


@api_router.put("/vendor/me")
async def vendor_update(payload: VendorUpdateIn, authorization: str = Header(None)):
    user, v = await my_vendor(authorization)
    updates = {k: val for k, val in payload.model_dump(exclude_unset=True).items()}
    if "category" in updates and updates["category"] not in VALID_CATEGORIES:
        raise HTTPException(status_code=422, detail="Invalid category")
    if "business_name" in updates and updates["business_name"] != v["business_name"]:
        updates["slug"] = await unique_slug(make_slug(updates["business_name"]))
    if updates:
        await db.vendors.update_one({"id": v["id"]}, {"$set": updates})
    fresh = await db.vendors.find_one({"id": v["id"]}, {"_id": 0})
    return {"vendor": vendor_public(fresh)}


# ---- Object Storage ----
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = os.environ.get("APP_NAME", "wedora-ai")
storage_key = None


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = http_requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = http_requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = http_requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        init_storage(force=True)
        resp = http_requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": storage_key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024


async def upload_image(file: UploadFile, subfolder: str, owner_id: str) -> str:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=422, detail="Only jpg/png/webp/gif images are allowed")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=422, detail="Image too large (max 8MB)")
    ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else "jpg"
    path = f"{APP_NAME}/uploads/{owner_id}/{subfolder}/{uuid.uuid4()}.{ext}"
    result = put_object(path, data, file.content_type)
    await db.files.insert_one({
        "id": str(uuid.uuid4()), "storage_path": result["path"],
        "original_filename": file.filename, "content_type": file.content_type,
        "size": result.get("size", 0), "owner_id": owner_id, "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return f"/api/files/{result['path']}"


@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))


@api_router.post("/vendor/upload/logo")
async def upload_logo(file: UploadFile = File(...), authorization: str = Header(None)):
    user, v = await my_vendor(authorization)
    url = await upload_image(file, "logo", v["id"])
    await db.vendors.update_one({"id": v["id"]}, {"$set": {"logo": url}})
    return {"url": url}


@api_router.post("/vendor/upload/portfolio")
async def upload_portfolio(file: UploadFile = File(...), authorization: str = Header(None)):
    user, v = await my_vendor(authorization)
    plan = PLANS.get(v.get("plan", "free"))
    limit = plan["photo_limit"]
    current = len(v.get("portfolio", []))
    if current >= limit:
        raise HTTPException(status_code=403, detail=f"PHOTO_LIMIT:{limit}")
    url = await upload_image(file, "portfolio", v["id"])
    await db.vendors.update_one({"id": v["id"]}, {"$push": {"portfolio": url}})
    return {"url": url, "count": current + 1, "limit": limit}


@api_router.delete("/vendor/portfolio")
async def delete_portfolio_image(url: str = Query(...), authorization: str = Header(None)):
    user, v = await my_vendor(authorization)
    if url in v.get("portfolio", []):
        await db.vendors.update_one({"id": v["id"]}, {"$pull": {"portfolio": url}})
        if url.startswith("/api/files/"):
            await db.files.update_one({"storage_path": url.replace("/api/files/", "")}, {"$set": {"is_deleted": True}})
    return {"ok": True}


@api_router.delete("/vendor/logo")
async def delete_logo(authorization: str = Header(None)):
    user, v = await my_vendor(authorization)
    old = v.get("logo", "")
    await db.vendors.update_one({"id": v["id"]}, {"$set": {"logo": ""}})
    if old.startswith("/api/files/"):
        await db.files.update_one({"storage_path": old.replace("/api/files/", "")}, {"$set": {"is_deleted": True}})
    return {"ok": True}


# ---- Plans (DEMO MODE — no real payments) ----
class PlanIn(BaseModel):
    plan: str


@api_router.post("/vendor/plan")
async def switch_plan(payload: PlanIn, authorization: str = Header(None)):
    user, v = await my_vendor(authorization)
    if payload.plan not in PLANS:
        raise HTTPException(status_code=422, detail="Unknown plan")
    await db.vendors.update_one({"id": v["id"]}, {"$set": {
        "plan": payload.plan, "plan_status": "demo",
        "is_featured": PLANS[payload.plan]["featured"],
    }})
    fresh = await db.vendors.find_one({"id": v["id"]}, {"_id": 0})
    return {"demo_mode": True, "vendor": vendor_public(fresh), "note": "DEMO MODE: plan switched without payment. Real payment gateway (e.g. Razorpay Subscriptions) can be connected later."}


# ---- AI Profile Generator (Premium only) ----
class AIProfileIn(BaseModel):
    business_name: str
    category: str
    location: str
    experience: str
    services: str
    price_range: str
    notes: Optional[str] = ""


@api_router.post("/vendor/profile/ai-generate")
async def ai_generate_profile(payload: AIProfileIn, authorization: str = Header(None)):
    user, v = await my_vendor(authorization)
    if not PLANS.get(v.get("plan", "free"), {}).get("ai_profile"):
        raise HTTPException(status_code=403, detail="AI_PROFILE_PREMIUM_ONLY")
    prompt = f"""Write a polished, professional vendor profile description for this wedding business. 120–180 words, elegant and warm, wedding-specialist tone, no emojis, no exaggeration, no invented stats.

Business: {payload.business_name}
Category: {payload.category}
Location: {payload.location}
Experience: {payload.experience}
Services: {payload.services}
Price range: {payload.price_range}
Extra notes: {payload.notes}

Return plain text only — 2–3 short paragraphs."""
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"ai-profile-{uuid.uuid4()}",
                   system_message="You write elegant vendor profile copy for wedding businesses.").with_model("anthropic", "claude-sonnet-5")
    text = await chat.send_message(UserMessage(text=prompt))
    return {"description": text if isinstance(text, str) else str(text)}


# ---- Leads ----
class LeadIn(BaseModel):
    vendor_slug: str
    name: str
    email: str
    phone: str
    wedding_date: Optional[str] = ""
    city: Optional[str] = ""
    guest_count: Optional[int] = None
    budget: Optional[str] = ""
    functions: Optional[str] = ""
    required_service: Optional[str] = ""
    theme: Optional[str] = ""
    message: Optional[str] = ""


@api_router.post("/leads")
async def create_lead(payload: LeadIn):
    v = await db.vendors.find_one({"slug": payload.vendor_slug}, {"_id": 0})
    if not v:
        raise HTTPException(status_code=404, detail="Vendor not found")
    lead = {
        "id": str(uuid.uuid4()), "vendor_id": v["id"],
        "name": payload.name.strip(), "email": payload.email.strip().lower(), "phone": payload.phone,
        "wedding_date": payload.wedding_date or "", "city": payload.city or "",
        "guest_count": payload.guest_count, "budget": payload.budget or "",
        "functions": payload.functions or "", "required_service": payload.required_service or "",
        "theme": payload.theme or "", "message": payload.message or "",
        "status": "new", "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.leads.insert_one(lead)
    await db.vendors.update_one({"id": v["id"]}, {"$inc": {"stats.contact_requests": 1}})
    asyncio.create_task(send_lead_notification(v, lead))
    return {"ok": True, "lead_id": lead["id"]}


@api_router.get("/vendor/leads")
async def vendor_leads(authorization: str = Header(None)):
    user, v = await my_vendor(authorization)
    leads = await db.leads.find({"vendor_id": v["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"count": len(leads), "leads": leads}


class LeadStatusIn(BaseModel):
    status: str


@api_router.patch("/vendor/leads/{lead_id}")
async def update_lead(lead_id: str, payload: LeadStatusIn, authorization: str = Header(None)):
    user, v = await my_vendor(authorization)
    if payload.status not in ("new", "contacted", "closed"):
        raise HTTPException(status_code=422, detail="Invalid status")
    res = await db.leads.update_one({"id": lead_id, "vendor_id": v["id"]}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"ok": True}


@api_router.get("/vendor/stats")
async def vendor_stats(authorization: str = Header(None)):
    user, v = await my_vendor(authorization)
    total_leads = await db.leads.count_documents({"vendor_id": v["id"]})
    new_leads = await db.leads.count_documents({"vendor_id": v["id"], "status": "new"})
    s = v.get("stats", {})
    completion_fields = ["business_name", "contact_person", "phone", "whatsapp", "category", "city",
                         "address", "years_experience", "starting_price", "description", "logo", "website"]
    done = sum(1 for f in completion_fields if v.get(f))
    if v.get("portfolio"):
        done += 1
    completion = round(100 * done / (len(completion_fields) + 1))
    return {
        "profile_views": s.get("profile_views", 0),
        "leads": total_leads, "new_leads": new_leads,
        "whatsapp_clicks": s.get("whatsapp_clicks", 0),
        "contact_requests": s.get("contact_requests", 0),
        "portfolio_views": s.get("portfolio_views", 0),
        "profile_completion": completion,
        "plan": v.get("plan"), "plan_details": PLANS.get(v.get("plan", "free")),
    }


# ---- Public marketplace ----
@api_router.get("/marketplace/vendors")
async def marketplace_list(category: Optional[str] = None, city: Optional[str] = None, q: Optional[str] = None, plan: Optional[str] = None):
    query = {"is_published": True}
    if category:
        query["category"] = category
    if city:
        query["city"] = {"$regex": f"^{re.escape(city)}$", "$options": "i"}
    if plan and plan in PLANS:
        query["plan"] = plan
    if q:
        query["$or"] = [
            {"business_name": {"$regex": re.escape(q), "$options": "i"}},
            {"description": {"$regex": re.escape(q), "$options": "i"}},
        ]
    vendors = await db.vendors.find(query, {"_id": 0}).sort([("is_featured", -1), ("created_at", -1)]).to_list(500)
    return {"count": len(vendors), "vendors": [vendor_public(v) for v in vendors]}


@api_router.get("/marketplace/vendors/{slug}")
async def marketplace_profile(slug: str):
    v = await db.vendors.find_one({"slug": slug, "is_published": True}, {"_id": 0})
    if not v:
        raise HTTPException(status_code=404, detail="Vendor not found")
    await db.vendors.update_one({"id": v["id"]}, {"$inc": {"stats.profile_views": 1}})
    return {"vendor": vendor_public(v)}


@api_router.post("/marketplace/track/{slug}")
async def marketplace_track(slug: str, event: str = Query(...)):
    allowed = {"whatsapp_click": "stats.whatsapp_clicks", "portfolio_view": "stats.portfolio_views"}
    field = allowed.get(event)
    if field:
        await db.vendors.update_one({"slug": slug}, {"$inc": {field: 1}})
    return {"ok": True}


# ---- Admin ----
@api_router.get("/admin/vendors")
async def admin_vendors(authorization: str = Header(None)):
    await get_admin_user(authorization)
    vendors = await db.vendors.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"count": len(vendors), "vendors": [vendor_public(v) for v in vendors]}


class AdminVendorUpdate(BaseModel):
    plan: Optional[str] = None
    is_featured: Optional[bool] = None
    is_published: Optional[bool] = None


@api_router.patch("/admin/vendors/{vendor_id}")
async def admin_update_vendor(vendor_id: str, payload: AdminVendorUpdate, authorization: str = Header(None)):
    await get_admin_user(authorization)
    updates = {k: val for k, val in payload.model_dump(exclude_unset=True).items()}
    if "plan" in updates:
        if updates["plan"] not in PLANS:
            raise HTTPException(status_code=422, detail="Unknown plan")
        updates["is_featured"] = PLANS[updates["plan"]]["featured"]
        updates["plan_status"] = "demo"
    if updates:
        await db.vendors.update_one({"id": vendor_id}, {"$set": updates})
    fresh = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    return {"vendor": vendor_public(fresh)}


@api_router.get("/admin/leads")
async def admin_leads(authorization: str = Header(None)):
    await get_admin_user(authorization)
    leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return {"count": len(leads), "leads": leads}


# ---- Share wedding chat link ----
class ShareIn(BaseModel):
    session_id: str


@api_router.post("/chat/share")
async def create_share(payload: ShareIn):
    msgs = await db.chat_messages.find({"session_id": payload.session_id}, {"_id": 0}).sort("timestamp", 1).to_list(500)
    if not msgs:
        raise HTTPException(status_code=404, detail="Conversation not found")
    existing = await db.shares.find_one({"session_id": payload.session_id}, {"_id": 0})
    if existing:
        return {"share_id": existing["share_id"]}
    share_id = secrets.token_urlsafe(8).replace("-", "").replace("_", "")[:12]
    await db.shares.insert_one({
        "share_id": share_id, "session_id": payload.session_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"share_id": share_id}


@api_router.get("/chat/share/{share_id}")
async def get_share(share_id: str):
    s = await db.shares.find_one({"share_id": share_id}, {"_id": 0})
    if not s:
        raise HTTPException(status_code=404, detail="Shared plan not found")
    msgs = await db.chat_messages.find({"session_id": s["session_id"]}, {"_id": 0, "role": 1, "content": 1, "timestamp": 1}).sort("timestamp", 1).to_list(500)
    return {"share_id": share_id, "messages": msgs}


# ================= EMAIL (Emergent-managed Resend) =================
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "WEDORA AI")
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "").rstrip("/")

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []
    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []
    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)
    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan(); scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} ≠ real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str, reply_to: str | None = None) -> str | None:
    _assert_safe_email(subject, html)
    if not EMAIL_KEY:
        logger.warning("EMERGENT_EMAIL_KEY not set — skipping email send")
        return None
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to or EMAIL_REPLY_TO:
        payload["contact_email"] = reply_to or EMAIL_REPLY_TO
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        logger.info(f"Email sent to {to}: id={resp.json().get('id')}")
        return resp.json().get("id")
    except Exception as e:
        logger.error(f"Email send failed to {to}: {e}")
        return None


def _lead_row(label: str, value: str) -> str:
    if not value:
        return ""
    return (
        f'<tr><td style="padding:8px 16px;font-size:12px;letter-spacing:1px;text-transform:uppercase;'
        f'color:#988FA6;width:130px;vertical-align:top">{label}</td>'
        f'<td style="padding:8px 16px;font-size:14px;color:#2D2638">{value}</td></tr>'
    )


def build_lead_email_html(vendor: dict, lead: dict) -> str:
    esc = html_escape
    rows = "".join([
        _lead_row("Couple", esc(lead["name"])),
        _lead_row("Email", esc(lead["email"])),
        _lead_row("Phone", esc(lead["phone"])),
        _lead_row("Wedding Date", esc(lead.get("wedding_date") or "")),
        _lead_row("City", esc(lead.get("city") or "")),
        _lead_row("Guests", str(lead.get("guest_count") or "")),
        _lead_row("Budget", esc(lead.get("budget") or "")),
        _lead_row("Functions", esc(lead.get("functions") or "")),
        _lead_row("Service", esc(lead.get("required_service") or "")),
        _lead_row("Theme", esc(lead.get("theme") or "")),
    ])
    message_html = ""
    if lead.get("message"):
        message_html = (
            f'<table role="presentation" width="100%" style="margin-top:16px"><tr><td style="padding:14px 18px;'
            f'background:linear-gradient(135deg,#FDF0F6,#F0EAFB);border-radius:14px;font-size:14px;'
            f'color:#4a4257;font-style:italic">“{esc(lead["message"])}”</td></tr></table>'
        )
    dashboard_link = f"{FRONTEND_URL}/vendor/dashboard" if FRONTEND_URL else "#"
    return (
        '<table role="presentation" width="100%" style="background:#FAF8F6;padding:32px 12px">'
        '<tr><td align="center">'
        '<table role="presentation" width="560" style="max-width:560px;width:100%;background:#ffffff;'
        'border-radius:24px;border:1px solid #F3E3EF;overflow:hidden">'
        '<tr><td style="padding:24px 28px;background:linear-gradient(120deg,#C9B8FF33,#F7B7D833,#A9E8FF33)">'
        '<p style="margin:0;font-family:Georgia,serif;font-size:24px;color:#2D2638">A couple just asked for a quote ✿</p>'
        '<p style="margin:6px 0 0;font-size:13px;color:#6B617A">via WEDORA AI · for '
        f'{esc(vendor.get("business_name", "your business"))}</p></td></tr>'
        '<tr><td style="padding:8px 12px 4px">'
        f'<table role="presentation" width="100%">{rows}</table>{message_html}'
        '</td></tr>'
        '<tr><td style="padding:20px 28px 28px" align="center">'
        f'<a href="{dashboard_link}" style="display:inline-block;padding:12px 28px;border-radius:999px;'
        'background:linear-gradient(120deg,#C9B8FF,#F7B7D8,#A9E8FF);color:#2D2638;font-size:14px;'
        'font-family:Arial,sans-serif;text-decoration:none">Open your WEDORA dashboard</a>'
        '<p style="margin:18px 0 0;font-size:11px;color:#988FA6">Sent by WEDORA AI. We never ask for '
        'passwords or card details by email.</p>'
        '</td></tr></table></td></tr></table>'
    )


async def send_lead_notification(vendor: dict, lead: dict):
    try:
        subject = f"New wedding inquiry — {lead['name']} · {lead.get('city') or 'Wedding'} ({vendor.get('category', '')})"
        html = build_lead_email_html(vendor, lead)
        email_id = await send_email(to=vendor["email"], subject=subject, html=html)
        await db.leads.update_one(
            {"id": lead["id"]},
            {"$set": {"email_notified": bool(email_id), "email_id": email_id, "email_status": "sent" if email_id else "failed"}},
        )
    except Exception as e:
        logger.error(f"Lead notification email failed for vendor {vendor.get('id')}: {e}")
        await db.leads.update_one({"id": lead["id"]}, {"$set": {"email_notified": False, "email_status": "error"}})


# ================= STARTUP =================
@app.on_event("startup")
async def startup_tasks():
    try:
        await db.users.create_index("email", unique=True)
        await db.vendors.create_index("slug", unique=True)
        await db.leads.create_index("vendor_id")
        await db.chat_messages.create_index("session_id")
    except Exception as e:
        logger.warning(f"Index creation: {e}")

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@wedora.ai")
    admin_password = os.environ.get("ADMIN_PASSWORD", "WedoraAdmin@2026")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": admin_email, "name": "WEDORA Admin",
            "password_hash": hash_password(admin_password), "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Seeded admin account")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Updated admin password")

    # Seed demo vendors (so marketplace isn't empty)
    demo_vendors = [
        {"business_name": "Petal & Pearl Studio", "contact_person": "Ananya Rao", "email": "petal@demo.wedora.ai",
         "phone": "+91 98290 12345", "category": "Wedding Decor", "city": "Jaipur", "years_experience": 8,
         "starting_price": 350000, "plan": "premium",
         "description": "Boutique décor studio specialising in pastel luxury weddings — floating florals, candlelit aisles and hand-crafted mandaps for intimate to grand celebrations.",
         "portfolio": [
             "https://images.unsplash.com/photo-1782038522861-22e8c23c96e5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBwYXN0ZWwlMjB3ZWRkaW5nJTIwZmxvcmFsJTIwZGVjb3J8ZW58MHx8fHwxNzkwMDU4MDI3fDA&ixlib=rb-4.1.0&q=85",
             "https://images.unsplash.com/photo-1751257547111-9641cb540f4d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBwYXN0ZWwlMjB3ZWRkaW5nJTIwZmxvcmFsJTIwZGVjb3J8ZW58MHx8fHwxNzkwMDU4MDI3fDA&ixlib=rb-4.1.0&q=85",
         ]},
        {"business_name": "Aperture Tales", "contact_person": "Kabir Sethi", "email": "aperture@demo.wedora.ai",
         "phone": "+91 98100 54321", "category": "Photographer", "city": "Delhi NCR", "years_experience": 11,
         "starting_price": 250000, "plan": "pro",
         "description": "Candid wedding photography and cinematic films with an editorial eye. 400+ weddings across India, loved for quiet, honest storytelling.",
         "portfolio": [
             "https://images.pexels.com/photos/37828118/pexels-photo-37828118.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
         ]},
        {"business_name": "The Saffron Table", "contact_person": "Meher Khan", "email": "saffron@demo.wedora.ai",
         "phone": "+91 98330 99887", "category": "Caterer", "city": "Mumbai", "years_experience": 6,
         "starting_price": 1800, "plan": "free",
         "description": "Multi-cuisine catering with live counters, regional specialties and beautifully styled buffets. Per-plate pricing, tastings on request.",
         "portfolio": []},
    ]
    for dv in demo_vendors:
        if await db.users.find_one({"email": dv["email"]}):
            continue
        uid = str(uuid.uuid4())
        vid = str(uuid.uuid4())
        await db.users.insert_one({
            "id": uid, "email": dv["email"], "name": dv["contact_person"],
            "password_hash": hash_password("VendorDemo@2026"), "role": "vendor", "vendor_id": vid,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        slug = await unique_slug(make_slug(dv["business_name"]))
        await db.vendors.insert_one({
            "id": vid, "user_id": uid, "slug": slug,
            "business_name": dv["business_name"], "contact_person": dv["contact_person"],
            "phone": dv["phone"], "whatsapp": dv["phone"], "email": dv["email"],
            "category": dv["category"], "city": dv["city"], "address": "",
            "years_experience": dv["years_experience"], "starting_price": dv["starting_price"],
            "instagram": "", "website": "", "description": dv["description"],
            "logo": "", "portfolio": dv["portfolio"], "services": [],
            "plan": dv["plan"], "plan_status": "demo",
            "is_featured": PLANS[dv["plan"]]["featured"], "is_published": True,
            "stats": {"profile_views": 0, "whatsapp_clicks": 0, "contact_requests": 0, "portfolio_views": 0},
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    logger.info("Demo vendors checked")

    # Init object storage
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


# ---------- Health ----------
@api_router.get("/")
async def root():
    return {"service": "WEDORA AI", "status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
