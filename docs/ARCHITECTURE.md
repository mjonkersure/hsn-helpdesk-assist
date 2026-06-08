# Architecture

## Overzicht

```
                  ┌──────────────────────┐
                  │  GitHub (versie-     │
                  │  beheer + sync)      │
                  └──────────┬───────────┘
                             │ git push
                             ▼
        ┌────────────────────────────────────────┐
        │  Vercel (Next.js frontend hosting)    │
        │  • automatische deploy bij elke push   │
        │  • live URL: hsn-helpdesk-assist.app   │
        └─────┬──────────────────────────────────┘
              │ data queries
              ▼
        ┌──────────────────────┐         ┌─────────────────┐
        │  Supabase (Postgres) │◄────────┤  Data pipeline  │
        │  • medewerkers       │         │  (Python script │
        │  • calls             │         │   in scripts/)  │
        │  • driver_scores     │         └─────────────────┘
        │  • nps_scores        │                ▲
        │  • profielen         │                │ leest
        │  • focus_drivers     │                │
        └──────────────────────┘     ┌──────────┴──────────┐
                                     │ Transcripten (.txt) │
                                     │ Classificatie xlsx  │
                                     │ NPS Q1 xlsx         │
                                     │ Marten scores xlsx  │
                                     └─────────────────────┘
```

## Data flow (huidige MVP)

Voor de MVP loopt het iets simpeler — statische JSON i.p.v. Supabase:

```
   Pipeline (Python)
   ├─ leest transcripten, classificatie, NPS
   ├─ past patroon-detectie toe (7 van 9 drivers)
   ├─ aggregeert per medewerker
   └─ schrijft → src/data/seed-data.json

   Next.js
   ├─ leest seed-data.json (build-tijd)
   ├─ rendert statische pagina's
   └─ deploy naar Vercel
```

## Componenten-overzicht

### Pages (`src/app/`)

| Bestand | Doel |
|---|---|
| `layout.tsx` | Root — laadt DM Sans font, applies globals.css |
| `page.tsx` | Redirect `/` → `/teamleider` (default landing) |
| `medewerker/page.tsx` | Lijst van alle 12 medewerker-cards met `showPersonal` |
| `teamleider/page.tsx` | Team-totaal matrix, driver-overzicht, ranking, legenda |
| `directie/page.tsx` | 4 KPI's, team-matrix, exec bullets, belofte |

### Reusable components (`src/components/`)

| Component | Gebruikt door | Beschrijving |
|---|---|---|
| `Header` | Alle pages | Sticky top-nav met logo + doelgroep-tabs |
| `Logo` | Header | Tekst-versie van &sure.it logo |
| `Banner` | Alle pages | Doelgroep-banner (3 varianten: medewerker/teamleider/directie) |
| `FilterBar` | Alle pages | Periode + dossier-type pills (visueel-only) |
| `MatrixTable` | AgentCard, Team-totaal, Directie | Ot's matrix: kanalen × 9 drivers + 2 scores |
| `AgentCard` | Medewerker | Volledige medewerker-card met optionele "personal" blocks |
| `DriverOverviewTable` | Teamleider | Alle 12 medewerkers × 9 drivers in 1 tabel |
| `TeamRanking` | Teamleider | Gesorteerde tabel op AI-score |
| `DriverLegenda` | Teamleider | 9 criteria definities in 3-kolom grid |
| `KpiCard` | Directie | Eén KPI-tegel met label, value, sub |

### Data laag (`src/lib/data.ts` + `src/types/data.ts`)

- `getDashboardData()` — laadt seed JSON, returnt typed `DashboardData`
- `getAgentByName(naam)` / `getAgentBySlug(slug)` — agent-lookup
- Score-helpers: `pct()`, `formatNps()`, `formatAiScore()`, `npsClass()`, `aiScoreClass()`, `driverPctClass()`

## Driver-scoring (huidige MVP)

7 van Marten's 9 criteria worden gedetecteerd met **regex-patronen** op transcript-tekst:

| Driver | Detectie |
|---|---|
| Welkom | `goedemorgen / hele goede dag` in eerste 30s |
| Vraag capteren | `als ik het goed begrijp`, `u bedoelt`, `klopt het dat` |
| Identificatie | `mag ik uw kenteken / e-mail / achternaam / VIN` |
| Oplossing | `wat ik ga doen`, `ik ga regelen / sturen` |
| **Toon** | **fase 2** — vereist audio-prosody-analyse |
| Empathie | template-zinnen + Ed's vraag-ruimte-zinnen ("waar kan ik u verder helpen") |
| Afsluiting | `bedankt`, `fijne dag`, `nog vragen?` |
| Enquête | `enquête`, `9 of 10`, `feedback` |
| **Inhoud** | **fase 2** — vereist Renault-kennisbank-koppeling |

**Volgende slag:** LLM-call per transcript (Claude API) voor accuratere detectie.

## Naam-mapping

Whisper hoort agent-namen vaak fout. Mapping uit Eddy's analyse:

| Whisper hoort | Werkelijke naam |
|---|---|
| Astrid / Arshap / Arsha | Arshad |
| Sirea / Sira / Sija / Sijde | Sayrah |
| Daan | Daniel |
| Reno / Renno / Renan | Reno |
| Sarah / Sara | Sarah Albuquerque (gegroepeerd) |

**Belangrijk:** Sara El-Berri (FO algemeen+multimedia volgens directie) belt via Teams en heeft geen Webex-transcripten. Onze "Sarah" bucket is dus Sarah Albuquerque, niet Sara El-Berri.

## Toekomstige Supabase-integratie

Schema staat klaar in `supabase/schema.sql`. Migratie-stappen:

1. Maak Supabase-project aan
2. Run `schema.sql` + `seed_drivers.sql` in SQL Editor
3. Vervang `src/lib/data.ts` met queries naar Supabase (`@supabase/supabase-js`)
4. Voeg `.env.local` toe met:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
5. Pipeline-script schrijft direct in tabellen (i.p.v. JSON)

Zie [`DEPLOYMENT.md`](DEPLOYMENT.md) voor concrete stappen.
