"use client";

import { createPublicBooking, CreateBookingState } from "@/app/actions/public-booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { useFormState } from "react-dom"; // Use standard hook or useActionState if Next 15
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

const initialState: CreateBookingState = { error: null, success: false };

export function BookingForm({
  locationId,
  organizationId,
  locationSlug,
  initialPhone
}: {
  locationId: string;
  organizationId: string;
  locationSlug: string;
  initialPhone: string;
}) {
  const [state, formAction, isPending] = useActionState(createPublicBooking, initialState);

  if (state.success) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">
          ✓
        </div>
        <h3 className="text-xl font-bold text-gray-900">Prenotazione Inviata!</h3>
        <p className="text-gray-600">
          Grazie! Riceverai presto una conferma tramite WhatsApp/SMS.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locationId" value={locationId} />
      <input type="hidden" name="organizationId" value={organizationId} />
      <input type="hidden" name="locationSlug" value={locationSlug} />

      {/* Guest Name */}
      <div className="space-y-2">
        <Label htmlFor="guestName">Nome e Cognome</Label>
        <Input
          id="guestName"
          name="guestName"
          placeholder="Mario Rossi"
          required
          className="text-lg py-3"
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="guestPhone">Telefono</Label>
        <Input
          id="guestPhone"
          name="guestPhone"
          type="tel"
          defaultValue={initialPhone}
          placeholder="+39 333 ..."
          required
          className="text-lg py-3"
        />
      </div>

      {/* Guests Count */}
      <div className="space-y-2">
        <Label htmlFor="guestsCount">Persone</Label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
            <div key={num} className="relative">
              <input
                type="radio"
                name="guestsCount"
                id={`g-${num}`}
                value={num}
                className="peer sr-only"
                required
                defaultChecked={num === 2}
              />
              <label
                htmlFor={`g-${num}`}
                className="flex items-center justify-center w-full h-10 border rounded-md cursor-pointer peer-checked:bg-slate-900 peer-checked:text-white peer-checked:border-slate-900 hover:bg-gray-50 text-gray-700"
              >
                {num}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="block w-full py-2"
          />
        </div>

        {/* Time */}
        <div className="space-y-2">
          <Label htmlFor="time">Ora</Label>
          <select
            id="time"
            name="time"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {/* Stub time slots - in real app fetch availability */}
            <option value="19:00">19:00</option>
            <option value="19:30">19:30</option>
            <option value="20:00">20:00</option>
            <option value="20:30">20:30</option>
            <option value="21:00">21:00</option>
            <option value="21:30">21:30</option>
          </select>
        </div>
      </div>

      {state.error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
          {state.error}
        </div>
      )}

      <Button type="submit" className="w-full text-lg py-6" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Inviando...
          </>
        ) : (
          "Conferma Prenotazione"
        )}
      </Button>
    </form>
  );
}
