<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Farmer Selling Price App (Inovathon Prototype)

## Goal
Mobile-first PWA that helps farmers set a selling price for their harvest based on all costs (including hidden costs), current market price, and currency (MYR default). Includes an AI advisor. Full brief: docs/Brief_Document_Harga_Jual_Petani_v1.1.pdf

## Scope
Competition prototype, NOT for real users. Prioritize a polished, working demo of the core flow. Do not over-engineer.
- Live (real logic): Cost Input, Hidden Costs Checklist, Selling Price Calculator, Recommendation, AI Advice, Fields and Crops (simple), Supabase sync for farms/crops, Price Radar from official PriceCatcher data
- Seed fallback: padi and maize keep the JSON sample series because PriceCatcher has no farm-gate padi or fresh maize item; the UI labels the source per commodity
- Static: language switch (en, id, ms, jv), currency (live free API with fallback to fixed rate table)
- Mock or skip: Community Chats (mock UI only), Environmental Info, offline mode, admin panel
- Auth: demo login with phone number + 4-digit PIN, seeded accounts, no OTP

## Stack
Next.js (App Router) + TypeScript + Tailwind CSS, PWA (manifest + simple service worker), daily PriceCatcher prices with JSON seed fallback, farms/crops synced to Supabase Postgres with localStorage as the offline cache, deploy target Vercel.

## Cloud data (Supabase)
- `supabase/schema.sql` creates `farms` and `crops` keyed by `(owner_id, id)`; run it in the Supabase SQL editor.
- The client talks to Supabase REST with the public anon/publishable key only. Never add a service-role key to the client.
- Sync is local-first: localStorage is the cache, login pulls then merges last-write-wins per crop by `updatedAt`, and every change is pushed debounced. No hard deletes.
- RLS in the schema is permissive demo-only. Replace it with Supabase Auth plus `auth.uid()` policies before real user data.

## Market prices (PriceCatcher)
- Source: official KPDN/DOSM PriceCatcher monthly CSV at `storage.data.gov.my`. It is daily retail data, not a real-time or farm-gate feed.
- `lib/market.ts` is the pure layer: item mapping, CSV parsing, daily median, snapshot validation. `lib/market-server.ts` handles download, Supabase history, and fallback.
- `GET /api/market-prices` serves the snapshot the client polls every minute. `GET /api/cron/market-prices` refreshes and stores it; `?month=YYYY-MM` backfills one month. Protect it with `CRON_SECRET` in production.
- `market_prices` in `supabase/schema.sql` is the long-horizon store (target 30 months). It is demo RLS and must be hardened with the rest of the schema.
- Always show the source and observation date. Never present seed data as live. PriceCatcher is retail, so state that it is a market reference, not the farm-gate price.

## UX rules (audience: farmers with low tech literacy, slow internet)
- One task per screen, step-by-step wizard for cost input
- Big touch targets (min 48px), large readable text, icons with labels, minimal text
- Numeric keypad for number inputs, always show unit and currency
- Result status with color and icon: Aman (green), Tipis (amber), Rugi (red)
- Bottom navbar: Home, Farm, PriceRadar, Community, Profile
- Keep bundle small, optimize images, no heavy libraries
- Every user-facing string goes through i18n dictionary (en, id, ms, jv). Default language: id (change if needed)
- Javanese (jv): use simple ngoko, friendly tone, avoid heavy krama inggil. Keep farming and price terms familiar to farmers. Mark jv strings as "needs native review" in a comment or a review list
- Language switcher shows native names: English, Bahasa Indonesia, Bahasa Melayu, Basa Jawa. Selected language is saved and applied to the AI Advice reply

## Pricing logic
- Total Cost = Direct Costs + Labour Costs + Hidden Costs
- Cost per Unit = Total Cost / (Yield x (1 - Loss%))
- Minimum Selling Price (MSP) = Cost per Unit x (1 + Margin), default margin 10%, editable
- Compare MSP with Market Price from Price Radar:
  - Market >= MSP x 1.10: Aman, recommend price near market
  - MSP <= Market < MSP x 1.10: Tipis, recommend price near market with warning
  - Market < MSP: Rugi, show warning and advice (hold sale, find other market, reduce cost)
- Store all money in MYR internally, convert only for display
- Put this logic in one pure, unit-tested module (lib/pricing.ts)

## Hidden costs checklist (seed)
Transport, packaging, post-harvest loss, middleman commission, storage, irrigation water and electricity, equipment depreciation, loan interest, certification, market fee, unpaid family labour.

## AI Advice
Server-side API route only, provider keys in env vars, never exposed to client. Provider order is OpenRouter free models → Gemini → Groq; a failing or rate-limited provider falls through to the next. System prompt: farming and pricing advisor, simple language, max 120 words, reply in the user's selected language (en, id, ms, or jv), use provided crop, cost, and market context, politely decline non-farming topics. The request carries the market source and observation date so the advisor never calls sample data live.

## Conventions
TypeScript strict, small components, no unused dependencies, mobile viewport first (test at 360px width), clear folder structure (app/, components/, lib/, data/, i18n/). After each task: run build and lint, fix errors, summarize what changed.

