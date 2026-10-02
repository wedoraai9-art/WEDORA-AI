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
        "price_yearly": 4599,
        "wedding_limit": None,
        "export_enabled": True,
        "lead_access": True,
        "priority_leads": True,
        "photo_limit": 9999,
        "featured": True,
        "ai_profile": True,
        "badge": "PRO VENDOR",
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


class VendorPortfolioCaseStudyIn(BaseModel):
    title: str = Field(..., min_length=2, max_length=120)
    event_type: str = Field(default="Wedding", max_length=60)
    location: str = Field(default="", max_length=120)
    event_date: str = Field(default="", max_length=40)
    description: str = Field(default="", max_length=2000)
    services: List[str] = Field(default_factory=list)
    budget_range: str = Field(default="", max_length=80)
    photos: List[str] = Field(default_factory=list)


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


class WeddingInvoiceLineItemIn(BaseModel):
    description: str = ""
    quantity: float = 1
    unit: Optional[str] = "service"
    unit_price: float = 0


class WeddingInvoiceIn(BaseModel):
    title: str = "Wedding invoice"
    client_name: Optional[str] = ""
    issue_date: Optional[str] = ""
    due_date: Optional[str] = ""
    line_items: List[WeddingInvoiceLineItemIn] = Field(default_factory=list)
    discount_type: Optional[str] = "amount"
    discount_value: float = 0
    tax_percent: float = 0
    terms: Optional[str] = ""
    notes: Optional[str] = ""


class WeddingInvoicePaymentIn(BaseModel):
    amount: float
    payment_date: Optional[str] = ""
    payment_method: Optional[str] = "Other"
    notes: Optional[str] = ""

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
    area: Optional[str] = ""
    status: Optional[str] = "planned"
    notes: Optional[str] = ""


class WeddingElementUpdateIn(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    dimensions: Optional[str] = None
    area: Optional[str] = None
    status: Optional[str] = None
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
    if plan == "premium" or plan not in VENDOR_PLANS:
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
        "portfolio_case_studies": [],
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
        "portfolio_case_studies": [],
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
    if plan == "premium" or plan not in VENDOR_PLANS:
        plan = "free"
        await db.vendors.update_one(
            {"id": vendor["id"]},
            {"$set": {"plan": "free", "updated_at": datetime.now(timezone.utc).isoformat()}},
        )

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

    updated_vendor = await db.vendors.find_one({"id": vendor["id"]}, {"_id": 0})
    return {"portfolio": portfolio, "url": image_url, "vendor": updated_vendor}


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

    updated_vendor = await db.vendors.find_one({"id": vendor["id"]}, {"_id": 0})
    return {"portfolio": portfolio, "vendor": updated_vendor}


@api_router.get("/vendor/portfolio/case-studies")
async def vendor_get_portfolio_case_studies(authorization: str = Header(None)):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    return {"case_studies": vendor.get("portfolio_case_studies") or []}


@api_router.post("/vendor/portfolio/case-studies")
async def vendor_create_portfolio_case_study(
    payload: VendorPortfolioCaseStudyIn,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    case_studies = vendor.get("portfolio_case_studies") or []
    if len(case_studies) >= 50:
        raise HTTPException(status_code=403, detail="You can save up to 50 portfolio case studies.")

    available_photos = set(vendor.get("portfolio") or [])
    invalid_photos = [photo for photo in payload.photos if photo not in available_photos]
    if invalid_photos:
        raise HTTPException(status_code=400, detail="Case-study photos must be selected from your uploaded portfolio.")

    case_study = payload.model_dump()
    case_study["id"] = str(uuid.uuid4())
    case_study["services"] = [str(item).strip()[:80] for item in case_study.get("services", []) if str(item).strip()][:20]
    case_study["created_at"] = datetime.now(timezone.utc).isoformat()
    case_study["updated_at"] = case_study["created_at"]
    case_studies.append(case_study)
    await db.vendors.update_one(
        {"id": vendor["id"]},
        {"$set": {"portfolio_case_studies": case_studies, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    updated_vendor = await db.vendors.find_one({"id": vendor["id"]}, {"_id": 0})
    return {"case_study": case_study, "case_studies": case_studies, "vendor": updated_vendor}


@api_router.put("/vendor/portfolio/case-studies/{case_study_id}")
async def vendor_update_portfolio_case_study(
    case_study_id: str,
    payload: VendorPortfolioCaseStudyIn,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    case_studies = vendor.get("portfolio_case_studies") or []
    existing = next((item for item in case_studies if item.get("id") == case_study_id), None)
    if not existing:
        raise HTTPException(status_code=404, detail="Portfolio case study not found")
    available_photos = set(vendor.get("portfolio") or [])
    if any(photo not in available_photos for photo in payload.photos):
        raise HTTPException(status_code=400, detail="Case-study photos must be selected from your uploaded portfolio.")
    updated = payload.model_dump()
    updated["id"] = case_study_id
    updated["services"] = [str(item).strip()[:80] for item in updated.get("services", []) if str(item).strip()][:20]
    updated["created_at"] = existing.get("created_at", datetime.now(timezone.utc).isoformat())
    updated["updated_at"] = datetime.now(timezone.utc).isoformat()
    case_studies = [updated if item.get("id") == case_study_id else item for item in case_studies]
    await db.vendors.update_one(
        {"id": vendor["id"]},
        {"$set": {"portfolio_case_studies": case_studies, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    updated_vendor = await db.vendors.find_one({"id": vendor["id"]}, {"_id": 0})
    return {"case_study": updated, "case_studies": case_studies, "vendor": updated_vendor}


@api_router.delete("/vendor/portfolio/case-studies/{case_study_id}")
async def vendor_delete_portfolio_case_study(
    case_study_id: str,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    case_studies = vendor.get("portfolio_case_studies") or []
    filtered = [item for item in case_studies if item.get("id") != case_study_id]
    if len(filtered) == len(case_studies):
        raise HTTPException(status_code=404, detail="Portfolio case study not found")
    await db.vendors.update_one(
        {"id": vendor["id"]},
        {"$set": {"portfolio_case_studies": filtered, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    updated_vendor = await db.vendors.find_one({"id": vendor["id"]}, {"_id": 0})
    return {"case_studies": filtered, "vendor": updated_vendor}


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




# ================= WEDDING TASKS =================
@api_router.get("/vendor/weddings/{wedding_id}/tasks")
async def vendor_get_wedding_tasks(
    wedding_id: str,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    tasks = await db.vendor_wedding_tasks.find(
        {"wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    ).sort([("due_date", 1), ("created_at", -1)]).to_list(500)
    return {"tasks": tasks}


@api_router.post("/vendor/weddings/{wedding_id}/tasks")
async def vendor_create_wedding_task(
    wedding_id: str,
    payload: dict,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    title = str(payload.get("title") or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Task title is required.")

    now = datetime.now(timezone.utc).isoformat()
    task = {
        "id": str(uuid.uuid4()),
        "wedding_id": wedding_id,
        "vendor_id": vendor["id"],
        "title": title[:240],
        "due_date": str(payload.get("due_date") or "").strip()[:10],
        "completed": bool(payload.get("completed", False)),
        "created_at": now,
        "updated_at": now,
    }
    await db.vendor_wedding_tasks.insert_one(task.copy())
    return {"task": task}


@api_router.patch("/vendor/weddings/{wedding_id}/tasks/{task_id}")
async def vendor_update_wedding_task(
    wedding_id: str,
    task_id: str,
    payload: dict,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    updates = {}
    if "title" in payload:
        title = str(payload.get("title") or "").strip()
        if not title:
            raise HTTPException(status_code=400, detail="Task title cannot be empty.")
        updates["title"] = title[:240]
    if "due_date" in payload:
        updates["due_date"] = str(payload.get("due_date") or "").strip()[:10]
    if "completed" in payload:
        updates["completed"] = bool(payload.get("completed"))

    if not updates:
        task = await db.vendor_wedding_tasks.find_one(
            {"id": task_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
            {"_id": 0},
        )
        if not task:
            raise HTTPException(status_code=404, detail="Task not found.")
        return {"task": task}

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.vendor_wedding_tasks.update_one(
        {"id": task_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"$set": updates},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found.")

    task = await db.vendor_wedding_tasks.find_one(
        {"id": task_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    )
    return {"task": task}


@api_router.delete("/vendor/weddings/{wedding_id}/tasks/{task_id}")
async def vendor_delete_wedding_task(
    wedding_id: str,
    task_id: str,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    result = await db.vendor_wedding_tasks.delete_one(
        {"id": task_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found.")
    return {"success": True}


# ================= VENDOR PROFIT & LOSS =================
def _report_month(value: Optional[str]) -> str:
    if value:
        if not re.fullmatch(r"\d{4}-\d{2}", value):
            raise HTTPException(status_code=400, detail="Month must use YYYY-MM format.")
        month_number = int(value[5:7])
        if month_number < 1 or month_number > 12:
            raise HTTPException(status_code=400, detail="Month must be a valid YYYY-MM.")
        return value
    return datetime.now(timezone.utc).strftime("%Y-%m")


def _record_month(value) -> str:
    """Return YYYY-MM for ISO or day-first dates; preserve undated records."""
    if isinstance(value, datetime):
        return value.strftime("%Y-%m")
    raw = str(value or "").strip()
    if not raw:
        return "Undated"

    # ISO date/time, including YYYY-MM-DD and YYYY-MM.
    if re.match(r"^\d{4}-\d{2}", raw):
        return raw[:7]

    # UI date format: DD-MM-YYYY.
    match = re.match(r"^(\d{2})-(\d{2})-(\d{4})$", raw)
    if match:
        day, month_number, year = map(int, match.groups())
        if 1 <= month_number <= 12 and 1 <= day <= 31:
            return f"{year:04d}-{month_number:02d}"

    # Common slash-separated day-first date.
    match = re.match(r"^(\d{2})/(\d{2})/(\d{4})$", raw)
    if match:
        day, month_number, year = map(int, match.groups())
        if 1 <= month_number <= 12 and 1 <= day <= 31:
            return f"{year:04d}-{month_number:02d}"

    return "Undated"


def _report_amount(value) -> float:
    try:
        amount = float(value or 0)
        return round(amount, 2) if amount == amount else 0.0
    except (TypeError, ValueError):
        return 0.0


async def _vendor_profit_loss_payload(vendor_id: str, month: str, wedding_id: Optional[str] = None):
    wedding_query = {"vendor_id": vendor_id}
    if wedding_id:
        wedding_query["id"] = wedding_id

    weddings = await db.vendor_weddings.find(
        wedding_query, {"_id": 0, "id": 1, "name": 1, "wedding_name": 1}
    ).to_list(500)
    wedding_map = {
        item["id"]: item.get("wedding_name") or item.get("name") or "Wedding"
        for item in weddings if item.get("id")
    }
    wedding_ids = list(wedding_map.keys())

    if not wedding_ids:
        return {
            "month": month, "income": 0, "expenses": 0, "net_profit": 0,
            "invoice_balance_due": 0, "by_wedding": [], "by_month": [],
            "expenses_by_category": [],
        }

    standalone_payments = await db.vendor_wedding_payments.find(
        {"vendor_id": vendor_id, "wedding_id": {"$in": wedding_ids}},
        {"_id": 0},
    ).to_list(5000)
    expenses = await db.vendor_wedding_expenses.find(
        {"vendor_id": vendor_id, "wedding_id": {"$in": wedding_ids}},
        {"_id": 0},
    ).to_list(5000)
    invoices = await db.vendor_wedding_invoices.find(
        {"vendor_id": vendor_id, "wedding_id": {"$in": wedding_ids}},
        {"_id": 0},
    ).to_list(5000)

    # Invoice receipts are stored inside each invoice's `payments` array,
    # not in vendor_wedding_payments. Include both sources in the report.
    # Invoice receipts are not mirrored into the standalone payments
    # collection by the current receipt endpoint, so this does not double-count
    # payments created through the invoice receipt workflow.
    income_records = []
    for payment in standalone_payments:
        income_records.append({
            "wedding_id": payment.get("wedding_id"),
            "amount": _report_amount(payment.get("amount")),
            "payment_date": payment.get("payment_date"),
            "payment_type": str(payment.get("payment_type") or "payment").lower(),
        })

    for invoice in invoices:
        for receipt in invoice.get("payments") or []:
            income_records.append({
                "wedding_id": invoice.get("wedding_id"),
                "amount": _report_amount(receipt.get("amount")),
                "payment_date": receipt.get("payment_date"),
                "payment_type": "payment",
            })

    monthly_payments = [
        p for p in income_records
        if _record_month(p.get("payment_date")) == month
    ]
    monthly_expenses = [
        e for e in expenses
        if _record_month(e.get("expense_date")) == month
    ]

    def payment_value(payment):
        amount = _report_amount(payment.get("amount"))
        return -amount if payment.get("payment_type") == "refund" else amount

    income = round(sum(payment_value(p) for p in monthly_payments), 2)
    expense_total = round(sum(_report_amount(e.get("amount")) for e in monthly_expenses), 2)
    invoice_balance_due = round(sum(
        max(
            _report_amount(i.get("balance_amount"))
            if i.get("balance_amount") is not None
            else _report_amount(i.get("total_amount")) - _report_amount(i.get("paid_amount")),
            0,
        )
        for i in invoices
    ), 2)

    by_wedding = []
    for current_id, wedding_name in wedding_map.items():
        wedding_income = round(sum(
            payment_value(p) for p in monthly_payments
            if p.get("wedding_id") == current_id
        ), 2)
        wedding_expenses = round(sum(
            _report_amount(e.get("amount")) for e in monthly_expenses
            if e.get("wedding_id") == current_id
        ), 2)
        if wedding_income or wedding_expenses:
            by_wedding.append({
                "wedding_id": current_id,
                "wedding_name": wedding_name,
                "income": wedding_income,
                "expenses": wedding_expenses,
                "net_profit": round(wedding_income - wedding_expenses, 2),
            })

    monthly_totals = {}
    for payment in income_records:
        key = _record_month(payment.get("payment_date"))
        monthly_totals.setdefault(key, {"income": 0.0, "expenses": 0.0})
        monthly_totals[key]["income"] += payment_value(payment)
    for expense in expenses:
        key = _record_month(expense.get("expense_date"))
        monthly_totals.setdefault(key, {"income": 0.0, "expenses": 0.0})
        monthly_totals[key]["expenses"] += _report_amount(expense.get("amount"))
    by_month = [
        {
            "month": key,
            "income": round(value["income"], 2),
            "expenses": round(value["expenses"], 2),
            "net_profit": round(value["income"] - value["expenses"], 2),
        }
        for key, value in sorted(monthly_totals.items(), key=lambda item: item[0])
    ]

    categories = {}
    for expense in monthly_expenses:
        category = str(expense.get("category") or "General").strip() or "General"
        categories[category] = categories.get(category, 0.0) + _report_amount(expense.get("amount"))
    expenses_by_category = [
        {"category": key, "amount": round(value, 2)}
        for key, value in sorted(categories.items(), key=lambda item: item[0].lower())
    ]

    return {
        "month": month,
        "income": income,
        "expenses": expense_total,
        "net_profit": round(income - expense_total, 2),
        "invoice_balance_due": invoice_balance_due,
        "by_wedding": by_wedding,
        "by_month": by_month,
        "expenses_by_category": expenses_by_category,
    }

@api_router.get("/vendor/profit-loss")
async def vendor_profit_loss(
    month: Optional[str] = Query(None),
    wedding_id: Optional[str] = Query(None),
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    report_month = _report_month(month)
    if wedding_id:
        await _get_vendor_wedding(wedding_id, vendor["id"])
    return await _vendor_profit_loss_payload(vendor["id"], report_month, wedding_id)


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


# ================= WEDDING INVOICES & RECEIPTS =================

def _invoice_status(total_amount: float, paid_amount: float, due_date: str) -> str:
    balance = max(round(total_amount - paid_amount, 2), 0)
    if balance <= 0:
        return "paid"
    if due_date:
        try:
            due = datetime.fromisoformat(str(due_date).replace("Z", "+00:00")).date()
            if due < datetime.now(timezone.utc).date():
                return "overdue"
        except (TypeError, ValueError):
            pass
    return "partial" if paid_amount > 0 else "unpaid"


def _invoice_response(invoice: dict) -> dict:
    if not invoice:
        return {}
    result = {key: value for key, value in invoice.items() if key != "_id"}
    result.setdefault("payments", [])
    result["line_items"] = result.get("line_items") or []
    result["total_amount"] = round(float(result.get("total_amount") or 0), 2)
    result["paid_amount"] = round(float(result.get("paid_amount") or 0), 2)
    result["balance_amount"] = round(
        max(result["total_amount"] - result["paid_amount"], 0), 2
    )
    result["status"] = _invoice_status(
        result["total_amount"], result["paid_amount"], result.get("due_date") or ""
    )
    return result


def _calculate_invoice(payload: WeddingInvoiceIn) -> dict:
    line_items = []
    subtotal = 0.0
    for item in payload.line_items or []:
        description = (item.description or "").strip()
        quantity = float(item.quantity)
        unit_price = float(item.unit_price)
        if not description:
            continue
        if quantity <= 0 or unit_price < 0:
            raise HTTPException(
                status_code=400,
                detail="Each invoice line needs a description, positive quantity, and non-negative price.",
            )
        amount = round(quantity * unit_price, 2)
        subtotal += amount
        line_items.append({
            "description": description[:300],
            "quantity": quantity,
            "unit": (item.unit or "service").strip()[:40] or "service",
            "unit_price": round(unit_price, 2),
            "amount": amount,
        })

    if not line_items:
        raise HTTPException(status_code=400, detail="Add at least one valid invoice line item.")

    discount_type = (payload.discount_type or "amount").strip().lower()
    if discount_type not in {"amount", "percent"}:
        discount_type = "amount"
    discount_value = max(float(payload.discount_value or 0), 0)
    discount_amount = (
        subtotal * min(discount_value, 100) / 100
        if discount_type == "percent"
        else min(discount_value, subtotal)
    )
    taxable_amount = max(subtotal - discount_amount, 0)
    tax_percent = min(max(float(payload.tax_percent or 0), 0), 100)
    tax_amount = taxable_amount * tax_percent / 100
    total_amount = round(taxable_amount + tax_amount, 2)

    return {
        "title": (payload.title or "Invoice").strip()[:160] or "Invoice",
        "client_name": (payload.client_name or "").strip()[:160],
        "issue_date": (payload.issue_date or "").strip(),
        "due_date": (payload.due_date or "").strip(),
        "line_items": line_items,
        "discount_type": discount_type,
        "discount_value": round(discount_value, 2),
        "discount_amount": round(discount_amount, 2),
        "tax_percent": round(tax_percent, 2),
        "tax_amount": round(tax_amount, 2),
        "subtotal": round(subtotal, 2),
        "total_amount": total_amount,
        "terms": (payload.terms or "").strip()[:4000],
        "notes": (payload.notes or "").strip()[:4000],
    }


@api_router.get("/vendor/weddings/{wedding_id}/invoices")
async def vendor_get_wedding_invoices(
    wedding_id: str,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    invoices = await db.vendor_wedding_invoices.find(
        {"wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(500)
    return {"invoices": [_invoice_response(item) for item in invoices]}


@api_router.post("/vendor/weddings/{wedding_id}/invoices")
async def vendor_create_wedding_invoice(
    wedding_id: str,
    payload: WeddingInvoiceIn,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    wedding = await _get_vendor_wedding(wedding_id, vendor["id"])
    calculated = _calculate_invoice(payload)

    now = datetime.now(timezone.utc).isoformat()
    invoice_count = await db.vendor_wedding_invoices.count_documents(
        {"vendor_id": vendor["id"]}
    )
    invoice = {
        "id": str(uuid.uuid4()),
        "invoice_number": f"WED-{datetime.now(timezone.utc).strftime('%Y%m')}-{invoice_count + 1:04d}",
        "wedding_id": wedding_id,
        "vendor_id": vendor["id"],
        "wedding_name": wedding.get("name") or wedding.get("wedding_name") or "",
        **calculated,
        "payments": [],
        "paid_amount": 0.0,
        "balance_amount": calculated["total_amount"],
        "status": _invoice_status(calculated["total_amount"], 0, calculated["due_date"]),
        "created_at": now,
        "updated_at": now,
    }
    await db.vendor_wedding_invoices.insert_one(invoice.copy())
    return _invoice_response(invoice)


@api_router.put("/vendor/weddings/{wedding_id}/invoices/{invoice_id}")
async def vendor_update_wedding_invoice(
    wedding_id: str,
    invoice_id: str,
    payload: WeddingInvoiceIn,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])
    existing = await db.vendor_wedding_invoices.find_one(
        {"id": invoice_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Invoice not found")

    calculated = _calculate_invoice(payload)
    paid_amount = round(float(existing.get("paid_amount") or 0), 2)
    if calculated["total_amount"] < paid_amount:
        raise HTTPException(
            status_code=400,
            detail="Invoice total cannot be less than payments already recorded.",
        )
    updates = {
        **calculated,
        "balance_amount": round(calculated["total_amount"] - paid_amount, 2),
        "status": _invoice_status(calculated["total_amount"], paid_amount, calculated["due_date"]),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.vendor_wedding_invoices.update_one(
        {"id": invoice_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"$set": updates},
    )
    updated = await db.vendor_wedding_invoices.find_one(
        {"id": invoice_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    )
    return _invoice_response(updated)


@api_router.delete("/vendor/weddings/{wedding_id}/invoices/{invoice_id}")
async def vendor_delete_wedding_invoice(
    wedding_id: str,
    invoice_id: str,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])
    result = await db.vendor_wedding_invoices.delete_one(
        {"id": invoice_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return {"success": True}


@api_router.post("/vendor/weddings/{wedding_id}/invoices/{invoice_id}/payments")
async def vendor_add_invoice_payment(
    wedding_id: str,
    invoice_id: str,
    payload: WeddingInvoicePaymentIn,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])
    invoice = await db.vendor_wedding_invoices.find_one(
        {"id": invoice_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    amount = round(float(payload.amount), 2)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero.")
    balance = round(
        float(invoice.get("total_amount") or 0) - float(invoice.get("paid_amount") or 0), 2
    )
    if amount > balance + 0.01:
        raise HTTPException(status_code=400, detail="Payment cannot exceed the invoice's outstanding balance.")

    now = datetime.now(timezone.utc).isoformat()
    payments = invoice.get("payments") or []
    receipt_number = f"REC-{datetime.now(timezone.utc).strftime('%Y%m')}-{len(payments) + 1:04d}"
    receipt = {
        "id": str(uuid.uuid4()),
        "receipt_number": receipt_number,
        "amount": amount,
        "payment_date": (payload.payment_date or "").strip(),
        "payment_method": (payload.payment_method or "Other").strip()[:60] or "Other",
        "notes": (payload.notes or "").strip()[:1000],
        "created_at": now,
    }
    payments.append(receipt)
    paid_amount = round(float(invoice.get("paid_amount") or 0) + amount, 2)
    updates = {
        "payments": payments,
        "paid_amount": paid_amount,
        "balance_amount": round(max(float(invoice.get("total_amount") or 0) - paid_amount, 0), 2),
        "status": _invoice_status(float(invoice.get("total_amount") or 0), paid_amount, invoice.get("due_date") or ""),
        "updated_at": now,
    }
    await db.vendor_wedding_invoices.update_one(
        {"id": invoice_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"$set": updates},
    )
    updated = await db.vendor_wedding_invoices.find_one(
        {"id": invoice_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    )
    return {"success": True, "receipt": receipt, "invoice": _invoice_response(updated)}



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

ELEMENT_STATUS_VALUES = {"planned", "in_progress", "ready", "completed"}
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


def _element_response(element: dict, wedding_id: str, vendor_id: str) -> dict:
    return {
        "id": element.get("id"),
        "wedding_id": wedding_id,
        "vendor_id": vendor_id,
        "name": element.get("name", ""),
        "category": element.get("category", "General"),
        "quantity": element.get("quantity", 1),
        "unit": element.get("unit", "pcs"),
        "dimensions": element.get("dimensions", ""),
        "area": element.get("area", ""),
        "status": element.get("status", "planned"),
        "notes": element.get("notes", ""),
        "created_at": element.get("created_at"),
        "updated_at": element.get("updated_at"),
    }


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

    status = (payload.status or "planned").strip().lower()
    if status not in ELEMENT_STATUS_VALUES:
        raise HTTPException(status_code=400, detail="Invalid element status")

    category = (payload.category or "General").strip() or "General"
    unit = (payload.unit or "pcs").strip() or "pcs"
    dimensions = (payload.dimensions or "").strip()
    area = (payload.area or "").strip()
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
        "area": area,
        "status": status,
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

    if "area" in data:
        updates["area"] = (data["area"] or "").strip()

    if "status" in data:
        status = (data["status"] or "planned").strip().lower()
        if status not in ELEMENT_STATUS_VALUES:
            raise HTTPException(status_code=400, detail="Invalid element status")
        updates["status"] = status

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


# ================= WEDDING DOCUMENTS =================
WEDDING_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024
WEDDING_DOCUMENT_ALLOWED_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".csv",
    ".txt",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}

def _document_extension(filename: str) -> str:
    return Path(filename or "").suffix.lower()

def _document_response(document: dict) -> dict:
    # Keep the API shape simple for the frontend while retaining compatibility
    # with common names used by document cards/download buttons.
    return {
        "id": document.get("id"),
        "wedding_id": document.get("wedding_id"),
        "vendor_id": document.get("vendor_id"),
        "title": document.get("title") or document.get("file_name") or "Document",
        "category": document.get("category") or "General",
        "file_name": document.get("file_name") or "document",
        "filename": document.get("file_name") or "document",
        "file_type": document.get("file_type") or "application/octet-stream",
        "content_type": document.get("file_type") or "application/octet-stream",
        "file_size": int(document.get("file_size") or 0),
        "size": int(document.get("file_size") or 0),
        "url": document.get("data_url"),
        "data_url": document.get("data_url"),
        "uploaded_at": document.get("uploaded_at") or document.get("created_at"),
        "created_at": document.get("created_at"),
        "updated_at": document.get("updated_at"),
    }


@api_router.get("/vendor/weddings/{wedding_id}/documents")
async def vendor_get_wedding_documents(
    wedding_id: str,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    documents = await db.vendor_wedding_documents.find(
        {"wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(200)

    return {"documents": [_document_response(document) for document in documents]}


@api_router.post("/vendor/weddings/{wedding_id}/documents")
async def vendor_upload_wedding_document(
    wedding_id: str,
    file: UploadFile = File(...),
    title: str = Form(""),
    category: str = Form("General"),
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    filename = (file.filename or "").strip()
    if not filename:
        raise HTTPException(status_code=400, detail="Please select a document")

    extension = _document_extension(filename)
    if extension not in WEDDING_DOCUMENT_ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(WEDDING_DOCUMENT_ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported document type. Allowed: {allowed}",
        )

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The selected document is empty")

    if len(content) > WEDDING_DOCUMENT_MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Document must be 10 MB or smaller",
        )

    import base64

    content_type = file.content_type or "application/octet-stream"
    data_url = f"data:{content_type};base64,{base64.b64encode(content).decode('ascii')}"
    now = datetime.now(timezone.utc).isoformat()

    clean_title = (title or "").strip()
    if not clean_title:
        clean_title = Path(filename).stem or "Document"

    clean_category = (category or "General").strip() or "General"

    document = {
        "id": str(uuid.uuid4()),
        "wedding_id": wedding_id,
        "vendor_id": vendor["id"],
        "title": clean_title,
        "category": clean_category,
        "file_name": filename,
        "file_type": content_type,
        "file_size": len(content),
        "data_url": data_url,
        "uploaded_at": now,
        "created_at": now,
        "updated_at": now,
    }

    await db.vendor_wedding_documents.insert_one(document.copy())
    return _document_response(document)


@api_router.put("/vendor/weddings/{wedding_id}/documents/{document_id}")
async def vendor_update_wedding_document(
    wedding_id: str,
    document_id: str,
    payload: WeddingDocumentUpdateIn,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    updates = {}

    if payload.title is not None:
        title = payload.title.strip()
        if not title:
            raise HTTPException(status_code=400, detail="Document title cannot be empty")
        updates["title"] = title

    if payload.category is not None:
        updates["category"] = payload.category.strip() or "General"

    if not updates:
        document = await db.vendor_wedding_documents.find_one(
            {"id": document_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
            {"_id": 0},
        )
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return _document_response(document)

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = await db.vendor_wedding_documents.update_one(
        {"id": document_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"$set": updates},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")

    document = await db.vendor_wedding_documents.find_one(
        {"id": document_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]},
        {"_id": 0},
    )
    return _document_response(document)


@api_router.delete("/vendor/weddings/{wedding_id}/documents/{document_id}")
async def vendor_delete_wedding_document(
    wedding_id: str,
    document_id: str,
    authorization: str = Header(None),
):
    user = await get_vendor_user(authorization)
    vendor = await _ensure_vendor_profile(user)
    await _get_vendor_wedding(wedding_id, vendor["id"])

    result = await db.vendor_wedding_documents.delete_one(
        {"id": document_id, "wedding_id": wedding_id, "vendor_id": vendor["id"]}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"success": True}



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
    """Search WEDORA vendor profiles and public web listings.

    Public search uses Tavily's web search endpoint. TAVILY_API_KEY is optional
    for keyless trials, but configuring a key is recommended for reliable use.
    """
    query = {}
    if category:
        query["category"] = {"$regex": re.escape(category), "$options": "i"}
    if city:
        query["city"] = {"$regex": re.escape(city), "$options": "i"}
    if search:
        query["$or"] = [
            {"business_name": {"$regex": re.escape(search), "$options": "i"}},
            {"category": {"$regex": re.escape(search), "$options": "i"}},
            {"city": {"$regex": re.escape(search), "$options": "i"}},
            {"description": {"$regex": re.escape(search), "$options": "i"}},
        ]

    registered = await db.vendors.find(
        query, {"_id": 0, "password_hash": 0}
    ).to_list(200)
    registered.sort(
        key=lambda vendor: (
            str(vendor.get("plan", vendor.get("subscription_plan", ""))).lower()
            not in {"pro", "premium", "platinum"},
            str(vendor.get("created_at", "")),
        )
    )

    # Convert the selected filters into a focused public-web query. Explicit
    # city/category filters are included so Jaipur searches do not return India-wide results.
    terms = [str(search or "").strip(), str(category or "").strip()]
    terms = [term for term in terms if term]
    if not terms:
        terms = ["wedding vendors"]
    web_query = " ".join(dict.fromkeys(terms))
    if city:
        web_query += f" in {city}, India"
    else:
        web_query += " in India"
    web_query += " wedding business contact website"

    public_vendors = []
    sources = []
    web_error = None
    try:
        tavily_key = (os.environ.get("TAVILY_API_KEY") or "").strip()
        headers = {"Content-Type": "application/json"}
        if tavily_key:
            headers["Authorization"] = f"Bearer {tavily_key}"
        async with httpx.AsyncClient(timeout=20.0) as http:
            response = await http.post(
                "https://api.tavily.com/search",
                headers=headers,
                json={
                    "query": web_query,
                    "search_depth": "basic",
                    "topic": "general",
                    "max_results": 10,
                    "include_answer": False,
                    "include_raw_content": False,
                    "country": "india",
                },
            )
            response.raise_for_status()
            web_data = response.json()

        for index, item in enumerate(web_data.get("results") or []):
            title = str(item.get("title") or "Wedding Vendor Listing").strip()
            url = str(item.get("url") or "").strip()
            content = str(item.get("content") or "").strip()
            if not url:
                continue
            # Search snippets are not verified business records; label them as
            # public web listings and avoid fabricating phone numbers or ratings.
            public_vendors.append({
                "id": f"web-{index}-{uuid.uuid5(uuid.NAMESPACE_URL, url).hex[:12]}",
                "name": title,
                "business_name": title,
                "category": category or "Wedding Vendor",
                "city": city or "India",
                "description": content[:700] or "Public web result. Open the source to view business details.",
                "website": url,
                "website_url": url,
                "source_url": url,
                "source_name": "Public web search",
                "verified": False,
                "wedora_verified": False,
                "public_listing": True,
                "listing_type": "web",
                "plan": "",
            })
            sources.append({"title": title, "url": url})
    except Exception as exc:
        logging.warning("Public vendor web search unavailable: %s", exc)
        web_error = "Public web search is temporarily unavailable. Showing registered WEDORA vendors where available."

    # Keep WEDORA profiles first; append deduplicated public listings.
    known_urls = {
        str(v.get("website") or v.get("website_url") or v.get("source_url") or "").lower().rstrip("/")
        for v in registered
    }
    known_names = {str(v.get("business_name") or v.get("name") or "").lower().strip() for v in registered}
    merged = list(registered)
    for vendor in public_vendors:
        url_key = str(vendor.get("website") or "").lower().rstrip("/")
        name_key = str(vendor.get("name") or "").lower().strip()
        if url_key in known_urls or name_key in known_names:
            continue
        merged.append(vendor)
        known_urls.add(url_key)
        known_names.add(name_key)

    return {
        "vendors": merged,
        "sources": sources,
        "total": len(merged),
        "registered_count": len(registered),
        "web_count": len(merged) - len(registered),
        "web_search_error": web_error,
    }


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


@api_router.post("/venues/search")
async def search_venues(payload: dict):
    """Search WEDORA venue records and public web listings.

    Natural-language requirements are converted into a focused web query.
    Public results are clearly marked as unverified; budget, capacity and room
    details are only shown when present in the source snippet.
    """
    raw_query = str(
        payload.get("query") or payload.get("search") or payload.get("search_query")
        or payload.get("keyword") or payload.get("q") or ""
    ).strip()
    city = str(payload.get("city") or payload.get("location") or "").strip()
    category = str(payload.get("category") or payload.get("venue_type") or payload.get("type") or "").strip()
    guests = payload.get("guests") or payload.get("capacity")
    rooms = payload.get("rooms") or payload.get("room_count")
    budget = payload.get("budget") or payload.get("max_budget")

    # Use the natural-language query when no structured fields were extracted.
    constraints = []
    if category:
        constraints.append(f"{category} wedding venue")
    else:
        constraints.append("wedding venue")
    if city:
        constraints.append(f"in {city}, India")
    else:
        constraints.append("in India")
    if guests:
        constraints.append(f"for {guests} guests")
    if rooms:
        constraints.append(f"hotel resort with {rooms} rooms")
    if budget:
        amount = int(float(budget)) if str(budget).replace('.', '', 1).isdigit() else budget
        constraints.append(f"under budget ₹{amount}")
    if raw_query:
        constraints.append(raw_query)
    web_query = " ".join(dict.fromkeys(constraints)) + " venue address website wedding"

    registered = []
    try:
        registered = await db.venues.find({}, {"_id": 0}).limit(500).to_list(length=500)
    except Exception as exc:
        logging.warning("Venue collection lookup failed: %s", exc)

    public_venues = []
    sources = []
    web_error = None
    try:
        tavily_key = (os.environ.get("TAVILY_API_KEY") or "").strip()
        headers = {"Content-Type": "application/json"}
        if tavily_key:
            headers["Authorization"] = f"Bearer {tavily_key}"
        async with httpx.AsyncClient(timeout=20.0) as http:
            response = await http.post(
                "https://api.tavily.com/search",
                headers=headers,
                json={
                    "query": web_query,
                    "search_depth": "basic",
                    "topic": "general",
                    "max_results": 20,
                    "include_answer": False,
                    "include_raw_content": False,
                    "country": "india",
                },
            )
            response.raise_for_status()
            web_data = response.json()
        for index, item in enumerate(web_data.get("results") or []):
            title = str(item.get("title") or "Wedding Venue Listing").strip()
            url = str(item.get("url") or "").strip()
            content = str(item.get("content") or "").strip()
            if not url:
                continue
            public_venues.append({
                "id": f"web-venue-{index}-{uuid.uuid5(uuid.NAMESPACE_URL, url).hex[:12]}",
                "name": title,
                "city": city or "India",
                "location": city or "India",
                "category": category or "Venue",
                "type": category or "Venue",
                "description": content[:900] or "Public web result. Open the source to confirm venue details.",
                "source_url": url,
                "website": url,
                "source_name": "Public web search",
                "status": "Public listing — unverified",
                "verified": False,
                "public_listing": True,
                "listing_type": "web",
                "capacity": "Not listed",
                "rooms": "Not listed",
                "starting_price": 0,
                "price_label": "Check source",
            })
            sources.append({"title": title, "url": url})
    except Exception as exc:
        logging.warning("Public venue web search unavailable: %s", exc)
        web_error = "Public web search is temporarily unavailable. Showing registered WEDORA venues where available."

    def matches_city(venue):
        if not city:
            return True
        venue_city = str(venue.get("city") or venue.get("location") or venue.get("address") or "").lower()
        return city.lower() in venue_city

    # City-filter registered records; public web search is already city-scoped.
    registered = [v for v in registered if matches_city(v)]
    seen = {str(v.get("source_url") or v.get("website") or "").lower().rstrip("/") for v in registered}
    seen_names = {str(v.get("name") or v.get("business_name") or "").lower().strip() for v in registered}
    merged = list(registered)
    for venue in public_venues:
        url_key = str(venue.get("source_url") or "").lower().rstrip("/")
        name_key = str(venue.get("name") or "").lower().strip()
        if url_key in seen or name_key in seen_names:
            continue
        merged.append(venue)
        seen.add(url_key)
        seen_names.add(name_key)

    return {
        "success": True,
        "venues": merged,
        "results": merged,
        "sources": sources,
        "total": len(merged),
        "registered_count": len(registered),
        "web_count": len(merged) - len(registered),
        "web_search_error": web_error,
        "search_query": web_query,
        "filters": {"city": city or None, "venue_type": category or None, "guests": guests, "rooms": rooms, "budget": budget},
    }

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
