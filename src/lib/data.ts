// ============================================================
// Data loader — leest seed-data.json
// In productie: vervang door Supabase queries (zie lib/supabase/queries.ts)
// ============================================================
import type { DashboardData, Agent, DriverKey } from '@/types/data';
import seedData from '@/data/seed-data.json';

export function getDashboardData(): DashboardData {
  return seedData as unknown as DashboardData;
}

export function getAgentByName(naam: string): Agent | undefined {
  return getDashboardData().agents.find(
    (a) => a.naam.toLowerCase() === naam.toLowerCase()
  );
}

export function getAgentBySlug(slug: string): Agent | undefined {
  return getDashboardData().agents.find(
    (a) => slugify(a.naam) === slug.toLowerCase()
  );
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// ============================================================
// Score utilities
// ============================================================
export function pct(n: number, total: number): number {
  return total ? Math.round((100 * n) / total) : 0;
}

export function driverPctClass(p: number): 'green' | 'amber' | 'red' {
  if (p >= 75) return 'green';
  if (p >= 40) return 'amber';
  return 'red';
}

export function npsClass(val: number | null | undefined): 'green' | 'amber' | 'red' | 'grey' {
  if (val === null || val === undefined) return 'grey';
  if (val >= 50) return 'green';
  if (val >= 0) return 'amber';
  return 'red';
}

export function aiScoreClass(val: number | null | undefined): 'green' | 'amber' | 'red' | 'grey' {
  if (val === null || val === undefined) return 'grey';
  if (val >= 0.75) return 'green';
  if (val >= 0.40) return 'amber';
  return 'red';
}

export function formatNps(val: number | null | undefined): string {
  if (val === null || val === undefined) return '—';
  const rounded = Math.round(val);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

export function formatAiScore(val: number | null | undefined): string {
  if (val === null || val === undefined) return '—';
  return `${Math.round(val * 100)}%`;
}
