# HSN Helpdesk Assist

> Coaching-dashboard voor het HSN-helpdesk-team van Renault Nederland.
> Gebouwd door **& sure-it** — *in a demanding world*.

**🚀 Live:** [hsn-helpdesk-assist.vercel.app](https://hsn-helpdesk-assist.vercel.app/teamleider)
**📦 Repo:** [github.com/mjonkersure/hsn-helpdesk-assist](https://github.com/mjonkersure/hsn-helpdesk-assist)

Een React/Next.js webapp die per medewerker driver-scores (gebaseerd op Marten's 9 QA-criteria) combineert met NPS-klantbeleving, Eddy's beluister-profielen en patroon-detectie op transcripten.

## Drie doelgroep-views

| Route | Voor wie | Inhoud |
|---|---|---|
| `/medewerker` | Helpdesk-medewerker | Eigen focus-drivers, vandaag-oefenen-tip, vorig gesprek, trend, Ot's matrix + rich context |
| `/teamleider` | Kim (teamleider) | Team-totaal matrix, driver-overzicht per medewerker, team-ranking, driver-legenda |
| `/directie` | Ot (directie) | 4 KPI-cards, team-matrix, strategische bullets, belofte-statement |

## Stack

- **Frontend:** [Next.js 16](https://nextjs.org/) (App Router, TypeScript, Turbopack)
- **Styling:** [TailwindCSS 4](https://tailwindcss.com/) met & sure-it huisstijl (#005A6C teal + #F8971D oranje)
- **Typografie:** DM Sans (Google Fonts)
- **Backend (toekomst):** [Supabase](https://supabase.com) — Postgres + Auth + Storage
- **Hosting:** [Vercel](https://vercel.com) — auto-deploy bij elke `git push`
- **Versie-beheer:** GitHub

## Quick start (lokaal)

```bash
# Eenmalig: installeer dependencies
npm install

# Start dev-server
npm run dev
# → http://localhost:3000

# Productie build (controleer compileer-errors)
npm run build

# Type-checking + linting
npm run lint
```

> **Op Windows:** als `npm` niet werkt in PowerShell (`'npm' is not recognized` of execution-policy-error), gebruik `start-dev.bat` in de project-root — die regelt alles.

## Project-structuur

```
hsn-helpdesk-assist/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout met DM Sans
│   │   ├── globals.css         # & sure-it huisstijl CSS variabelen
│   │   ├── page.tsx            # Redirect naar /teamleider
│   │   ├── medewerker/page.tsx # Medewerker-view
│   │   ├── teamleider/page.tsx # Teamleider-view
│   │   └── directie/page.tsx   # Directie-view
│   ├── components/             # Herbruikbare componenten
│   │   ├── Header.tsx          # Top-nav met logo + tabs
│   │   ├── Logo.tsx            # & sure-it tekst-logo (vervangbaar door SVG)
│   │   ├── Banner.tsx          # Doelgroep-banner (oranje/groen/blauw)
│   │   ├── FilterBar.tsx       # Periode + dossier-type filter
│   │   ├── MatrixTable.tsx     # Ot's matrix (kanalen × drivers)
│   │   ├── AgentCard.tsx       # Medewerker-card (focus, tip, vorig gesprek, trend, matrix, rich)
│   │   ├── DriverOverviewTable.tsx
│   │   ├── TeamRanking.tsx     # Ranking onderaan
│   │   ├── DriverLegenda.tsx   # 9 criteria definities
│   │   └── KpiCard.tsx         # KPI-card voor directie
│   ├── lib/
│   │   └── data.ts             # Data loader + score utilities
│   ├── types/
│   │   └── data.ts             # TypeScript types
│   └── data/
│       └── seed-data.json      # Statische demo-data (uit v14 pipeline)
├── supabase/                   # Database schema voor productie
│   ├── schema.sql              # Tabellen + views + RLS-skeleton
│   └── seed_drivers.sql        # 9 Marten-criteria
├── public/                     # Statische assets (logo, favicon)
└── README.md
```

## Verdere documentatie

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Hoe alles samen werkt + data flow
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Vercel + Supabase setup-stappen
- [`docs/ONBOARDING.md`](docs/ONBOARDING.md) — Voor de volgende ontwikkelaar

## Status

**MVP (juni 2026)** — statische demo-data uit v14-pipeline, drie views werkend, & sure-it huisstijl.

**Komende slagen:**

1. Supabase-koppeling (data uit JSON → database)
2. LLM-scoring (vervang regex door Claude API per transcript)
3. Werkende filterbalk
4. Per-medewerker auth (medewerker ziet alleen eigen card)
5. Mail-werkhut (medewerker stelt mail op, AI checkt drivers vóór verzenden)
6. 14 extra drivers (na levering door Eddy)

## Contact

Gebouwd door Maurits Jonker (mjonker@nsureit.nl) voor & sure-it / HSN Renault.
