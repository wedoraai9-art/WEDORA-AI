from fastapi import FastAPI, APIRouter, HTTPException, Request, UploadFile, File, Header, Query, Form
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


@api_router.get("/auth/me")
async def auth_me(authorization: str = Header(None)):
    user = await get_current_user(authorization)

    return {
        "user": user
    }



# ================= VENDOR SYSTEM =================

VENDOR_PLANS = {
    "free": {
        "label": "WEDORA FREE",
        "price_monthly": 0,
        "price_yearly": 0,
        "wedding_limit": 3,
        "export_enabled": False,
        "lead_access": False,
        "priority_leads": False,
        "photo_limit": 5,
        "featured": False,
        "ai_profile": False,
        "badge": None,
    },
    "pro": {
        "label": "WEDORA PRO",
        "price_monthly": 399,
        "price_yearly": 4399,
        "wedding_limit": None,
        "export_enabled": True,
        "lead_access": True,
        "priority_leads": True,
        "photo_limit": 9999,
        "featured": True,
        "ai_profile": True,
        "badge": "PRO VENDOR",
    },
    "premium": {
        "label": "WEDORA PREMIUM",
        "price_monthly": 0,
        "price_yearly": 0,
        "wedding_limit": None,
        "export_enabled": True,
        "lead_access": True,
        "priority_leads": True,
        "photo_limit": 9999,
        "featured": True,
        "ai_profile": True,
        "badge": "PREMIUM VENDOR",
    },
}


class VendorRegisterIn(BaseModel):
    email: str
    password: str
    business_name: str = ""
    name: Optional[str] = None
    category: str = "Wedding Vendor"
    city: str = "Jaipur"
    phone: Optional[str] = None


class VendorUpdateIn(BaseModel):
    business_name: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    instagram: Optional[str] = None
    description: Optional[str] = None
    about: Optional[str] = None
    address: Optional[str] = None
    logo: Optional[str] = None
    slug: Optional[str] = None


class VendorLeadUpdateIn(BaseModel):
    status: str


class VendorPlanIn(BaseModel):
    plan: str


class WeddingCreateIn(BaseModel):
    name: Optional[str] = None
    client_name: Optional[str] = ""
    event_date: Optional[str] = ""
    city: Optional[str] = ""
    guest_count: Optional[int] = 0
    budget: Optional[float] = 0
    status: Optional[str] = "planning"
    notes: Optional[str] = ""
    wedding_name: Optional[str] = None
    bride_name: Optional[str] = ""
    groom_name: Optional[str] = ""
    wedding_date: Optional[str] = ""
    venue: Optional[str] = ""


class WeddingUpdateIn(BaseModel):
    name: Optional[str] = None
    client_name: Optional[str] = None
    event_date: Optional[str] = None
    city: Optional[str] = None
    guest_count: Optional[int] = None
    budget: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    wedding_name: Optional[str] = None
    bride_name: Optional[str] = None
    groom_name: Optional[str] = None
    wedding_date: Optional[str] = None
    venue: Optional[str] = None


class WeddingBudgetUpdateIn(BaseModel):
    total_budget: float = 0


class WeddingExpenseIn(BaseModel):
    title: str
    category: Optional[str] = "General"
    amount: float = 0
    expense_date: Optional[str] = ""
    notes: Optional[str] = ""


class WeddingPaymentIn(BaseModel):
    title: str
    payment_type: Optional[str] = "payment"
    amount: float = 0
    payment_date: Optional[str] = ""
    notes: Optional[str] = ""


class WeddingDocumentUpdateIn(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None

class WeddingDesignIn(BaseModel):
    theme: Optional[str] = ""
    concept: Optional[str] = ""
    palette: List[str] = Field(default_factory=list)
    mandap: Optional[str] = ""
    stage: Optional[str] = ""
    entrance: Optional[str] = ""
    table_decor: Optional[str] = ""
    lighting: Optional[str] = ""
    florals: Optional[str] = ""
    notes: Optional[str] = ""
    status: Optional[str] = "draft"
    reference_images: List[str] = Field(default_factory=list)

class WeddingElementCategoryIn(BaseModel):
    name: str


class WeddingElementIn(BaseModel):
    name: str
    category: Optional[str] = "General"
    quantity: float = 1
    unit: Optional[str] = "pcs"
    dimensions: Optional[str] = ""
    dimension_unit: Optional[str] = "ft"
    area: Optional[str] = ""
    function: Optional[str] = "All Functions"
    status: Optional[str] = "planned"
    pricing_type: Optional[str] = "manual"
    rate: float = 0
    estimated_cost: float = 0
    actual_cost: float = 0
    supplier: Optional[str] = ""
    supplier_contact: Optional[str] = ""
    notes: Optional[str] = ""


class WeddingElementUpdateIn(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    dimensions: Optional[str] = None
    dimension_unit: Optional[str] = None
    area: Optional[str] = None
    function: Optional[str] = None
    status: Optional[str] = None
    pricing_type: Optional[str] = None
    rate: Optional[float] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    supplier: Optional[str] = None
    supplier_contact: Optional[str] = None
    notes: Optional[str] = None



class WeddingNotificationIn(BaseModel):
    title: str
    message: str = ""
    notification_type: str = "reminder"
    reminder_date: Optional[str] = ""
    priority: str = "normal"


async def get_vendor_user(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user.get("role") not in ("vendor", "admin"):
        raise HTTPException(status_code=403, detail="Vendor access required")
    return user


def _vendor_slug(name: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", (name or "vendor").lower()).strip("-")
    return value or f"vendor-{uuid.uuid4().hex[:8]}"


def _vendor_plan_details(plan: str):
    return VENDOR_PLANS.get(plan, VENDOR_PLANS["free"])


async def _ensure_vendor_profile(user: dict):
    vendor = await db.vendors.find_one({"user_id": user["id"]}, {"_id": 0})

    if vendor:
        return vendor

    business_name = (
        user.get("business_name")
        or user.get("name")
        or (user.get("email", "").split("@")[0] if user.get("email") else "WEDORA Vendor")
    )
    plan = user.get("plan", "free")
    if plan not in VENDOR_PLANS:
        plan = "free"

    vendor = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "business_name": business_name,
        "name": user.get("name") or business_name,
        "email": user.get("email", ""),
        "category": user.get("category", "Wedding Vendor"),
        "city": user.get("city", "Jaipur"),
        "phone": user.get("phone"),
        "whatsapp": user.get("whatsapp"),
        "website": "",
        "instagram": "",
        "description": "",
        "about": "",
        "address": "",
        "logo": None,
        "portfolio": [],
        "slug": _vendor_slug(business_name),
        "plan": plan,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.vendors.insert_one(vendor.copy())
    return {k: v for k, v in vendor.items()}


def _profile_completion(vendor: dict) -> int:
    fields = [
        vendor.get("business_name"),
        vendor.get("category"),
        vendor.get("city"),
        vendor.get("phone"),
        vendor.get("description") or vendor.get("about"),
        vendor.get("logo"),
        vendor.get("instagram"),
        vendor.get("website"),
        vendor.get("address"),
    ]
    filled = sum(1 for value in fields if value)
    return round((filled / len(fields)) * 100)


@api_router.post("/vendor/register")
async def vendor_register(payload: VendorRegisterIn):
    email = payload.email.strip().lower()

    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user_id = str(uuid.uuid4())
    name = (payload.name or payload.business_name or email.split("@")[0]).strip()
    business_name = (payload.business_name or name).strip()

    user = {
        "id": user_id,
        "email": email,
        "name": name,
        "role": "vendor",
        "business_name": business_name,
        "category": payload.category,
        "city": payload.city,
        "phone": payload.phone,
        "plan": "free",
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.users.insert_one(user)

    vendor = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "business_name": business_name,
        "name": name,
        "email": email,
        "category": payload.category,
        "city": payload.city,
        "phone": payload.phone,
        "whatsapp": payload.phone,
        "website": "",
        "instagram": "",
        "description": "",
        "about": "",
        "address": "",
        "logo": None,
        "portfolio": [],
        "slug": _vendor_slug(business_name),
        "plan": "free",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.vendors.insert_one(vendor.copy())

    token = create_token(user_id, "vendor")

    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": email,
            "name": name,
            "role": "vendor",
        },
        "vendor": {k: v for k, v in vendor.items()},
        "plan_details": _vendor_plan_details("free"),
    }


@api_router.get("/vendor/me")
async def vendor_me(authorization: str = Header(None)):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)

    plan = vendor.get("plan") or user.get("plan") or "free"
    if plan not in VENDOR_PLANS:
        plan = "free"

    vendor["plan"] = plan
    vendor["profile_completion"] = _profile_completion(vendor)

    return {
        "vendor": vendor,
        "plan_details": _vendor_plan_details(plan),
    }


@api_router.put("/vendor/me")
async def vendor_update(payload: VendorUpdateIn, authorization: str = Header(None)):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)

    updates = payload.model_dump(exclude_none=True)

    if "business_name" in updates:
        updates["business_name"] = updates["business_name"].strip()
        if updates["business_name"] and not payload.slug:
            updates["slug"] = _vendor_slug(updates["business_name"])

    if "email" in updates:
        updates["email"] = updates["email"].strip().lower()

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    if updates:
        await db.vendors.update_one(
            {"id": vendor["id"]},
            {"$set": updates},
        )

    vendor = await db.vendors.find_one({"id": vendor["id"]}, {"_id": 0})
    plan = vendor.get("plan", "free")

    return {
        "vendor": vendor,
        "plan_details": _vendor_plan_details(plan),
    }


@api_router.get("/vendor/stats")
async def vendor_stats(authorization: str = Header(None)):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    vendor_id = vendor["id"]
    slug = vendor.get("slug")

    weddings = await db.vendor_weddings.count_documents({"vendor_id": vendor_id})
    leads = await db.vendor_leads.count_documents({"vendor_id": vendor_id})
    new_leads = await db.vendor_leads.count_documents(
        {"vendor_id": vendor_id, "status": {"$in": ["new", "pending"]}}
    )
    portfolio_views = await db.vendor_events.count_documents(
        {"vendor_id": vendor_id, "event": "portfolio_view"}
    )
    profile_views = await db.vendor_events.count_documents(
        {"vendor_id": vendor_id, "event": "profile_view"}
    )
    whatsapp_clicks = await db.vendor_events.count_documents(
        {"vendor_id": vendor_id, "event": "whatsapp_click"}
    )
    contact_requests = await db.vendor_events.count_documents(
        {"vendor_id": vendor_id, "event": "contact_request"}
    )

    # Also support older tracking records that may have been stored by public-profile slug.
    if slug:
        profile_views += await db.vendor_events.count_documents(
            {"slug": slug, "event": "profile_view"}
        )
        portfolio_views += await db.vendor_events.count_documents(
            {"slug": slug, "event": "portfolio_view"}
        )
        whatsapp_clicks += await db.vendor_events.count_documents(
            {"slug": slug, "event": "whatsapp_click"}
        )
        contact_requests += await db.vendor_events.count_documents(
            {"slug": slug, "event": "contact_request"}
        )

    return {
        "profile_views": profile_views,
        "leads": leads,
        "whatsapp_clicks": whatsapp_clicks,
        "contact_requests": contact_requests,
        "portfolio_views": portfolio_views,
        "profile_completion": _profile_completion(vendor),
        "new_leads": new_leads,
        "weddings": weddings,
    }


@api_router.post("/vendor/plan")
async def vendor_switch_plan(payload: VendorPlanIn, authorization: str = Header(None)):
    user = await get_vendor_user(authorization)
    plan = payload.plan.strip().lower()

    if plan not in VENDOR_PLANS:
        raise HTTPException(status_code=400, detail="Invalid vendor plan")

    vendor = await _ensure_vendor_profile(user)

    await db.vendors.update_one(
        {"id": vendor["id"]},
        {
            "$set": {
                "plan": plan,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"plan": plan}},
    )

    vendor["plan"] = plan

    return {
        "vendor": vendor,
        "plan_details": _vendor_plan_details(plan),
    }


@api_router.get("/vendor/leads")
async def vendor_leads(authorization: str = Header(None)):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)

    docs = await db.vendor_leads.find(
        {"vendor_id": vendor["id"]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(200)

    return {"leads": docs}


@api_router.patch("/vendor/leads/{lead_id}")
async def vendor_update_lead(
    lead_id: str,
    payload: VendorLeadUpdateIn,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)

    result = await db.vendor_leads.update_one(
        {"id": lead_id, "vendor_id": vendor["id"]},
        {
            "$set": {
                "status": payload.status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead = await db.vendor_leads.find_one(
        {"id": lead_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    )
    return lead


@api_router.post("/vendor/upload/logo")
async def vendor_upload_logo(
    file: UploadFile = File(...),
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)

    # Store the uploaded image as a small data URL so this feature works
    # without adding a paid storage provider.
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Logo must be 5 MB or smaller")

    import base64
    mime = file.content_type or "image/jpeg"
    logo_url = f"data:{mime};base64,{base64.b64encode(content).decode('ascii')}"

    await db.vendors.update_one(
        {"id": vendor["id"]},
        {"$set": {"logo": logo_url, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )

    return {"logo": logo_url}


@api_router.delete("/vendor/logo")
async def vendor_delete_logo(authorization: str = Header(None)):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)

    await db.vendors.update_one(
        {"id": vendor["id"]},
        {"$set": {"logo": None, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )

    return {"success": True}


@api_router.post("/vendor/upload/portfolio")
async def vendor_upload_portfolio(
    file: UploadFile = File(...),
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)

    plan = vendor.get("plan", "free")
    limit = _vendor_plan_details(plan)["photo_limit"]

    portfolio = vendor.get("portfolio") or []
    if len(portfolio) >= limit:
        raise HTTPException(status_code=403, detail="Your current plan has reached its portfolio limit")

    content = await file.read()
    if len(content) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Portfolio image must be 8 MB or smaller")

    import base64
    mime = file.content_type or "image/jpeg"
    image_url = f"data:{mime};base64,{base64.b64encode(content).decode('ascii')}"

    portfolio.append(image_url)

    await db.vendors.update_one(
        {"id": vendor["id"]},
        {"$set": {"portfolio": portfolio, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )

    return {"portfolio": portfolio, "url": image_url}


@api_router.delete("/vendor/portfolio")
async def vendor_delete_portfolio(
    url: str = Query(...),
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)

    portfolio = [item for item in (vendor.get("portfolio") or []) if item != url]

    await db.vendors.update_one(
        {"id": vendor["id"]},
        {"$set": {"portfolio": portfolio, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )

    return {"portfolio": portfolio}


@api_router.get("/vendor/weddings")
async def vendor_get_weddings(authorization: str = Header(None)):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)

    weddings = await db.vendor_weddings.find(
        {"vendor_id": vendor["id"]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(200)

    return {"weddings": weddings}


@api_router.post("/vendor/weddings")
async def vendor_create_wedding(
    payload: WeddingCreateIn,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)

    plan = vendor.get("plan", "free")
    limit = _vendor_plan_details(plan)["wedding_limit"]

    if limit is not None:
        existing_count = await db.vendor_weddings.count_documents({"vendor_id": vendor["id"]})
        if existing_count >= limit:
            raise HTTPException(
                status_code=403,
                detail=f"Your {VENDOR_PLANS[plan]['label']} plan allows up to {limit} weddings.",
            )

    wedding_name = (payload.wedding_name or payload.name or "Untitled Wedding").strip()
    event_date = payload.wedding_date or payload.event_date or ""

    wedding = {
        "id": str(uuid.uuid4()),
        "vendor_id": vendor["id"],
        "name": wedding_name,
        "client_name": payload.client_name or "",
        "event_date": event_date,
        "city": payload.city or vendor.get("city", "Jaipur"),
        "guest_count": payload.guest_count or 0,
        "budget": payload.budget or 0,
        "status": payload.status or "planning",
        "notes": payload.notes or "",
        # Workspace-friendly aliases retained alongside the original API fields.
        "wedding_name": wedding_name,
        "bride_name": payload.bride_name or "",
        "groom_name": payload.groom_name or "",
        "wedding_date": event_date,
        "venue": payload.venue or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.vendor_weddings.insert_one(wedding.copy())
    return wedding


@api_router.put("/vendor/weddings/{wedding_id}")
async def vendor_update_wedding(
    wedding_id: str,
    payload: WeddingUpdateIn,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)

    updates = payload.model_dump(exclude_none=True)
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = await db.vendor_weddings.update_one(
        {"id": wedding_id, "vendor_id": vendor["id"]},
        {"$set": updates},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Wedding not found")

    wedding = await db.vendor_weddings.find_one(
        {"id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    )
    return wedding


@api_router.delete("/vendor/weddings/{wedding_id}")
async def vendor_delete_wedding(
    wedding_id: str,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)

    result = await db.vendor_weddings.delete_one(
        {"id": wedding_id, "vendor_id": vendor["id"]}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Wedding not found")

    return {"success": True}


@api_router.get("/vendor/weddings/{wedding_id}")
async def vendor_get_wedding(
    wedding_id: str,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)

    wedding = await db.vendor_weddings.find_one(
        {"id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    )

    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")

    return wedding




# ================= WEDDING BUDGET & PAYMENTS =================
async def _get_vendor_wedding(wedding_id: str, vendor_id: str):
    wedding = await db.vendor_weddings.find_one(
        {"id": wedding_id, "vendor_id": vendor_id},
        {"_id": 0},
    )
    if not wedding:
        raise HTTPException(status_code=404, detail="Wedding not found")
    return wedding


async def _wedding_budget_payload(wedding: dict):
    wedding_id = wedding["id"]

    expenses = await db.vendor_wedding_expenses.find(
        {"wedding_id": wedding_id},
        {"_id": 0},
    ).sort("created_at", -1).to_list(500)

    payments = await db.vendor_wedding_payments.find(
        {"wedding_id": wedding_id},
        {"_id": 0},
    ).sort("created_at", -1).to_list(500)

    total_budget = float(wedding.get("budget") or 0)
    total_expenses = round(sum(float(item.get("amount") or 0) for item in expenses), 2)
    total_payments = round(
        sum(
            (-1 if item.get("payment_type") == "refund" else 1)
            * float(item.get("amount") or 0)
            for item in payments
        ),
        2,
    )

    return {
        "budget": {
            "total_budget": total_budget,
            "total_expenses": total_expenses,
            "total_payments": total_payments,
            "remaining_budget": round(total_budget - total_expenses, 2),
            "payment_balance": round(total_expenses - total_payments, 2),
        },
        "expenses": expenses,
        "payments": payments,
    }


@api_router.get("/vendor/weddings/{wedding_id}/budget")
async def vendor_get_wedding_budget(
    wedding_id: str,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    wedding = await _get_vendor_wedding(wedding_id, vendor["id"])
    return await _wedding_budget_payload(wedding)


@api_router.put("/vendor/weddings/{wedding_id}/budget")
async def vendor_update_wedding_budget(
    wedding_id: str,
    payload: WeddingBudgetUpdateIn,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    wedding = await _get_vendor_wedding(wedding_id, vendor["id"])

    total_budget = max(float(payload.total_budget or 0), 0)
    await db.vendor_weddings.update_one(
        {"id": wedding_id, "vendor_id": vendor["id"]},
        {
            "$set": {
                "budget": total_budget,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    wedding["budget"] = total_budget
    return await _wedding_budget_payload(wedding)


@api_router.post("/vendor/weddings/{wedding_id}/expenses")
async def vendor_add_wedding_expense(
    wedding_id: str,
    payload: WeddingExpenseIn,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Expense title is required")
    if float(payload.amount) <= 0:
        raise HTTPException(status_code=400, detail="Expense amount must be greater than 0")

    expense = {
        "id": str(uuid.uuid4()),
        "wedding_id": wedding_id,
        "vendor_id": vendor["id"],
        "title": payload.title.strip(),
        "category": (payload.category or "General").strip() or "General",
        "amount": round(float(payload.amount), 2),
        "expense_date": payload.expense_date or "",
        "notes": payload.notes or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.vendor_wedding_expenses.insert_one(expense.copy())
    return expense


@api_router.put("/vendor/weddings/{wedding_id}/expenses/{expense_id}")
async def vendor_update_wedding_expense(
    wedding_id: str,
    expense_id: str,
    payload: WeddingExpenseIn,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Expense title is required")
    if float(payload.amount) <= 0:
        raise HTTPException(status_code=400, detail="Expense amount must be greater than 0")

    updates = {
        "title": payload.title.strip(),
        "category": (payload.category or "General").strip() or "General",
        "amount": round(float(payload.amount), 2),
        "expense_date": payload.expense_date or "",
        "notes": payload.notes or "",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    result = await db.vendor_wedding_expenses.update_one(
        {"id": expense_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"$set": updates},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")

    return await db.vendor_wedding_expenses.find_one(
        {"id": expense_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    )


@api_router.delete("/vendor/weddings/{wedding_id}/expenses/{expense_id}")
async def vendor_delete_wedding_expense(
    wedding_id: str,
    expense_id: str,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    result = await db.vendor_wedding_expenses.delete_one(
        {"id": expense_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")

    return {"success": True}


@api_router.post("/vendor/weddings/{wedding_id}/payments")
async def vendor_add_wedding_payment(
    wedding_id: str,
    payload: WeddingPaymentIn,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Payment title is required")
    if float(payload.amount) <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than 0")

    payment_type = (payload.payment_type or "payment").strip().lower()
    if payment_type not in {"advance", "payment", "refund"}:
        raise HTTPException(status_code=400, detail="Invalid payment type")

    payment = {
        "id": str(uuid.uuid4()),
        "wedding_id": wedding_id,
        "vendor_id": vendor["id"],
        "title": payload.title.strip(),
        "payment_type": payment_type,
        "amount": round(float(payload.amount), 2),
        "payment_date": payload.payment_date or "",
        "notes": payload.notes or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.vendor_wedding_payments.insert_one(payment.copy())
    return payment


@api_router.put("/vendor/weddings/{wedding_id}/payments/{payment_id}")
async def vendor_update_wedding_payment(
    wedding_id: str,
    payment_id: str,
    payload: WeddingPaymentIn,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Payment title is required")
    if float(payload.amount) <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than 0")

    payment_type = (payload.payment_type or "payment").strip().lower()
    if payment_type not in {"advance", "payment", "refund"}:
        raise HTTPException(status_code=400, detail="Invalid payment type")

    updates = {
        "title": payload.title.strip(),
        "payment_type": payment_type,
        "amount": round(float(payload.amount), 2),
        "payment_date": payload.payment_date or "",
        "notes": payload.notes or "",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    result = await db.vendor_wedding_payments.update_one(
        {"id": payment_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"$set": updates},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")

    return await db.vendor_wedding_payments.find_one(
        {"id": payment_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    )


@api_router.delete("/vendor/weddings/{wedding_id}/payments/{payment_id}")
async def vendor_delete_wedding_payment(
    wedding_id: str,
    payment_id: str,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    result = await db.vendor_wedding_payments.delete_one(
        {"id": payment_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")

    return {"success": True}



# ================= WEDDING DESIGN (DECORATOR ONLY) =================
DECORATOR_CATEGORIES = {
    "wedding decorator",
    "wedding decor",
    "decorator",
    "decor",
}


def _is_decorator_vendor(vendor: dict) -> bool:
    category = str(vendor.get("category") or "").strip().lower()
    return category in DECORATOR_CATEGORIES


async def _get_decorator_wedding(wedding_id: str, vendor: dict):
    if not _is_decorator_vendor(vendor):
        raise HTTPException(
            status_code=403,
            detail="Wedding Design is available only to decorator vendors.",
        )

    return await _get_vendor_wedding(wedding_id, vendor["id"])


def _design_response(design: Optional[dict], wedding_id: str, vendor_id: str) -> dict:
    if not design:
        return {
            "id": None,
            "wedding_id": wedding_id,
            "vendor_id": vendor_id,
            "theme": "",
            "concept": "",
            "palette": [],
            "mandap": "",
            "stage": "",
            "entrance": "",
            "table_decor": "",
            "lighting": "",
            "florals": "",
            "notes": "",
            "status": "draft",
            "reference_images": [],
        }

    return {
        "id": design.get("id"),
        "wedding_id": design.get("wedding_id"),
        "vendor_id": design.get("vendor_id"),
        "theme": design.get("theme") or "",
        "concept": design.get("concept") or "",
        "palette": design.get("palette") or [],
        "mandap": design.get("mandap") or "",
        "stage": design.get("stage") or "",
        "entrance": design.get("entrance") or "",
        "table_decor": design.get("table_decor") or "",
        "lighting": design.get("lighting") or "",
        "florals": design.get("florals") or "",
        "notes": design.get("notes") or "",
        "status": design.get("status") or "draft",
        "reference_images": design.get("reference_images") or [],
        "created_at": design.get("created_at"),
        "updated_at": design.get("updated_at"),
    }


@api_router.get("/vendor/weddings/{wedding_id}/design")
async def vendor_get_wedding_design(
    wedding_id: str,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_decorator_wedding(wedding_id, vendor)

    design = await db.vendor_wedding_designs.find_one(
        {"wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    )

    return _design_response(design, wedding_id, vendor["id"])


@api_router.put("/vendor/weddings/{wedding_id}/design")
async def vendor_save_wedding_design(
    wedding_id: str,
    payload: WeddingDesignIn,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_decorator_wedding(wedding_id, vendor)

    status = (payload.status or "draft").strip().lower()
    if status not in {"draft", "in_progress", "approved", "completed"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid design status",
        )

    palette = []
    for color in payload.palette or []:
        value = str(color).strip()
        if value and value not in palette:
            palette.append(value[:50])

    reference_images = []
    for image in payload.reference_images or []:
        value = str(image).strip()
        if value and value not in reference_images:
            reference_images.append(value[:2000])

    now = datetime.now(timezone.utc).isoformat()
    updates = {
        "theme": (payload.theme or "").strip(),
        "concept": (payload.concept or "").strip(),
        "palette": palette[:12],
        "mandap": (payload.mandap or "").strip(),
        "stage": (payload.stage or "").strip(),
        "entrance": (payload.entrance or "").strip(),
        "table_decor": (payload.table_decor or "").strip(),
        "lighting": (payload.lighting or "").strip(),
        "florals": (payload.florals or "").strip(),
        "notes": (payload.notes or "").strip(),
        "status": status,
        "reference_images": reference_images[:20],
        "updated_at": now,
    }

    existing = await db.vendor_wedding_designs.find_one(
        {"wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    )

    if existing:
        await db.vendor_wedding_designs.update_one(
            {"id": existing["id"]},
            {"$set": updates},
        )
        design = await db.vendor_wedding_designs.find_one(
            {"id": existing["id"]},
            {"_id": 0},
        )
    else:
        design = {
            "id": str(uuid.uuid4()),
            "wedding_id": wedding_id,
            "vendor_id": vendor["id"],
            **updates,
            "created_at": now,
        }
        await db.vendor_wedding_designs.insert_one(design.copy())

    return _design_response(design, wedding_id, vendor["id"])


@api_router.delete("/vendor/weddings/{wedding_id}/design")
async def vendor_delete_wedding_design(
    wedding_id: str,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_decorator_wedding(wedding_id, vendor)

    result = await db.vendor_wedding_designs.delete_one(
        {"wedding_id": wedding_id, "vendor_id": vendor["id"]}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Wedding design not found")

    return {"success": True}



# ================= WEDDING ELEMENT CATEGORIES (DECORATOR ONLY) =================

@api_router.get("/vendor/element-categories")
async def vendor_get_element_categories(
    authorization: str = Header(None),
):
    vendor = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(vendor)
    if not _is_decorator_vendor(vendor):
        raise HTTPException(status_code=403, detail="Wedding element categories are available only to decorator vendors")

    cursor = db.vendor_element_categories.find(
        {"vendor_id": vendor["id"]},
        {"_id": 0},
    ).sort("created_at", 1)

    categories = []
    async for item in cursor:
        categories.append({
            "id": item.get("id"),
            "name": item.get("name", ""),
            "created_at": item.get("created_at"),
        })
    return {"categories": categories}


@api_router.post("/vendor/element-categories")
async def vendor_create_element_category(
    payload: WeddingElementCategoryIn,
    authorization: str = Header(None),
):
    vendor = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(vendor)
    if not _is_decorator_vendor(vendor):
        raise HTTPException(status_code=403, detail="Wedding element categories are available only to decorator vendors")

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name is required")
    if len(name) > 60:
        raise HTTPException(status_code=400, detail="Category name must be 60 characters or fewer")

    existing = await db.vendor_element_categories.find_one({
        "vendor_id": vendor["id"],
        "name_lower": name.lower(),
    })
    if existing:
        return {
            "success": True,
            "category": {"id": existing.get("id"), "name": existing.get("name", name), "created_at": existing.get("created_at")},
            "existing": True,
        }

    count = await db.vendor_element_categories.count_documents({"vendor_id": vendor["id"]})
    if count >= 30:
        raise HTTPException(status_code=400, detail="You can save up to 30 custom categories")

    now = datetime.now(timezone.utc).isoformat()
    category = {
        "id": str(uuid.uuid4()),
        "vendor_id": vendor["id"],
        "name": name,
        "name_lower": name.lower(),
        "created_at": now,
    }
    await db.vendor_element_categories.insert_one(category.copy())
    return {
        "success": True,
        "category": {"id": category["id"], "name": category["name"], "created_at": now},
        "existing": False,
    }


@api_router.delete("/vendor/element-categories/{category_id}")
async def vendor_delete_element_category(
    category_id: str,
    authorization: str = Header(None),
):
    vendor = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(vendor)
    if not _is_decorator_vendor(vendor):
        raise HTTPException(status_code=403, detail="Wedding element categories are available only to decorator vendors")

    result = await db.vendor_element_categories.delete_one({
        "id": category_id,
        "vendor_id": vendor["id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Custom category not found")

    return {"success": True}


# ================= WEDDING ELEMENTS (DECORATOR ONLY) =================

ELEMENT_STATUS_VALUES = {
    "planned",
    "quotation",
    "ordered",
    "received",
    "installed",
    "in_progress",
    "ready",
    "completed",
}
ELEMENT_CATEGORIES = {
    "General",
    "Mandap",
    "Stage",
    "Entrance",
    "Furniture",
    "Flooring & Carpet",
    "Floral",
    "Lighting",
    "Truss",
    "Sound & AV",
    "Fabric & Draping",
    "Decor Props",
    "Table Decor",
    "Printing & Branding",
    "Electrical",
    "Production",
    "Transportation",
    "Signage",
    "Other",
}
ELEMENT_FUNCTIONS = {
    "All Functions",
    "Haldi",
    "Mehendi",
    "Sangeet",
    "Wedding",
    "Reception",
    "Other",
}


def _dimension_area_sqft(dimensions: str, dimension_unit: str = "ft") -> float:
    """
    Convert the first two numeric dimensions into square feet.
    Examples:
      20*12 ft -> 240
      20 x 12 ft -> 240
      6*4 m -> 258.33
    For 3D dimensions such as 20*12*3, only length x width is used
    for floor/platform area.
    """
    values = re.findall(r"(?<![A-Za-z])(?:\d+(?:\.\d+)?)", str(dimensions or ""))
    if len(values) < 2:
        return 0.0

    length = float(values[0])
    width = float(values[1])
    area = length * width

    unit = str(dimension_unit or "ft").strip().lower()
    if unit in {"m", "meter", "meters", "metre", "metres"}:
        area *= 10.7639104167

    return round(area, 2)


def _element_calculated_cost(element: dict) -> dict:
    dimensions = element.get("dimensions", "")
    dimension_unit = element.get("dimension_unit", "ft") or "ft"
    area_sqft = _dimension_area_sqft(dimensions, dimension_unit)

    quantity = float(element.get("quantity", 1) or 0)
    rate = float(element.get("rate", 0) or 0)
    pricing_type = str(element.get("pricing_type", "manual") or "manual").lower()

    if pricing_type == "per_sqft":
        estimated_cost = round(area_sqft * rate * quantity, 2)
    elif pricing_type == "per_unit":
        estimated_cost = round(quantity * rate, 2)
    else:
        estimated_cost = round(float(element.get("estimated_cost", 0) or 0), 2)

    actual_cost = round(float(element.get("actual_cost", 0) or 0), 2)

    return {
        "area_sqft": area_sqft,
        "estimated_cost": estimated_cost,
        "actual_cost": actual_cost,
    }


def _element_response(element: dict, wedding_id: str, vendor_id: str) -> dict:
    calculated = _element_calculated_cost(element)
    return {
        "id": element.get("id"),
        "wedding_id": wedding_id,
        "vendor_id": vendor_id,
        "name": element.get("name", ""),
        "category": element.get("category", "General"),
        "quantity": element.get("quantity", 1),
        "unit": element.get("unit", "pcs"),
        "dimensions": element.get("dimensions", ""),
        "dimension_unit": element.get("dimension_unit", "ft"),
        "area_sqft": calculated["area_sqft"],
        "area": element.get("area", ""),
        "function": element.get("function", "All Functions"),
        "status": element.get("status", "planned"),
        "pricing_type": element.get("pricing_type", "manual"),
        "rate": element.get("rate", 0),
        "estimated_cost": calculated["estimated_cost"],
        "actual_cost": calculated["actual_cost"],
        "supplier": element.get("supplier", ""),
        "supplier_contact": element.get("supplier_contact", ""),
        "notes": element.get("notes", ""),
        "created_at": element.get("created_at"),
        "updated_at": element.get("updated_at"),
    }


def _validate_element_status(status: str) -> str:
    value = (status or "planned").strip().lower()
    if value not in ELEMENT_STATUS_VALUES:
        raise HTTPException(status_code=400, detail="Invalid element status")
    return value


def _validate_pricing_type(value: str) -> str:
    pricing_type = (value or "manual").strip().lower()
    if pricing_type not in {"manual", "per_sqft", "per_unit"}:
        raise HTTPException(status_code=400, detail="Invalid element pricing type")
    return pricing_type


@api_router.get("/vendor/weddings/{wedding_id}/elements")
async def vendor_get_wedding_elements(
    wedding_id: str,
    authorization: str = Header(None),
):
    vendor = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(vendor)
    await _get_decorator_wedding(wedding_id, vendor)

    cursor = db.vendor_wedding_elements.find(
        {"wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    ).sort("created_at", -1)

    elements = [_element_response(item, wedding_id, vendor["id"]) async for item in cursor]
    return {"elements": elements}


@api_router.post("/vendor/weddings/{wedding_id}/elements")
async def vendor_create_wedding_element(
    wedding_id: str,
    payload: WeddingElementIn,
    authorization: str = Header(None),
):
    vendor = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(vendor)
    await _get_decorator_wedding(wedding_id, vendor)

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Element name is required")

    quantity = float(payload.quantity)
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

    status = _validate_element_status(payload.status)
    pricing_type = _validate_pricing_type(payload.pricing_type)
    rate = max(0.0, float(payload.rate or 0))
    estimated_cost = max(0.0, float(payload.estimated_cost or 0))
    actual_cost = max(0.0, float(payload.actual_cost or 0))

    category = (payload.category or "General").strip() or "General"
    unit = (payload.unit or "pcs").strip() or "pcs"
    dimensions = (payload.dimensions or "").strip()
    dimension_unit = (payload.dimension_unit or "ft").strip().lower() or "ft"
    area = (payload.area or "").strip()
    function = (payload.function or "All Functions").strip() or "All Functions"
    supplier = (payload.supplier or "").strip()
    supplier_contact = (payload.supplier_contact or "").strip()
    notes = (payload.notes or "").strip()

    now = datetime.now(timezone.utc).isoformat()

    element = {
        "id": str(uuid.uuid4()),
        "wedding_id": wedding_id,
        "vendor_id": vendor["id"],
        "name": name,
        "category": category,
        "quantity": quantity,
        "unit": unit,
        "dimensions": dimensions,
        "dimension_unit": dimension_unit,
        "area": area,
        "function": function,
        "status": status,
        "pricing_type": pricing_type,
        "rate": rate,
        "estimated_cost": estimated_cost,
        "actual_cost": actual_cost,
        "supplier": supplier,
        "supplier_contact": supplier_contact,
        "notes": notes,
        "created_at": now,
        "updated_at": now,
    }

    await db.vendor_wedding_elements.insert_one(element.copy())
    return {"success": True, "element": _element_response(element, wedding_id, vendor["id"])}


@api_router.put("/vendor/weddings/{wedding_id}/elements/{element_id}")
async def vendor_update_wedding_element(
    wedding_id: str,
    element_id: str,
    payload: WeddingElementUpdateIn,
    authorization: str = Header(None),
):
    vendor = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(vendor)
    await _get_decorator_wedding(wedding_id, vendor)

    existing = await db.vendor_wedding_elements.find_one(
        {"id": element_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Element not found")

    updates = {}
    data = payload.model_dump(exclude_unset=True)

    if "name" in data:
        name = (data["name"] or "").strip()
        if not name:
            raise HTTPException(status_code=400, detail="Element name is required")
        updates["name"] = name

    if "category" in data:
        updates["category"] = (data["category"] or "General").strip() or "General"

    if "quantity" in data:
        quantity = float(data["quantity"])
        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
        updates["quantity"] = quantity

    if "unit" in data:
        updates["unit"] = (data["unit"] or "pcs").strip() or "pcs"

    if "dimensions" in data:
        updates["dimensions"] = (data["dimensions"] or "").strip()

    if "dimension_unit" in data:
        updates["dimension_unit"] = (data["dimension_unit"] or "ft").strip().lower() or "ft"

    if "area" in data:
        updates["area"] = (data["area"] or "").strip()

    if "function" in data:
        updates["function"] = (data["function"] or "All Functions").strip() or "All Functions"

    if "status" in data:
        updates["status"] = _validate_element_status(data["status"])

    if "pricing_type" in data:
        updates["pricing_type"] = _validate_pricing_type(data["pricing_type"])

    if "rate" in data:
        updates["rate"] = max(0.0, float(data["rate"] or 0))

    if "estimated_cost" in data:
        updates["estimated_cost"] = max(0.0, float(data["estimated_cost"] or 0))

    if "actual_cost" in data:
        updates["actual_cost"] = max(0.0, float(data["actual_cost"] or 0))

    if "supplier" in data:
        updates["supplier"] = (data["supplier"] or "").strip()

    if "supplier_contact" in data:
        updates["supplier_contact"] = (data["supplier_contact"] or "").strip()

    if "notes" in data:
        updates["notes"] = (data["notes"] or "").strip()

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.vendor_wedding_elements.update_one(
        {"id": element_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"$set": updates},
    )

    updated = await db.vendor_wedding_elements.find_one(
        {"id": element_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    )
    return {"success": True, "element": _element_response(updated, wedding_id, vendor["id"])}


@api_router.delete("/vendor/weddings/{wedding_id}/elements/{element_id}")
async def vendor_delete_wedding_element(
    wedding_id: str,
    element_id: str,
    authorization: str = Header(None),
):
    vendor = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(vendor)
    await _get_decorator_wedding(wedding_id, vendor)

    result = await db.vendor_wedding_elements.delete_one(
        {"id": element_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Element not found")

    return {"success": True}


@api_router.get("/vendor/weddings/{wedding_id}/elements-summary")
async def vendor_get_wedding_elements_summary(
    wedding_id: str,
    authorization: str = Header(None),
):
    vendor = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(vendor)
    await _get_decorator_wedding(wedding_id, vendor)

    cursor = db.vendor_wedding_elements.find(
        {"wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    )

    total = 0
    ordered = 0
    pending = 0
    estimated_cost = 0.0
    actual_cost = 0.0

    async for item in cursor:
        total += 1
        status = str(item.get("status", "planned")).lower()
        if status in {"ordered", "received", "installed", "completed"}:
            ordered += 1
        if status not in {"completed"}:
            pending += 1

        calculated = _element_calculated_cost(item)
        estimated_cost += calculated["estimated_cost"]
        actual_cost += calculated["actual_cost"]

    return {
        "summary": {
            "total_elements": total,
            "ordered_elements": ordered,
            "pending_elements": pending,
            "estimated_cost": round(estimated_cost, 2),
            "actual_cost": round(actual_cost, 2),
        }
    }


# ================= WEDDING NOTIFICATIONS =================

WEDDING_NOTIFICATION_TYPES = {
    "reminder",
    "payment",
    "budget",
    "document",
    "update",
    "system",
}

WEDDING_NOTIFICATION_PRIORITIES = {
    "low",
    "normal",
    "high",
}


def _notification_response(notification: dict) -> dict:
    return {
        "id": notification.get("id"),
        "wedding_id": notification.get("wedding_id"),
        "vendor_id": notification.get("vendor_id"),
        "title": notification.get("title") or "Wedding Notification",
        "message": notification.get("message") or "",
        "notification_type": notification.get("notification_type") or "reminder",
        "reminder_date": notification.get("reminder_date") or "",
        "priority": notification.get("priority") or "normal",
        "read": bool(notification.get("read", False)),
        "created_at": notification.get("created_at"),
        "updated_at": notification.get("updated_at"),
    }


async def _seed_wedding_date_notification(wedding: dict, vendor_id: str):
    """
    Create one automatic reminder when the wedding date is within 30 days.
    The reminder is stored once, so repeated page loads do not create duplicates.
    """
    wedding_date_raw = wedding.get("wedding_date") or wedding.get("event_date") or ""
    if not wedding_date_raw:
        return

    try:
        parsed_date = datetime.fromisoformat(str(wedding_date_raw).replace("Z", "+00:00"))
        if parsed_date.tzinfo is None:
            parsed_date = parsed_date.replace(tzinfo=timezone.utc)
        wedding_date = parsed_date.astimezone(timezone.utc).date()
    except Exception:
        return

    today = datetime.now(timezone.utc).date()
    days_left = (wedding_date - today).days

    if days_left < 0 or days_left > 30:
        return

    existing = await db.vendor_wedding_notifications.find_one(
        {
            "wedding_id": wedding["id"],
            "vendor_id": vendor_id,
            "system_key": "wedding_date_30_day_reminder",
        },
        {"_id": 0, "id": 1},
    )

    if existing:
        return

    if days_left == 0:
        message = "Your wedding is today. Wishing you a smooth and beautiful celebration."
    elif days_left == 1:
        message = "Your wedding is tomorrow. Make sure the final details are ready."
    else:
        message = f"Your wedding is in {days_left} days. Review your tasks, documents and payments."

    now = datetime.now(timezone.utc).isoformat()
    notification = {
        "id": str(uuid.uuid4()),
        "wedding_id": wedding["id"],
        "vendor_id": vendor_id,
        "title": "Wedding date reminder",
        "message": message,
        "notification_type": "reminder",
        "reminder_date": wedding_date.isoformat(),
        "priority": "high" if days_left <= 7 else "normal",
        "read": False,
        "system_key": "wedding_date_30_day_reminder",
        "created_at": now,
        "updated_at": now,
    }

    await db.vendor_wedding_notifications.insert_one(notification.copy())


@api_router.get("/vendor/weddings/{wedding_id}/notifications")
async def vendor_get_wedding_notifications(
    wedding_id: str,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    wedding = await _get_vendor_wedding(wedding_id, vendor["id"])

    await _seed_wedding_date_notification(wedding, vendor["id"])

    notifications = await db.vendor_wedding_notifications.find(
        {"wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(500)

    unread_count = sum(1 for item in notifications if not item.get("read", False))

    return {
        "notifications": [_notification_response(item) for item in notifications],
        "unread_count": unread_count,
    }


@api_router.post("/vendor/weddings/{wedding_id}/notifications")
async def vendor_create_wedding_notification(
    wedding_id: str,
    payload: WeddingNotificationIn,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Notification title is required")

    notification_type = (payload.notification_type or "reminder").strip().lower()
    if notification_type not in WEDDING_NOTIFICATION_TYPES:
        raise HTTPException(status_code=400, detail="Invalid notification type")

    priority = (payload.priority or "normal").strip().lower()
    if priority not in WEDDING_NOTIFICATION_PRIORITIES:
        raise HTTPException(status_code=400, detail="Invalid notification priority")

    now = datetime.now(timezone.utc).isoformat()
    notification = {
        "id": str(uuid.uuid4()),
        "wedding_id": wedding_id,
        "vendor_id": vendor["id"],
        "title": title,
        "message": (payload.message or "").strip(),
        "notification_type": notification_type,
        "reminder_date": (payload.reminder_date or "").strip(),
        "priority": priority,
        "read": False,
        "created_at": now,
        "updated_at": now,
    }

    await db.vendor_wedding_notifications.insert_one(notification.copy())
    return _notification_response(notification)


@api_router.patch("/vendor/weddings/{wedding_id}/notifications/{notification_id}")
async def vendor_update_wedding_notification(
    wedding_id: str,
    notification_id: str,
    payload: dict,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    allowed_updates = {}

    if "read" in payload:
        allowed_updates["read"] = bool(payload.get("read"))

    if "title" in payload:
        title = str(payload.get("title") or "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="Notification title is required")
        allowed_updates["title"] = title

    if "message" in payload:
        allowed_updates["message"] = str(payload.get("message") or "").strip()

    if "notification_type" in payload:
        notification_type = str(payload.get("notification_type") or "reminder").strip().lower()
        if notification_type not in WEDDING_NOTIFICATION_TYPES:
            raise HTTPException(status_code=400, detail="Invalid notification type")
        allowed_updates["notification_type"] = notification_type

    if "reminder_date" in payload:
        allowed_updates["reminder_date"] = str(payload.get("reminder_date") or "").strip()

    if "priority" in payload:
        priority = str(payload.get("priority") or "normal").strip().lower()
        if priority not in WEDDING_NOTIFICATION_PRIORITIES:
            raise HTTPException(status_code=400, detail="Invalid notification priority")
        allowed_updates["priority"] = priority

    if not allowed_updates:
        notification = await db.vendor_wedding_notifications.find_one(
            {
                "id": notification_id,
                "wedding_id": wedding_id,
                "vendor_id": vendor["id"],
            },
            {"_id": 0},
        )
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        return _notification_response(notification)

    allowed_updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = await db.vendor_wedding_notifications.update_one(
        {
            "id": notification_id,
            "wedding_id": wedding_id,
            "vendor_id": vendor["id"],
        },
        {"$set": allowed_updates},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification = await db.vendor_wedding_notifications.find_one(
        {
            "id": notification_id,
            "wedding_id": wedding_id,
            "vendor_id": vendor["id"],
        },
        {"_id": 0},
    )
    return _notification_response(notification)


@api_router.post("/vendor/weddings/{wedding_id}/notifications/read-all")
async def vendor_mark_all_wedding_notifications_read(
    wedding_id: str,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    await db.vendor_wedding_notifications.update_many(
        {
            "wedding_id": wedding_id,
            "vendor_id": vendor["id"],
            "read": False,
        },
        {
            "$set": {
                "read": True,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    return {"success": True, "unread_count": 0}


@api_router.delete("/vendor/weddings/{wedding_id}/notifications/{notification_id}")
async def vendor_delete_wedding_notification(
    wedding_id: str,
    notification_id: str,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    result = await db.vendor_wedding_notifications.delete_one(
        {
            "id": notification_id,
            "wedding_id": wedding_id,
            "vendor_id": vendor["id"],
        }
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"success": True}


@api_router.post("/vendor/profile/ai-generate")
async def vendor_ai_generate_profile(
    payload: dict,
    authorization: str = Header(None),
):
    # Kept deliberately free of any paid external AI provider.
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)

    business_name = payload.get("business_name") or vendor.get("business_name") or "Wedding Vendor"
    category = payload.get("category") or vendor.get("category") or "Wedding Vendor"
    city = payload.get("city") or vendor.get("city") or "Jaipur"

    description = (
        f"{business_name} is a {category.lower()} serving weddings in {city}. "
        "We create thoughtful, reliable wedding experiences tailored to each couple's "
        "style, celebration and budget."
    )

    return {"description": description}


@api_router.get("/marketplace/vendors")
async def marketplace_vendors(
    city: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
):
    query = {}
    if city:
        query["city"] = {"$regex": re.escape(city), "$options": "i"}
    if category:
        query["category"] = {"$regex": re.escape(category), "$options": "i"}
    if search:
        query["$or"] = [
            {"business_name": {"$regex": re.escape(search), "$options": "i"}},
            {"category": {"$regex": re.escape(search), "$options": "i"}},
            {"city": {"$regex": re.escape(search), "$options": "i"}},
        ]

    vendors = await db.vendors.find(query, {"_id": 0, "password_hash": 0}).sort(
        "created_at", -1
    ).to_list(200)

    return {"vendors": vendors}


@api_router.get("/marketplace/vendors/{slug}")
async def marketplace_vendor_profile(slug: str):
    vendor = await db.vendors.find_one({"slug": slug}, {"_id": 0})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    return vendor


@api_router.post("/marketplace/track/{slug}")
async def marketplace_track(slug: str, event: str = Query(...)):
    allowed_events = {
        "profile_view",
        "portfolio_view",
        "whatsapp_click",
        "contact_request",
    }
    if event not in allowed_events:
        raise HTTPException(status_code=400, detail="Invalid tracking event")

    vendor = await db.vendors.find_one({"slug": slug}, {"_id": 0, "id": 1})
    vendor_id = vendor.get("id") if vendor else None

    await db.vendor_events.insert_one({
        "id": str(uuid.uuid4()),
        "vendor_id": vendor_id,
        "slug": slug,
        "event": event,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"success": True}


@api_router.post("/leads")
async def marketplace_create_lead(payload: dict):
    vendor_id = payload.get("vendor_id")
    slug = payload.get("vendor_slug") or payload.get("slug")

    if not vendor_id and slug:
        vendor = await db.vendors.find_one({"slug": slug}, {"_id": 0, "id": 1})
        vendor_id = vendor.get("id") if vendor else None

    if not vendor_id:
        raise HTTPException(status_code=400, detail="Vendor is required")

    lead = {
        "id": str(uuid.uuid4()),
        "vendor_id": vendor_id,
        "name": payload.get("name", ""),
        "email": payload.get("email", ""),
        "phone": payload.get("phone", ""),
        "message": payload.get("message", ""),
        "event_date": payload.get("event_date", ""),
        "city": payload.get("city", ""),
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.vendor_leads.insert_one(lead.copy())
    return lead


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
