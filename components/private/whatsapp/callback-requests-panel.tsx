"use client";

import { useState, useEffect, useTransition } from "react";
import { Phone, CheckCircle2, Archive, Clock, Loader2 } from "lucide-react";
import ConfirmDialog from "@/components/utility/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getCallbackRequests,
  markCallbackCompleted,
  archiveCallback,
} from "@/app/actions/call-management";
import { formatPhoneNumber } from "@/lib/utils";
import NoItems from "@/components/utility/no-items";

interface CallbackRequest {
  id: string;
  phone_number: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export function CallbackRequestsPanel({ locationId }: { locationId: string }) {
  const [requests, setRequests] = useState<CallbackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchData = async () => {
    try {
      const data = await getCallbackRequests(locationId);
      setRequests(data);
    } catch {
      console.error("Failed to fetch callback requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [locationId]);

  const handleComplete = (id: string) => {
    startTransition(async () => {
      await markCallbackCompleted(id);
      fetchData();
    });
  };

  const handleArchive = (id: string) => {
    startTransition(async () => {
      await archiveCallback(id);
      fetchData();
    });
  };

  const pending = requests.filter((r) => r.status === "pending");
  const completed = requests.filter((r) => r.status === "completed");

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pending.length === 0 && completed.length === 0 ? (
        <NoItems 
          variant="children"
          icon={<Phone size={28} className='text-primary' />}
          title="Nessuna richiesta di richiamata"
          description="Quando un cliente clicca 'Richiamatemi' sul messaggio WhatsApp, apparirà qui."
        />
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Da richiamare ({pending.length})
              </p>
              {pending.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Phone className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{formatPhoneNumber(req.phone_number)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.created_at).toLocaleString("it-IT", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled={isPending}
                      onClick={() => handleComplete(req.id)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Richiamato
                    </Button>
                    <ConfirmDialog
                      title="Archivia richiesta"
                      description="Sei sicuro di voler archiviare questa richiesta di richiamata?"
                      confirmLabel="Archivia"
                      onConfirm={() => handleArchive(req.id)}
                      trigger={
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-muted-foreground"
                          disabled={isPending}
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Completate
              </p>
              {completed.slice(0, 5).map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-dashed opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{formatPhoneNumber(req.phone_number)}</p>
                      <p className="text-xs text-muted-foreground">
                        Richiamato{" "}
                        {req.completed_at
                          ? new Date(req.completed_at).toLocaleString("it-IT", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : ""}
                      </p>
                    </div>
                  </div>
                  <ConfirmDialog
                    title="Archivia richiesta"
                    description="Sei sicuro di voler archiviare questa richiesta di richiamata?"
                    confirmLabel="Archivia"
                    onConfirm={() => handleArchive(req.id)}
                    trigger={
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-muted-foreground"
                        disabled={isPending}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
