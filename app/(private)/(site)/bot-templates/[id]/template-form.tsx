"use client";

import { useState, useMemo, useTransition } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import PageWrapper from "@/components/private/page-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Loader2, Plus, Info, InfoIcon, Send, TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { createTemplate, updateTemplate, submitTemplateToMeta } from "../actions";
import { toTemplateName, TYPE_TO_CATEGORY } from "@/lib/waba-templates";
import type {
  WabaTemplate, WabaTemplateComponent, WabaTemplateType, WabaTemplateCategory, ButtonSemanticRole,
} from "@/types/general";
import SetPageTitle from "@/components/private/set-page-title";
import {
  CHAR_LIMITS, LANGS, TEMPLATE_TYPE_CONFIG,
  ButtonFormState, templateButtonToFormState, formStateToButton, getDefaultButtonsForType,
} from "./template-form-config";
import { TypeSelector } from "./type-selector";
import { ButtonEditor } from "./button-editor";
import { TemplateSidebar } from "./template-form-sidebar";
import { ButtonGroup } from "@/components/ui/button-group";
import EditCard from "@/components/utility/edit-card";

// ── Interfaces ────────────────────────────────────────────────────────────────

interface LocationData {
  id: string;
  name: string;
  meta_phone_id: string;
  waba_templates: WabaTemplate[];
}

interface Props {
  locations: LocationData[];
  template: WabaTemplate | null;
  templateLocationId: string | null;
  organizationId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function charBadge(current: number, max: number) {
  const pct = current / max;
  return (
    <span className={`text-xs tabular-nums ${pct >= 1 ? "text-destructive" : pct >= 0.85 ? "text-amber-500" : "text-muted-foreground"}`}>
      {current}/{max}
    </span>
  );
}

// ── Main export — wizard orchestration ────────────────────────────────────────

export default function TemplateForm({ locations, template, templateLocationId, organizationId: _ }: Props) {
  const router = useRouter();
  const isNew = template === null;

  const [templateType, setTemplateType] = useState<WabaTemplateType | null>(
    template?.template_type ?? null,
  );

  if (isNew && templateType === null) {
    return <TypeSelector onSelect={setTemplateType} />;
  }

  const activeType = templateType ?? "custom";

  return (
    <TemplateFormInner
      locations={locations}
      template={template}
      templateLocationId={templateLocationId}
      isNew={isNew}
      activeType={activeType}
      onTypeReset={isNew ? () => setTemplateType(null) : undefined}
      router={router}
    />
  );
}

// ── Inner form ────────────────────────────────────────────────────────────────

interface InnerProps {
  locations: LocationData[];
  template: WabaTemplate | null;
  templateLocationId: string | null;
  isNew: boolean;
  activeType: WabaTemplateType;
  onTypeReset?: () => void;
  router: ReturnType<typeof useRouter>;
}

function TemplateFormInner({
  locations, template, templateLocationId, isNew, activeType, onTypeReset, router,
}: InnerProps) {
  // All templates are editable; editing a non-DRAFT resets status to DRAFT locally
  const isEditable = true;
  // Name is locked once submitted to Meta (not DRAFT) — Meta uses it as identifier
  const isNameLocked = !isNew && template?.meta_status !== "DRAFT";
  const wasSubmitted = !isNew && template?.meta_status !== "DRAFT";
  const category: WabaTemplateCategory = TYPE_TO_CATEGORY[activeType];
  const typeConfig = TEMPLATE_TYPE_CONFIG[activeType];
  const requiredRoles: ButtonSemanticRole[] = typeConfig.requiredRoles;
  const isMarketing = category === "MARKETING";

  // ── Form state ──
  const [displayName, setDisplayName] = useState(template?.display_name ?? "");
  const [name, setName]               = useState(template?.name ?? "");
  const [language, setLanguage]       = useState(template?.language ?? "it");
  const [locationId, setLocationId]   = useState(templateLocationId ?? locations[0]?.id ?? "");

  const [headerEnabled, setHeaderEnabled] = useState(
    template?.components.some((c) => c.type === "HEADER") ?? false,
  );
  const [headerText, setHeaderText] = useState(() => {
    const h = template?.components.find((c) => c.type === "HEADER");
    return h && "text" in h ? h.text : "";
  });
  const [bodyText, setBodyText] = useState(() => {
    const b = template?.components.find((c) => c.type === "BODY");
    return b && "text" in b ? b.text : "";
  });
  const [footerEnabled, setFooterEnabled] = useState(
    template?.components.some((c) => c.type === "FOOTER") ?? false,
  );
  const [footerText, setFooterText] = useState(() => {
    const f = template?.components.find((c) => c.type === "FOOTER");
    return f && "text" in f ? f.text : "";
  });
  const [buttons, setButtons] = useState<ButtonFormState[]>(() => {
    const b = template?.components.find((c) => c.type === "BUTTONS");
    if (b && "buttons" in b) return b.buttons.map((btn) => templateButtonToFormState(btn, requiredRoles));
    return getDefaultButtonsForType(activeType);
  });

  const [variableExamples, setVariableExamples] = useState<Record<number, string>>(() => {
    const b = template?.components.find((c) => c.type === "BODY");
    if (b && "example" in b && b.example?.body_text?.[0]) {
      return Object.fromEntries(b.example.body_text[0].map((val, i) => [i + 1, val]));
    }
    return {};
  });

  const bodyVars = useMemo(() => {
    const matches = [...bodyText.matchAll(/\{\{(\d+)\}\}/g)];
    return [...new Set(matches.map((m) => parseInt(m[1])))].sort((a, b) => a - b);
  }, [bodyText]);

  // ── Two-step save state ──
  const [savePhase, setSavePhase] = useState<"editing" | "saved">("editing");
  const [savedRef, setSavedRef] = useState<{ locationId: string; templateId: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Helpers ──

  const handleDisplayNameChange = (val: string) => {
    setDisplayName(val);
    if (isNew) setName(toTemplateName(val));
  };

  function buildComponents(): WabaTemplateComponent[] {
    const comps: WabaTemplateComponent[] = [];
    if (headerEnabled && headerText.trim())
      comps.push({ type: "HEADER", format: "TEXT", text: headerText });
    comps.push(
      bodyVars.length > 0
        ? { type: "BODY", text: bodyText, example: { body_text: [bodyVars.map((n) => variableExamples[n]?.trim() || `esempio_${n}`)] } }
        : { type: "BODY", text: bodyText },
    );
    if (footerEnabled && footerText.trim())
      comps.push({ type: "FOOTER", text: footerText });
    if (buttons.length > 0)
      comps.push({ type: "BUTTONS", buttons: buttons.map(formStateToButton) });
    return comps;
  }

  const canAddCustomButton = buttons.length < 3 && isEditable &&
    !buttons.some((b) => !b.is_locked);

  // ── Step 1: Save (create/update as DRAFT) ──

  const handleSave = () => {
    if (!displayName.trim()) { toast.error("Inserisci un nome visualizzato."); return; }
    if (!name.trim())        { toast.error("Il nome tecnico è obbligatorio."); return; }
    if (!bodyText.trim())    { toast.error("Il corpo del template è obbligatorio."); return; }
    const components = buildComponents();
    startTransition(async () => {
      const res = isNew
        ? await createTemplate(locationId, { display_name: displayName, name, language, template_type: activeType, components })
        : await updateTemplate(templateLocationId!, template!.id, { display_name: displayName, name, language, components });
      if (res.success && res.data) {
        setSavePhase("saved");
        setSavedRef({
          locationId: isNew ? locationId : templateLocationId!,
          templateId: res.data.id,
        });
        toast.success(isNew ? "Template salvato" : "Template aggiornato");
      } else if (!res.success) {
        toast.error("Errore", { description: res.error });
      }
    });
  };

  // ── Step 2: Submit to Meta ──

  const handleSubmitToMeta = () => {
    if (!savedRef) return;
    setIsSubmitting(true);
    startTransition(async () => {
      const res = await submitTemplateToMeta(savedRef.locationId, savedRef.templateId);
      setIsSubmitting(false);
      if (res.success) {
        toast.success("Template inviato a Meta per revisione");
        router.push("/bot-templates");
        router.refresh();
      } else {
        toast.error("Invio fallito", { description: res.error });
      }
    });
  };

  const previewBody = bodyText.replace(/\{\{(\d+)\}\}/g, (_, n) =>
    variableExamples[parseInt(n)]?.trim() || `{{${n}}}`,
  );

  const isBusy = isPending || isSubmitting;

  return (
    <PageWrapper>
      {!isNew && name && <SetPageTitle title={name} description="Modifica template" />}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push("/bot-templates")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">
                {isNew ? "Nuovo Template" : "Modifica Template"}
              </h2>
              <Badge variant={isMarketing ? "destructive" : "default"} className="text-xs">
                {category}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              {typeConfig.label} · {typeConfig.costPerConv}
            </p>
          </div>
        </div>

        {isEditable && (
          <ButtonGroup>
            {onTypeReset && (
              <Button variant="outline" onClick={onTypeReset} disabled={isBusy}>
                Cambia tipo
              </Button>
            )}
            {savePhase === "editing" ? (
              <Button onClick={handleSave} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Salva
              </Button>
            ) : (
              <Button onClick={handleSubmitToMeta} disabled={isSubmitting}>
                {isSubmitting
                  ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  : <Send className="h-4 w-4 mr-1.5" />}
                Invia per revisione
              </Button>
            )}
          </ButtonGroup>
        )}
      </div>

      {/* Warning per template già inviato a Meta */}
      {wasSubmitted && savePhase === "editing" && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900 [&>svg]:text-amber-600">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>
            Questo template è già stato inviato a Meta. Salvando le modifiche verrà riportato in bozza e <strong>non sarà usato</strong> finché non viene reinviato e approvato nuovamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Warning tipo template */}
      {typeConfig.warning && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>{typeConfig.warning}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">

          <EditCard
            title="Informazioni tecniche"
            description="Dati necessari per identificare il template su Meta"
          >
            <div className="grid gap-2">
              <Label htmlFor="display-name">Nome visualizzato *</Label>
              <Input
                id="display-name"
                placeholder="es. Recupero Chiamata Aperto Personalizzato"
                value={displayName}
                onChange={(e) => handleDisplayNameChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template-name">
                Nome tecnico *{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  {isNameLocked
                    ? "(bloccato — identificatore univoco su Meta)"
                    : "(solo minuscole, numeri, underscore — univoco su WABA)"}
                </span>
              </Label>
              <Input
                id="template-name"
                placeholder="es. recupero_aperto_personalizzato"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                disabled={isNameLocked}
                className="font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Lingua *</Label>
                <Select value={language} onValueChange={setLanguage} disabled={!isEditable}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent position="popper">
                    {LANGS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {isNew && locations.length > 1 && (
                <div className="grid gap-2">
                  <Label>Sede</Label>
                  <Select value={locationId} onValueChange={setLocationId}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent position="popper">
                      {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </EditCard>

          <EditCard
            title="Contenuto del template"
            description="Compila header, corpo e footer del messaggio"
          > 
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Header <span className="text-xs text-muted-foreground font-normal">(opzionale)</span></Label>
                <button
                  type="button"
                  onClick={() => setHeaderEnabled(!headerEnabled)}
                  disabled={!isEditable}
                  className={`text-xs px-3 py-1 rounded-xl border-2 transition-colors ${headerEnabled ? "bg-primary/10 border-primary/30 text-primary" : "border-border bg-white text-muted-foreground hover:border-primary/30"}`}
                >
                  {headerEnabled ? "Abilitato" : "Disabilitato"}
                </button>
              </div>
              {headerEnabled && (
                <div className="space-y-1">
                  <Input
                    placeholder="Titolo breve"
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value.slice(0, CHAR_LIMITS.HEADER))}
                    disabled={!isEditable}
                  />
                  <div className="flex justify-end">{charBadge(headerText.length, CHAR_LIMITS.HEADER)}</div>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label>
                Corpo del messaggio *
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  Usa {"{{1}}"}, {"{{2}}"} per le variabili
                  {(activeType === "recovery_open" || activeType === "recovery_closed") && (
                    <span className="text-primary"> · {"{{1}}"} = nome sede (auto-iniettato)</span>
                  )}
                  {activeType === "booking_reminder" && (
                    <span className="text-primary"> · {"{{1}}"} = nome ospite · {"{{2}}"} = orario · {"{{3}}"} = nome sede</span>
                  )}
                </span>
              </Label>
              <Textarea
                placeholder={
                  activeType.startsWith("recovery")
                    ? "Ciao! Hai chiamato {{1}} ma non abbiamo risposto.\nPossiamo aiutarti?"
                    : activeType === "booking_reminder"
                      ? "Ciao {{1}}, ti ricordiamo la tua prenotazione alle {{2}} presso {{3}}.\nConfermi la presenza?"
                      : "Ciao {{1}}, la tua prenotazione per {{2}} alle {{3}} è confermata."
                }
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value.slice(0, CHAR_LIMITS.BODY))}
                disabled={!isEditable}
                rows={6}
                className="resize-none"
              />
              <div className="flex justify-end">{charBadge(bodyText.length, CHAR_LIMITS.BODY)}</div>

              {/* Variable examples */}
              {bodyVars.length > 0 && (
                <div className="mt-2 pt-3 border-t space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" /> Esempi per le variabili — richiesti da Meta per la revisione
                  </Label>
                  {bodyVars.map((n) => (
                    <div key={n} className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground shrink-0 w-8">{`{{${n}}}`}</span>
                      <Input
                        placeholder={
                          n === 1 && activeType.startsWith("recovery") ? "es. Pizzeria Roma" :
                          n === 1 && activeType === "booking_reminder" ? "es. Mario" :
                          n === 2 && activeType === "booking_reminder" ? "es. 20:30" :
                          n === 3 && activeType === "booking_reminder" ? "es. Pizzeria Roma" :
                          `es. valore ${n}`
                        }
                        value={variableExamples[n] ?? ""}
                        onChange={(e) => setVariableExamples((prev) => ({ ...prev, [n]: e.target.value }))}
                        disabled={!isEditable}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Footer <span className="text-xs text-muted-foreground font-normal">(opzionale)</span></Label>
                <button
                  type="button"
                  onClick={() => setFooterEnabled(!footerEnabled)}
                  disabled={!isEditable}
                  className={`text-xs px-3 py-1 rounded-xl border-2 transition-colors ${footerEnabled ? "bg-primary/10 border-primary/30 text-primary" : "border-border bg-white text-muted-foreground hover:border-primary/30"}`}
                >
                  {footerEnabled ? "Abilitato" : "Disabilitato"}
                </button>
              </div>
              {footerEnabled && (
                <div className="space-y-1">
                  <Input
                    placeholder="es. Rispondi ANNULLA per cancellare"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value.slice(0, CHAR_LIMITS.FOOTER))}
                    disabled={!isEditable}
                  />
                  <div className="flex justify-end">{charBadge(footerText.length, CHAR_LIMITS.FOOTER)}</div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <ButtonEditor
              buttons={buttons}
              isEditable={isEditable}
              canAddCustomButton={canAddCustomButton}
              onAdd={() => {
                if (buttons.length >= 3) return;
                setButtons([...buttons, {
                  type: "QUICK_REPLY", text: "", url: "", url_example: "",
                  phone_number: "", copy_code_example: "", semantic_role: "custom", is_locked: false,
                }]);
              }}
              onTypeChange={(idx, type) => {
                const next = [...buttons];
                next[idx] = { ...next[idx], type };
                setButtons(next);
              }}
              onFieldChange={(idx, field, value) => {
                const next = [...buttons];
                next[idx] = { ...next[idx], [field]: value };
                setButtons(next);
              }}
              onRemove={(idx) => setButtons(buttons.filter((_, i) => i !== idx))}
            />
          </EditCard>
        </div>

        {/* ── Sidebar ── */}
        <TemplateSidebar
          isEditable={isEditable}
          isMarketing={isMarketing}
          activeType={activeType}
          previewBody={previewBody}
          headerEnabled={headerEnabled}
          headerText={headerText}
          footerEnabled={footerEnabled}
          footerText={footerText}
          buttons={buttons}
          buildComponents={buildComponents}
          onApplySuggestion={(text) => setBodyText(text)}
        />
      </div>

      {/* Bottom save/submit — visible on scroll for long forms */}
      {isEditable && (
        <div className="flex justify-end pt-2">
          {savePhase === "editing" ? (
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Salva
            </Button>
          ) : (
            <Button onClick={handleSubmitToMeta} disabled={isSubmitting}>
              {isSubmitting
                ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                : <Send className="h-4 w-4 mr-1.5" />}
              Invia per revisione
            </Button>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
