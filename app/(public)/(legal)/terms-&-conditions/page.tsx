import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termini e Condizioni',
  description: 'Leggi i Termini e Condizioni di utilizzo della piattaforma Smartables per la gestione di ristoranti e locali.',
  alternates: { canonical: '/legal/terms-and-conditions' },
  openGraph: {
    title: 'Termini e Condizioni - Smartables',
    description: 'Leggi i Termini e Condizioni di utilizzo della piattaforma Smartables per la gestione di ristoranti e locali.',
    type: 'website',
    images: [
      {
        url: "/og-image.png",
        width: 1280,
        height: 800,
        alt: "Smartables - Termini e Condizioni",
      },
    ],
  },
  robots: { index: false, follow: true },
}

export default function TermsAndConditions() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-white text-gray-800">
      <div className='max-w-4xl mx-auto'>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Termini e Condizioni di Utilizzo</h1>
        <p className="text-sm text-gray-500 mb-8">Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}</p>
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduzione</h2>
            <p className="mb-4">
              Benvenuto su <strong>Smartables</strong>. I presenti Termini e Condizioni ("Termini") regolano l'accesso e l'utilizzo della nostra piattaforma software-as-a-service (SaaS) per la gestione di spazi, posti e organizzazioni.
            </p>
            <p className="mb-4">
              Accedendo o utilizzando il Servizio, accetti di essere vincolato da questi Termini. Se non accetti parte dei Termini, non puoi utilizzare il Servizio.
            </p>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <p className="text-sm text-gray-600">
                Il Servizio è fornito da:<br />
                <span className="font-medium">Tobia Bartolomei</span><br />
                Piazzale Giuseppe Garibaldi 4, 61121 Pesaro<br />
                P.IVA: 02863390411
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Registrazione e Account</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Idoneità:</strong> Devi avere almeno 18 anni o la maggiore età legale nella tua giurisdizione e l'autorità per vincolare l'organizzazione per conto della quale ti registri.
              </li>
              <li>
                <strong>Sicurezza dell'Account:</strong> Sei responsabile della custodia delle credenziali di accesso. Sei l'unico responsabile per tutte le attività che avvengono sotto il tuo account.
              </li>
              <li>
                <strong>Veridicità dei Dati:</strong> Ti impegni a fornire dati accurati, attuali e completi durante la registrazione e ad aggiornarli tempestivamente.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Servizi e Abbonamenti</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Piani di Abbonamento:</strong> L'accesso ad alcune funzionalità richiede un abbonamento (mensile o annuale). I prezzi e le caratteristiche sono descritti nella pagina dei prezzi o nel contratto specifico.
              </li>
              <li>
                <strong>Pagamenti:</strong> I pagamenti sono anticipati. Autorizzi noi o il nostro processore di pagamenti (es. Stripe) ad addebitare il metodo di pagamento fornito.
              </li>
              <li>
                <strong>Rinnovo Automatico:</strong> Salvo disdetta prima della scadenza, l'abbonamento si rinnova automaticamente alle condizioni vigenti.
              </li>
              <li>
                <strong>Cancellazione:</strong> Puoi cancellare l'abbonamento in qualsiasi momento. La cancellazione avrà effetto alla fine del periodo di fatturazione corrente; non sono previsti rimborsi per periodi parziali.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Uso Consentito del Servizio</h2>
            <p className="mb-4">Ti impegni a non utilizzare il Servizio per:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Caricare contenuti illegali, offensivi, o che violino diritti di terzi (inclusi documenti falsi o non autorizzati).</li>
              <li>Tentare di accedere abusivamente al codice sorgente, reverse engineering o manomettere il sistema.</li>
              <li>Utilizzare il servizio per inviare spam o comunicazioni non sollecitate.</li>
              <li>Rivendere o affittare l'accesso al servizio senza nostra esplicita autorizzazione scritta.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Contenuti dell'Utente</h2>
            <p className="mb-4">
              L'utente mantiene la proprietà di tutti i dati, file e documenti ("Contenuti") caricati sulla piattaforma. Caricando i Contenuti, ci concedi una licenza limitata per ospitare, copiare e processare tali dati esclusivamente per fornirti il Servizio.
            </p>
            <p>
              Non monitoriamo preventivamente i contenuti caricati, ma ci riserviamo il diritto di rimuovere qualsiasi contenuto che violi questi Termini.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Proprietà Intellettuale</h2>
            <p>
              Il software <strong>Smartables</strong>, inclusi il codice, il design, le interfacce e i marchi, sono di proprietà esclusiva di Tobia Bartolomei o dei suoi licenziatari. L'uso del Servizio non ti conferisce alcun diritto di proprietà intellettuale su di esso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Limitazione di Responsabilità</h2>
            <p className="mb-4">
              Il Servizio è fornito "COSÌ COM'È" e "SECONDO DISPONIBILITÀ". Nella misura massima consentita dalla legge:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Non garantiamo che il servizio sarà ininterrotto, privo di errori o sicuro al 100%.</li>
              <li>Non siamo responsabili per danni indiretti, incidentali o consequenziali (inclusa la perdita di dati o profitti) derivanti dall'uso del servizio.</li>
              <li>La nostra responsabilità totale per qualsiasi reclamo relativo al Servizio non supererà l'importo pagato dall'utente negli ultimi 12 mesi.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Modifiche ai Termini</h2>
            <p>
              Possiamo modificare questi Termini in qualsiasi momento. Le modifiche sostanziali saranno notificate via email o tramite la piattaforma. Continuare ad usare il servizio dopo le modifiche costituisce accettazione dei nuovi termini.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Legge Applicabile e Foro Competente</h2>
            <p>
              Questi Termini sono regolati dalla <strong>Legge Italiana</strong>. Per qualsiasi controversia derivante da o relativa a questi Termini sarà competente in via esclusiva il Foro di <strong>Pesaro</strong>, salvo norme inderogabili a tutela del consumatore (se applicabili).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Contatti</h2>
            <p>
              Per domande su questi Termini, contattaci a: <span className="font-medium">support@smartables.it</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}