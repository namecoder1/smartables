"use client";

import { useState, useEffect, useTransition } from "react";
import { Package, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getTaggedContacts,
  removeContactTag,
} from "@/app/actions/call-management";

interface ContactAttribute {
  id: string;
  phone_number: string;
  tag: string;
  updated_at: string;
}

export function TaggedSuppliersPanel({ locationId }: { locationId: string }) {
  const [contacts, setContacts] = useState<ContactAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchData = async () => {
    try {
      const data = await getTaggedContacts(locationId, "supplier");
      setContacts(data);
    } catch {
      console.error("Failed to fetch tagged contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [locationId]);

  const handleRemove = (id: string) => {
    startTransition(async () => {
      await removeContactTag(id);
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

  return (
    <div className="space-y-4">
      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-xl">
          <Package className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Nessun fornitore taggato.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Quando un chiamante clicca &quot;Sono un fornitore&quot; sul
            messaggio WhatsApp, apparirà qui.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Fornitori auto-taggati ({contacts.length})
          </p>
          {contacts.map((contact) => {
            const isActive =
              new Date(contact.updated_at).getTime() >
              Date.now() - 7 * 24 * 60 * 60 * 1000;

            return (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Package className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {contact.phone_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isActive ? (
                        <span className="text-blue-500">
                          Silenziato (
                          {Math.ceil(
                            (new Date(contact.updated_at).getTime() +
                              7 * 24 * 60 * 60 * 1000 -
                              Date.now()) /
                            (24 * 60 * 60 * 1000),
                          )}
                          g rimasti)
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Soppressione scaduta
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-muted-foreground hover:text-destructive"
                  disabled={isPending}
                  onClick={() => handleRemove(contact.id)}
                  title="Rimuovi tag fornitore"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground/70 px-1 italic">
            I fornitori non ricevono il messaggio automatico per 7 giorni dopo
            il tag. Puoi rimuovere il tag manualmente.
          </p>
        </div>
      )}
    </div>
  );
}
