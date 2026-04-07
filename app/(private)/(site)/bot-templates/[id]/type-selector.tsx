"use client";

import PageWrapper from "@/components/private/page-wrapper";
import { Badge } from "@/components/ui/badge";
import { Lock, Workflow } from "lucide-react";
import { TEMPLATE_TYPE_CONFIG, ROLE_LABEL } from "./template-form-config";
import { TYPE_TO_CATEGORY } from "@/lib/waba-templates";
import type { WabaTemplateType } from "@/types/general";

function TypeCard({
  type,
  onSelect,
}: {
  type: WabaTemplateType;
  onSelect: (t: WabaTemplateType) => void;
}) {
  const cfg = TEMPLATE_TYPE_CONFIG[type];
  const cat = TYPE_TO_CATEGORY[type];
  const Icon = cfg.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(type)}
      className="text-left flex flex-col border-2 h-full bg-card rounded-2xl p-4 hover:border-primary/60 transition-colors space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-primary"><Icon className="h-6 w-6" /></div>
        <Badge variant={cat === "MARKETING" ? "destructive" : "secondary"} className="text-[10px] shrink-0">
          {cat} · {cfg.costPerConv}
        </Badge>
      </div>
      <p className="font-semibold text-sm tracking-tight">{cfg.label}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{cfg.description}</p>
      {cfg.requiredRoles.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {cfg.requiredRoles.map((r) => (
            <span key={r} className="text-[10px] bg-muted rounded px-1.5 py-0.5 flex items-center gap-1">
              {r === "booking_flow" ? <Workflow className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
              {ROLE_LABEL[r]}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

const UTILITY_TYPES: WabaTemplateType[] = ["recovery_open", "recovery_closed", "service_update", "booking_reminder", "custom"];
const MARKETING_TYPES: WabaTemplateType[] = ["promotion", "news"];

export function TypeSelector({ onSelect }: { onSelect: (t: WabaTemplateType) => void }) {
  return (
    <PageWrapper>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Nuovo Template</h2>
        <p className="text-muted-foreground mt-1">
          Scegli il tipo di template per determinare la struttura e la categoria Meta.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">UTILITY</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {UTILITY_TYPES.map((t) => <TypeCard key={t} type={t} onSelect={onSelect} />)}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">MARKETING</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {MARKETING_TYPES.map((t) => <TypeCard key={t} type={t} onSelect={onSelect} />)}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
