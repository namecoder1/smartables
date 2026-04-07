"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2, Sparkles, CheckCircle2, AlertCircle, Info, Brain, TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { validateTemplate } from "../actions";
import type { WabaTemplateComponent, WabaTemplateType } from "@/types/general";
import type { LlmValidationResult } from "@/lib/waba-templates";
import type { ButtonFormState } from "./template-form-config";
import EditCard from "@/components/utility/edit-card";

interface SidebarProps {
  isEditable: boolean;
  isMarketing: boolean;
  activeType: WabaTemplateType;
  previewBody: string;
  headerEnabled: boolean;
  headerText: string;
  footerEnabled: boolean;
  footerText: string;
  buttons: ButtonFormState[];
  buildComponents: () => WabaTemplateComponent[];
  onApplySuggestion: (text: string) => void;
}

export function TemplateSidebar({
  isEditable, isMarketing, activeType, previewBody,
  headerEnabled, headerText, footerEnabled, footerText, buttons,
  buildComponents, onApplySuggestion,
}: SidebarProps) {
  const [validation, setValidation] = useState<LlmValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleValidate = async () => {
    if (!previewBody.trim()) { toast.error("Il corpo del template è obbligatorio prima della verifica."); return; }
    setIsValidating(true);
    const res = await validateTemplate(buildComponents(), activeType);
    if (res.success) {
      toast.success('Il template rispetta le policy della categoria selezionata')
    } else toast.error('Il template non rispetta le policy della categoria selezionata ')
    setIsValidating(false);
    if (res.success && res.data) {
      setValidation(res.data);
    } else if (!res.success) {
      toast.error("Errore durante la verifica AI", { description: res.error });
    }
  };

  return (
    <div className="space-y-6">
      {isEditable && !isMarketing && (
        <Card>
          <CardHeader>
            <CardTitle>Verifica AI</CardTitle>
            <CardDescription>Controlla la conformità alle policy UTILITY prima di inviare</CardDescription>
          </CardHeader>
          <CardFooter className="flex-col">
            <Button
              variant="outline" className="w-full gap-2"
              onClick={handleValidate} disabled={isValidating || !previewBody.trim()}
            >
              {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isValidating ? "Analisi in corso…" : "Verifica con AI"}
            </Button>
            {validation && (
              <div className="space-y-3">
                {validation.verdict !== "approve" && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm space-y-2">
                      <p className="font-medium">Problemi rilevati:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {validation.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                {validation.revised_text && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Testo suggerito:</p>
                    <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">{validation.revised_text}</div>
                    <Button
                      variant="outline" size="sm" className="w-full text-xs"
                      onClick={() => {
                        onApplySuggestion(validation.revised_text!);
                        setValidation(null);
                        toast.success("Testo sostituito");
                      }}
                    >
                      Usa il testo suggerito
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      )}

      {isMarketing && (
        <Alert>
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Template MARKETING</strong> — costo €0.0572/conversazione in Italia (vs €0.0248 UTILITY).
            Meta applica una revisione più stringente.
          </AlertDescription>
        </Alert>
      )}

      <EditCard
        title='Anteprima'
        description='Come vedranno il messaggio i tuoi clienti'
      >
        <div className="bg-[#e5ddd5] rounded-2xl p-4 space-y-1 min-h-20">
          <div className="bg-white rounded-xl px-3 py-2 shadow-sm max-w-xs space-y-1">
            {headerEnabled && headerText && <p className="text-sm font-semibold">{headerText}</p>}
            {previewBody
              ? <p className="text-sm whitespace-pre-wrap">{previewBody}</p>
              : <p className="text-sm text-muted-foreground italic">Il testo apparirà qui...</p>}
            {footerEnabled && footerText && <p className="text-xs text-muted-foreground">{footerText}</p>}
          </div>
          {buttons.length > 0 && (
            <div className="flex flex-col gap-1 mt-1 max-w-xs">
              {buttons.map((btn, i) => {
                const label = btn.type === "COPY_CODE" ? "Copia codice offerta"
                  : btn.type === "FLOW" ? (btn.text || "Prenota")
                  : btn.text || null;
                if (!label) return null;
                return (
                  <div key={i} className="bg-white rounded-xl px-3 py-2 text-center text-sm text-primary font-medium shadow-sm">
                    {label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </EditCard>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Dopo l&apos;invio, Meta può impiegare da pochi minuti fino a 24h per la revisione.
          I template rifiutati mostrano il motivo nella lista.
        </AlertDescription>
      </Alert>
    </div>
  );
}
