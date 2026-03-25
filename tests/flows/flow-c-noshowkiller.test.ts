/**
 * Flusso C — No-Show Killer (verify-booking Trigger.dev task)
 *
 * Testa la funzione `run` del task `verify-booking`, che:
 *  - Aspetta fino a 24h prima del booking time
 *  - Invia il template WhatsApp "verify_booking" al cliente
 *  - Gestisce tutti i casi edge (booking cancellato, stesso giorno, ecc.)
 *
 * Scenari coperti:
 *  1. Booking non trovato → NOT_FOUND
 *  2. Booking whatsapp_auto dello stesso giorno → SAME_DAY_WHATSAPP
 *  3. Booking non più pending (già confermato/cancellato) → NO_LONGER_PENDING
 *  4. Location senza meta_phone_id → MISSING_PHONE_ID
 *  5. Flusso completo di successo → wait + WA + update DB
 *  6. Booking cancellato durante l'attesa → NO_LONGER_PENDING (post-wait)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@trigger.dev/sdk", () => ({
  task: vi.fn((config: any) => config), // restituisce il config per accedere a .run()
  wait: { until: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue({ messages: [{ id: "wa-1" }] }),
}));

import { verifyBooking } from "@/trigger/verify-booking";
import { createClient } from "@supabase/supabase-js";
import { wait } from "@trigger.dev/sdk";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { makeChain } from "./helpers";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PAYLOAD = {
  bookingId: "booking-1",
  locationId: "loc-1",
  customerId: "cust-1",
  guestName: "Mario Rossi",
  guestPhone: "+393331112233",
  bookingTime: "2026-03-20T19:00:00.000Z", // giovedì sera (futuro)
};

const PENDING_BOOKING = {
  status: "pending",
  organization_id: "org-1",
  source: "dashboard",
  created_at: "2026-03-16T09:00:00.000Z",
};

const LOCATION_WITH_META = {
  meta_phone_id: "meta-phone-1",
  name: "Pizzeria Mario",
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Flusso C — No-Show Killer (verify-booking)", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // 4 giorni prima del booking → la 24h mark non è ancora passata
    vi.setSystemTime(new Date("2026-03-16T10:00:00.000Z"));

    mockSupabase = { from: vi.fn(), rpc: vi.fn() };
    (createClient as any).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("termina con NOT_FOUND se la prenotazione non esiste", async () => {
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "bookings")
        return makeChain({ data: null, error: { message: "not found" } });
      return makeChain();
    });

    const result = await verifyBooking.run(PAYLOAD);

    expect(result).toEqual({ success: false, reason: "NOT_FOUND" });
    expect(wait.until).not.toHaveBeenCalled();
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it("salta la verifica per booking whatsapp_auto creato lo stesso giorno del booking", async () => {
    // Booking e sistema entrambi il 20 marzo
    vi.setSystemTime(new Date("2026-03-20T08:00:00.000Z"));
    const sameDayPayload = { ...PAYLOAD, bookingTime: "2026-03-20T19:00:00.000Z" };

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "bookings")
        return makeChain({
          data: {
            status: "pending",
            organization_id: "org-1",
            source: "whatsapp_auto",
            created_at: "2026-03-20T07:30:00.000Z", // stesso giorno del booking
          },
        });
      return makeChain();
    });

    const result = await verifyBooking.run(sameDayPayload);

    expect(result).toEqual({ success: false, reason: "SAME_DAY_WHATSAPP" });
    expect(wait.until).not.toHaveBeenCalled();
  });

  it("salta la verifica se la prenotazione non è più pending (già confermata)", async () => {
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "bookings")
        return makeChain({
          data: { ...PENDING_BOOKING, status: "confirmed" },
        });
      return makeChain();
    });

    const result = await verifyBooking.run(PAYLOAD);

    expect(result).toEqual({ success: false, reason: "NO_LONGER_PENDING" });
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it("termina con MISSING_PHONE_ID se la location non ha meta_phone_id", async () => {
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "bookings") return makeChain({ data: PENDING_BOOKING });
      if (table === "locations")
        return makeChain({ data: { meta_phone_id: null, name: "Pizzeria" } });
      return makeChain();
    });

    const result = await verifyBooking.run(PAYLOAD);

    expect(result).toEqual({ success: false, reason: "MISSING_PHONE_ID" });
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it("salta la verifica se il booking viene cancellato durante l'attesa (post-wait)", async () => {
    let bookingFetchCount = 0;
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "bookings") {
        bookingFetchCount++;
        if (bookingFetchCount === 1) {
          // Prima fetch: pending
          return makeChain({ data: PENDING_BOOKING });
        } else {
          // Seconda fetch (post-wait): cancellato nel frattempo
          return makeChain({ data: { ...PENDING_BOOKING, status: "cancelled" } });
        }
      }
      return makeChain();
    });

    const result = await verifyBooking.run(PAYLOAD);

    expect(wait.until).toHaveBeenCalled();
    expect(result).toEqual({ success: false, reason: "NO_LONGER_PENDING" });
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it("invia il template verify_booking e aggiorna il DB in caso di successo", async () => {
    const updateMock = vi.fn(() => makeChain());

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "bookings") {
        const chain = makeChain({ data: PENDING_BOOKING });
        chain.update = updateMock;
        return chain;
      }
      if (table === "locations") return makeChain({ data: LOCATION_WITH_META });
      return makeChain();
    });

    const result = await verifyBooking.run(PAYLOAD);

    // Deve aspettare 24h prima del booking
    expect(wait.until).toHaveBeenCalledWith(
      expect.objectContaining({ date: expect.any(Date) }),
    );

    // Deve inviare il template corretto
    expect(sendWhatsAppMessage).toHaveBeenCalledWith(
      PAYLOAD.guestPhone,
      expect.objectContaining({ name: "verify_booking" }),
      LOCATION_WITH_META.meta_phone_id,
    );

    // Il template deve includere nome, ora e nome ristorante
    const [, templateConfig] = (sendWhatsAppMessage as any).mock.calls[0];
    const bodyParams = templateConfig.components[0].parameters;
    expect(bodyParams[0].text).toBe(PAYLOAD.guestName);
    expect(bodyParams[2].text).toBe(LOCATION_WITH_META.name);

    // Deve aggiornare il DB
    expect(updateMock).toHaveBeenCalled();

    expect(result).toEqual({ success: true });
  });
});
