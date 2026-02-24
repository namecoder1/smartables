"use client";

import { useEffect, useState, useTransition } from "react";
import { useOrganization } from "@/components/providers/organization-provider";
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "./actions";
import { parsePhoneNumber } from "react-phone-number-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Store, Pencil, Trash2, Loader2, Info, UtensilsCrossed, MapPin, Phone, Users, Clock } from "lucide-react";
import { WeeklyHoursSelector } from "@/components/utility/weekly-hours-selector";
import { PhoneInput } from "@/components/ui/phone-input";
import PageWrapper from "@/components/private/page-wrapper";
import { Location } from "@/types/general";
import ActionSheet from "@/components/utility/action-sheet";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import GroupedActions from "@/components/utility/grouped-actions";
import { NumberInput } from "@/components/ui/number-input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import OverviewCards from "@/components/private/overview-cards";

const ActivitiesView = () => {
  const { organization } = useOrganization();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [seats, setSeats] = useState<number | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  const selectedOrganizationId = organization?.id;

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
    setAddress("");
    setSeats(undefined);
    setSheetOpen(true);
  };

  const handleOpenEdit = (loc: Location) => {
    setEditingLocation(loc);
    try {
      const parsed = parsePhoneNumber(loc.phone_number || "", "IT");
      setPhoneNumber(parsed?.number || loc.phone_number || "");
    } catch {
      setPhoneNumber(loc.phone_number || "");
    }
    setAddress(loc.address || "");
    setSeats(loc.seats || undefined);
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
      <PageWrapper>
        <Store className="h-12 w-12 text-muted-foreground/50" />
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Nessuna attività selezionata</h3>
          <p className="text-sm text-muted-foreground">Seleziona un'attività per gestire le sue impostazioni.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="relative">
      {/* Header */}
      <div className="xl:hidden flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestisci sedi</h1>
          <p className="text-muted-foreground">Gestisci le sedi della tua organizzazione.</p>
        </div>
        <Button onClick={handleOpenAdd} disabled={organization?.billing_tier === "starter"} className="shadow-sm">
          <Plus className="h-4 w-4" /> Aggiungi
        </Button>
      </div>

      <OverviewCards
        data={[
          {
            title: 'Totale sedi',
            value: locations.length,
            description: 'sedi'
          },
          {
            title: 'Sedi massime',
            value: organization.billing_tier === "starter" ? 1 : organization.billing_tier === "growth" ? 3 : 5,
            description: 'sedi'
          },
          {
            title: 'Il tuo abbonamento',
            value: organization.billing_tier.charAt(0).toUpperCase() + organization.billing_tier.slice(1),
            description: ''
          }
        ]}
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleOpenAdd}
            disabled={organization?.billing_tier === "starter"}
            className="absolute bottom-6 right-6 hidden xl:flex"
          >
            <Plus className="h-4 w-4" /> Aggiungi
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Aggiungi una nuova sede</p>
        </TooltipContent>
      </Tooltip>

      {/* Info Box */}
      <div className="flex items-start gap-4 rounded-lg border bg-primary/20 p-4 dark:bg-primary/20 dark:text-primary border-primary dark:border-primary">
        <div className="space-y-2">
          <p className="font-semibold text-lg tracking-tight leading-none">Gestisci piu di una sede?</p>
          <p className="text-sm opacity-90">
            Ogni sede ha il proprio indirizzo e orari di apertura specifici. Aggiungere una sede nuova permette di gestire le prenotazioni separatamente.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 animate-pulse rounded-xl border bg-card" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {locations.map((loc) => (
            <LocationCard
              key={loc.id}
              loc={loc}
              handleOpenEdit={handleOpenEdit}
              onDeleteConfirm={onDeleteConfirm}
            />
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

      <ActionSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editingLocation ? "Modifica Luogo" : "Aggiungi Nuovo Negozio"}
        description={editingLocation ? "Aggiorna i dettagli per questo luogo." : "Inserisci i dettagli per il tuo nuovo negozio."}
        formAction={handleSubmit}
        actionButtons={editingLocation ? <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salva Cambiamenti
        </Button> : <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crea Negozio
        </Button>}
      >
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Negozio</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-2.5 h-4 w-4 text-foreground" />
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
                <Label htmlFor="seats">Coperti totali</Label>
                <div className="relative">
                  <UtensilsCrossed className="absolute left-3 top-2.5 h-4 w-4 text-foreground" />
                  <NumberInput
                    id="seats"
                    name="seats"
                    placeholder="es: 100"
                    className="pl-9 w-full"
                    value={seats}
                    context="default"
                    onValueChange={setSeats}
                    required
                  />
                </div>
              </div>

            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Indirizzo</Label>
              <AddressAutocomplete
                name="address"
                required
                defaultValue={address}
                onAddressSelect={(addr) => setAddress(addr)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Numero di telefono</Label>
              <div className="relative">
                <PhoneInput
                  id="phone"
                  defaultCountry="IT"
                  value={phoneNumber}
                  onChange={(value) => setPhoneNumber(value || "")}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Label>Orari</Label>
            <WeeklyHoursSelector
              key={editingLocation ? editingLocation.id : "new"}
              initialData={editingLocation?.opening_hours}
              context="settings"
            />
          </div>
        </div>
      </ActionSheet>
    </PageWrapper>
  );
}

const LocationCard = ({
  loc,
  handleOpenEdit,
  onDeleteConfirm
}: {
  loc: Location,
  handleOpenEdit: (loc: Location) => void,
  onDeleteConfirm: (id: string) => void
}) => {
  return (
    <Card key={loc.id} className="group relative overflow-hidden transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2">
            <h3 className="truncate tracking-tight font-bold text-2xl">{loc.name}</h3>
          </CardTitle>
          <GroupedActions
            side="bottom"
            items={[
              {
                label: "Modifica",
                icon: <Pencil />,
                action: () => handleOpenEdit(loc),
              },
              {
                label: "Elimina",
                icon: <Trash2 className="group-hover:text-red-500 dark:group-hover:text-white/80" />,
                variant: "destructive",
                action: () => onDeleteConfirm(loc.id),
              },
            ]}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-start gap-3 text-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{loc.address || "Nessun indirizzo"}</span>
        </div>
        <div className="flex items-center gap-3 text-foreground">
          <Phone className="h-4 w-4 shrink-0 text-primary" />
          <span>{loc.phone_number || "Nessun telefono"}</span>
        </div>
        <div className="flex items-center gap-3 text-foreground">
          <Users className="h-4 w-4 shrink-0 text-primary" />
          <span>{loc.seats ? `${loc.seats} Coperti` : "Coperti non specificati"}</span>
        </div>
        <div className="flex items-start gap-3 text-foreground">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="space-y-1">
            {(() => {
              if (!loc.opening_hours || Object.keys(loc.opening_hours).length === 0) {
                return <span>Orari non impostati</span>;
              }

              // Check today's hours
              // Note: We use Italian day names because that's how they are stored in the WeeklyHoursSelector
              const days = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
              const todayIndex = new Date().getDay();
              const todayName = days[todayIndex];
              // @ts-ignore - we know opening_hours is an object based on the selector
              const todaySlots = loc.opening_hours[todayName];

              if (todaySlots && todaySlots.length > 0) {
                return (
                  <>
                    <span className="font-medium text-green-600 dark:text-green-400">Aperto oggi</span>
                    <span className="ml-1 text-xs">
                      {todaySlots.map((s: any) => `${s.open}-${s.close}`).join(", ")}
                    </span>
                  </>
                );
              } else {
                return <span className="text-foreground">Chiuso oggi</span>;
              }
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivitiesView;
