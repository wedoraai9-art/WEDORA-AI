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

## Backlog (P0 → P2)
- **P1** Save/share a wedding plan (link + PDF) — needs email or public share.
- **P1** Instagram-ready moodboard export for AI Designer output.
- **P2** Real vendor onboarding/CRM (accounts + Google Auth).
- **P2** Currency toggle (₹ / $ / £) with regional venue data.
- **P2** WhatsApp share for chat responses.

## Next Tasks
- If user asks: add persistent chat sidebar (recent sessions).
- If user asks: expand vendor DB and add booking inquiry email via Resend.
