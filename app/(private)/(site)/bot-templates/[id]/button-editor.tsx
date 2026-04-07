"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Lock, Workflow } from "lucide-react";
import { CHAR_LIMITS, ROLE_LABEL, BUTTON_TYPE_LABELS } from "./template-form-config";
import type { ButtonFormState } from "./template-form-config";
import type { WabaTemplateButtonType } from "@/types/general";

function charBadge(current: number, max: number) {
  const pct = current / max;
  return (
    <span className={`text-xs tabular-nums ${pct >= 1 ? "text-destructive" : pct >= 0.85 ? "text-amber-500" : "text-muted-foreground"}`}>
      {current}/{max}
    </span>
  );
}

interface ButtonEditorProps {
  buttons: ButtonFormState[];
  isEditable: boolean;
  canAddCustomButton: boolean;
  onAdd: () => void;
  onTypeChange: (idx: number, type: WabaTemplateButtonType) => void;
  onFieldChange: (idx: number, field: keyof ButtonFormState, value: string) => void;
  onRemove: (idx: number) => void;
}

export function ButtonEditor({
  buttons, isEditable, canAddCustomButton, onAdd, onTypeChange, onFieldChange, onRemove,
}: ButtonEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Pulsanti <span className="text-xs text-muted-foreground font-normal">({buttons.length}/3)</span></Label>
        {canAddCustomButton && (
          <Button type="button" variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={onAdd}>
            <Plus className="h-3 w-3" /> Aggiungi
          </Button>
        )}
      </div>

      {buttons.map((btn, idx) => (
        <div key={idx} className={`border rounded-xl p-3 space-y-3 ${btn.is_locked ? "bg-muted/50" : "bg-muted/20"}`}>
          <div className="flex items-center gap-2">
            {btn.is_locked ? (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {btn.type === "FLOW"
                  ? <Workflow className="h-3.5 w-3.5 shrink-0 text-primary" />
                  : <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                <span className="text-xs font-medium truncate">{ROLE_LABEL[btn.semantic_role]}</span>
                <Badge variant="outline" className="text-[10px] h-4 shrink-0">obbligatorio</Badge>
              </div>
            ) : (
              <Select
                value={btn.type}
                onValueChange={(v) => onTypeChange(idx, v as WabaTemplateButtonType)}
                disabled={!isEditable}
              >
                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(BUTTON_TYPE_LABELS) as [WabaTemplateButtonType, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!btn.is_locked && isEditable && (
              <Button
                type="button" variant="ghost" size="icon"
                className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10"
                onClick={() => onRemove(idx)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {btn.type === "FLOW" && (
            <div className="space-y-1">
              <Input
                placeholder="Testo pulsante (es. Prenota un tavolo)"
                value={btn.text}
                onChange={(e) => onFieldChange(idx, "text", e.target.value.slice(0, CHAR_LIMITS.BUTTON))}
                disabled={!isEditable} className="h-8 text-sm"
              />
              <div className="flex items-center justify-between">
                {charBadge(btn.text.length, CHAR_LIMITS.BUTTON)}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Workflow className="h-3 w-3" /> Apre il flow di prenotazione tavolo
                </span>
              </div>
            </div>
          )}

          {btn.type === "QUICK_REPLY" && (
            <div className="space-y-1">
              <Input
                placeholder="Testo pulsante"
                value={btn.text}
                onChange={(e) => onFieldChange(idx, "text", e.target.value.slice(0, CHAR_LIMITS.BUTTON))}
                disabled={!isEditable} className="h-8 text-sm"
              />
              <div className="flex justify-end">{charBadge(btn.text.length, CHAR_LIMITS.BUTTON)}</div>
            </div>
          )}

          {btn.type === "URL" && (
            <div className="space-y-2">
              <div className="space-y-1">
                <Input
                  placeholder="Testo pulsante (es. Vedi prenotazione)"
                  value={btn.text}
                  onChange={(e) => onFieldChange(idx, "text", e.target.value.slice(0, CHAR_LIMITS.BUTTON))}
                  disabled={!isEditable} className="h-8 text-sm"
                />
                <div className="flex justify-end">{charBadge(btn.text.length, CHAR_LIMITS.BUTTON)}</div>
              </div>
              <Input
                placeholder="URL (es. https://example.com o .../{{1}} per dinamico)"
                value={btn.url}
                onChange={(e) => onFieldChange(idx, "url", e.target.value)}
                disabled={!isEditable} className="h-8 text-sm font-mono"
              />
              {btn.url.includes("{{1}}") && (
                <Input
                  placeholder="URL di esempio per Meta"
                  value={btn.url_example}
                  onChange={(e) => onFieldChange(idx, "url_example", e.target.value)}
                  disabled={!isEditable} className="h-8 text-sm font-mono"
                />
              )}
            </div>
          )}

          {btn.type === "PHONE_NUMBER" && (
            <div className="space-y-2">
              <div className="space-y-1">
                <Input
                  placeholder="Testo pulsante (es. Chiama il locale)"
                  value={btn.text}
                  onChange={(e) => onFieldChange(idx, "text", e.target.value.slice(0, CHAR_LIMITS.BUTTON))}
                  disabled={!isEditable} className="h-8 text-sm"
                />
                <div className="flex justify-end">{charBadge(btn.text.length, CHAR_LIMITS.BUTTON)}</div>
              </div>
              <Input
                placeholder="+39012345678"
                value={btn.phone_number}
                onChange={(e) => onFieldChange(idx, "phone_number", e.target.value)}
                disabled={!isEditable} className="h-8 text-sm"
              />
            </div>
          )}

          {btn.type === "COPY_CODE" && (
            <div className="space-y-1">
              <Input
                placeholder="Codice di esempio (es. ESTATE25)"
                value={btn.copy_code_example}
                onChange={(e) => onFieldChange(idx, "copy_code_example", e.target.value)}
                disabled={!isEditable} className="h-8 text-sm font-mono"
              />
              <p className="text-xs text-muted-foreground">Il testo &ldquo;Copia codice&rdquo; è fisso e localizzato da Meta.</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
