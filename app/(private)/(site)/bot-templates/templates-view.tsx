"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import PageWrapper from "@/components/private/page-wrapper";
import OverviewCards from "@/components/private/overview-cards";
import NoItems from "@/components/utility/no-items";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Edit,
  Send,
  RefreshCw,
  Loader2,
  MessageSquare,
  LayoutTemplate,
  CheckCircle2,
  Clock,
  AlertCircle,
  PauseCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { deleteTemplate, submitTemplateToMeta, syncTemplateStatus } from "./actions";
import type { WabaTemplate } from "@/types/general";
import ConfirmDialog from "@/components/utility/confirm-dialog";
import { ButtonGroup } from "@/components/ui/button-group";

interface LocationData {
  id: string;
  name: string;
  meta_phone_id: string;
  waba_templates: WabaTemplate[];
}

interface Props {
  organizationId: string;
  locations: LocationData[];
  templateLimit: number;
  totalUsed: number;
}

type TemplateWithLocation = WabaTemplate & {
  locationId: string;
  locationName: string;
};

const STATUS_CONFIG: Record<
  WabaTemplate["meta_status"],
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success"; icon: React.ReactNode }
> = {
  DRAFT:    { label: "Bozza",        variant: "secondary",    icon: <FileText className="h-3 w-3" /> },
  PENDING:  { label: "In revisione", variant: "outline",      icon: <Clock className="h-3 w-3" /> },
  APPROVED: { label: "Approvato",    variant: "success",      icon: <CheckCircle2 className="h-3 w-3" /> },
  REJECTED: { label: "Rifiutato",    variant: "destructive",  icon: <AlertCircle className="h-3 w-3" /> },
  PAUSED:   { label: "In pausa",     variant: "outline",      icon: <PauseCircle className="h-3 w-3" /> },
  DISABLED: { label: "Disabilitato", variant: "destructive",  icon: <AlertCircle className="h-3 w-3" /> },
};

function getBodyPreview(template: WabaTemplate): string {
  const body = template.components.find((c) => c.type === "BODY");
  if (!body || !("text" in body)) return "";
  const text = (body as { type: "BODY"; text: string }).text;
  return text.length > 100 ? text.slice(0, 100) + "…" : text;
}

export default function TemplatesView({ locations, templateLimit, totalUsed }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ locationId: string; templateId: string; displayName: string } | null>(null);

  const allTemplates: TemplateWithLocation[] = locations.flatMap((loc) =>
    loc.waba_templates.map((t) => ({ ...t, locationId: loc.id, locationName: loc.name })),
  );

  const approvedCount = allTemplates.filter((t) => t.meta_status === "APPROVED").length;
  const pendingCount  = allTemplates.filter((t) => t.meta_status === "PENDING").length;
  const isAtLimit = totalUsed >= templateLimit;

  const handleDelete = () => {
    if (!deleteTarget) return;
    const { locationId, templateId } = deleteTarget;
    setLoadingId(templateId);
    setDeleteTarget(null);
    startTransition(async () => {
      const res = await deleteTemplate(locationId, templateId);
      if (res.success) {
        toast.success("Template eliminato");
        router.refresh();
      } else {
        toast.error("Errore", { description: res.error });
      }
      setLoadingId(null);
    });
  };

  const handleSubmit = (locationId: string, templateId: string) => {
    setLoadingId(templateId);
    startTransition(async () => {
      const res = await submitTemplateToMeta(locationId, templateId);
      if (res.success) {
        toast.success("Template inviato a Meta", { description: "In revisione. Di solito richiede pochi minuti." });
        router.refresh();
      } else {
        toast.error("Invio fallito", { description: res.error });
      }
      setLoadingId(null);
    });
  };

  const handleSync = (locationId: string, templateId: string) => {
    setLoadingId(templateId);
    startTransition(async () => {
      const res = await syncTemplateStatus(locationId, templateId);
      if (res.success) {
        toast.success("Stato aggiornato", { description: res.data ? `Stato attuale: ${STATUS_CONFIG[res.data.meta_status].label}` : undefined });
        router.refresh();
      } else {
        toast.error("Sincronizzazione fallita", { description: res.error });
      }
      setLoadingId(null);
    });
  };

  return (
    <PageWrapper>
      <div className="header-container">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Template Bot</h1>
          <p className="text-muted-foreground mt-1">
            Crea messaggi personalizzati per i tuoi clienti. Tutti i template sono sottoposti a revisione Meta prima dell&apos;utilizzo.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <OverviewCards
          data={[
            {
              title: "Template Creati",
              value: `${totalUsed}/${templateLimit}`,
              description: isAtLimit ? "limite raggiunto" : "disponibili",
              icon: <LayoutTemplate className="h-5 w-5 text-primary" />,
            },
            {
              title: "Approvati",
              value: approvedCount,
              description: "pronti all'uso",
              icon: <CheckCircle2 className="h-5 w-5 text-primary" />,
            },
            {
              title: "In revisione",
              value: pendingCount,
              description: "in attesa di Meta",
              icon: <Clock className="h-5 w-5 text-primary" />,
            },
          ]}
        />

        <div className="flex flex-col sm:flex-row justify-between items-center bg-card p-4 gap-6 rounded-3xl border-2">
          <div>
            <h3 className="font-semibold text-lg tracking-tight">I tuoi template</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Solo categoria <span className="font-medium">UTILITY</span> — nessun messaggio promozionale.
              Il controllo AI pre-invio ti aiuta a rispettare le policy Meta.
            </p>
          </div>
          <Button
            className="ml-auto"
            onClick={() => router.push("/bot-templates/new")}
            disabled={isAtLimit}
            title={isAtLimit ? "Limite template raggiunto. Aggiorna il piano per crearne altri." : undefined}
          >
            <Plus className="h-4 w-4" /> Nuovo Template
          </Button>
        </div>

        {allTemplates.length === 0 ? (
          <NoItems
            icon={<MessageSquare size={28} className='text-primary' />}
            title="Nessun template"
            description="Crea il tuo primo template personalizzato. Sarà sottoposto a revisione da Meta prima di poterlo usare."
            button={
              <Button variant="outline" onClick={() => router.push("/bot-templates/new")} disabled={isAtLimit}>
                Crea il primo template
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allTemplates.map((template) => {
              const status = STATUS_CONFIG[template.meta_status];
              const isLoading = loadingId === template.id;
              return (
                <Card key={template.id} className="flex flex-col py-4">
                  <CardHeader className="border-b pb-4! flex flex-row justify-between items-start space-y-0 gap-2">
                    <div className="flex flex-col gap-1 min-w-0">
                      <CardTitle className="text-base line-clamp-1" title={template.display_name}>
                        {template.display_name}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground font-mono truncate">{template.name}</span>
                    </div>
                    <Badge variant={status.variant} className="shrink-0 gap-1 text-xs">
                      {status.icon} {status.label}
                    </Badge>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3">{getBodyPreview(template)}</p>
                    {template.rejection_reason && template.rejection_reason !== 'NONE' && (
                      <p className="text-xs text-destructive mt-2 line-clamp-2">✗ {template.rejection_reason || "Motivo non specificato"}</p>
                    )}
                  </CardContent>

                  <div className="px-4 border-t pt-4 flex gap-2 justify-between mt-auto">
                    {template.meta_status === "PENDING" && (
                      <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground"
                        disabled={isLoading || isPending}
                        onClick={() => handleSync(template.locationId, template.id)}
                        title="Aggiorna stato da Meta"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                    )}
                    {template.meta_status === "DRAFT" && (
                      <Button variant="outline" size="icon" className="h-8 w-8 text-primary"
                        disabled={isLoading || isPending}
                        onClick={() => handleSubmit(template.locationId, template.id)}
                        title="Invia a Meta per revisione"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    )}
                    <ButtonGroup className="ml-auto">
                      <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground"
                        disabled={isLoading || isPending}
                        onClick={() => router.push(`/bot-templates/${template.id}`)}
                        title="Modifica template"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        disabled={isLoading || isPending}
                        onClick={() => setDeleteTarget({ locationId: template.locationId, templateId: template.id, displayName: template.display_name })}
                        title="Elimina template"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </ButtonGroup>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Eliminare il template?"
        description={`Eliminare "${deleteTarget?.displayName}"? Se già inviato a Meta, verrà eliminato anche lì.`}
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </PageWrapper>
  );
}
