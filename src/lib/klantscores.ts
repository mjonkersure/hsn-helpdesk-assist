import type { KlantscoreData } from '@/types/data';
import klantscoresJson from '@/data/klantscores.json';

export function getKlantscores(): KlantscoreData {
  return klantscoresJson as KlantscoreData;
}

export function osatClass(val: number | null | undefined): 'green' | 'amber' | 'red' | 'grey' {
  if (val === null || val === undefined) return 'grey';
  if (val >= 9) return 'green';
  if (val >= 7) return 'amber';
  return 'red';
}

export function vocClass(val: number | null | undefined): 'green' | 'amber' | 'red' | 'grey' {
  if (val === null || val === undefined) return 'grey';
  if (val >= 50) return 'green';
  if (val >= 0) return 'amber';
  return 'red';
}

export function driverScoreClass(val: number | null | undefined): 'green' | 'amber' | 'red' | 'grey' {
  if (val === null || val === undefined) return 'grey';
  if (val >= 8) return 'green';
  if (val >= 6) return 'amber';
  return 'red';
}

export function formatVoc(val: number | null | undefined): string {
  if (val === null || val === undefined) return '—';
  const r = Math.round(val);
  return r > 0 ? `+${r}` : `${r}`;
}

export function formatOsat(val: number | null | undefined): string {
  if (val === null || val === undefined) return '—';
  return val.toFixed(1);
}
