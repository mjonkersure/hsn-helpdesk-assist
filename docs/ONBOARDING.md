# Onboarding voor de volgende ontwikkelaar

Welkom. Deze pagina vat samen wat je moet weten om de **HSN Helpdesk Assist** verder te bouwen na Maurits' eerste oplevering (juni 2026).

## Wat is dit project?

Een coaching-dashboard voor het Renault-helpdesk-team van HSN. Doel: per medewerker laten zien hoe ze scoren op 9 gespreksdrivers (Marten's QA-criteria) gekoppeld aan klanttevredenheid (NPS) en Eddy's beluister-profielen. Drie doelgroepen:
- **medewerker:** persoonlijke coaching
- **teamleider:** Kim's overzicht
- **directie:** Ot's KPI-view

## Drie centrale principes (uit de gesprekken)

1. **AI is een coach, geen meting.** Eerste 90 dagen geen consequenties voor medewerkers.
2. **Eén medewerker ziet alleen zijn eigen card.** Aggregaten voor teamleider, geen individuen voor directie.
3. **Driver-detectie is een proxy voor klantbeleving.** De échte KPI is NPS / klantscore. Drivers zijn de PI's die we kunnen sturen.

## In 30 minuten: zo begin je

```bash
# 1. Clone
git clone https://github.com/<owner>/hsn-helpdesk-assist.git
cd hsn-helpdesk-assist

# 2. Install
npm install

# 3. Run
npm run dev
# → http://localhost:3000

# 4. Open in editor (VS Code aanbevolen)
code .
```

Lees daarna:
- [`README.md`](../README.md) — project-overview
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — hoe alles samen werkt
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — Vercel + Supabase setup

## Wat is af (MVP juni 2026)

- ✅ Next.js 16 app met 3 routes
- ✅ & sure-it huisstijl (kleuren + DM Sans)
- ✅ MatrixTable, AgentCard, KpiCard etc — herbruikbaar
- ✅ Statische demo-data uit Python pipeline
- ✅ Patroon-detectie voor 7 van 9 drivers
- ✅ Supabase schema (klaar om te runnen)
- ✅ Auto-deploy via GitHub → Vercel

## Wat is niet af (komende slagen)

### Prio 1 — productie-klaar maken

- [ ] **Supabase connectie maken.** Schema bestaat al in `supabase/schema.sql`. Vervang `src/lib/data.ts::getDashboardData()` met queries. Zie `DEPLOYMENT.md`.
- [ ] **Pipeline-script schrijven** dat nieuwe call-dumps inleest en in Supabase schrijft (i.p.v. JSON output).
- [ ] **Filterbalk werkend maken** — periode + dossier-type moet daadwerkelijk filteren.

### Prio 2 — kwaliteit van detectie

- [ ] **LLM-scoring** (Claude API per transcript) i.p.v. regex. Veel accurater. Schema in `supabase/schema.sql` ondersteunt het al (driver_scores.detected = boolean of null).
- [ ] **14 extra drivers** verwerken zodra Eddy ze levert (maandag/dinsdag). Wordt totaal 23 drivers.
- [ ] **Driver "Vraag capteren" hernoemen** — Ot vond term verwarrend tijdens 8-juni-gesprek.

### Prio 3 — features

- [ ] **Per-medewerker auth.** Supabase Auth, Microsoft 365 SSO. Medewerker ziet alleen eigen card.
- [ ] **Focus drivers door medewerker zelf kiezen.** Schema heeft tabel `focus_drivers` al.
- [ ] **Trends in de tijd.** Sparklines zijn nu illustratief (verzonnen waarden). Met historische data → echt.
- [ ] **Mail-werkhut.** Aparte interface waar medewerker mail opstelt, AI checkt op drivers vóór verzending. Idee van Ot uit gesprek 8 juni.
- [ ] **Email BCC-route.** Salesforce blind-copy naar onze database zodat mail in de loop komt. Ot's voorstel.

### Prio 4 — fase 2

- [ ] **Toon-driver (audio-analyse).** Tweede AI-model op de mp3's. Prosody / sentiment-uit-stem. Kost ~€5 per uur audio (Deepgram + sentiment).
- [ ] **Inhoud-driver (Renault KB).** Knowledge-base met Renault-procedures. Verifieer claims in transcripten.

## Belangrijke context die niet uit code blijkt

### Drie soorten medewerkers in scope

12 medewerkers totaal, verdeeld over rollen + werkomgeving:

**Met Webex-opnames (driver-detectie mogelijk):**
- Sarah Albuquerque (FO algemeen+multimedia, 102 calls)
- Arshad Akalie (FO algemeen+multimedia, 57 calls)
- Reno Els (FO algemeen+multimedia, 54 calls)
- Daniel Buabeng (FO algemeen+multimedia, 29 calls)
- Sayrah Badloe (BO algemeen+soms FO, 12 calls)

**Via Teams (geen Webex-data, dus matrix leeg):**
- Sara El-Berri (FO algemeen+multimedia)
- Enno van Vaale (BO algemeen+Alpine)
- Rachid de Ling (BO multimedia)
- Jeramie (BO multimedia)
- Matthijs Rands (BO algemeen+Alpine)
- Jalda Azimi (FO algemeen+parts)
- Trees (FO parts)

### Whisper-namen ≠ echte namen

Spraakherkenning hoort namen verkeerd. Mapping staat in:
- `src/data/seed-data.json` (statisch)
- `supabase/schema.sql` → `medewerkers.whisper_key`

Belangrijk: **"Astrid" in de transcripten is Arshad** (man, FO). Niet Astrid Hofmann ofzo.

### Eddy's beluister-analyse

Eddy van den Berg heeft 20+ calls beluisterd en per medewerker een profiel geschreven (sterke kant, zwakke kant, trainings-richting + oefen-tip). Die zit in `seed-data.json` per agent (`agent.profile`). Dit is **handmatige input** — kan in Supabase uitgebreid worden via de `profielen` tabel.

### NPS Q1 2026

Per medewerker drie NPS-types: Verzoeken / Klachten / Support. Bron: HSN's Cloud9 QA-leverancier. Periode is per kwartaal — schema ondersteunt meerdere periodes (`nps_scores.periode`).

## Mensen om aan te spreken

- **Ot Ciolina** — directie, visie & prioriteiten. "De acculader"-metafoor komt van hem.
- **Eddy van den Berg** — heeft de oorspronkelijke leveringen + beluister-analyses gemaakt. Domeinexpert.
- **Kim Hillenaar** — teamleider HSN. Beluistert in volgende rondes 30-50 calls/maand.
- **Marten** — Cloud9 QA-leverancier. Levert de maandelijkse beoordeling op 3 calls/persoon volgens 9 criteria.

## Vragen om eerst te beantwoorden voor je begint

1. **Is de Supabase-koppeling al gedaan?** Check `src/lib/data.ts` — staat er nog `import seedData from '@/data/seed-data.json'`? Dan nog niet.
2. **Is er een live Vercel URL?** Check Vercel dashboard.
3. **Welke datum heeft de seed-data?** Zie `src/data/seed-data.json` → `meta.generated_at`. Als > 1 maand oud: pipeline opnieuw draaien met verse calls.

## Verdere bronnen

In de oorspronkelijke werkmap (op OneDrive bij & sure-it):

```
40-agents/Renault Dashboard/
├── 2026-06-08_mockup-v14.html      # Laatste visuele mockup (basis voor app)
├── 2026-06-08_mockup-v14.pdf       # PDF-versie voor Ot
├── 2026-06-08_aanpak-dashboard.md  # Eerste plan-document
├── 2026-06-08_gespreksnotitie-2.md # Notitie van 8-juni-gesprek
├── 07 Transcripten/                # 367 transcripten + analyses door Eddy
└── Claude_voorstel_dashboard_8juni2026.html  # Design-template voor Claude_voorstel
```

Veel succes!
