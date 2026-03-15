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
 * Validates all required fields for a public (external) booking form.
 * Returns an Italian-language error string, or `null` if valid.
 */
export function validatePublicBookingFields({
  locationId,
  organizationId,
  guestName,
  guestPhone,
  date,
  time,
}: PublicBookingFields): string | null {
  if (!locationId || !organizationId || !guestName || !guestPhone || !date || !time) {
    return "Compila tutti i campi obbligatori.";
  }
  return null;
}
