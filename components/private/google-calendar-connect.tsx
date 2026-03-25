"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, CheckCircle2, Link2Off, Loader, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocationStore } from "@/store/location-store";
import {
  saveGoogleCalendar,
  disconnectGoogleCalendar,
} from "@/app/actions/google-calendar";

type Status = {
  connected: boolean;
  calendarId: string | null;
  calendarName: string | null;
};

type GCalItem = {
  id: string;
  summary: string;
  primary?: boolean;
};

interface Props {
  onCalendarChange: (calendarId: string | null, calendarName: string | null) => void;
}

export default function GoogleCalendarConnect({ onCalendarChange }: Props) {
  const { selectedLocationId } = useLocationStore();
  const [status, setStatus] = useState<Status | null>(null);
  const [open, setOpen] = useState(false);
  const [calendars, setCalendars] = useState<GCalItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!selectedLocationId) return;
    try {
      const res = await fetch(
        `/api/google/calendar/status?locationId=${selectedLocationId}`,
      );
      const data: Status = await res.json();
      setStatus(data);
      onCalendarChange(data.calendarId, data.calendarName);
    } catch {
      // silent fail
    }
  }, [selectedLocationId, onCalendarChange]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const fetchCalendars = useCallback(async () => {
    if (!selectedLocationId) return;
    setLoadingCalendars(true);
    try {
      const res = await fetch(
        `/api/google/calendar/calendars?locationId=${selectedLocationId}`,
      );
      const data = await res.json();
      setCalendars(data.calendars ?? []);
      // Pre-select primary or currently saved calendar
      const current = status?.calendarId;
      const primary = data.calendars?.find((c: GCalItem) => c.primary);
      setSelectedId(current ?? primary?.id ?? data.calendars?.[0]?.id ?? "");
    } finally {
      setLoadingCalendars(false);
    }
  }, [selectedLocationId, status?.calendarId]);

  const handleOpenDialog = () => {
    setOpen(true);
    if (status?.connected) {
      fetchCalendars();
    }
  };

  const handleSave = async () => {
    if (!selectedLocationId || !selectedId) return;
    setSaving(true);
    try {
      const cal = calendars.find((c) => c.id === selectedId);
      await saveGoogleCalendar(selectedLocationId, selectedId, cal?.summary ?? "");
      await fetchStatus();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedLocationId) return;
    setDisconnecting(true);
    try {
      await disconnectGoogleCalendar(selectedLocationId);
      setStatus({ connected: false, calendarId: null, calendarName: null });
      onCalendarChange(null, null);
      setOpen(false);
    } finally {
      setDisconnecting(false);
    }
  };

  if (!selectedLocationId) return null;

  return (
    <>
      <Button
        variant="outline"
        className="gap-2 border-2"
        onClick={handleOpenDialog}
      >
        {status?.calendarId ? (
          <>
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">{status.calendarName ?? "Google Calendar"}</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          </>
        ) : (
          <Loader className="animate-spin" />
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Google Calendar
            </DialogTitle>
            <DialogDescription>
              Mostra gli eventi di Google Calendar nel calendario prenotazioni.
            </DialogDescription>
          </DialogHeader>

          {!status?.connected ? (
            <div className="flex flex-col gap-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Collega il tuo account Google per vedere gli eventi del tuo
                calendario insieme alle prenotazioni.
              </p>
              <Button
                asChild
                className="w-full"
              >
                <a
                  href={`/api/google/calendar/auth?locationId=${selectedLocationId}`}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Connetti Google Calendar
                </a>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pt-2">
              <Badge variant="secondary" className="w-fit gap-1.5 text-green-600 bg-green-50 border-green-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Account collegato
              </Badge>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Calendario da mostrare</label>
                {loadingCalendars ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Caricamento calendari...
                  </div>
                ) : (
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Seleziona calendario" />
                    </SelectTrigger>
                    <SelectContent>
                      {calendars.map((cal) => (
                        <SelectItem key={cal.id} value={cal.id}>
                          {cal.summary}
                          {cal.primary && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              (principale)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={saving || !selectedId}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salva
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 border-2 text-destructive hover:text-destructive"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2Off className="h-4 w-4" />
                  )}
                  Scollega
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
