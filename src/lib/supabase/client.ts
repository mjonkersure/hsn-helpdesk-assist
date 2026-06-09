/**
 * Supabase client — singleton voor de hele app.
 *
 * Gebruik vanuit een server-component of API route:
 *   import { supabase } from '@/lib/supabase/client';
 *   const { data } = await supabase!.from('medewerkers').select();
 *
 * Wanneer env vars nog ontbreken (lokale dev zonder Supabase), is `supabase`
 * `null`. Gebruik `isSupabaseEnabled()` voor graceful fallback naar de
 * statische seed-data in `src/data/seed-data.json`.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export function isSupabaseEnabled(): boolean {
  return supabase !== null;
}
