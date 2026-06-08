# Deployment

Stap-voor-stap: van lokale dev naar productie via GitHub + Vercel + Supabase.

## 1. GitHub (versie-beheer)

```bash
# Vanuit project-directory:
cd C:\Users\MauritsJonker\Projects\hsn-helpdesk-assist

# Status check
git status
git log --oneline -5

# Eerste push naar GitHub (na repo aanmaken via UI):
git remote add origin https://github.com/<je-username>/hsn-helpdesk-assist.git
git branch -M main
git push -u origin main
```

### Workflow

```bash
# Wijziging maken
# (... edit files ...)

git add .
git commit -m "feat: korte beschrijving van wijziging"
git push

# → Vercel deployt automatisch (zie hieronder)
```

### Branch-strategie

- `main` — productie (auto-deploy naar Vercel)
- `dev` — staging (kan apart Vercel-omgeving krijgen)
- feature-branches → PR → merge naar `main`

## 2. Vercel (frontend hosting)

### Eerste setup

1. Ga naar [vercel.com](https://vercel.com), sign up met GitHub
2. Klik **"Add New Project"** → kies de `hsn-helpdesk-assist` repo
3. Framework-detectie: **Next.js** (automatisch)
4. Build-instellingen: laat default staan
5. Klik **"Deploy"**
6. Na ~1 min: live URL zoals `hsn-helpdesk-assist.vercel.app`

### Auto-deploy

Vercel listens naar GitHub. Elke `git push` naar `main` triggert een nieuwe deploy. PR's krijgen een preview-URL.

### Environment variables (later)

Wanneer Supabase is gekoppeld, voeg toe via Vercel UI:
- Settings → Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` = `https://xxx.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJ...`

Deze worden bij elke deploy meegegeven.

### Custom domain

Vercel Settings → Domains → Add → bv. `assist.nsureit.nl`.

## 3. Supabase (backend / database)

### Eerste setup

1. Ga naar [supabase.com](https://supabase.com), sign up met GitHub
2. Klik **"New Project"**
   - Naam: `hsn-helpdesk-assist`
   - Database password: bewaar in 1Password/Bitwarden
   - Region: **West-Europe (Frankfurt)** — dichtbij & sure-it
3. Wacht ~2 min tot project ready is

### Schema runnen

1. Open Supabase project → **SQL Editor**
2. Open lokaal `supabase/schema.sql` en plak in editor
3. Klik **Run**
4. Herhaal voor `supabase/seed_drivers.sql`
5. Controleer in **Table Editor**: 7 tabellen + 2 views moeten verschijnen

### Connect Next.js aan Supabase

```bash
# Installeer client (vanuit project-root):
npm install @supabase/supabase-js
```

Maak `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

> Pak deze waarden uit Supabase Settings → API.

Maak `src/lib/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

Vervang `src/lib/data.ts::getDashboardData()` met Supabase-queries (zie commentaar in code).

### Pipeline-script schrijven

In plaats van `seed-data.json` → JSON-bestand, schrijf direct in Supabase:

```python
# scripts/ingest.py (Python)
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Upsert medewerker
supabase.table("medewerkers").upsert({...}).execute()

# Upsert call + driver scores
for call in calls:
    call_row = supabase.table("calls").upsert(call).execute()
    for driver_key, detected in scores.items():
        supabase.table("driver_scores").upsert({...}).execute()
```

> **NB:** gebruik de `service_role` key (niet de anon-key) voor write-operaties vanuit Python.

## 4. Continuous deployment workflow

```
[1] Maurits committed naar branch         → GitHub
[2] GitHub triggert Vercel build           → Vercel
[3] Vercel bouwt + deployt                 → live URL bijgewerkt
[4] Supabase staat los, data wijzigt
    onafhankelijk via:
    - Supabase Studio (handmatige edits)
    - scripts/ingest.py (batch nieuwe calls)
    - Edge Functions (later: realtime)
```

## 5. Belangrijke punten voor volgende ontwikkelaar

- **Geen `.env*` files committen** — staat al in `.gitignore`
- **Service-role key alleen lokaal/server-side** — nooit in client-bundle
- **Supabase free tier:** 500 MB database, 1 GB storage, 50K maandelijkse actieve users. Ruim voldoende voor MVP.
- **Vercel free tier:** 100 GB bandwidth/maand, ongelimiteerde deploys. Voor productie-traffic in HSN-context is dit zat.

Vragen? Zie ook [`ONBOARDING.md`](ONBOARDING.md).
