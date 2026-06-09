// ============================================================
// Data types — overeenkomstig src/data/seed-data.json
// In productie haalt dit uit Supabase via lib/supabase/queries.ts
// ============================================================

export type DriverKey =
  | 'welkom'
  | 'vraag_capteren'
  | 'identificatie'
  | 'oplossing'
  | 'toon'
  | 'empathie'
  | 'afsluiting'
  | 'enquete'
  | 'inhoud';

export type DriverGroup =
  | 'welkom'
  | 'vraag'
  | 'oplossing'
  | 'empathie'
  | 'afsluiting'
  | 'inhoud';

export interface Driver {
  key: DriverKey;
  label: string;
  group: DriverGroup;
  detect: boolean; // false = fase 2 (audio of KB)
  order: number;
}

export type DriverCounts = Partial<Record<DriverKey, number | null>>;

export interface NpsData {
  verzoeken?: number;
  klachten?: number;
  support?: number;
  n_v?: number;
  n_k?: number;
  n_s?: number;
}

export interface Profile {
  sterk?: string;
  zwak?: string;
  training?: string;
  tip?: string;
}

export interface LastCall {
  case: string;
  duur: string;
  goed: string;
  klant_zei: string;
  ai_zag: string;
}

export interface AggregateBlock {
  nCallsTotal: number;
  nCallsNieuw: number;
  nCallsHerhaal: number;
  durationMinTotal: number;
  driversTotal: DriverCounts;
  driversNieuw: DriverCounts;
  driversHerhaal: DriverCounts;
  aiTotal: number | null;
  aiNieuw: number | null;
  aiHerhaal: number | null;
  gesprekstype: Record<string, number>;
  hoofdcategorie: Record<string, number>;
  klantEmotie: Record<string, number>;
  opgelost: Record<string, number>;
  terugbelBelofte: Record<string, number>;
}

export interface Agent extends AggregateBlock {
  naam: string;
  nameKey: string | null;
  rol: 'Front Office' | 'Back Office';
  specs: string[];
  teams: boolean;
  npsNaam: string | null;
  nps: NpsData;
  npsAvg: number | null;
  marten: number | null;
  profile: Profile;
  lastCall: LastCall | null;
  focusDrivers: DriverKey[];
}

export interface DashboardData {
  meta: {
    generated_at: string;
    source: string;
    total_transcripts: number;
    total_with_agent: number;
  };
  team: AggregateBlock;
  agents: Agent[];
  drivers: Driver[];
  driverDefs: Record<DriverKey, string>;
  catLabels: Record<string, string>;
  typeLabels: Record<string, string>;
  emoLabels: Record<string, string>;
}

// ============================================================
// Helpers
// ============================================================
export type Doelgroep = 'medewerker' | 'teamleider' | 'directie';
export type EmotionKey = 'tevreden' | 'neutraal' | 'licht_geirriteerd' | 'gefrustreerd_boos' | 'onbekend';

export const EMO_COLORS: Record<EmotionKey, string> = {
  tevreden: '#2c9e57',
  neutraal: '#aab3c2',
  licht_geirriteerd: '#e8970e',
  gefrustreerd_boos: '#d24a3e',
  onbekend: '#d8dde6',
};

// ============================================================
// Transcripten (Deepgram-uitvoer vereenvoudigd) — voor mail-generator
// ============================================================
export interface TranscriptUtterance {
  speaker: 'agent' | 'klant';
  start: number;
  text: string;
}

export interface SampleTranscript {
  case_id: string;
  duration_sec: number;
  duration_mmss: string;
  merk: string;
  gesprekstype: string;
  hoofdcategorie: string;
  subonderwerp: string;
  eerste_of_herhaal: string;
  klant_emotie: string;
  opgelost: string;
  terugbel_belofte: string;
  confidence: string;
  samenvatting: string;
  agent_naam: string;
  agent_whisper: string | null;
  utterances: TranscriptUtterance[];
}

// ============================================================
// Klantscore-enquête (Renault CSAT export) — geaggregeerd
// ============================================================
export type KlantscoreCategorie = 'claims' | 'request' | 'support';

export type KlantscoreDriverKey =
  | 'ease'
  | 'follow_up'
  | 'listen'
  | 'friendliness'
  | 'clarity';

export interface KlantscoreCatAgg {
  n: number;
  voc_avg: number | null;
  osat_avg: number | null;
}

export interface KlantscoreDriverAgg {
  n: number;
  avg: number | null;
}

export interface KlantscoreAgent {
  sf_code: string;
  total_enquetes: number;
  voc_index_avg: number | null;
  cc_osat_avg: number | null;
  categories: Record<KlantscoreCategorie, KlantscoreCatAgg>;
  drivers: Record<KlantscoreDriverKey, KlantscoreDriverAgg>;
}

export interface KlantscoreData {
  _meta: {
    generated_at: string;
    bron: string;
    total_enquetes: number;
    unmapped_sf_codes: Record<string, number>;
  };
  team: {
    total_enquetes: number;
    voc_index_avg: number | null;
    cc_osat_avg: number | null;
    drivers: Record<KlantscoreDriverKey, KlantscoreDriverAgg>;
  };
  by_agent: Record<string, KlantscoreAgent>;
}

export const KLANTSCORE_DRIVER_LABELS: Record<KlantscoreDriverKey, string> = {
  ease: 'Bereikbaarheid',
  follow_up: 'Opvolging',
  listen: 'Luisteren',
  friendliness: 'Vriendelijkheid',
  clarity: 'Duidelijkheid',
};
