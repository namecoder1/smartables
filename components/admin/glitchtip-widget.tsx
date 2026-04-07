"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

type GlitchTipIssue = {
  id: string;
  shortId: string;
  title: string;
  level: "fatal" | "error" | "warning" | "info";
  count: string;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
};

const LEVEL_CONFIG: Record<string, { label: string; className: string }> = {
  fatal:   { label: "FATAL",   className: "bg-red-100 text-red-800 border-red-200" },
  error:   { label: "ERROR",   className: "bg-orange-100 text-orange-700 border-orange-200" },
  warning: { label: "WARN",    className: "bg-amber-100 text-amber-700 border-amber-200" },
  info:    { label: "INFO",    className: "bg-blue-100 text-blue-700 border-blue-200" },
};

const BASE_URL = process.env.NEXT_PUBLIC_GLITCHTIP_URL ?? "";
const API_TOKEN = process.env.NEXT_PUBLIC_GLITCHTIP_API_TOKEN ?? "";

export default function GlitchTipWidget() {
  const [issues, setIssues] = useState<GlitchTipIssue[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "unreachable" | "no-token">("loading");

  async function load() {
    setStatus("loading");

    if (!BASE_URL || !API_TOKEN) {
      setStatus("no-token");
      return;
    }

    try {
      const res = await fetch(
        `${BASE_URL}/api/0/issues/?query=is%3Aunresolved&limit=10`,
        {
          headers: { Authorization: `Token ${API_TOKEN}` },
          signal: AbortSignal.timeout(5000),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: GlitchTipIssue[] = await res.json();
      setIssues(data);
      setStatus("ok");
    } catch {
      setStatus("unreachable");
    }
  }

  useEffect(() => { load(); }, []);

  if (status === "no-token") {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center gap-2 text-sm text-muted-foreground">
        <WifiOff className="size-5" />
        <p>Configura <code className="text-xs bg-muted px-1 rounded">NEXT_PUBLIC_GLITCHTIP_URL</code> e <code className="text-xs bg-muted px-1 rounded">NEXT_PUBLIC_GLITCHTIP_API_TOKEN</code></p>
      </div>
    );
  }

  if (status === "unreachable") {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center gap-3 text-sm text-muted-foreground">
        <WifiOff className="size-5 text-amber-500" />
        <p className="text-xs">GlitchTip non raggiungibile — assicurati di essere su Tailscale.</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load} className="h-7 text-xs gap-1">
            <RefreshCw className="size-3" /> Riprova
          </Button>
          <Button size="sm" variant="outline" asChild className="h-7 text-xs gap-1">
            <a href={BASE_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3" /> Apri GlitchTip
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
        <RefreshCw className="size-4 animate-spin" /> Caricamento…
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {issues.length === 0 ? (
        <div className="flex items-center gap-2 text-green-700 text-sm py-2">
          <Wifi className="size-4" /> Nessun errore irrisolto
        </div>
      ) : (
        issues.map((issue) => {
          const lvl = LEVEL_CONFIG[issue.level] ?? LEVEL_CONFIG.error;
          return (
            <div key={issue.id} className="flex items-start justify-between gap-2 py-2 border-b last:border-0 text-xs">
              <div className="min-w-0 flex-1">
                <a
                  href={issue.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline line-clamp-1 leading-tight"
                >
                  {issue.title}
                </a>
                <p className="text-muted-foreground mt-0.5">
                  {issue.count}× · ultimo {formatDistanceToNow(new Date(issue.lastSeen), { addSuffix: true, locale: it })}
                </p>
              </div>
              <Badge variant="outline" className={`shrink-0 text-[10px] ${lvl.className}`}>
                {lvl.label}
              </Badge>
            </div>
          );
        })
      )}
      <div className="pt-2 flex justify-between items-center">
        <Button size="sm" variant="ghost" onClick={load} className="h-6 text-xs gap-1 text-muted-foreground">
          <RefreshCw className="size-3" /> Aggiorna
        </Button>
        <a
          href={BASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
        >
          Apri GlitchTip <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}
