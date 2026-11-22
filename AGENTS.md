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
- Live (real logic): Cost Input, Hidden Costs Checklist, Selling Price Calculator, Recommendation, AI Advice, Fields and Crops (simple), Supabase sync for farms/crops, Price Radar from official Malaysia (PriceCatcher) and Indonesia (Bapanas) data, Community chat per room stored in Supabase
- Seed fallback: Malaysian padi and maize keep the JSON sample series because PriceCatcher has no farm-gate padi or fresh maize item; the UI labels the source per commodity
- Static: language switch (en, id, ms, jv), currency (live free API with fallback to fixed rate table)
- Mock or skip: Environmental Info, offline mode, admin panel
- Auth: demo login with phone number + 4-digit PIN, seeded accounts, no OTP

## Stack
Next.js (App Router) + TypeScript + Tailwind CSS, PWA (manifest + simple service worker), daily Malaysia PriceCatcher and Indonesia Bapanas prices with JSON seed fallback, farms/crops synced to Supabase Postgres with localStorage as the offline cache, deploy target Vercel.

## Cloud data (Supabase)
- `supabase/schema.sql` creates `farms` and `crops` keyed by `(owner_id, id)`, the `market_prices` and `market_prices_indonesia` history tables, and `community_messages`; run it in the Supabase SQL editor.
- The client talks to Supabase REST with the public anon/publishable key only. Never add a service-role key to the client.
- Sync is local-first: localStorage is the cache, login pulls then merges last-write-wins per crop by `updatedAt`, and every change is pushed debounced. No hard deletes.
- RLS in the schema is demo-only: `farms`/`crops` stay permissive for the shared demo accounts, `market_prices` and `market_prices_indonesia` allow read plus official-row insert/update (the Indonesia table only accepts `source = 'bapanas'`), and `community_messages` allows read plus insert only. Replace all of them with Supabase Auth plus `auth.uid()` policies before real user data.

## Market prices (Malaysia + Indonesia)
- Malaysia: official KPDN/DOSM PriceCatcher monthly CSV at `storage.data.gov.my`. It is daily retail data, not a real-time or farm-gate feed.
- Indonesia: public Bapanas `front/harga-pangan-informasi` at `level_harga_id=1` (producer level), national daily IDR price for padi, maize, and chilli. No API key. Displayed natively in IDR (`formatIdr`), never converted from MYR.
- `lib/market.ts` is the pure layer: item mapping, CSV parsing, daily median, Bapanas parsing/merging, snapshot validation. `lib/market-server.ts` handles download, Supabase history, and fallback for both feeds.
- `GET /api/market-prices` serves the combined snapshot the client polls every minute. `GET /api/cron/market-prices` refreshes both; `?month=YYYY-MM` backfills Malaysia, `?country=id` refreshes Indonesia (today or previous days), `?country=id&days=N` (N 1–60) backfills Indonesia. Protect it with `CRON_SECRET` in production.
- `market_prices` (Malaysia) and `market_prices_indonesia` (Indonesia) in `supabase/schema.sql` are the long-horizon stores (target 30 months). They are demo RLS and must be hardened with the rest of the schema.
- Always show the source and observation date. Never present seed data as live. Malaysia PriceCatcher is retail and Indonesia Bapanas is producer-level; state both as market references, not the exact farm-gate price.

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
- Compare MSP with the Malaysia Market Price from Price Radar (farm money is MYR; the Indonesia Bapanas feed is a separate IDR reference and is not used in this comparison):
  - Market >= MSP x 1.10: Aman, recommend price near market
  - MSP <= Market < MSP x 1.10: Tipis, recommend price near market with warning
  - Market < MSP: Rugi, show warning and advice (hold sale, find other market, reduce cost)
- Store all money in MYR internally, convert only for display
- Put this logic in one pure, unit-tested module (lib/pricing.ts)
- Cost suggestions come from `lib/cost-catalog.ts` (per-commodity direct costs, shared labour costs). They only prefill a label so the farmer types the amount; never hardcode amounts. Sources and hidden-cost definitions live in `docs/cost-catalog.md`.

## Hidden costs checklist (seed)
Transport, packaging, post-harvest loss, middleman commission, storage, irrigation water and electricity, equipment depreciation, loan interest, certification, market fee, unpaid family labour.

## AI Advice
Server-side API route only, provider keys in env vars, never exposed to client. Provider order is OpenRouter free models → Gemini → Groq; a failing or rate-limited provider falls through to the next. System prompt: farming and pricing advisor, simple language, max 120 words, reply in the user's selected language (en, id, ms, or jv), use provided crop, cost, and market context, politely decline non-farming topics. The request carries the market source and observation date so the advisor never calls sample data live.

## Conventions
TypeScript strict, small components, no unused dependencies, mobile viewport first (test at 360px width), clear folder structure (app/, components/, lib/, data/, i18n/). After each task: run build and lint, fix errors, summarize what changed.

