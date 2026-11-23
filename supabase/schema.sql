-- Harga Jual Petani - Supabase schema.
-- Run once in the Supabase SQL editor.
--
-- Security: farms, crops, and community_messages are protected by Supabase Auth
-- policies keyed on auth.uid(). The app stores the signed-in user's id in
-- owner_id / author_id and sends that user's access token on every request.
-- market_prices and market_prices_indonesia stay public read (served by the
-- /api routes with the anon key) with source-constrained writes. Enable the
-- Email auth provider before use.

create table if not exists public.farms (
  owner_id text not null,
  id text not null,
  name text not null,
  size_ha numeric not null default 0,
  location text not null default '',
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

create table if not exists public.crops (
  owner_id text not null,
  id text not null,
  farm_id text not null,
  commodity_id text not null,
  planting_date date not null,
  harvest_date date not null,
  yield_kg numeric not null default 0,
  loss_percent numeric not null default 10,
  margin_percent numeric not null default 10,
  costs jsonb not null default '{"direct":[],"labour":[],"hidden":{}}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (owner_id, id),
  constraint crops_farm_fkey
    foreign key (owner_id, farm_id)
    references public.farms (owner_id, id)
    on delete cascade
);

alter table public.farms enable row level security;
alter table public.crops enable row level security;

drop policy if exists "demo anon farms" on public.farms;
drop policy if exists "farms_owner" on public.farms;
create policy "farms_owner"
  on public.farms
  for all
  to authenticated
  using (owner_id = auth.uid()::text)
  with check (owner_id = auth.uid()::text);

drop policy if exists "demo anon crops" on public.crops;
drop policy if exists "crops_owner" on public.crops;
create policy "crops_owner"
  on public.crops
  for all
  to authenticated
  using (owner_id = auth.uid()::text)
  with check (owner_id = auth.uid()::text);

-- Daily market prices ingested from PriceCatcher (KPDN). One row per
-- commodity per observed day. The cron route adds a row set every day, so the
-- table accumulates the multi-month history (target horizon: 30 months) used
-- for trends and forecasting.
create table if not exists public.market_prices (
  commodity_id text not null,
  observed_on date not null,
  price_myr numeric not null check (price_myr > 0),
  source text not null default 'pricecatcher',
  fetched_at timestamptz not null default now(),
  primary key (commodity_id, observed_on)
);

create index if not exists market_prices_observed_on_idx
  on public.market_prices (observed_on desc);

alter table public.market_prices enable row level security;

-- The cron route reads history and upserts official rows, so anon needs
-- select, insert, and update. No delete. Rows must stay marked as official.
drop policy if exists "demo anon market prices" on public.market_prices;
drop policy if exists "market prices read" on public.market_prices;
create policy "market prices read"
  on public.market_prices
  for select
  to anon
  using (true);

drop policy if exists "market prices insert" on public.market_prices;
create policy "market prices insert"
  on public.market_prices
  for insert
  to anon
  with check (source = 'pricecatcher');

drop policy if exists "market prices update" on public.market_prices;
create policy "market prices update"
  on public.market_prices
  for update
  to anon
  using (source = 'pricecatcher')
  with check (source = 'pricecatcher');

-- Daily producer prices from Indonesia's Bapanas Panel Harga. This stays in a
-- separate table because the source, currency (IDR), and commodity coverage
-- differ from PriceCatcher. Bapanas only publishes padi, maize, and chilli from
-- the app's commodity list.
create table if not exists public.market_prices_indonesia (
  commodity_id text not null,
  observed_on date not null,
  price_idr numeric not null check (price_idr > 0),
  source text not null default 'bapanas',
  fetched_at timestamptz not null default now(),
  primary key (commodity_id, observed_on)
);

create index if not exists market_prices_indonesia_observed_on_idx
  on public.market_prices_indonesia (observed_on desc);

alter table public.market_prices_indonesia enable row level security;

-- Same narrow access as the Malaysian table: public history, but rows written
-- through the anon key must stay marked as official Bapanas data.
drop policy if exists "market prices indonesia read"
  on public.market_prices_indonesia;
create policy "market prices indonesia read"
  on public.market_prices_indonesia
  for select
  to anon
  using (true);

drop policy if exists "market prices indonesia insert"
  on public.market_prices_indonesia;
create policy "market prices indonesia insert"
  on public.market_prices_indonesia
  for insert
  to anon
  with check (source = 'bapanas');

drop policy if exists "market prices indonesia update"
  on public.market_prices_indonesia;
create policy "market prices indonesia update"
  on public.market_prices_indonesia
  for update
  to anon
  using (source = 'bapanas')
  with check (source = 'bapanas');

-- Community chat rooms. Room ids are defined in lib/community.ts. Messages are
-- shared by every demo account, so only use non-sensitive content here.
create table if not exists public.community_messages (
  id text primary key,
  room_id text not null,
  author_id text not null,
  author_name text not null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists community_messages_room_time_idx
  on public.community_messages (room_id, created_at);

alter table public.community_messages enable row level security;

-- Signed-in farmers read the room and post only as themselves.
drop policy if exists "demo anon community messages" on public.community_messages;
drop policy if exists "community read" on public.community_messages;
drop policy if exists "community post" on public.community_messages;
drop policy if exists "community_read" on public.community_messages;
drop policy if exists "community_post" on public.community_messages;
create policy "community_read"
  on public.community_messages
  for select
  to authenticated
  using (true);

create policy "community_post"
  on public.community_messages
  for insert
  to authenticated
  with check (
    author_id = auth.uid()::text
    and char_length(body) between 1 and 500
  );

-- General Advice cache. One row per (user, crop, language); the app reads it to
-- avoid regenerating advice for up to 30 days. RLS keys on auth.uid() so each
-- farmer only sees their own cached advice.
create table if not exists public.advice_cache (
  user_id uuid not null,
  crop_id text not null,
  language text not null,
  input_hash text not null,
  advice jsonb not null,
  generated_at timestamptz not null default now(),
  primary key (user_id, crop_id, language)
);

create index if not exists advice_cache_user_generated_idx
  on public.advice_cache (user_id, generated_at desc);

alter table public.advice_cache enable row level security;

drop policy if exists "advice_owner" on public.advice_cache;
create policy "advice_owner"
  on public.advice_cache
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
