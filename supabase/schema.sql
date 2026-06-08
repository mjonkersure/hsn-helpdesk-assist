-- ============================================================
-- HSN Helpdesk Assist — database schema
-- Run dit in Supabase SQL Editor (https://app.supabase.com)
-- ============================================================

-- ============================================================
-- 1. REFERENCE TABLES
-- ============================================================

-- 9 Marten-criteria + definitie
create table if not exists public.drivers (
  key text primary key,
  label text not null,
  group_name text not null,        -- 'welkom' | 'vraag' | 'oplossing' | 'empathie' | 'afsluiting' | 'inhoud'
  detectable boolean not null default true,  -- false voor Toon + Inhoud (fase 2)
  definition text not null,
  display_order int not null
);

-- ============================================================
-- 2. EMPLOYEES
-- ============================================================
create table if not exists public.medewerkers (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  whisper_key text,                -- 'Sarah', 'Reno' etc — voor matching bij ingest
  rol text not null,               -- 'Front Office' | 'Back Office'
  specs text[] not null default '{}',  -- ['algemeen', 'multimedia'] etc
  via_teams boolean not null default false,
  nps_naam text,                   -- 'Sarah Albuquerque' — om met NPS-tabel te koppelen
  created_at timestamptz not null default now()
);

create index if not exists idx_medewerkers_whisper_key on public.medewerkers(whisper_key);

-- ============================================================
-- 3. CALLS
-- ============================================================
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  case_id text unique not null,
  medewerker_id uuid references public.medewerkers(id) on delete set null,
  duration_sec numeric,
  gesprekstype text,               -- 'inbound_klant' | 'outbound_terugbel' | etc
  eerste_of_herhaal text,          -- 'eerste' | 'herhaal' | 'onzeker'
  hoofdcategorie text,             -- 'MyRenault_app_connected' etc
  klant_emotie text,               -- 'tevreden' | 'neutraal' | 'licht_geirriteerd' | 'gefrustreerd_boos' | 'onbekend'
  opgelost text,                   -- 'ja' | 'deels' | 'nee' | 'nvt'
  terugbel_belofte text,           -- 'ja' | 'nee'
  doorverbonden text,              -- 'ja' | 'nee'
  confidence text,                 -- 'hoog' | 'midden' | 'laag'
  samenvatting text,
  transcript text,                 -- volledige tekst (optioneel)
  call_at timestamptz,             -- tijdstip van het gesprek
  ingested_at timestamptz not null default now()
);

create index if not exists idx_calls_medewerker on public.calls(medewerker_id);
create index if not exists idx_calls_eerste_of_herhaal on public.calls(eerste_of_herhaal);
create index if not exists idx_calls_hoofdcategorie on public.calls(hoofdcategorie);

-- ============================================================
-- 4. DRIVER SCORES — per call, per driver een bool
-- ============================================================
create table if not exists public.driver_scores (
  call_id uuid not null references public.calls(id) on delete cascade,
  driver_key text not null references public.drivers(key) on delete cascade,
  detected boolean,                -- null = nog niet gescoord (bv. fase 2)
  scored_at timestamptz not null default now(),
  primary key (call_id, driver_key)
);

-- ============================================================
-- 5. NPS SCORES (Q1 2026 etc)
-- ============================================================
create table if not exists public.nps_scores (
  id uuid primary key default gen_random_uuid(),
  medewerker_id uuid not null references public.medewerkers(id) on delete cascade,
  type text not null,              -- 'verzoeken' | 'klachten' | 'support'
  periode text not null,           -- 'Q1_2026' etc
  waarde numeric not null,
  aantal_enquetes int not null,
  created_at timestamptz not null default now(),
  unique (medewerker_id, type, periode)
);

-- ============================================================
-- 6. PROFIELEN (Eddy's per-persoon analyse + Marten QA)
-- ============================================================
create table if not exists public.profielen (
  medewerker_id uuid primary key references public.medewerkers(id) on delete cascade,
  sterke_kant text,
  zwakke_kant text,
  trainings_richting text,
  oefen_tip text,                  -- de "vandaag oefenen — één ding" tekst
  marten_qa_score numeric,         -- 0..1
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 7. FOCUS DRIVERS — door medewerker zelf gekozen
-- ============================================================
create table if not exists public.focus_drivers (
  id uuid primary key default gen_random_uuid(),
  medewerker_id uuid not null references public.medewerkers(id) on delete cascade,
  driver_key text not null references public.drivers(key) on delete cascade,
  gekozen_op timestamptz not null default now(),
  actief boolean not null default true,
  unique (medewerker_id, driver_key, actief)
);

-- ============================================================
-- 8. VIEWS — handig voor frontend
-- ============================================================

-- Per medewerker: aggregaat driver-detectie
create or replace view public.v_driver_aggregaat as
select
  m.id as medewerker_id,
  m.naam,
  ds.driver_key,
  count(*) filter (where ds.detected = true) as detected_count,
  count(*) filter (where ds.detected is not null) as scored_count,
  case
    when count(*) filter (where ds.detected is not null) = 0 then null
    else round(100.0 * count(*) filter (where ds.detected = true) / count(*) filter (where ds.detected is not null))
  end as detected_pct
from public.medewerkers m
left join public.calls c on c.medewerker_id = m.id
left join public.driver_scores ds on ds.call_id = c.id
group by m.id, m.naam, ds.driver_key;

-- Per medewerker: gewogen NPS
create or replace view public.v_nps_gewogen as
select
  medewerker_id,
  periode,
  round(sum(waarde * aantal_enquetes)::numeric / nullif(sum(aantal_enquetes), 0), 1) as gewogen_nps,
  sum(aantal_enquetes) as totaal_enquetes
from public.nps_scores
group by medewerker_id, periode;

-- ============================================================
-- 9. RLS (Row Level Security) — voor MVP uit, later aan
-- ============================================================
-- Voor productie: enable RLS en policies per rol (medewerker / teamleider / directie)
-- alter table public.medewerkers enable row level security;
-- create policy ... etc

comment on table public.drivers is '9 Marten-criteria — referentie';
comment on table public.medewerkers is '12 helpdesk-medewerkers (5 Webex + 7 Teams)';
comment on table public.calls is 'Calls uit Webex / Salesforce — per call alle classificatie-velden';
comment on table public.driver_scores is 'Per call, per driver: detected ja/nee/null';
comment on table public.nps_scores is 'NPS Q1 2026 + toekomstige periodes';
comment on table public.profielen is 'Eddy''s beluister-analyse + Marten QA + oefen-tip';
comment on table public.focus_drivers is 'Door medewerker zelf gekozen focus-drivers (max 3 actief)';
