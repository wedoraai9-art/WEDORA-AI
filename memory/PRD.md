# WEDORA AI — Product Requirements Document

## Problem Statement (verbatim)
Create a premium, modern AI chatbot website called "WEDORA AI" — a wedding-centric AI platform and digital wedding companion. Iridescent pastel liquid-glass aesthetic inspired by the uploaded logo. Apple liquid glass search/chat bar. Single-page responsive experience.

## Architecture
- **Backend**: FastAPI + MongoDB (Motor). Claude Sonnet 5 via `emergentintegrations` + Emergent LLM Universal Key.
- **Frontend**: React 19, Tailwind, Framer-motion-ready, shadcn/ui base. Iridescent liquid-glass design system in `index.css`.
- **Chat**: SSE streaming (`/api/chat/stream`) + non-streaming fallback (`/api/chat`), persisted in Mongo per `session_id`.
- **Design tokens**: pearlescent off-white base, lavender/pink/blush/coral/cyan/cream gradient system.

## User Personas
1. Bride/Groom planning an Indian wedding (primary): dreamy, budget-conscious, guest count 100–500, cities incl. Jaipur, Udaipur, Goa, Delhi, Mumbai, Bangalore.
2. Wedding designer/planner using WEDORA as inspiration engine.

## Core Requirements (static)
- Premium iridescent liquid-glass visual language.
- Functional AI chat (streaming) at hero + everywhere.
- Interactive budget planner (INR).
- AI Wedding Designer (theme, palette, mandap, stage, entrance, table décor, lighting, florals).
- Venue & Vendor Discovery (curated sample data, city/type filters).
- How WEDORA Works, Prompt Examples, Final CTA, Footer.
- Fully responsive.

## Implemented (2026-02-22)
- Backend endpoints: `/api/`, `/api/chat`, `/api/chat/stream` (SSE), `/api/chat/history/{sid}`, `/api/budget/estimate`, `/api/venues`, `/api/vendors`, `/api/designer/generate`.
- Frontend sections: Navigation (floating glass, mobile hamburger), Hero + Apple Liquid Glass chat, Capabilities (8 cards), How It Works (4 steps with gradient connector), AI Designer (JSON-driven cards + palette), Budget Planner (interactive stacked bar + 10 categories), Venue & Vendor Discovery (tabs + filters), Prompt Examples (populate hero input), Final CTA (glowing orb), Footer.
- SSE streaming render fix (immutable state updater to survive React StrictMode double-invocation).
- Design system: Cormorant Garamond display + Plus Jakarta Sans headings + DM Sans body; iridescent gradient text; liquid glass utilities.
- Testing agent verified: backend 8/8, frontend 7/7 flows pass.

## Implemented (2026-09-22) — Chat Engine Upgrade
- Massive premium system prompt (intent classification, wedding-specialist mode, no-hallucination, structured markdown contract).
- PremiumMarkdown renderer (headings, gradient bullets, numbered pills, responsive tables, callout cards, palette swatches).
- Chat controls: textarea + Enter/Shift+Enter, New chat, Retry on error, Share plan.

## Implemented (2026-09-22) — Vendor Marketplace, Share Links, Moodboard Export
- JWT auth (bcrypt) with roles: couple / vendor / admin. Seeded admin + 3 demo vendors. `/app/memory/test_credentials.md`.
- Vendor registration (full business form), public profiles at `/vendor/{slug}` with PREMIUM VENDOR badge.
- Vendor dashboard 7 tabs: Overview (stats + completion), Profile (edit + logo upload + AI profile generator, premium-gated), Portfolio (upload w/ plan photo limits 5/30/∞ via Emergent Object Storage), Leads (NEW LEAD badge, contact/whatsapp/mark contacted/closed), Analytics (plan-gated), Subscription (DEMO MODE plan switcher, payments intentionally skipped per user), Settings.
- Marketplace at `/marketplace` with search + category filter; Request Quote modal → leads DB.
- Admin console `/admin/dashboard`: vendor list, plan switch, featured/published toggles, all leads.
- Save Wedding Link: `POST /api/chat/share` → `/share/{id}` read-only page; Share button in chat with clipboard + prompt fallback.
- Moodboard Export: AI Designer → hidden 1080×1920 portrait canvas → PNG download via html-to-image.
- Plan restrictions enforced server-side (photo limits verified: 6th upload on FREE rejected).
- Testing: iteration_2 backend 14/14, frontend 11/12; iteration_3 retest 2/2 (share toast fix, plan-choose testids).

## Backlog (P0 → P2)
- **P0** Real Razorpay Subscriptions (PRO ₹999 / PREMIUM ₹2,999) — user skipped for now; DEMO switcher is the hook-in point.
- **P1** Vendor inquiry emails (Resend) when a lead is created.
- **P1** Split server.py into routers (auth, vendor, marketplace, admin, chat) — now 1100+ lines.
- **P2** Vendor analytics depth (daily charts), lead email notifications, couple accounts + saved vendors.
- **P2** Currency toggle; WhatsApp voice replies in Hindi/Hinglish.

## Next Tasks
- Razorpay keys from user → wire real subscriptions + webhooks.
- Resend integration for lead notifications.
