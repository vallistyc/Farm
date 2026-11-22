# Harga Jual Petani (iASI 2026 prototype)

Mobile-first PWA that helps smallholder farmers set a selling price from real
costs, hidden costs, official daily market prices, and a short AI advisory.
Competition prototype only, not for real farm data.

Brief: `docs/Brief_Document_Harga_Jual_Petani_v1.1.pdf`

## Status

| Area | Status |
| --- | --- |
| Farm, fields, crops | Live logic, localStorage cache, Supabase sync when configured |
| Cost entry wizard + hidden cost checklist | Live |
| Pricing calculator and recommendation | Live, pure module with unit tests |
| AI advice | Live with OpenRouter, Gemini, or Groq keys; server-side route only |
| Price Radar | Two live feeds behind a Malaysia/Indonesia segmented toggle: Malaysia PriceCatcher (retail, blue) and Indonesia Bapanas (producer, red). Malaysia keeps seed series for padi and maize |
| Community | Live chat per room via Supabase (`community_messages`) |
| Language and currency | Live settings (en, id, ms, jv; MYR default) |
| Demo login (phone + PIN) | Seeded accounts, no OTP |
| Offline, environmental data, admin | Out of scope for this prototype |

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 in a mobile viewport (360px is the target).

```bash
npm test        # pricing + cloud merge unit tests (node:test)
npm run lint
npm run build
npm start       # production, needed to test the service worker
```

## Demo accounts

| Farmer | Phone | PIN |
| --- | --- | --- |
| Ahmad bin Ali | 0123456789 | 1234 |
| Siti Rahayu | 08123456789 | 4321 |

Tap an account on the login screen to fill the form.

## AI advisor setup

The browser calls `/api/ai-advice`; provider keys stay on the server and are
never shipped to the client. Providers are tried in order and skipped when the
key is empty: OpenRouter (free priority models) → Google Gemini → Groq.

```bash
cp .env.example .env.local
# edit .env.local and set at least one provider key
```

| Variable | Required | Description |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | No | Tried first. Free models from `lib/ai-providers.ts` by default. |
| `OPENROUTER_MODELS` | No | Comma-separated model IDs, tried in order. |
| `OPENROUTER_MAX_ATTEMPTS` | No | How many OpenRouter models to try. Default 3, so the fallback stays fast. |
| `GEMINI_API_KEY` | No | Second fallback. Default model `gemini-3.1-flash-lite`. |
| `GEMINI_MODEL` | No | Override the Gemini model. |
| `GROQ_API_KEY` | No | Last fallback. Default model `openai/gpt-oss-120b`. |
| `GROQ_MODEL` | No | Override the Groq model. |

Each attempt has a 15s timeout and the whole chain stops after 45s; the client
waits up to 60s. Free models can be rate limited or temporarily overloaded, so
one failing provider simply moves to the next. With no key configured the route
returns 503 and the app shows a setup message. The advisor receives crop, cost,
price, status, selected language, and display currency context; it is asked to
stay under 120 words and to decline non-farming topics. It also receives the
market source and observation date, so it can say whether the price is official
retail data or a sample.

## Cloud data (Supabase)

Farms and crops stay in localStorage and, when Supabase is configured, are also
copied to two tables (`farms`, `crops`) keyed by the demo account. Logging in
pulls the cloud copy, merges it with the phone copy (the newest crop wins), then
pushes the result. Without a connection the app keeps working locally. Community
chat uses the same project (`community_messages`). The cron route stores
PriceCatcher history in `market_prices` (Malaysia) and Bapanas history in
`market_prices_indonesia` (Indonesia).

1. In Supabase, open the SQL editor and run `supabase/schema.sql`.
2. Copy the project URL and anon/publishable key into `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. Restart `npm run dev`. Profile shows the sync state (saved to cloud,
   syncing, this phone only, or failed).

The anon key is public by design. `farms` and `crops` keep permissive demo
policies; `market_prices` and `market_prices_indonesia` allow read plus
insert/update of official rows (the Indonesia table only accepts
`source = 'bapanas'`); and `community_messages` allows read plus insert only, so
messages cannot be edited
or deleted with the public key. Replace all of these with Supabase Auth and
`auth.uid()` policies before storing private farmer data.

## Live market prices (Malaysia + Indonesia)

Price Radar shows two independent official feeds, switched with a
Malaysia/Indonesia segmented control so only one list is on screen at a time.
Each country has its own accent color (blue for Malaysia, red for Indonesia)
and its own source badge and observation date. No free source gives
second-by-second farm-gate prices, so these update once a day.

### Malaysia — PriceCatcher (retail)

- `GET /api/market-prices` returns the current snapshot: per-commodity price,
  source (`pricecatcher` or `seed`), observation date, and a 30-day trend. The
  client re-fetches it every minute, the server caches it for 5–10 minutes, and
  the underlying source updates once a day; the client also keeps the last copy
  for offline use.
- `GET /api/cron/market-prices` downloads the current and previous monthly CSV,
  keeps only mapped item codes, takes the daily median across premises, and
  upserts into `market_prices`. `vercel.json` runs it daily at 09:15 MYT.
- `GET /api/cron/market-prices?month=YYYY-MM` backfills one month. Repeat it for
  the months you want; `market_prices` is the long horizon store (target 30
  months) for trend and forecasting work.
- Mapping: spinach = `BAYAM HIJAU/MERAH`, chilli = `CILI MERAH` (Kulai/Minyak),
  banana = `PISANG BERANGAN/EMAS`. PriceCatcher has no farm-gate padi or fresh
  maize item, so those two stay on the seed series and are labeled "sample".
- PriceCatcher is **retail** data. It is a market reference, not the farm-gate
  price a farmer receives; the UI and AI prompt say so. Replace or blend it with
  FAMA wholesale data before making farm-gate claims.
- If the download fails and no history exists, the API serves the seed series.
  The UI always shows the source and observation date, so sample data is never
  presented as live.

### Indonesia — Bapanas Panel Harga (producer)

- Source: the public Bapanas endpoint
  `api-panelhargav2.badanpangan.go.id/api/front/harga-pangan-informasi` at
  `level_harga_id=1` (producer level), national daily price in IDR. It needs no
  API key. Covered commodities: padi, maize, and red chilli; spinach and banana
  are not in this feed, so they only appear in the Malaysia section.
- Prices are shown **natively in IDR** (`formatIdr`); unlike the farm's own MYR
  money they are not converted. The card labels the source "Harga produsen"
  (producer price) and the change "sejak kemarin" (vs yesterday).
- `GET /api/cron/market-prices?country=id` fetches today (falling back to the
  previous one or two days) and upserts into `market_prices_indonesia`.
- `GET /api/cron/market-prices?country=id&days=N` (N = 1–60) backfills N days.
- The default cron (`GET /api/cron/market-prices`) refreshes Malaysia and
  Indonesia in parallel; an Indonesia failure is logged and does not block the
  Malaysia refresh.
- If Bapanas or the table is unavailable, the Indonesia section falls back to
  the stored history or shows an honest "unavailable" note. It never shows
  sample data.
- Caveat: producer-level national reference prices, not the exact price a
  specific farmer will get at a specific market.

Environment: the server uses the existing `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` for both market tables. Set `CRON_SECRET` in
production so only Vercel Cron can trigger the refresh route.

## Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, add a new project and import the repository. Next.js is detected automatically.
3. Add at least one of `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`,
   plus `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `CRON_SECRET` for Production and Preview.
4. Deploy. The Supabase tables are optional; without the two Supabase variables
   the app runs local-only, Malaysia falls back to the seed series, and the
   Indonesia section shows its unavailable note.
5. Open the deployed HTTPS URL on a phone and confirm the manifest, install prompt, and service worker.

Local production check: `npm run build && npm start`, then open port 3000. The
service worker only registers in production builds.

## 2-minute demo

See `docs/demo-script.md` for the timed flow, exact cost numbers, and reset
instructions. Short version: log in as Ahmad, add a padi crop, enter costs
(including hidden ones), open the recommendation, ask the AI advisor, compare the
official Malaysia retail and Indonesia producer prices with your minimum in
Price Radar, then switch language and currency in Profile.

## Structure

```
app/          routes (tabs, farm, radar, AI advice, API route, PWA manifest)
components/   app shell, navigation, forms, charts, UI primitives
i18n/         typed dictionaries (en, id, ms, jv)
lib/          pricing, farm model/store, commodities, market, AI request, currency
data/         seeded JSON (commodities, demo farmers, initial field)
supabase/     SQL schema and demo RLS for farms, crops, market prices (MY/ID), chat
docs/         brief, demo script, cost catalog, Javanese review list
public/       icons and service worker
```

## Notes

- All money is stored in MYR; the currency setting only changes display values
  using a fixed fallback rate table.
- Farm data lives in this browser's localStorage under `hjp.*`. Clearing site
  data resets the local copy; when Supabase is configured, the next login pulls
  the cloud copy again.
- Javanese uses simple ngoko and needs native review. Every jv string is listed
  in `docs/jv-review.md`.
- Malaysia prices come from PriceCatcher when available and fall back to the
  seed series. Indonesia prices come from Bapanas and are shown in IDR; when it
  is unavailable the section says so instead of showing sample data. Each row
  shows its source and observation date.
- Community rooms are live chat stored in Supabase `community_messages`; the
  app never shows sample messages. If the table is missing, the room says so and
  points back to `supabase/schema.sql`.
- The cost wizard suggests common direct and labour cost labels per commodity
  from `lib/cost-catalog.ts`. It only prefills the label; the farmer enters
  amounts. Sources and hidden-cost definitions are in `docs/cost-catalog.md`.
