import { createClient } from "@/utils/supabase/server";
import { DocumentForm } from "./document-form";
import { NumberPurchase } from "./number-purchase";
import { BrandingForm } from "./branding-form";
import { redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import PageWrapper from "@/components/private/page-wrapper";
import { getFaqsByTopic } from "@/utils/sanity/queries";

const faqs = [
  {
    id: 1,
    title: 'Perchè servono questi documenti?',
    text: 'Per acquistare e attivare un numero locale italiano (es. 02, 06, 051), la normativa richiede di verificare l\'identità del titolare e la sede dell\'attività. Telnyx (il nostro fornitore VoIP) è legalmente tenuto a richiederli.'
  },
  {
    id: 2,
    title: 'I miei dati sono al sicuro?',
    text: 'Assolutamente sì. I documenti vengono caricati su un server privato e trasmessi direttamente a Telnyx tramite connessione crittografata solo per la verifica. Non vengono condivisi con terze parti. I tuoi documenti verranno eliminati automaticamente dopo la verifica, in quanto non ci interessa conservarli.'
  },
  {
    id: 3,
    title: 'Sono un privato o un azienda?',
    text: 'Se sei un privato, devi caricare la tessera sanitaria del tuo rappresentante legale. Se sei un azienda, devi caricare la tessera sanitaria del tuo rappresentante legale.'
  },
  {
    id: 4,
    title: 'Cosa succede se non li carico?',
    text: 'Senza la verifica, non è possibile acquistare numeri locali. Il sistema non potrà intercettare le chiamate e attivare il bot che risponde al posto tuo.'
  },
  {
    id: 5,
    title: 'Quanto tempo ci vuole?',
    text: 'La verifica solitamente richiede 24-48 ore lavorative da parte del team legale di Telnyx. Ti avviseremo non appena sarà completata.'
  },
  {
    id: 6,
    title: 'Sto pagando per un numero locale?',
    text: 'No, non paghi per un numero locale. Il numero locale è un numero virtuale che viene assegnato al tuo bot quando viene verificato. Non paghi per il numero locale (lo compriamo noi per te), ma per il tuo bot.'
  },
  {
    id: 7,
    title: 'Dovrò collegare il numero locale al mio bot?',
    text: 'Più avanti dovrai impostare il numero locale come numero di telefono del bot nelle impostazioni del tuo telefono.'
  },
]

export default async function CompliancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch Organization with Locations
  const { data: organization } = await supabase
    .from("organizations")
    .select(`
      id, 
      name, 
      activation_status,
      locations ( 
        id, 
        name, 
        address,
        telnyx_phone_number,
        regulatory_requirement_id,
        activation_status
      )
    `)
    .eq("created_by", user.id)
    .single();

  if (!organization) return <div>Organization not found.</div>;
  const primaryLocation = organization.locations?.[0];

  let complianceData = null;
  if (primaryLocation?.regulatory_requirement_id) {
    const { data } = await supabase
      .from("telnyx_regulatory_requirements")
      .select("*")
      .eq("id", primaryLocation.regulatory_requirement_id)
      .single();
    complianceData = data;
  }

  const isApproved = complianceData?.status === 'approved';
  // Telnyx statuses can be 'pending', 'in-progress', 'pending-approval'
  const isPendingTelnyx = ['pending', 'in-progress', 'pending-approval', 'unapproved'].includes(complianceData?.status || '');
  const isPendingReview = complianceData?.status === 'pending_review';
  const isRejected = complianceData?.status === 'rejected';
  const hasNumber = !!primaryLocation?.telnyx_phone_number;

  return (
    <PageWrapper>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance & Attivazione</h1>
        <p className="text-muted-foreground">
          Per attivare i numeri locali e le funzionalità di chiamata, è necessario verificare la tua azienda.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">

          {complianceData && (
            <Alert variant={isApproved ? "default" : isRejected ? "destructive" : "default"} className={isApproved ? "border-green-500 bg-green-50" : isRejected ? "" : "bg-blue-50 border-blue-200"}>
              {isApproved && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {(isPendingTelnyx || isPendingReview) && <Clock className="h-4 w-4 text-blue-600" />}
              {isRejected && <XCircle className="h-4 w-4" />}
              <AlertTitle className={isApproved ? "text-green-800" : (isPendingTelnyx || isPendingReview) ? "text-blue-800" : ""}>
                Stato Verifica: {isApproved ? "Approvato" : isPendingTelnyx ? "In Revisione (Telnyx)" : isPendingReview ? "In Attesa di Approvazione" : "Respinto"}
              </AlertTitle>
              <AlertDescription className={isApproved ? "text-green-700" : (isPendingTelnyx || isPendingReview) ? "text-blue-700" : ""}>
                {isApproved && "I tuoi documenti sono stati approvati. Puoi procedere all'acquisto del numero."}
                {isPendingTelnyx && "Telnyx sta controllando i tuoi documenti. Puoi gia acquistare un numero, sarà attivato non appena i tuoi documenti verranno confermati."}
                {isPendingReview && "I tuoi documenti sono stati inviati e sono in attesa di approvazione da parte del nostro team."}
                {isRejected && `La verifica è stata respinta: ${complianceData.rejection_reason || "Documenti non validi"}. Riprova.`}
              </AlertDescription>
            </Alert>
          )}

          {hasNumber && primaryLocation.activation_status !== 'pending' ? (
            <div className="p-6 border rounded-lg bg-green-50">
              <h3 className="text-lg font-bold text-green-800 mb-2">Numero Acquistato!</h3>
              <p className="text-green-700">Il tuo numero <strong>{primaryLocation.telnyx_phone_number}</strong> è stato acquistato, riceverai una email non appena sarà attivo e potrai configurarlo.</p>
            </div>
          ) : hasNumber && primaryLocation.activation_status === 'pending' ? (
            <div className="p-6 border rounded-lg bg-yellow-50">
              <h3 className="text-lg font-bold text-yellow-800 mb-2">Numero Riservato</h3>
              <p className="text-yellow-700 mb-2">Abbiamo riservato il numero <strong>{primaryLocation.telnyx_phone_number}</strong> per te.</p>
              <p className="text-sm text-yellow-700">Il numero sarà attivo non appena la verifica dei documenti sarà completata da Telnyx (24-48h). Nel frattempo puoi configurare il resto della piattaforma.</p>
            </div>
          ) : (
            <>
              {(!complianceData || isRejected) && primaryLocation && (
                <DocumentForm
                  locationId={primaryLocation.id}
                />
              )}

              {(isApproved || isPendingTelnyx) && primaryLocation && complianceData?.telnyx_requirement_group_id && (
                <NumberPurchase
                  locationId={primaryLocation.id}
                  requirementGroupId={complianceData.telnyx_requirement_group_id}
                  areaCode={complianceData.area_code}
                />
              )}

              {primaryLocation && primaryLocation.activation_status === 'verified' && (
                <div className="mt-8">
                  <BrandingForm locationId={primaryLocation.id} />
                </div>
              )}
            </>
          )}

          {!primaryLocation && (
            <div className="p-4 border rounded bg-yellow-50 text-yellow-800">
              Nessuna sede trovata. Crea prima una sede per caricare i documenti.
            </div>
          )}

        </div>
        <div className="space-y-6">
          <ComplianceGuide />
          <ComplianceFAQ />
        </div>
      </div>
    </PageWrapper>
  );
}

const ComplianceGuide = () => {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg">Guida alla Compilazione</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="ditta-individuale">
            <AccordionTrigger className="text-left">Ditta Indiv. / Libero Prof.</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p><strong>Nome Azienda:</strong> Inserisci il nome completo (es. "Mario Rossi" o "Bar Sport di Mario Rossi").</p>
              <p><strong>Partita IVA:</strong> Le 11 cifre della tua P.IVA.</p>
              <p><strong>Codice Fiscale:</strong> Il tuo Codice Fiscale personale (alfanumerico, es. RSSMRI80A01H501U).</p>
              <p><strong>Documento:</strong> Carica la tua Carta d'Identità o Patente valida.</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="societa-persone">
            <AccordionTrigger className="text-left">Società di Persone (S.n.c., S.a.s.)</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p><strong>Nome Azienda:</strong> Ragione Sociale completa (es. "Ristorante Da Mario S.n.c.").</p>
              <p><strong>Partita IVA / CF:</strong> Solitamente coincidono e sono numerici (11 cifre).</p>
              <p><strong>Rappresentante:</strong> Inserisci i dati di un socio amministratore.</p>
              <p><strong>Documento:</strong> Visura Camerale recente + Documento d'identità del socio amministratore.</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="societa-capitali">
            <AccordionTrigger className="text-left">Società di Capitali (S.r.l., S.p.A.)</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p><strong>Nome Azienda:</strong> Ragione Sociale completa (es. "Ristorante Da Mario S.r.l.").</p>
              <p><strong>Partita IVA / CF:</strong> Solitamente coincidono e sono numerici (11 cifre).</p>
              <p><strong>Rappresentante:</strong> Inserisci i dati dell'Amministratore Unico o del Legale Rappresentante.</p>
              <p><strong>Documento:</strong> Visura Camerale recente + Documento d'identità dell'amministratore.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

const ComplianceFAQ = async () => {
  const faqs = await getFaqsByTopic('whatsapp')


  return (
    <Card className="h-fit gap-2">
      <CardHeader>
        <CardTitle className="text-lg">Domande Frequenti</CardTitle>
      </CardHeader>
      <CardContent>
        {faqs.map((faq) => (
          <Accordion key={faq._id} type="single" collapsible className="w-full">
            <AccordionItem value={`item-${faq._id}`}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent>
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  );
}