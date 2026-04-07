"use client";

import { useState, useEffect, useTransition } from "react";
import { Package, Trash2, Loader2 } from "lucide-react";
import ConfirmDialog from "@/components/utility/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  getTaggedContacts,
  removeContactTag,
} from "@/app/actions/call-management";
import NoItems from "@/components/utility/no-items";

interface ContactAttribute {
  id: string;
  phone_number: string;
  tags: string[];
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
      await removeContactTag(id, "supplier");
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
        <NoItems 
          variant="children"
          icon={<Package size={28} className='text-primary' />}
          title="Nessun fornitore salvato"
          description="Quando un chiamante clicca 'Sono un fornitore' sul messaggio WhatsApp, apparirà qui."
        />
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Fornitori auto-taggati ({contacts.length})
          </p>
          {contacts.map((contact) => {
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
                      <span className="text-blue-500">
                        Silenziato in automatico
                      </span>
                    </p>
                  </div>
                </div>
                <ConfirmDialog
                  title="Rimuovi tag fornitore"
                  description="Sei sicuro di voler rimuovere il tag fornitore da questo contatto? Inizierà a ricevere nuovamente i messaggi automatici."
                  confirmLabel="Rimuovi"
                  variant="destructive"
                  onConfirm={() => handleRemove(contact.id)}
                  trigger={
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-muted-foreground hover:text-destructive"
                      disabled={isPending}
                      title="Rimuovi tag fornitore"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground/70 px-1 italic">
            I fornitori non ricevono il messaggio automatico. Puoi rimuovere
            il tag manualmente se vuoi che tornino a riceverlo.
          </p>
        </div>
      )}
    </div>
  );
}
