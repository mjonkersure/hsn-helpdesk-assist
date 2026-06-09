import Anthropic from '@anthropic-ai/sdk';
import { getSampleTranscript, transcriptToPlainText } from '@/lib/transcripts';
import type { SampleTranscript } from '@/types/data';

export const dynamic = 'force-dynamic';

const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Je bent een ervaren Renault Nederland helpdesk-medewerker die een opvolgmail schrijft na een telefoongesprek met een klant.

Schrijf de mail in correct, vriendelijk Nederlands. De mail moet voldoen aan de volgende structuur (drivers):

1. **Aanhef met klantnaam** als die uit het gesprek blijkt; anders "Geachte heer/mevrouw".
2. **Verwijzing naar het dossiernummer** (de case_id), bijvoorbeeld "naar aanleiding van ons gesprek over dossier 2026000022538".
3. **Samenvatting van de vraag/het probleem** in 1-2 zinnen, zodat de klant weet dat je het begrepen hebt.
4. **Concreet wat je gaat doen** — duidelijke vervolgstappen of de oplossing. Geen vaag taalgebruik.
5. **Vriendelijke afsluiting** met groet en ondertekening (medewerker-naam + "Renault Nederland helpdesk").

Houd het kort en duidelijk (200-400 woorden body). Geen jargon, geen onnodig formele beleefdheid. Schrijf alsof je het zelf belt.

Output-formaat (exact):
Onderwerp: <heldere onderwerpregel>

<mailbody met witregels tussen alinea's>`;

interface RequestBody {
  case_id: string;
}

function buildUserPrompt(t: SampleTranscript): string {
  return `Hieronder de context van het telefoongesprek waar deze mail bij hoort.

<dossier>
Dossiernummer: ${t.case_id}
Merk: ${t.merk}
Categorie: ${t.hoofdcategorie}${t.subonderwerp ? ` — ${t.subonderwerp}` : ''}
Duur: ${t.duration_mmss}
Klant-emotie: ${t.klant_emotie}
Opgelost: ${t.opgelost}
Terugbelafspraak: ${t.terugbel_belofte}
Medewerker: ${t.agent_naam}
</dossier>

<samenvatting>
${t.samenvatting}
</samenvatting>

<transcript>
${transcriptToPlainText(t)}
</transcript>

Schrijf nu de opvolgmail volgens de drivers uit je systeem-instructie. Begin direct met "Onderwerp:" — geen inleidende tekst.`;
}

function mockMail(t: SampleTranscript): string {
  return `Onderwerp: Bevestiging gesprek dossier ${t.case_id}

Geachte heer/mevrouw,

Hartelijk dank voor uw telefoontje vandaag over uw ${t.merk}. Ik bevestig hierbij dat we het volgende hebben besproken: ${t.samenvatting}

Ik ga voor u het volgende doen:
- [Vul concrete vervolgstap in op basis van het gesprek]
- [Vul tijdspad in]

Mocht u in de tussentijd vragen hebben, dan kunt u ons terugbellen onder vermelding van dossiernummer ${t.case_id}.

Met vriendelijke groet,
${t.agent_naam}
Renault Nederland helpdesk

— Mock-respons: ANTHROPIC_API_KEY ontbreekt. Vul .env.local en herstart dev-server.`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as RequestBody;

  if (!body.case_id) {
    return Response.json({ error: 'case_id ontbreekt' }, { status: 400 });
  }

  const transcript = await getSampleTranscript(body.case_id);
  if (!transcript) {
    return Response.json({ error: `transcript ${body.case_id} niet gevonden` }, { status: 404 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ mail: mockMail(transcript), mock: true });
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: buildUserPrompt(transcript) }],
  });

  const mailText = response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('\n')
    .trim();

  return Response.json({
    mail: mailText,
    mock: false,
    usage: response.usage,
  });
}
