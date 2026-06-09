import fs from 'node:fs/promises';
import path from 'node:path';
import type { SampleTranscript } from '@/types/data';

const SAMPLES_DIR = path.join(process.cwd(), 'src', 'data', 'sample-transcripts');

export async function listSampleTranscripts(): Promise<SampleTranscript[]> {
  let files: string[];
  try {
    files = await fs.readdir(SAMPLES_DIR);
  } catch (err) {
    // Map kan ontbreken op productie (sample-transcripten zijn gitignored
    // vanwege klantnamen). Toon dan een lege lijst zonder crash.
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
  const jsons = files.filter((f) => f.endsWith('.json'));
  const loaded = await Promise.all(
    jsons.map(async (f) => {
      const raw = await fs.readFile(path.join(SAMPLES_DIR, f), 'utf-8');
      return JSON.parse(raw) as SampleTranscript;
    })
  );
  return loaded.sort((a, b) => a.case_id.localeCompare(b.case_id));
}

export async function getSampleTranscript(caseId: string): Promise<SampleTranscript | null> {
  try {
    const raw = await fs.readFile(path.join(SAMPLES_DIR, `${caseId}.json`), 'utf-8');
    return JSON.parse(raw) as SampleTranscript;
  } catch {
    return null;
  }
}

export function transcriptToPlainText(t: SampleTranscript): string {
  return t.utterances
    .map((u) => `${u.speaker === 'agent' ? 'Medewerker' : 'Klant'}: ${u.text}`)
    .join('\n');
}
