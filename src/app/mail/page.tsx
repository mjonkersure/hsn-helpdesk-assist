import { Header } from '@/components/Header';
import { Banner } from '@/components/Banner';
import { listSampleTranscripts } from '@/lib/transcripts';
import { MailGenerator } from './MailGenerator';

export default async function MailPage() {
  const transcripts = await listSampleTranscripts();

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-6 space-y-6">
        <Banner
          variant="teamleider"
          deelLabel="Mail-generator"
          title="Van telefoongesprek naar opvolgmail"
          whoNote="Selecteer een transcript en laat AI een conceptmail maken die langs de drivers loopt — dossier, samenvatting, wat je gaat doen, afsluiting."
        />
        <MailGenerator transcripts={transcripts} />
      </main>
    </>
  );
}
