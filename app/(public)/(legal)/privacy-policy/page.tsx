import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Informativa sulla Privacy',
  description: 'Informativa sulla privacy di Smartables: come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali in conformità al GDPR.',
  alternates: { canonical: '/privacy-policy' },
  openGraph: {
    title: 'Informativa sulla Privacy - Smartables',
    description: 'Informativa sulla privacy di Smartables: come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali in conformità al GDPR.',
    type: 'website',
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 800,
        alt: "Smartables - Informativa sulla Privacy",
      },
    ],
  }
}

export default function PrivacyPolicy() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-white text-gray-800">
      <div className='max-w-4xl mx-auto'>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Informativa sulla Privacy</h1>
        <p className="text-sm text-gray-500 mb-8">Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}</p>
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Titolare del Trattamento</h2>
            <p className="mb-2">
              Il Titolare del trattamento dei dati è:
            </p>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
              <p className="font-medium">Tobia Bartolomei</p>
              <p className="text-gray-600">Piazzale Giuseppe Garibaldi 4</p>
              <p className="text-gray-600">61121 Pesaro</p>
              <p className="text-gray-600">Email di contatto: <span className="font-medium">support@smartables.com</span></p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Tipologie di Dati Raccolti</h2>
            <p className="mb-4">
              Durante l'utilizzo della nostra applicazione <strong>Smartables</strong>, raccogliamo le seguenti tipologie di dati:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Dati dell'Account:</strong> Nome, cognome, indirizzo email, password (crittografata).
              </li>
              <li>
                <strong>Dati Aziendali:</strong> Nome dell'organizzazione, indirizzi, partita IVA, dati di fatturazione.
              </li>
              <li>
                <strong>Dati di Navigazione e Utilizzo:</strong> Indirizzi IP, log di sistema, tipo di browser, orari di accesso, interazioni con l'interfaccia.
              </li>
              <li>
                <strong>Dati di Compliance:</strong> Documenti d'identità caricati per la verifica dell'account o per obblighi normativi.
              </li>
              <li>
                <strong>Numeri di Telefono:</strong> Numeri di telefono per la gestione delle configurazioni o per l'autenticazione a due fattori (se attiva).
              </li>
              <li>
                <strong>Gestione delle Zone e dei Posti:</strong> Configurazioni delle mappe, layout dei tavoli/posti e preferenze associate.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Finalità del Trattamento</h2>
            <p className="mb-4">Trattiamo i tuoi dati per le seguenti finalità:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Erogazione del Servizio:</strong> Per permetterti di accedere alla piattaforma, gestire le tue mappe, i tuoi posti e le configurazioni aziendali.</li>
              <li><strong>Gestione Amministrativa e Contabile:</strong> Fatturazione degli abbonamenti, gestione dei pagamenti e adempimento degli obblighi fiscali.</li>
              <li><strong>Sicurezza e Monitoraggio:</strong> Prevenzione di frodi, abusi o accessi non autorizzati; monitoraggio delle performance del sistema.</li>
              <li><strong>Supporto Clienti:</strong> Risposta a richieste di assistenza tecnica o commerciale.</li>
              <li><strong>Comunicazioni di Servizio:</strong> Invio di notifiche relative a scadenze, rinnovi, modifiche contrattuali o aggiornamenti tecnici critici.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Base Giuridica del Trattamento</h2>
            <p className="mb-4">Il trattamento dei dati si basa su:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Esecuzione del Contratto:</strong> Necessario per fornire i servizi richiesti (es. registrazione account, uso del software).</li>
              <li><strong>Obbligo Legale:</strong> Necessario per adempiere a normative fiscali, amministrative o di sicurezza.</li>
              <li><strong>Legittimo Interesse:</strong> Per garantire la sicurezza dell'infrastruttura e migliorare i nostri servizi.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Destinatari dei Dati</h2>
            <p className="mb-4">I tuoi dati potrebbero essere condivisi con:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Fornitori di Servizi Tecnici:</strong> Hosting provider (es. Vercel, AWS), fornitori di database, servizi di email transazionali.</li>
              <li><strong>Processori di Pagamento:</strong> Stripe o altri gateway per la gestione sicura dei pagamenti (noi non memorizziamo i dati completi della carta di credito).</li>
              <li><strong>Consulenti e Studi Professionali:</strong> Commercialisti o legali per adempimenti fiscali e normativi.</li>
              <li><strong>Autorità Pubbliche:</strong> Solo se richiesto dalla legge o da ordini dell'autorità.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Trasferimento dei Dati Extra-UE</h2>
            <p>
              I dati sono primariamente conservati su server situati all'interno dell'Unione Europea o in paesi che garantiscono un livello di protezione adeguato secondo la Commissione Europea. Qualora ci avvalessimo di fornitori extra-UE (es. USA), ci assicureremo che siano adottate le Clausole Contrattuali Standard (SCC) o altre garanzie previste dal GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Periodo di Conservazione</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Dati Account e Contenuti:</strong> Conservati finché l'account è attivo. In caso di cancellazione, i dati saranno eliminati entro 30 giorni, salvo backup tecnici (conservati per un massimo di 90 giorni).</li>
              <li><strong>Dati di Fatturazione:</strong> Conservati per 10 anni come richiesto dalla legge italiana.</li>
              <li><strong>Log di Sistema:</strong> Conservati per un periodo limitato (es. 6-12 mesi) per finalità di sicurezza.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Diritti dell'Interessato</h2>
            <p className="mb-4">In conformità al GDPR (artt. 15-22), hai il diritto di:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Chiedere l'<strong>accesso</strong> ai tuoi dati personali.</li>
              <li>Chiedere la <strong>rettifica</strong> di dati inesatti o incompleti.</li>
              <li>Chiedere la <strong>cancellazione</strong> dei dati (diritto all'oblio), se sussistono i presupposti.</li>
              <li>Chiedere la <strong>limitazione</strong> del trattamento.</li>
              <li>Richiedere la <strong>portabilità</strong> dei dati in un formato strutturato.</li>
              <li><strong>Opporti</strong> al trattamento per motivi legittimi.</li>
            </ul>
            <p className="mt-4">
              Per esercitare i tuoi diritti, puoi contattarci all'indirizzo email: <span className="font-medium">support@smartables.com</span>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Modifiche a questa Policy</h2>
            <p>
              Ci riserviamo il diritto di aggiornare la presente informativa. Le modifiche saranno notificate via email o tramite avviso sulla piattaforma. L'uso continuato del servizio costituisce accettazione delle modifiche.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}