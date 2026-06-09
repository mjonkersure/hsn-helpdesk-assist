import Anthropic from '@anthropic-ai/sdk';
import { getSampleTranscript, transcriptToPlainText } from '@/lib/transcripts';
import type { SampleTranscript } from '@/types/data';
import type { GenereerMailResponse, MailDrivers, MailDriverKey, DriverCheck } from '@/types/mail';

export const dynamic = 'force-dynamic';

const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Je bent een ervaren Renault Nederland helpdesk-medewerker die een opvolgmail schrijft na een telefoongesprek met een klant.

De mail moet gericht voldoen aan de coaching-drivers van HSN. Elke driver is een aspect dat we ook in telefoongesprekken meten — in mail-vorm gelden ze als volgt:

1. **Welkom** — aanhef met klantnaam ("Beste meneer/mevrouw X,"). Als de naam niet uit het gesprek blijkt, "Geachte heer/mevrouw,".
2. **Identificatie** — vermeld het dossiernummer expliciet, zodat de klant weet dat we de zaak hebben en kan refereren bij vervolg.
3. **Vraag capteren** — gebruik direct na de aanhef de volgende vaste openingszin (eventueel licht gepersonaliseerd, maar de kernboodschap blijft staan):
   "Wij zijn blij dat u contact met ons heeft opgenomen, zodat we u van dienst kunnen zijn. Ik heb daarbij begrepen dat:"
   Sluit deze zin DIRECT af met een ge-distilleerde herformulering van de klantvraag (1-2 zinnen). Geen herhaling van transcript-tekst.
4. **Oplossing bieden** — concreet wat je gaat doen of hebt gedaan, met tijdspad waar mogelijk. Geen vaag taalgebruik. Bij verwijzing naar een online actie (verlengen, registreren, instellen): voeg de concrete URL toe (zie <urls> in de user-prompt).
5. **Proactief ondersteunend** — anticipeer op vervolgvragen of biedt ongevraagd maar relevante extra informatie. Voorbeelden: wat blijft er voor de klant werken als hij niét voor de aangeboden oplossing kiest; welke alternatieven er zijn; een tip die helpt bij het vervolg; een scenario dat hij waarschijnlijk later toch tegenkomt. Niet forceren als de klant al volledig is bediend — sla dan over en leg uit waarom.
6. **Empathie** — erkenning van klant-emotie ALLEEN als die het aanstuurt. Bij een geïrriteerde of boze klant: één zin die erkent ("Ik begrijp dat dit vervelend voor u is"). Bij een tevreden of neutrale klant: NIET forceren — laat de driver dan over.
7. **Afsluiting** — vriendelijke groet + ondertekening (medewerker-naam + "Renault Nederland helpdesk" of "Dacia Nederland helpdesk" afhankelijk van merk).
8. **Enquête** — optionele uitnodiging om de CSAT-enquête in te vullen ("U ontvangt straks een korte enquête; uw feedback helpt ons enorm"). Alleen toevoegen als de mail al stevig staat en het natuurlijk past.

**Woordkeuze — verboden termen en alternatieven (belangrijk):**
- "2e hands" of "tweedehands" → schrijf "occasion" of "voertuig van een eerdere eigenaar"
- "mild hybride" / "mild-hybrid" → schrijf "hybride" (zonder kwalificatie) of het officiële modelpostfix (E-Tech Hybrid e.d.)
- "BEV" / "PHEV" / "EV" → schrijf "elektrisch model" of "plug-in hybride" voluit
- "voertuig" klinkt formeel — als de auto al een naam heeft (Captur, Sandero, Megane …) gebruik die liever
- Geen Engelse marketingtermen ("car", "drive", "feature") als er een gewone Nederlandse variant is

**Opbouw — visueel:**
- Korte alinea's, witregels ertussen, geen muur van tekst.
- Wanneer je twee of meer vervolgstappen of vragen aan de klant stelt: gebruik een genummerde lijst.
- Verwijzingen naar een URL zet je inline in de zin, niet als kale link op een aparte regel.

Houd het kort en duidelijk (150-350 woorden body). Geen jargon, geen onnodig formele beleefdheid.

Lever je antwoord ALTIJD via de tool 'lever_opvolgmail'. Vul per driver in of je hem hebt gebruikt, met een citaat uit de mail dat de driver vertegenwoordigt — of de reden waarom je hem hebt overgeslagen.`;

const DRIVER_KEYS: MailDriverKey[] = [
  'welkom',
  'identificatie',
  'vraag_capteren',
  'oplossing',
  'proactief_ondersteunend',
  'empathie',
  'afsluiting',
  'enquete',
];

const DRIVER_CHECK_SCHEMA = {
  type: 'object',
  properties: {
    gebruikt: {
      type: 'boolean',
      description: 'true als deze driver in de mail is toegepast',
    },
    hoe: {
      type: 'string',
      description:
        'Letterlijk citaat uit de mail dat deze driver vertegenwoordigt (1 zin). Lege string als gebruikt=false.',
    },
    reden_overgeslagen: {
      type: 'string',
      description: 'Korte reden waarom deze driver overgeslagen is. Lege string als gebruikt=true.',
    },
  },
  required: ['gebruikt', 'hoe', 'reden_overgeslagen'],
};

const TOOL: Anthropic.Tool = {
  name: 'lever_opvolgmail',
  description:
    'Lever de gegenereerde opvolgmail in gestructureerd formaat, inclusief per coaching-driver welke is toegepast en hoe.',
  input_schema: {
    type: 'object',
    properties: {
      onderwerp: {
        type: 'string',
        description: 'De onderwerpsregel van de mail, zonder "Onderwerp:" prefix',
      },
      body: {
        type: 'string',
        description:
          'De volledige mailbody (zonder onderwerpsregel). Met witregels tussen alineas. Gebruik gewone tekst, geen Markdown.',
      },
      drivers: {
        type: 'object',
        properties: Object.fromEntries(DRIVER_KEYS.map((k) => [k, DRIVER_CHECK_SCHEMA])),
        required: [...DRIVER_KEYS],
      },
    },
    required: ['onderwerp', 'body', 'drivers'],
  },
};

interface RequestBody {
  case_id: string;
}

// Per-merk URLs voor verwijzing naar online acties. Voorlopige waarden;
// in productie kunnen deze uit een Renault/Dacia-content-config komen.
const URLS_PER_MERK: Record<string, { label: string; url: string }[]> = {
  Renault: [
    { label: 'MyRenault (app en website)', url: 'https://www.renault.nl/myrenault.html' },
    { label: 'Renault contact / klantenservice', url: 'https://www.renault.nl/klantenservice.html' },
    { label: 'Verlengen van connected services', url: 'https://www.renault.nl/myrenault.html' },
  ],
  Dacia: [
    { label: 'MyDacia (app en website)', url: 'https://www.dacia.nl/mydacia.html' },
    { label: 'Dacia contact / klantenservice', url: 'https://www.dacia.nl/klantenservice.html' },
  ],
};

function urlsForMerk(merk: string): string {
  const list = URLS_PER_MERK[merk] ?? URLS_PER_MERK['Renault'];
  return list.map((u) => `- ${u.label}: ${u.url}`).join('\n');
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

<urls>
Wanneer je in de mail verwijst naar een online actie, gebruik dan een van deze URLs (alleen wanneer relevant — niet forceren):
${urlsForMerk(t.merk)}
</urls>

<transcript>
${transcriptToPlainText(t)}
</transcript>

Schrijf de opvolgmail en lever het resultaat via de tool 'lever_opvolgmail'. Hou je aan de vaste openingszin van Vraag capteren, de woordkeuze-regels, en de opbouw-regels uit het systeem.`;
}

function mockResponse(t: SampleTranscript): GenereerMailResponse {
  const drivers: MailDrivers = {
    welkom: { gebruikt: true, hoe: 'Geachte heer/mevrouw,', reden_overgeslagen: '' },
    identificatie: {
      gebruikt: true,
      hoe: `dossiernummer ${t.case_id}`,
      reden_overgeslagen: '',
    },
    vraag_capteren: {
      gebruikt: true,
      hoe: t.samenvatting,
      reden_overgeslagen: '',
    },
    oplossing: {
      gebruikt: false,
      hoe: '',
      reden_overgeslagen: 'mock-respons heeft geen echte vervolgstappen',
    },
    proactief_ondersteunend: {
      gebruikt: false,
      hoe: '',
      reden_overgeslagen: 'mock-respons; AI niet aangeroepen',
    },
    empathie: {
      gebruikt: false,
      hoe: '',
      reden_overgeslagen: 'mock-respons; klant-emotie niet meegewogen',
    },
    afsluiting: {
      gebruikt: true,
      hoe: `${t.agent_naam} — Renault Nederland helpdesk`,
      reden_overgeslagen: '',
    },
    enquete: { gebruikt: false, hoe: '', reden_overgeslagen: 'mock-respons' },
  };
  return {
    onderwerp: `Bevestiging gesprek dossier ${t.case_id}`,
    body: `Geachte heer/mevrouw,

Hartelijk dank voor uw telefoontje vandaag over uw ${t.merk}. Ik bevestig hierbij dat we het volgende hebben besproken: ${t.samenvatting}

Met vriendelijke groet,
${t.agent_naam}
Renault Nederland helpdesk

— Mock-respons: ANTHROPIC_API_KEY ontbreekt. Vul .env.local en herstart dev-server.`,
    drivers,
    mock: true,
  };
}

function normalizeDrivers(input: unknown): MailDrivers {
  const fallback: DriverCheck = { gebruikt: false, hoe: '', reden_overgeslagen: 'niet geleverd door AI' };
  const obj = (input ?? {}) as Record<string, Partial<DriverCheck>>;
  return Object.fromEntries(
    DRIVER_KEYS.map((k) => {
      const v = obj[k];
      return [
        k,
        {
          gebruikt: Boolean(v?.gebruikt),
          hoe: typeof v?.hoe === 'string' ? v.hoe : '',
          reden_overgeslagen: typeof v?.reden_overgeslagen === 'string' ? v.reden_overgeslagen : '',
        } satisfies DriverCheck,
      ];
    })
  ) as MailDrivers;
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
    return Response.json(mockResponse(transcript));
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [TOOL],
    tool_choice: { type: 'tool', name: TOOL.name },
    messages: [{ role: 'user', content: buildUserPrompt(transcript) }],
  });

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    return Response.json(
      { error: 'AI leverde geen gestructureerde mail-output' },
      { status: 502 }
    );
  }

  const parsed = toolUse.input as {
    onderwerp?: string;
    body?: string;
    drivers?: unknown;
  };

  const payload: GenereerMailResponse = {
    onderwerp: parsed.onderwerp ?? '',
    body: parsed.body ?? '',
    drivers: normalizeDrivers(parsed.drivers),
    mock: false,
    usage: response.usage,
  };

  return Response.json(payload);
}
