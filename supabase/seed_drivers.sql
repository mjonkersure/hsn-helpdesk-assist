-- Seed: 9 Marten-criteria
-- Run na schema.sql

insert into public.drivers (key, label, group_name, detectable, definition, display_order) values
  ('welkom',         'Welkom',                  'welkom',     true,  'Begroet klant met tijd-van-dag, naam en organisatie in eerste 30 seconden.', 1),
  ('vraag_capteren', 'Vraag capteren',          'vraag',      true,  'Vat de klantvraag samen of herhaalt voor verificatie ("als ik het goed begrijp...").', 2),
  ('identificatie',  'Identificatie van klant', 'vraag',      true,  'Vraagt klantgegevens uit: kenteken, e-mail, achternaam, VIN, chassisnummer.', 3),
  ('oplossing',      'Oplossing / hulp bieden', 'oplossing',  true,  'Benoemt concreet wat er gaat gebeuren ("wat ik voor u ga doen is...", "ik ga regelen...").', 4),
  ('toon',           'Toon',                    'oplossing',  false, 'Warme, dynamische toon, geen stiltes. Vereist audio-analyse — fase 2.', 5),
  ('empathie',       'Empathie',                'empathie',   true,  'Erkent emotie ("wat vervelend") of geeft ruimte via vragende zinnen ("waar kan ik u verder mee helpen?").', 6),
  ('afsluiting',     'Afsluiting',              'afsluiting', true,  'Sluit af met bedankje, beleefdheidsformule, vervolgvraag.', 7),
  ('enquete',        'Enquête',                 'afsluiting', true,  'Benoemt enquête-mogelijkheid actief, eventueel met "9 of 10 helpt enorm".', 8),
  ('inhoud',         'Inhoud',                  'inhoud',     false, 'Inhoudelijk juiste antwoord. Vereist Renault-KB — fase 2.', 9)
on conflict (key) do update set
  label = excluded.label,
  group_name = excluded.group_name,
  detectable = excluded.detectable,
  definition = excluded.definition,
  display_order = excluded.display_order;
