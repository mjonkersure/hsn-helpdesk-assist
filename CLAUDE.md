@AGENTS.md

# HSN Helpdesk Assist — project-context voor Claude

Coaching-dashboard voor het Renault-helpdesk-team van HSN, gebouwd door & sure-it. Live op [hsn-helpdesk-assist.vercel.app](https://hsn-helpdesk-assist.vercel.app/teamleider).

## Status (juni 2026)

- **MVP draait live op Vercel**, statische data uit Python pipeline in `src/data/seed-data.json`
- **GitHub auto-deploy** via Vercel — elke `git push` naar `main` → nieuwe deploy
- **Supabase project** bestaat (`yeaskaqrzgatvkytreai`), schema klaar in `supabase/`, nog niet aangesloten
- **3 routes**: `/medewerker`, `/teamleider`, `/directie` — elk met & sure-it huisstijl

## Documentatie

Lees in deze volgorde:
1. [`README.md`](README.md) — project overview
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — hoe alles samen werkt
3. [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Vercel + Supabase setup
4. [`docs/ONBOARDING.md`](docs/ONBOARDING.md) — voor de volgende ontwikkelaar

## Vandaag's openstaande to-do's (prioriteit)

1. **Supabase activeren** — schema runnen in SQL Editor + `.env.local` met keys + `lib/data.ts` ombouwen van JSON-import naar Supabase-queries
2. **Pipeline-script schrijven** — Python script in `scripts/` dat nieuwe call-dumps inleest en in Supabase schrijft (i.p.v. JSON-output)
3. **LLM-scoring** — vervang regex-detectie door Claude API call per transcript (veel accurater). Endpoint: per call de 9 criteria laten beoordelen met een gestructureerde prompt
4. **Filterbalk werkend maken** — periode + dossier-type echt filteren (nu UI-only)
5. **Per-medewerker auth** — Supabase Auth + per-route bescherming. Medewerker ziet alleen eigen card

## Cruciale project-kennis (niet uit code af te leiden)

### Sara El-Berri vs Sarah Albuquerque
- Onze "Sarah" bucket (102 calls in seed-data) = **Sarah Albuquerque** (PoC-cohort met Reno)
- **Sara El-Berri** belt via Teams → géén Webex-opnames → géén transcripten van haar
- In seed-data staan beiden, maar Sara El-Berri heeft `teams: true` en lege matrix

### Whisper-namen ≠ echte namen
| Whisper hoort | Werkelijke naam |
|---|---|
| Astrid / Arshap / Arsha | **Arshad** (man, FO) |
| Sirea / Sira / Sija / Sijde | Sayrah |
| Daan | Daniel |
| Reno / Renno / Renan | Reno (man) |
| Sarah / Sara | Sarah Albuquerque (gegroepeerd) |

### Drie centrale principes
1. AI is een coach, geen meting. Eerste 90 dagen geen consequenties.
2. Medewerker ziet alleen eigen card. Aggregaten voor Kim, geen namen voor Ot.
3. Driver-scores zijn PI's (sturen), klantscore (NPS) is KPI (gevolg).

## Conventions

- **Geen `.env*` committen** — `.env.local.example` is exception (zie `.gitignore`)
- **Supabase service-role key alleen server-side** — nooit in client-bundle
- **TypeScript strict mode** — alle types in `src/types/data.ts`
- **TailwindCSS 4 + DM Sans** — & sure-it kleuren in `src/app/globals.css` als CSS-variabelen
- **PowerShell op Windows blokkeert npm-script** — gebruik `npm.cmd` of dubbelklik `start-dev.bat`

## Mensen om te kennen

- **Ot Ciolina** — directie, visie ("de acculader"-metafoor)
- **Eddy van den Berg** — domeinexpert, beluister-analyses, oorspronkelijke leveringen
- **Kim Hillenaar** — teamleider HSN, beluistert 30-50 calls/maand
- **Marten** — Cloud9 QA-leverancier, maandelijkse 9-criteria-beoordeling
- **Maurits Jonker** (mjonker@nsureit.nl) — bouwde de MVP

## Belangrijke pad-info

- **Project zelf**: `C:\Users\MauritsJonker\Projects\hsn-helpdesk-assist\` (buiten OneDrive!)
- **Oorspronkelijke werkmap met mockups**: `c:\Users\MauritsJonker\& sure-it B.V\N SureIT - Documents\3. Interne Organisatie\AI Ecosystem\40-agents\Renault Dashboard\`
- **Live URL**: https://hsn-helpdesk-assist.vercel.app
- **GitHub**: https://github.com/mjonkersure/hsn-helpdesk-assist
- **Supabase**: https://yeaskaqrzgatvkytreai.supabase.co
