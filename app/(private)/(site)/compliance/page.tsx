import { createClient } from "@/supabase/server";
import { DocumentForm } from "@/app/(private)/(site)/compliance/document-form";
import { NumberPurchase } from "@/app/(private)/(site)/compliance/number-purchase";
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
        regulatory_requirement_id
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
  const isPendingTelnyx = complianceData?.status === 'pending';
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
                {isPendingTelnyx && "Telnyx sta controllando i tuoi documenti. Riceverai una mail appena completato (24-48h)."}
                {isPendingReview && "I tuoi documenti sono stati inviati e sono in attesa di approvazione da parte del nostro team."}
                {isRejected && `La verifica è stata respinta: ${complianceData.rejection_reason || "Documenti non validi"}. Riprova.`}
              </AlertDescription>
            </Alert>
          )}

          {hasNumber ? (
            <div className="p-6 border rounded-lg bg-green-50">
              <h3 className="text-lg font-bold text-green-800 mb-2">Numero Attivo!</h3>
              <p className="text-green-700">Il tuo numero <strong>{primaryLocation.telnyx_phone_number}</strong> è attivo e collegato a questa sede.</p>
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
            </>
          )}

          {!primaryLocation && (
            <div className="p-4 border rounded bg-yellow-50 text-yellow-800">
              Nessuna sede trovata. Crea prima una sede per caricare i documenti.
            </div>
          )}

        </div>
        <div>
          <ComplianceFAQ />
        </div>
      </div>
    </PageWrapper>
  );
}

const ComplianceFAQ = () => {
  return (
    <Card className="h-fit gap-2">
      <CardHeader>
        <CardTitle className="text-lg">Domande Frequenti</CardTitle>
      </CardHeader>
      <CardContent>
        {faqs.map((faq) => (
          <Accordion key={faq.id} type="single" collapsible className="w-full">
            <AccordionItem value={`item-${faq.id}`}>
              <AccordionTrigger>{faq.title}</AccordionTrigger>
              <AccordionContent>
                {faq.text}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  );
}