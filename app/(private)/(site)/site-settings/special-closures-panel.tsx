"use client";

import { useState, useEffect, useTransition } from "react";
import {
  CalendarOff,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import ConfirmDialog from "@/components/utility/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RangePicker } from "@/components/ui/range-picker";
import { DateRange } from "react-day-picker";
import {
  getSpecialClosures,
  addSpecialClosure,
  removeSpecialClosure,
} from "@/app/actions/call-management";

interface SpecialClosure {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
}

export function SpecialClosuresPanel({ locationId }: { locationId: string }) {
  const [closures, setClosures] = useState<SpecialClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [reason, setReason] = useState("");

  const fetchData = async () => {
    try {
      const data = await getSpecialClosures(locationId);
      setClosures(data);
    } catch {
      console.error("Failed to fetch closures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [locationId]);

  const handleAdd = () => {
    if (!range?.from || !range?.to || !reason) return;
    startTransition(async () => {
      await addSpecialClosure(locationId, range.from!.toISOString(), range.to!.toISOString(), reason);
      setRange(undefined);
      setReason("");
      setShowForm(false);
      fetchData();
    });
  };

  const handleRemove = (id: string) => {
    startTransition(async () => {
      await removeSpecialClosure(id);
      fetchData();
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const now = new Date();
  const activeClosure = closures.find(
    (c) => new Date(c.start_date) <= now && new Date(c.end_date) >= now,
  );

  return (
    <div className="space-y-4">
      {activeClosure && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <CalendarOff className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
              Chiusura attiva: {activeClosure.reason}
            </p>
            <p className="text-xs text-muted-foreground">
              Fino al{" "}
              {new Date(activeClosure.end_date).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
              . I clienti riceveranno il messaggio &quot;siamo chiusi&quot;.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Chiusure ({closures.length})
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Aggiungi
        </Button>
      </div>

      {showForm && (
        <div className="p-4 rounded-xl border bg-card space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Periodo di chiusura</Label>
              <RangePicker
                date={range}
                onChange={setRange}
                placeholder="Seleziona periodo"
                className="w-full"
                showDays={true}
                variant="input"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Motivo</Label>
              <Input
                placeholder="es: Ferie estive, Ristrutturazione..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setShowForm(false)}
            >
              Annulla
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleAdd}
              disabled={isPending || !range?.from || !range?.to || !reason}
            >
              {isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              Salva
            </Button>
          </div>
        </div>
      )}

      {closures.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-xl">
          <CalendarOff className="h-7 w-7 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Nessuna chiusura programmata.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Aggiungi ferie o chiusure straordinarie per avvisare automaticamente
            i clienti.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {closures.map((closure) => {
            const isActive =
              new Date(closure.start_date) <= now &&
              new Date(closure.end_date) >= now;
            const isPast = new Date(closure.end_date) < now;

            return (
              <div
                key={closure.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isActive
                  ? "bg-orange-500/5 border-orange-500/20"
                  : isPast
                    ? "opacity-50 border-dashed"
                    : "bg-input/30 hover:bg-input/50"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${isActive ? "bg-orange-500/10" : "bg-muted"}`}
                  >
                    <CalendarOff
                      className={`h-4 w-4 ${isActive ? "text-orange-500" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {closure.reason || "Chiusura"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(closure.start_date).toLocaleDateString(
                        "it-IT",
                        { day: "2-digit", month: "short" },
                      )}{" "}
                      →{" "}
                      {new Date(closure.end_date).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <ConfirmDialog
                  title="Elimina chiusura"
                  description="Questa azione non può essere annullata. Sei sicuro di voler eliminare questa chiusura speciale?"
                  confirmLabel="Elimina"
                  variant="destructive"
                  onConfirm={() => handleRemove(closure.id)}
                  trigger={
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 text-xs text-muted-foreground hover:text-destructive"
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" color="white" />
                    </Button>
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
