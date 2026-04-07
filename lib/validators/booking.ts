/**
 * Booking validation helpers.
 *
 * Centralises the required-field checks that were scattered across
 * `bookings.ts`, `public-booking.ts`, and related action files.
 *
 * Functions return `null` on success or an error string on failure, so
 * callers can do:
 *
 *   const err = validateBookingFields(fields);
 *   if (err) return fail(err);
 */

import { z } from "zod";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BookingFields {
  guestsCount: number;
  bookingTime: string;
  locationId: string | null;
}

export interface GuestFields {
  guestName: string;
  guestPhone: string;
}

export interface PublicBookingFields {
  locationId: string;
  organizationId: string;
  guestName: string;
  guestPhone: string;
  date: string;
  time: string;
}

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const PublicBookingSchema = z.object({
  locationId: z.string().min(1, "ID sede mancante"),
  organizationId: z.string().min(1, "ID organizzazione mancante"),
  guestName: z
    .string()
    .min(2, "Nome troppo corto (min 2 caratteri)")
    .max(100, "Nome troppo lungo (max 100 caratteri)"),
  guestPhone: z
    .string()
    .min(7, "Numero di telefono non valido")
    .max(25, "Numero di telefono non valido"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato data non valido (atteso YYYY-MM-DD)"),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Formato orario non valido (atteso HH:mm)"),
});

// ─── Validators ──────────────────────────────────────────────────────────────

/**
 * Validates the core booking fields (guests count, date/time, location).
 * Returns an error message string, or `null` if valid.
 */
export function validateBookingFields({
  guestsCount,
  bookingTime,
  locationId,
}: BookingFields): string | null {
  if (!guestsCount || !bookingTime || !locationId) {
    return "Missing required fields (guests, date, or location)";
  }
  return null;
}

/**
 * Validates that guest name and phone are present for a new (unknown) customer.
 * Returns an error message string, or `null` if valid.
 */
export function validateGuestFields({
  guestName,
  guestPhone,
}: GuestFields): string | null {
  if (!guestName || !guestPhone) {
    return "Name and Phone are required";
  }
  return null;
}

/**
 * Validates all required fields for a public (external) booking form using Zod.
 * Returns an Italian-language error string, or `null` if valid.
 */
export function validatePublicBookingFields(fields: PublicBookingFields): string | null {
  const result = PublicBookingSchema.safeParse(fields);
  if (!result.success) {
    return result.error.issues[0]?.message ?? "Dati non validi.";
  }
  return null;
}
