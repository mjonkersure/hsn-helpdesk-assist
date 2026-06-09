export type MailDriverKey =
  | 'welkom'
  | 'identificatie'
  | 'vraag_capteren'
  | 'oplossing'
  | 'proactief_ondersteunend'
  | 'empathie'
  | 'afsluiting'
  | 'enquete';

export interface DriverCheck {
  gebruikt: boolean;
  hoe: string;
  reden_overgeslagen: string;
}

export type MailDrivers = Record<MailDriverKey, DriverCheck>;

export interface GenereerMailResponse {
  onderwerp: string;
  body: string;
  drivers: MailDrivers;
  mock: boolean;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number | null;
    cache_read_input_tokens?: number | null;
  };
  error?: string;
}

export const MAIL_DRIVER_LABELS: Record<MailDriverKey, string> = {
  welkom: 'Welkom',
  identificatie: 'Identificatie',
  vraag_capteren: 'Vraag capteren',
  oplossing: 'Oplossing bieden',
  proactief_ondersteunend: 'Proactief ondersteunend',
  empathie: 'Empathie',
  afsluiting: 'Afsluiting',
  enquete: 'Enquête',
};

export const MAIL_DRIVER_TOELICHTING: Record<MailDriverKey, string> = {
  welkom: 'Aanhef met klantnaam',
  identificatie: 'Dossiernummer expliciet vermeld',
  vraag_capteren: 'Vraag of probleem samengevat',
  oplossing: 'Concreet wat je gaat doen, met tijdspad',
  proactief_ondersteunend:
    'Anticipeert op vervolgvragen of biedt relevante extra info (alternatief, tip, scenario)',
  empathie: 'Emotie erkend (alleen wanneer passend)',
  afsluiting: 'Vriendelijke groet + ondertekening',
  enquete: 'Uitnodiging CSAT-enquête (optioneel)',
};
