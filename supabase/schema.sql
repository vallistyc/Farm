-- Harga Jual Petani - Supabase schema (demo prototype).
-- Run once in the Supabase SQL editor.
--
-- Security note: the app uses the public anon key with demo login, so these
-- permissive RLS policies are for the competition prototype only. Before
-- handling real user data, replace them with Supabase Auth and policies based
-- on auth.uid().

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
create policy "demo anon farms"
  on public.farms
  for all
  to anon
  using (true)
  with check (true);

drop policy if exists "demo anon crops" on public.crops;
create policy "demo anon crops"
  on public.crops
  for all
  to anon
  using (true)
  with check (true);

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

drop policy if exists "demo anon market prices" on public.market_prices;
create policy "demo anon market prices"
  on public.market_prices
  for all
  to anon
  using (true)
  with check (true);
