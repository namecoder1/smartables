/**
 * Flusso F — Prenotazione Pubblica (createPublicBooking)
 *
 * Testa la server action per la pagina pubblica /p/[locationSlug].
 *
 * Scenari coperti:
 *  1. Campi obbligatori mancanti → errore validazione
 *  2. Honeypot compilato → spam bloccato
 *  3. Rate limit superato → errore throttle
 *  4. Booking duplicato stesso giorno → errore
 *  5. Limite booking nel ciclo superato (2+ in 24h) → errore
 *  6. Errore durante createBookingRecord → errore generico
 *  7. Flusso completo di successo → success: true, bookingId restituito
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("127.0.0.1"),
  }),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/app/actions/bookings", () => ({
  upsertCustomerForBooking: vi.fn().mockResolvedValue("cust-1"),
  createBookingRecord: vi.fn().mockResolvedValue({
    data: { id: "booking-new-1" },
    error: null,
  }),
}));

// La createPublicBooking importa fromZonedTime dinamicamente
vi.mock("date-fns-tz", () => ({
  fromZonedTime: vi.fn((str: string) => new Date(str)),
}));

import { createPublicBooking } from "@/app/actions/public-booking";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { upsertCustomerForBooking, createBookingRecord } from "@/app/actions/bookings";
import { makeChain } from "./helpers";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PREV_STATE = { success: false, error: null };

function makeValidForm(overrides: Record<string, string> = {}): FormData {
  const form = new FormData();
  form.append("locationId", "loc-1");
  form.append("organizationId", "org-1");
  form.append("guestName", "Mario Rossi");
  form.append("guestPhone", "+393331112233");
  form.append("date", "2026-03-20");
  form.append("time", "20:00");
  form.append("guestsCount", "2");
  form.append("locationSlug", "pizzeria-mario");
  form.append("honeypot", ""); // vuoto = ok

  for (const [k, v] of Object.entries(overrides)) {
    form.set(k, v);
  }
  return form;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Flusso F — Prenotazione Pubblica (createPublicBooking)", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "bookings") return makeChain({ data: [] }); // nessun duplicato
        return makeChain();
      }),
    };
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  it("restituisce errore se i campi obbligatori sono mancanti", async () => {
    const form = new FormData();
    form.append("locationId", "loc-1");
    // guestName, guestPhone, date, time mancanti

    const result = await createPublicBooking(PREV_STATE, form, "public_form");

    expect(result.success).toBe(false);
    expect(result.error).toContain("obbligatori");
  });

  it("blocca le richieste spam (honeypot compilato)", async () => {
    const form = makeValidForm({ honeypot: "sono-un-bot" });

    const result = await createPublicBooking(PREV_STATE, form, "public_form");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Spam");
    expect(upsertCustomerForBooking).not.toHaveBeenCalled();
  });

  it("restituisce errore quando il rate limit è superato", async () => {
    (checkRateLimit as any).mockResolvedValueOnce({ success: false });

    const result = await createPublicBooking(PREV_STATE, makeValidForm(), "public_form");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Troppe richieste");
    expect(upsertCustomerForBooking).not.toHaveBeenCalled();
  });

  it("blocca la prenotazione duplicata per lo stesso giorno", async () => {
    // Il DB restituisce un booking già esistente per quella data
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "bookings") {
        return makeChain({
          data: [{ id: "existing-booking", booking_time: "2026-03-20T18:00:00Z" }],
        });
      }
      return makeChain();
    });

    const form = makeValidForm({ date: "2026-03-20" });
    const result = await createPublicBooking(PREV_STATE, form, "public_form");

    expect(result.success).toBe(false);
    expect(result.error).toContain("già una prenotazione");
    expect(upsertCustomerForBooking).not.toHaveBeenCalled();
  });

  it("blocca se ci sono già 2 prenotazioni nelle ultime 24h (date diverse)", async () => {
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "bookings") {
        return makeChain({
          data: [
            { id: "b-1", booking_time: "2026-03-19T18:00:00Z" },
            { id: "b-2", booking_time: "2026-03-21T18:00:00Z" },
          ],
        });
      }
      return makeChain();
    });

    const form = makeValidForm({ date: "2026-03-20" }); // data diversa dalle esistenti
    const result = await createPublicBooking(PREV_STATE, form, "public_form");

    expect(result.success).toBe(false);
    expect(result.error).toContain("limite massimo");
    expect(upsertCustomerForBooking).not.toHaveBeenCalled();
  });

  it("restituisce errore generico se createBookingRecord fallisce", async () => {
    (createBookingRecord as any).mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
    });

    const result = await createPublicBooking(PREV_STATE, makeValidForm(), "public_form");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Errore durante la prenotazione");
  });

  it("crea la prenotazione con successo e restituisce il bookingId", async () => {
    const result = await createPublicBooking(PREV_STATE, makeValidForm(), "public_form");

    expect(result.success).toBe(true);
    expect(result.bookingId).toBe("booking-new-1");
    expect(result.error).toBeNull();

    expect(upsertCustomerForBooking).toHaveBeenCalledWith(
      expect.anything(),     // supabase client
      "org-1",
      "loc-1",
      "Mario Rossi",
      "+393331112233",
      expect.any(String),    // bookingTime ISO
    );

    expect(createBookingRecord).toHaveBeenCalled();
  });
});
