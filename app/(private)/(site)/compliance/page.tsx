import { createClient } from "@/utils/supabase/server";
import { DocumentForm } from "./document-form";
import { NumberPurchase } from "./number-purchase";
import { redirect } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  FileText,
  AlertTriangle,
  Phone,
  Building2,
  ExternalLink,
} from "lucide-react";
import PageWrapper from "@/components/private/page-wrapper";
import { getFaqsByTopic } from "@/utils/sanity/queries";
import { FaqContent } from "@/components/private/faq-section";
import { formatPhoneNumber } from "@/lib/utils";

export const metadata = {
  title: "Compliance & Attivazione",
  description:
    "Per attivare i numeri locali e le funzionalità di chiamata, è necessario verificare la tua azienda.",
};

// ─── types & helpers ─────────────────────────────────────────────────────────

type RegulatoryStatus =
  | "pending"
  | "in-progress"
  | "pending-approval"
  | "unapproved"
  | "pending_review"
  | "approved"
  | "rejected"
  | null;

type ComplianceState =
  | "no_location"
  | "no_documents"
  | "waiting"
  | "approved"
  | "rejected"
  | "number_pending"
  | "number_active";

function deriveState(
  status: RegulatoryStatus,
  hasNumber: boolean,
  numberActivationStatus: string | null | undefined
): ComplianceState {
  if (hasNumber && numberActivationStatus !== "pending") return "number_active";
  if (hasNumber && numberActivationStatus === "pending") return "number_pending";
  if (status === "approved") return "approved";
  if (
    status !== null &&
    ["pending", "in-progress", "pending-approval", "unapproved", "pending_review"].includes(status)
  )
    return "waiting";
  if (status === "rejected") return "rejected";
  return "no_documents";
}

const STATE_META: Record<
  ComplianceState | "no_location",
  { label: string; description: string; badge: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" | "success" }
> = {
  no_location: {
    label: "Nessuna sede",
    description: "Crea prima una sede per poter caricare i documenti di compliance.",
    badge: "Nessuna sede",
    badgeVariant: "outline",
  },
  no_documents: {
    label: "Documenti da caricare",
    description: "Carica i documenti della tua azienda per avviare la verifica e ottenere un numero locale.",
    badge: "In attesa",
    badgeVariant: "secondary",
  },
  waiting: {
    label: "In verifica",
    description: "I tuoi documenti sono stati ricevuti e sono in corso di verifica. Ti aggiorneremo non appena completata.",
    badge: "In verifica",
    badgeVariant: "secondary",
  },
  approved: {
    label: "Documenti approvati",
    description: "La tua azienda è stata verificata con successo. Procedi all'acquisto del numero locale.",
    badge: "Approvato",
    badgeVariant: "success",
  },
  rejected: {
    label: "Verifica respinta",
    description: "La verifica è stata respinta. Ricarica i documenti corretti.",
    badge: "Respinto",
    badgeVariant: "destructive",
  },
  number_pending: {
    label: "Numero riservato",
    description: "Il numero è stato riservato e sarà attivato al completamento della verifica Telnyx (24–48h).",
    badge: "Attivazione in corso",
    badgeVariant: "secondary",
  },
  number_active: {
    label: "Attivo",
    description: "Il tuo numero locale è attivo e operativo.",
    badge: "Attivo",
    badgeVariant: "success",
  },
};

// ─── page ────────────────────────────────────────────────────────────────────

export default async function CompliancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [complianceFaqs] = await Promise.all([getFaqsByTopic("compliance")]);

  const { data: organization } = await supabase
    .from("organizations")
    .select(
      `
      id,
      name,
      activation_status,
      locations (
        id,
        name,
        address,
        telnyx_phone_number,
        regulatory_status,
        regulatory_rejection_reason,
        regulatory_documents_data,
        telnyx_requirement_group_id,
        activation_status
      )
    `
    )
    .eq("created_by", user.id)
    .single();

  if (!organization) return <div>Organization not found.</div>;

  const primaryLocation = organization.locations?.[0];
  const docs = (primaryLocation?.regulatory_documents_data ?? null) as Record<string, unknown> | null;
  const regulatoryStatus = (primaryLocation?.regulatory_status ?? null) as RegulatoryStatus;
  const hasNumber = !!primaryLocation?.telnyx_phone_number;

  const state: ComplianceState | "no_location" = primaryLocation
    ? deriveState(regulatoryStatus, hasNumber, primaryLocation.activation_status)
    : "no_location";

  const requirementGroupId = primaryLocation?.telnyx_requirement_group_id ?? null;
  const areaCode = (docs as any)?.area_code ?? null;

  // Generate signed URLs for uploaded documents
  let identityUrl: string | null = null;
  let addressUrl: string | null = null;
  if (docs?.identity_path) {
    const { data } = await supabase.storage
      .from("compliance-docs")
      .createSignedUrl(docs.identity_path as string, 3600);
    identityUrl = data?.signedUrl ?? null;
  }
  if (docs?.address_path) {
    const { data } = await supabase.storage
      .from("compliance-docs")
      .createSignedUrl(docs.address_path as string, 3600);
    addressUrl = data?.signedUrl ?? null;
  }

  return (
    <PageWrapper>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Compliance & Attivazione</h1>
        <p className="text-muted-foreground">
          Per attivare i numeri locali e le funzionalità di chiamata, è necessario verificare la
          tua azienda.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-5">

          {/* ── Status banner ── */}
          <StatusBanner state={state} rejectionReason={primaryLocation?.regulatory_rejection_reason ?? null} />

          {/* ── Business info card ── */}
          {primaryLocation && docs && (
            <InfoCard
              location={primaryLocation}
              docs={docs}
              regulatoryStatus={regulatoryStatus}
            />
          )}

          {/* ── Documents card ── */}
          {(identityUrl || addressUrl) && (
            <Card className="pt-0 gap-0">
              <div className="px-5 py-4 border-b flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-lg">Documenti caricati</span>
              </div>
              <CardContent className="pt-4 grid grid-cols-2 gap-3">
                {identityUrl && (
                  <DocumentCard
                    title="Documento d'identità"
                    filename={(docs?.identity_filename as string) ?? "documento.pdf"}
                    url={identityUrl}
                  />
                )}
                {addressUrl && (
                  <DocumentCard
                    title="Documento indirizzo / Visura"
                    filename={(docs?.address_filename as string) ?? "visura.pdf"}
                    url={addressUrl}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Action area ── */}
          {(state === "no_documents" || state === "rejected") && primaryLocation && (
            <DocumentForm locationId={primaryLocation.id} />
          )}

          {(state === "approved" || state === "waiting") && primaryLocation && requirementGroupId && (
            <NumberPurchase
              locationId={primaryLocation.id}
              requirementGroupId={requirementGroupId}
              areaCode={areaCode}
            />
          )}

          {state === "no_location" && (
            <div className="p-4 border rounded bg-yellow-50 text-yellow-800 text-sm">
              Nessuna sede trovata. Crea prima una sede per caricare i documenti.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <ComplianceGuide />
          <FaqContent title="Domande frequenti" faqs={complianceFaqs} />
        </div>
      </div>
    </PageWrapper>
  );
}

// ─── StatusBanner ─────────────────────────────────────────────────────────────

function StatusBanner({
  state,
  rejectionReason,
}: {
  state: ComplianceState | "no_location";
  rejectionReason: string | null;
}) {
  const meta = STATE_META[state];

  const iconMap: Record<string, React.ReactNode> = {
    no_location: <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />,
    no_documents: <FileText className="w-5 h-5 text-muted-foreground shrink-0" />,
    waiting: <Clock className="w-5 h-5 text-blue-500 shrink-0" />,
    approved: <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />,
    rejected: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
    number_pending: <Clock className="w-5 h-5 text-amber-500 shrink-0" />,
    number_active: <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />,
  };

  const borderMap: Record<string, string> = {
    no_location: "border-l-yellow-400",
    no_documents: "border-l-border",
    waiting: "border-l-blue-400",
    approved: "border-l-green-400",
    rejected: "border-l-red-400",
    number_pending: "border-l-amber-400",
    number_active: "border-l-green-400",
  };

  return (
    <div className={`flex items-start gap-3 p-4 border rounded-2xl border-l-4 border-emerald-200 bg-emerald-50 ${borderMap[state]}`}>
      {iconMap[state]}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-lg leading-none">{meta.label}</p>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {state === "rejected" && rejectionReason
            ? `${meta.description} Motivo: ${rejectionReason}`
            : meta.description}
        </p>
      </div>
    </div>
  );
}

// ─── InfoCard ─────────────────────────────────────────────────────────────────

const REGULATORY_STATUS_LABEL: Record<string, string> = {
  pending: "In attesa (Telnyx)",
  "in-progress": "In lavorazione (Telnyx)",
  "pending-approval": "In attesa di approvazione",
  unapproved: "Non approvato",
  pending_review: "In revisione interna",
  approved: "Approvato",
  rejected: "Respinto",
};

const DOCS_LABEL: Record<string, string> = {
  business_name: "Nome azienda",
  vat_number: "Partita IVA",
  tax_code: "Codice Fiscale",
  area_code: "Prefisso richiesto",
  representative_name: "Rappresentante legale",
  representative_cf: "CF Rappresentante",
  document_type: "Tipo documento",
  business_type: "Tipo azienda",
};

const ACTIVATION_STATUS_LABEL: Record<string, string> = {
  pending: "In attesa di attivazione",
  active: "Attivo",
  failed: "Attivazione fallita",
  verified: "Verificata",
};

// Keys that are internal paths/filenames — skip in the UI
const SKIP_KEYS = new Set(["identity_path", "identity_filename", "address_path", "address_filename"]);

function InfoCard({
  location,
  docs,
  regulatoryStatus,
}: {
  location: {
    name: string | null;
    address: string | null;
    telnyx_phone_number: string | null;
    regulatory_status: string | null;
    activation_status: string | null;
  };
  docs: Record<string, unknown>;
  regulatoryStatus: RegulatoryStatus;
}) {
  // Business fields from docs
  const businessFields = Object.entries(docs)
    .filter(([k, v]) => !SKIP_KEYS.has(k) && v !== null && v !== undefined && v !== "")
    .map(([k, v]) => ({ label: DOCS_LABEL[k] ?? k, value: String(v) }));

  return (
    <Card className="pt-0 gap-0">
      {/* Azienda */}
      <div className="px-5 py-4 border-b-2 flex items-center gap-2 bg-muted rounded-t-4xl">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <span className="font-semibold text-lg">Informazioni azienda</span>
      </div>
      <CardContent className="pt-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {businessFields.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Sede</dt>
            <dd className="font-medium">{location.name ?? "—"}</dd>
          </div>
          {location.address && (
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Indirizzo</dt>
              <dd className="font-medium">{location.address}</dd>
            </div>
          )}
        </dl>
      </CardContent>

      {/* Numero */}
      {location.telnyx_phone_number && (
        <div className="mt-4">
          <div className="px-5 py-3 border-t-2 border-b-2 flex items-center gap-2 bg-muted">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-lg">Numero locale</span>
          </div>
          <CardContent className="pt-4">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Numero</dt>
                <dd className="font-semibold text-base tracking-wide">{formatPhoneNumber(location.telnyx_phone_number)}</dd>
              </div>
              {location.activation_status && (
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">Stato attivazione</dt>
                  <dd className="font-medium capitalize">{ACTIVATION_STATUS_LABEL[location.activation_status] ?? location.activation_status}</dd>
                </div>
              )}
              {regulatoryStatus && (
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">Stato verifica</dt>
                  <dd className="font-medium">{REGULATORY_STATUS_LABEL[regulatoryStatus] ?? regulatoryStatus}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </div>
      )}
    </Card>
  );
}

// ─── DocumentCard ─────────────────────────────────────────────────────────────

function DocumentCard({
  title,
  filename,
  url,
}: {
  title: string;
  filename: string;
  url: string;
}) {
  const isPdf = filename.toLowerCase().endsWith(".pdf");

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 p-4 border rounded-lg hover:border-primary hover:bg-muted/30 transition-colors"
    >
      {isPdf ? (
        <div className="w-full h-36 rounded bg-muted flex items-center justify-center">
          <FileText className="w-10 h-10 text-muted-foreground" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={title}
          className="w-full h-36 object-cover rounded border"
        />
      )}
      <div className="flex items-start justify-between gap-2">
        <p className="text-md text-muted-foreground">{title}</p>
        <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors mt-0.5" />
      </div>
    </a>
  );
}

// ─── ComplianceGuide ─────────────────────────────────────────────────────────

const ComplianceGuide = () => {
  return (
    <Card className="h-fit py-0 gap-0">
      <div className="px-6 py-6 border-b-2 bg-muted/5">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold tracking-tight">Guida alla Compilazione</h3>
        </div>
      </div>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="ditta-individuale">
            <AccordionTrigger className="text-left">Ditta Indiv. / Libero Prof.</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Nome Azienda:</strong> Inserisci il nome completo (es. "Mario Rossi" o
                "Bar Sport di Mario Rossi").
              </p>
              <p>
                <strong>Partita IVA:</strong> Le 11 cifre della tua P.IVA.
              </p>
              <p>
                <strong>Codice Fiscale:</strong> Il tuo Codice Fiscale personale (alfanumerico,
                es. RSSMRI80A01H501U).
              </p>
              <p>
                <strong>Documento:</strong> Carica la tua Carta d'Identità o Patente valida.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="societa-persone">
            <AccordionTrigger className="text-left">
              Società di Persone (S.n.c., S.a.s.)
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Nome Azienda:</strong> Ragione Sociale completa (es. "Ristorante Da Mario
                S.n.c.").
              </p>
              <p>
                <strong>Partita IVA / CF:</strong> Solitamente coincidono e sono numerici (11
                cifre).
              </p>
              <p>
                <strong>Rappresentante:</strong> Inserisci i dati di un socio amministratore.
              </p>
              <p>
                <strong>Documento:</strong> Visura Camerale recente + Documento d'identità del
                socio amministratore.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="societa-capitali">
            <AccordionTrigger className="text-left">
              Società di Capitali (S.r.l., S.p.A.)
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Nome Azienda:</strong> Ragione Sociale completa (es. "Ristorante Da Mario
                S.r.l.").
              </p>
              <p>
                <strong>Partita IVA / CF:</strong> Solitamente coincidono e sono numerici (11
                cifre).
              </p>
              <p>
                <strong>Rappresentante:</strong> Inserisci i dati dell'Amministratore Unico o del
                Legale Rappresentante.
              </p>
              <p>
                <strong>Documento:</strong> Visura Camerale recente + Documento d'identità
                dell'amministratore.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};
