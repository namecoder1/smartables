/**
 * Flusso E — Bot AI Conversazionale (handleTextMessage)
 *
 * Testa il handler dei messaggi WhatsApp in entrata, che:
 *  - Rileva il keyword "annulla" e cancella la prenotazione attiva
 *  - Rispetta la pausa bot (intervento umano)
 *  - Dispatcha il task AI reply-to-message per messaggi normali
 *
 * Scenari coperti:
 *  1. Location non trovata → risponde 200, nessun task
 *  2. Testo "annulla" con prenotazione attiva → cancella booking + conferma WA
 *  3. Testo "annulla" senza prenotazione attiva → risposta "nessuna prenotazione"
 *  4. Bot in pausa (intervento umano attivo) → ignora il messaggio, nessun task AI
 *  5. Testo normale → dispatcha task reply-to-message
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("next/server", () => {
  class NextResponse {
    constructor(public body: any, public init?: any) {}
    static json = vi.fn((data: any) => new NextResponse(JSON.stringify(data)));
  }
  return { NextResponse };
});

vi.mock("@/lib/utils", () => ({
  normalizePhoneNumber: vi.fn((n: string) => n),
}));

vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppText: vi.fn().mockResolvedValue(undefined),
}));

// Dynamic imports inside handleTextMessage
vi.mock("@trigger.dev/sdk/v3", () => ({
  tasks: { trigger: vi.fn().mockResolvedValue({ id: "task-triggered-1" }) },
}));

vi.mock("@/trigger/reply-to-message", () => ({
  replyToMessage: { id: "reply-to-message" },
}));

import { handleTextMessage } from "@/app/api/webhooks/whatsapp/_handlers/messages";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { tasks } from "@trigger.dev/sdk/v3";
import { makeChain, makeSupabase } from "./helpers";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PHONE_NUMBER_ID = "meta-phone-1";
const FROM = "+393331112233";

const BASE_LOCATION = { id: "loc-1", organization_id: "org-1" };
const ACTIVE_CUSTOMER = { id: "cust-1", name: "Mario", tags: [], bot_paused_until: null };

function makeMessage(text: string, id = "msg-1") {
  return { from: FROM, id, text: { body: text } };
}

function makeValue(customerName = "Mario") {
  return { contacts: [{ profile: { name: customerName } }] };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Flusso E — Bot AI Conversazionale (handleTextMessage)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-16T19:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("restituisce 200 senza azioni se la location non è trovata", async () => {
    const supabase = makeSupabase({
      locations: makeChain({ data: null }),
    });

    const result = await handleTextMessage(
      supabase as any,
      makeMessage("ciao") as any,
      makeValue() as any,
      PHONE_NUMBER_ID,
    );

    // Il handler ritorna un NextResponse 200 quando la location manca
    expect(result).toBeTruthy();
    expect(tasks.trigger).not.toHaveBeenCalled();
    expect(sendWhatsAppText).not.toHaveBeenCalled();
  });

  it("cancella la prenotazione attiva quando il testo contiene 'annulla'", async () => {
    const activePendingBooking = { id: "booking-1" };
    const supabase = makeSupabase({
      locations: makeChain({ data: BASE_LOCATION }),
      customers: makeChain({ data: ACTIVE_CUSTOMER }),
      whatsapp_messages: makeChain({ data: null }),
      bookings: makeChain({ data: activePendingBooking }),
    });

    await handleTextMessage(
      supabase as any,
      makeMessage("vorrei annullare la prenotazione") as any,
      makeValue() as any,
      PHONE_NUMBER_ID,
    );

    // Deve inviare il messaggio di conferma annullamento
    expect(sendWhatsAppText).toHaveBeenCalledWith(
      FROM,
      expect.stringContaining("annullato"),
      PHONE_NUMBER_ID,
    );
    // Non deve dispatchare il task AI
    expect(tasks.trigger).not.toHaveBeenCalled();
  });

  it("risponde 'nessuna prenotazione' quando annulla ma non ci sono booking attivi", async () => {
    const supabase = makeSupabase({
      locations: makeChain({ data: BASE_LOCATION }),
      customers: makeChain({ data: ACTIVE_CUSTOMER }),
      whatsapp_messages: makeChain({ data: null }),
      bookings: makeChain({ data: null }), // nessuna prenotazione trovata
    });

    await handleTextMessage(
      supabase as any,
      makeMessage("annulla") as any,
      makeValue() as any,
      PHONE_NUMBER_ID,
    );

    expect(sendWhatsAppText).toHaveBeenCalledWith(
      FROM,
      expect.stringContaining("Non ho trovato prenotazioni"),
      PHONE_NUMBER_ID,
    );
    expect(tasks.trigger).not.toHaveBeenCalled();
  });

  it("ignora il messaggio se il bot è in pausa (intervento umano attivo)", async () => {
    // bot_paused_until nel futuro → bot in pausa
    const pausedCustomer = {
      ...ACTIVE_CUSTOMER,
      bot_paused_until: "2026-03-17T19:00:00.000Z", // domani
    };
    const supabase = makeSupabase({
      locations: makeChain({ data: BASE_LOCATION }),
      customers: makeChain({ data: pausedCustomer }),
      whatsapp_messages: makeChain({ data: null }),
    });

    const result = await handleTextMessage(
      supabase as any,
      makeMessage("ho una domanda") as any,
      makeValue() as any,
      PHONE_NUMBER_ID,
    );

    // Il handler ritorna un NextResponse 200 (ignora silenziosamente)
    expect(result).toBeTruthy();
    expect(tasks.trigger).not.toHaveBeenCalled();
    expect(sendWhatsAppText).not.toHaveBeenCalled();
  });

  it("dispatcha il task reply-to-message per un testo generico", async () => {
    const supabase = makeSupabase({
      locations: makeChain({ data: BASE_LOCATION }),
      customers: makeChain({ data: ACTIVE_CUSTOMER }),
      whatsapp_messages: makeChain({ data: null }),
    });

    await handleTextMessage(
      supabase as any,
      makeMessage("siete aperti domani?") as any,
      makeValue() as any,
      PHONE_NUMBER_ID,
    );

    expect(tasks.trigger).toHaveBeenCalledWith(
      "reply-to-message",
      expect.objectContaining({
        organizationId: BASE_LOCATION.organization_id,
        locationId: BASE_LOCATION.id,
        customerId: ACTIVE_CUSTOMER.id,
        customerPhone: FROM,
        metaPhoneId: PHONE_NUMBER_ID,
      }),
    );
  });
});
