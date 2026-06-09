@AGENTS.md

# HSN Helpdesk Assist — project-context voor Claude

Coaching-dashboard voor het Renault-helpdesk-team van HSN, gebouwd door & sure-it. Live op [hsn-helpdesk-assist.vercel.app](https://hsn-helpdesk-assist.vercel.app/teamleider).

## Status (juni 2026, geüpdatet 2026-06-09)

- **MVP draait live op Vercel**, GitHub auto-deploy — elke `git push` naar `main` → nieuwe deploy
- **4 routes**: `/medewerker`, `/teamleider`, `/directie`, `/mail` — alle met & sure-it huisstijl
- **Data**: gesprek-aggregaten uit `src/data/seed-data.json` (Python pipeline); klantscores uit `src/data/klantscores.json` (Node-aggregator over Salesforce CSAT-exports)
- **Mail-generator** op `/mail`: Claude Sonnet 4.6 (via `@anthropic-ai/sdk`) maakt een conceptmail van een transcript langs de drivers. Lokaal werkend met `ANTHROPIC_API_KEY` in `.env.local`; op Vercel nog te activeren (zie hieronder).
- **Klantscore-integratie**: 287 enquêtes (year-to-date Claims/Request/Custom Support) gekoppeld via Salesforce-codes → per-agent VoC, CC Osat, en 5 sub-drivers. Sara El-Berri verschijnt nu ook (eerst onmogelijk zonder Webex).
- **Supabase project** (`yeaskaqrzgatvkytreai`): schema klaar in `supabase/`, nog niet aangesloten. Lager prio dan eerst gedacht (zie scope-herijking in memory).

## Documentatie

Lees in deze volgorde:
1. [`README.md`](README.md) — project overview
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — hoe alles samen werkt
3. [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Vercel + Supabase setup
4. [`docs/ONBOARDING.md`](docs/ONBOARDING.md) — voor de volgende ontwikkelaar

## Openstaande to-do's na scope-herijking (juni 2026)

Ot's deadline: **werkende MVP eind van deze week**. Kwaliteit mag rommelig zijn, fundament telt. Volledige herijking in `~/.claude/projects/.../memory/project_scope_herijking_juni_2026.md`.

### Hoge prio
1. **Mail-generator op Vercel werkend krijgen** — `ANTHROPIC_API_KEY` in Vercel Environment Variables + besluit over hoe transcripten naar productie (sample-transcripten zijn lokaal gitignored vanwege klantnamen; anonimiseren-en-committen of via Supabase-storage later).
2. **Onbekende SF-code `005bD00000WwOtxQAF`** (17 enquêtes) — vermoedelijk oud-medewerker, op verzoek toevoegen aan `src/data/agent-sf-codes.json` en `node scripts/aggregate-klantscore.mjs` opnieuw draaien.
3. **Supabase activeren** (lager dan vóór de herijking) — schema runnen, `lib/data.ts` ombouwen, ingest-pipeline schetsen. Eerst doel: zelfvullend i.p.v. statisch.
4. **Ingest-pipeline / opname-route** — Maurits + Willem zoeken praktische input-route uit (apparaatje tussen telefonie), parallel aan code-werk.

### Bewust geschrapt (per Ot juni 2026)
- Filterbalk werkend maken
- Per-medewerker auth + rol-gebaseerde views
- Audio-afspeelknop (zat niet in app-code, was mockup-feature)

### Voor later (fase 2)
- "Toon"-driver (audio-analyse, prosody)
- "Inhoud"-driver (Renault KB)
- 14 extra drivers van Eddy (als geleverd)

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
3. Driver-scores zijn PI's (sturen), klantscore (VoC/CSAT) is KPI (gevolg).

### Vier kanalen-model (Ot juni 2026)
Elk klantcontact valt onder één van vier kanalen, alle gemeten op dezelfde drivers:
1. Telefoon inkomend (eerste contact)
2. Telefoon opvolging
3. Mail (nog geen pipeline)
4. App (WhatsApp-achtig, fase 2)

### Klantscore-bron
- 3 CSAT-CSVs in `src/data/private/` (gitignored, klant-PII): Claims / Request / Custom Support Y2D
- Koppeling per case → medewerker via `Case Resolved By` ↔ `src/data/agent-sf-codes.json`
- Aggregatie via `node scripts/aggregate-klantscore.mjs` → `src/data/klantscores.json` (geen PII, mag wel in git)
- 5 sub-drivers (ease/follow-up/listen/friendliness/clarity) mappen direct op gesprek-drivers — basis voor Willem's correlatie-uitzoekspoor.

## Conventions

- **Geen `.env*` committen** — `.env.local.example` is exception (zie `.gitignore`)
- **Supabase service-role key alleen server-side** — nooit in client-bundle
- **TypeScript strict mode** — alle types in `src/types/data.ts`
- **TailwindCSS 4 + DM Sans** — & sure-it kleuren in `src/app/globals.css` als CSS-variabelen
- **PowerShell op Windows blokkeert npm-script** — gebruik `npm.cmd` of dubbelklik `start-dev.bat`

## Mensen om te kennen

- **Ot Ciolina** — directie, visie ("de acculader"-metafoor), beslist over scope
- **Eddy van den Berg** — domeinexpert, beluister-analyses, oorspronkelijke leveringen
- **Kim Hillenaar** — teamleider HSN, beluistert 30-50 calls/maand
- **Marten** — Cloud9 QA-leverancier, maandelijkse 9-criteria-beoordeling
- **Willem** — praktische implementatie (hoe komen opnames binnen) + uitzoeken correlatie drivers ↔ CSAT-enquête
- **Maurits Jonker** (mjonker@nsureit.nl) — bouwde de MVP

## Belangrijke pad-info

- **Project zelf**: `C:\Users\MauritsJonker\Projects\hsn-helpdesk-assist\` (buiten OneDrive!)
- **Oorspronkelijke werkmap met mockups**: `c:\Users\MauritsJonker\& sure-it B.V\N SureIT - Documents\3. Interne Organisatie\AI Ecosystem\40-agents\Renault Dashboard\`
- **Live URL**: https://hsn-helpdesk-assist.vercel.app
- **GitHub**: https://github.com/mjonkersure/hsn-helpdesk-assist
- **Supabase**: https://yeaskaqrzgatvkytreai.supabase.co
