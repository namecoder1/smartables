"use client";

import { useEffect, useState, useTransition } from "react";
import { useOrganization } from "@/components/providers/organization-provider";
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Store, MapPin, Pencil, Trash2, Loader2, Info, Phone, Table, UtensilsCrossed } from "lucide-react";
import { WeeklyHoursSelector, WeeklyHours } from "@/components/utility/weekly-hours-selector";
import ConfirmDialog from "@/components/utility/confirm-dialog";
import { PhoneInput } from "@/components/ui/phone-input";

// Types
type Location = {
  id: string;
  name: string;
  address: string;
  phone_number: string;
  places: number;
  opening_hours: WeeklyHours;
  organization_id: string;
};

export default function ManageView() {
  const { organization } = useOrganization();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const selectedOrganizationId = organization?.id;
  const selectedOrg = organization;

  const fetchLocations = async () => {
    if (!selectedOrganizationId) return;
    setLoading(true);
    try {
      const data = await getLocations(selectedOrganizationId);
      // @ts-ignore
      setLocations(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [selectedOrganizationId]);

  const handleOpenAdd = () => {
    setEditingLocation(null);
    setPhoneNumber("");
    setSheetOpen(true);
  };

  const handleOpenEdit = (loc: Location) => {
    setEditingLocation(loc);
    setPhoneNumber(loc.phone_number);
    setSheetOpen(true);
  };

  const handleSubmit = async (formData: FormData) => {
    if (!selectedOrganizationId) return;

    if (!selectedOrganizationId) return;

    // Append the controlled phone number to formData
    formData.set("phone", phoneNumber);

    startTransition(async () => {
      let result;
      if (editingLocation) {
        result = await updateLocation(editingLocation.id, formData);
      } else {
        result = await createLocation(selectedOrganizationId, formData);
      }

      if (result.success) {
        setSheetOpen(false);
        fetchLocations();
      } else {
        console.error("Operation failed");
        alert("Operation failed");
      }
    });
  };

  const onDeleteConfirm = async (id: string) => {
    startTransition(async () => {
      const result = await deleteLocation(id);
      if (result.success) {
        fetchLocations();
      } else {
        console.error("Delete failed");
        alert("Delete failed");
      }
    });
  };

  if (!selectedOrganizationId) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <Store className="h-12 w-12 text-muted-foreground/50" />
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Nessuna attività selezionata</h3>
          <p className="text-sm text-muted-foreground">Seleziona un'attività per gestire le sue impostazioni.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestisci attività</h2>
          <p className="text-muted-foreground">
            Gestisci le tue attività ed i dettagli dei tuoi negozi.
          </p>
        </div>
        <Button onClick={handleOpenAdd} disabled={organization?.activation_status !== "active"} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Aggiungi attività
        </Button>
      </div>


      {/* Info Box */}
      <div className="flex items-start gap-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-blue-900 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="space-y-1">
          <p className="font-medium">Gestisci piu di un'attività?</p>
          <p className="text-sm opacity-90">
            Ogni attività ha il proprio indirizzo e orari di apertura specifici. Aggiungere un'attività nuova permette di gestire le prenotazioni separatamente.
          </p>
        </div>
      </div>

      {/* Locations Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 animate-pulse rounded-xl border bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <Card key={loc.id} className="group relative overflow-hidden transition-all hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-start justify-between text-lg">
                  <span className="truncate">{loc.name}</span>
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{loc.address}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-end gap-2 pt-4">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(loc)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" /> Modifica
                  </Button>
                  <ConfirmDialog
                    title="Elimina attività"
                    description="Sei sicuro di voler eliminare questa attività? Questa azione non può essere annullata."
                    confirmLabel="Elimina"
                    cancelLabel="Annulla"
                    variant="destructive"
                    onConfirm={() => onDeleteConfirm(loc.id)}
                    trigger={
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {locations.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center animate-in fade-in zoom-in-95 duration-500">
          <Store className="h-10 w-10 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">Nessun luogo trovato</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">Inizia aggiungendo il tuo primo luogo.</p>
          <Button onClick={handleOpenAdd} variant="outline">Aggiungi Luogo</Button>
        </div>
      )}

      {/* Edit/Add Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl flex flex-col gap-0 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>{editingLocation ? "Modifica Luogo" : "Aggiungi Nuovo Negozio"}</SheetTitle>
            <SheetDescription>
              {editingLocation
                ? "Aggiorna i dettagli per questo luogo."
                : "Inserisci i dettagli per il tuo nuovo negozio."}
            </SheetDescription>
          </SheetHeader>

          <form action={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="grid grid-cols-1 gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Negozio</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        placeholder="es: Pizzeria di Mario"
                        className="pl-9 w-full"
                        defaultValue={editingLocation?.name}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Coperti totali</Label>
                    <div className="relative">
                      <UtensilsCrossed className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        type="number"
                        placeholder="es: 100"
                        className="pl-9 w-full"
                        defaultValue={editingLocation?.places}
                        required
                      />
                    </div>
                  </div>

                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Indirizzo</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      name="address"
                      placeholder="es: Via Roma 123, 00100 Roma"
                      className="pl-9"
                      defaultValue={editingLocation?.address}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Numero di telefono</Label>
                  <div className="relative">
                    <PhoneInput
                      id="phone"
                      defaultCountry="IT"
                      defaultValue={editingLocation?.phone_number}
                      value={phoneNumber}
                      onChange={(value) => setPhoneNumber(value || "")}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Orari</Label>
                <WeeklyHoursSelector
                  key={editingLocation ? editingLocation.id : "new"}
                  initialData={editingLocation?.opening_hours}
                  context="settings"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t bg-background mt-auto">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>Annulla</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingLocation ? "Salva Cambiamenti" : "Crea Negozio"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
