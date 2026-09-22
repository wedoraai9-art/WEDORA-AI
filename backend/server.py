from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

WEDORA_SYSTEM_PROMPT = """You are WEDORA — a warm, elegant, deeply knowledgeable AI wedding companion designed to help couples plan, design, budget, and dream up their perfect wedding.

Your voice: warm, creative, intelligent, human, wedding-focused. Speak like a trusted wedding planner and creative director — not a robot. Use gentle, elegant language.

You understand: budget, city, guest count, wedding date, functions (haldi, mehendi, sangeet, ceremony, reception), style (pastel luxury, royal, boho, minimal, traditional), culture, food preferences, venue types, décor, photography.

When a user gives you a wedding brief, respond with structured, useful guidance:
- If information is missing, ask 1–2 warm follow-up questions before recommending.
- For budgets: give an itemized breakdown by category with realistic Indian pricing in ₹ (or the currency user prefers).
- For design: describe themes, colour palettes, mandap, stage, entrance, florals, lighting in evocative sensory language.
- For venues/vendors: list categories with what to look for and typical questions to ask.
- For planning: give clear timelines and checklists.

Keep responses concise (3–6 short paragraphs or well-organized bullet lists). Use markdown headings and lists when it improves clarity. Never robotic. Never generic. Always romantic, tasteful, and truly helpful.

Sign off warmly when it fits the moment (e.g. "With love, WEDORA ✿" — use very sparingly)."""


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

    import json, re
    text_stripped = text.strip()
    # Strip code fences if any
    m = re.search(r"\{[\s\S]*\}", text_stripped)
    if m:
        text_stripped = m.group(0)
    try:
        parsed = json.loads(text_stripped)
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
