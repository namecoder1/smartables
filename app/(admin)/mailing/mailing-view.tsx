"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Plus,
  Send,
  Save,
  Trash2,
  ArrowLeft,
  Eye,
  Pencil,
  Users,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  saveCampaignAction,
  sendCampaignAction,
  deleteCampaignAction,
  type MailingCampaign,
} from "@/app/actions/mailing";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface MailingViewProps {
  campaigns: MailingCampaign[];
  subscribersCount: number;
}

// --------------------------------------------------------------------------
// Status config
// --------------------------------------------------------------------------

const STATUS_CONFIG = {
  draft: { label: "Bozza", icon: Clock, className: "bg-gray-100 text-gray-700 border-gray-200" },
  sending: { label: "In invio...", icon: Loader2, className: "bg-blue-100 text-blue-700 border-blue-200" },
  sent: { label: "Inviata", icon: CheckCircle, className: "bg-green-100 text-green-700 border-green-200" },
  failed: { label: "Errore", icon: AlertCircle, className: "bg-red-100 text-red-700 border-red-200" },
} as const;

// --------------------------------------------------------------------------
// Campaign Editor
// --------------------------------------------------------------------------

function CampaignEditor({
  initial,
  subscribersCount,
  onBack,
  onSaved,
}: {
  initial?: MailingCampaign;
  subscribersCount: number;
  onBack: () => void;
  onSaved: (campaign: MailingCampaign) => void;
}) {
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [content, setContent] = useState(initial?.content_markdown ?? "");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [currentId, setCurrentId] = useState(initial?.id);
  const [isSaving, startSave] = useTransition();
  const [isSending, startSend] = useTransition();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const isReadOnly = initial?.status === "sent" || initial?.status === "sending";

  const handleSave = () => {
    if (!subject.trim()) { toast.error("Inserisci un oggetto"); return; }
    if (!content.trim()) { toast.error("Inserisci il contenuto della mail"); return; }

    startSave(async () => {
      const result = await saveCampaignAction({
        id: currentId,
        subject: subject.trim(),
        content_markdown: content,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const savedId = result.data!.id;
      setCurrentId(savedId);
      toast.success("Bozza salvata");
      onSaved({
        id: savedId,
        subject: subject.trim(),
        content_markdown: content,
        status: "draft",
        sent_at: null,
        sent_by: null,
        recipients_count: 0,
        resend_batch_ids: null,
        created_at: initial?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  };

  const handleSend = () => {
    if (!currentId) { toast.error("Salva prima la bozza"); return; }

    startSend(async () => {
      setSendDialogOpen(false);
      const result = await sendCampaignAction(currentId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Campagna inviata a ${result.data!.recipientsCount} destinatari`);
      onSaved({
        id: currentId,
        subject,
        content_markdown: content,
        status: "sent",
        sent_at: new Date().toISOString(),
        sent_by: null,
        recipients_count: result.data!.recipientsCount,
        resend_batch_ids: null,
        created_at: initial?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      onBack();
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b bg-white shrink-0 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Campagne
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <Button
            size="sm"
            variant={mode === "write" ? "default" : "ghost"}
            className="h-7 px-3 text-xs gap-1.5"
            onClick={() => setMode("write")}
          >
            <Pencil className="h-3 w-3" />
            Scrivi
          </Button>
          <Button
            size="sm"
            variant={mode === "preview" ? "default" : "ghost"}
            className="h-7 px-3 text-xs gap-1.5"
            onClick={() => setMode("preview")}
          >
            <Eye className="h-3 w-3" />
            Anteprima
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {!isReadOnly && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={isSaving || isSending}
              className="gap-1.5"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salva bozza
            </Button>
          )}

          {!isReadOnly && (
            <AlertDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={isSending || isSaving || !currentId}
                  className="gap-1.5"
                >
                  {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Invia campagna
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    Invia campagna
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3">
                      <p>
                        Stai per inviare la campagna{" "}
                        <strong>&quot;{subject}&quot;</strong> a tutti gli utenti
                        iscritti alla mailing list.
                      </p>
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm font-medium">
                          {subscribersCount} destinatari con consenso attivo
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Questa azione è irreversibile. Verifica l&apos;anteprima prima di procedere.
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <Button onClick={handleSend} disabled={isSending} className="gap-1.5">
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Invia ora
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Subject */}
      {!isReadOnly ? (
        <div className="px-6 pt-5 pb-0 shrink-0">
          <Input
            placeholder="Oggetto della mail..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="text-lg font-medium h-12 border-2 border-neutral-200"
          />
        </div>
      ) : (
        <div className="px-6 pt-5 pb-0 shrink-0">
          <h2 className="text-xl font-semibold">{subject}</h2>
          {initial?.sent_at && (
            <p className="text-sm text-muted-foreground mt-1">
              Inviata il {format(new Date(initial.sent_at), "d MMMM yyyy 'alle' HH:mm", { locale: it })} ·{" "}
              {initial.recipients_count} destinatari
            </p>
          )}
        </div>
      )}

      {/* Editor / Preview */}
      <div className="flex-1 overflow-hidden flex min-h-0">
        {mode === "write" && !isReadOnly ? (
          <textarea
            className="flex-1 resize-none p-6 font-mono text-sm bg-white outline-none leading-relaxed"
            placeholder={`Scrivi il contenuto della mail in Markdown...\n\n# Titolo principale\n\nTesto del paragrafo con **grassetto** e *corsivo*.\n\n## Sottotitolo\n\n- Punto elenco 1\n- Punto elenco 2\n\n[Link di esempio](https://smartables.it)`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            <article className="prose prose-sm max-w-none prose-headings:font-semibold prose-a:text-orange-500">
              <ReactMarkdown>{content || "*Nessun contenuto*"}</ReactMarkdown>
            </article>
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Campaign List
// --------------------------------------------------------------------------

function CampaignList({
  campaigns: initialCampaigns,
  subscribersCount,
}: {
  campaigns: MailingCampaign[];
  subscribersCount: number;
}) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [editing, setEditing] = useState<MailingCampaign | "new" | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const handleSaved = (campaign: MailingCampaign) => {
    setCampaigns((prev) => {
      const existing = prev.findIndex((c) => c.id === campaign.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = campaign;
        return next;
      }
      return [campaign, ...prev];
    });
  };

  const handleDelete = (id: string) => {
    startDelete(async () => {
      const result = await deleteCampaignAction(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      toast.success("Bozza eliminata");
    });
  };

  if (editing !== null) {
    return (
      <CampaignEditor
        initial={editing === "new" ? undefined : editing}
        subscribersCount={subscribersCount}
        onBack={() => setEditing(null)}
        onSaved={(c) => { handleSaved(c); if (editing === "new") setEditing(c); }}
      />
    );
  }

  const sentCampaigns = campaigns.filter((c) => c.status === "sent");
  const draftCampaigns = campaigns.filter((c) => c.status !== "sent");

  return (
    <div className="p-6 space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{subscribersCount}</p>
              <p className="text-xs text-muted-foreground">Iscritti attivi</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sentCampaigns.length}</p>
              <p className="text-xs text-muted-foreground">Campagne inviate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{draftCampaigns.length}</p>
              <p className="text-xs text-muted-foreground">Bozze</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New campaign button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Campagne</h2>
          <p className="text-sm text-muted-foreground">Crea e gestisci le tue newsletter</p>
        </div>
        <Button onClick={() => setEditing("new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuova campagna
        </Button>
      </div>

      {campaigns.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">Nessuna campagna</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crea la tua prima campagna email per comunicare con i tuoi utenti.
              </p>
            </div>
            <Button onClick={() => setEditing("new")} className="mt-2 gap-2">
              <Plus className="h-4 w-4" />
              Crea campagna
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Campaign list */}
      {campaigns.length > 0 && (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const statusConfig = STATUS_CONFIG[campaign.status];
            const StatusIcon = statusConfig.icon;

            return (
              <Card
                key={campaign.id}
                className="hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => setEditing(campaign)}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 justify-between">
                      <p className="font-semibold truncate">{campaign.subject}</p>
                      <Badge
                        variant="outline"
                        className={`shrink-0 gap-1 text-xs ${statusConfig.className}`}
                      >
                        <StatusIcon className={`h-3 w-3 ${campaign.status === "sending" ? "animate-spin" : ""}`} />
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                      {campaign.content_markdown.slice(0, 100)}...
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(campaign.created_at), "d MMM yyyy", { locale: it })}
                      </span>
                      {campaign.status === "sent" && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {campaign.recipients_count} destinatari
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {campaign.status === "draft" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={(e) => e.stopPropagation()}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Elimina bozza</AlertDialogTitle>
                          <AlertDialogDescription>
                            Sei sicuro di voler eliminare la bozza &quot;{campaign.subject}&quot;? L&apos;azione è irreversibile.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                          <Button
                            variant="destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(campaign.id); }}
                          >
                            Elimina
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Main export
// --------------------------------------------------------------------------

export default function MailingView({ campaigns, subscribersCount }: MailingViewProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-6 pb-4 border-b bg-white shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Mailing List</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Gestisci le newsletter e le comunicazioni agli utenti Smartables.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <CampaignList campaigns={campaigns} subscribersCount={subscribersCount} />
      </div>
    </div>
  );
}
