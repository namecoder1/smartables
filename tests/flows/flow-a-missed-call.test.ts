/**
 * Flusso A — Missed Call Recovery
 *
 * Testa `handleCallInitiated`: il handler che intercetta le chiamate Telnyx
 * e decide se/come inviare un template WhatsApp al chiamante.
 *
 * Scenari coperti:
 *  1. Location non trovata → hangup, nessun WA
 *  2. Chiamante anonimo → hangup, nessun WA
 *  3. Rate limit attivo (messaggio nelle ultime 24h) → hangup, nessun WA
 *  4. Fornitore (tag "supplier") → hangup, nessun WA
 *  5. Ristorante chiuso (nessun orario configurato) → template missed_call_closed
 *  6. Chiusura straordinaria attiva → template missed_call_closed
 *  7. Ristorante aperto → template missed_call_open
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: { json: vi.fn((data) => ({ _json: data })) },
}));

vi.mock("@/lib/utils", () => ({
  normalizePhoneNumber: vi.fn((n: string) => n),
}));

vi.mock("@/lib/telnyx", () => ({
  hangupCall: vi.fn().mockResolvedValue(undefined),
  answerCall: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue({ messages: [{ id: "wa-1" }] }),
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
  checkWhatsAppLimitNotification: vi.fn(),
}));

import { handleCallInitiated } from "@/app/api/webhooks/telnyx/_handlers/call";
import { hangupCall, answerCall } from "@/lib/telnyx";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { makeChain, makeSupabase } from "./helpers";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PAYLOAD = {
  call_control_id: "ctrl-1",
  to: "+390212345678",
  from: "+393331112233",
};

const BASE_LOCATION = {
  id: "loc-1",
  organization_id: "org-1",
  meta_phone_id: "meta-phone-1",
  opening_hours: null, // closed by default
  is_test_completed: true,
  name: "Pizzeria Mario",
};

const EXISTING_CUSTOMER = { id: "cust-1", tags: [] };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Flusso A — Missed Call Recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Monday 2026-03-16 at 20:00 Rome (19:00 UTC)
    vi.setSystemTime(new Date("2026-03-16T19:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fa hangup e non invia WA se la location non esiste", async () => {
    const supabase = makeSupabase({
      locations: makeChain({ data: null, error: { message: "Not found" } }),
    });

    await handleCallInitiated(supabase as any, PAYLOAD);

    expect(hangupCall).toHaveBeenCalledWith(PAYLOAD.call_control_id);
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it("fa hangup per chiamante anonimo (from vuoto)", async () => {
    const supabase = makeSupabase({
      locations: makeChain({ data: BASE_LOCATION }),
    });

    await handleCallInitiated(supabase as any, { ...PAYLOAD, from: "" });

    expect(hangupCall).toHaveBeenCalledWith(PAYLOAD.call_control_id);
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it("fa hangup se il numero è in rate limit (messaggio nelle ultime 24h)", async () => {
    const supabase = makeSupabase({
      locations: makeChain({ data: BASE_LOCATION }),
      customers: makeChain({ data: EXISTING_CUSTOMER }),
      // La select su whatsapp_messages trova un messaggio recente → rate limit
      whatsapp_messages: makeChain({ data: { id: "msg-recent" } }),
    });

    await handleCallInitiated(supabase as any, PAYLOAD);

    expect(hangupCall).toHaveBeenCalledWith(PAYLOAD.call_control_id);
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it("fa hangup per fornitori (tag 'supplier')", async () => {
    const supabase = makeSupabase({
      locations: makeChain({ data: BASE_LOCATION }),
      customers: makeChain({ data: { id: "cust-1", tags: ["supplier"] } }),
      whatsapp_messages: makeChain({ data: null }), // nessun rate limit
    });

    await handleCallInitiated(supabase as any, PAYLOAD);

    expect(hangupCall).toHaveBeenCalledWith(PAYLOAD.call_control_id);
    expect(sendWhatsAppMessage).not.toHaveBeenCalled();
  });

  it("invia missed_call_closed quando il ristorante ha opening_hours: null", async () => {
    // BASE_LOCATION ha opening_hours: null → chiuso
    const supabase = makeSupabase({
      locations: makeChain({ data: BASE_LOCATION }),
      customers: makeChain({ data: EXISTING_CUSTOMER }),
      whatsapp_messages: makeChain({ data: null }),
      special_closures: makeChain({ data: null }),
    });

    await handleCallInitiated(supabase as any, PAYLOAD);

    expect(answerCall).toHaveBeenCalledWith(PAYLOAD.call_control_id);
    expect(sendWhatsAppMessage).toHaveBeenCalledWith(
      PAYLOAD.from,
      expect.objectContaining({ name: "missed_call_closed" }),
      BASE_LOCATION.meta_phone_id,
    );
  });

  it("invia missed_call_closed con chiusura straordinaria attiva (anche se orario ok)", async () => {
    // Orari aperto per lunedì, ma c'è una chiusura straordinaria → deve risultare chiuso
    const locationOpen = {
      ...BASE_LOCATION,
      opening_hours: { lunedì: [{ open: "18:00", close: "23:00" }] },
    };
    const supabase = makeSupabase({
      locations: makeChain({ data: locationOpen }),
      customers: makeChain({ data: EXISTING_CUSTOMER }),
      whatsapp_messages: makeChain({ data: null }),
      special_closures: makeChain({ data: { reason: "Chiuso per ferie" } }),
    });

    await handleCallInitiated(supabase as any, PAYLOAD);

    expect(sendWhatsAppMessage).toHaveBeenCalledWith(
      PAYLOAD.from,
      expect.objectContaining({ name: "missed_call_closed" }),
      BASE_LOCATION.meta_phone_id,
    );
  });

  it("invia missed_call_open quando il ristorante è aperto (lunedì 20:00)", async () => {
    // Fake time: lunedì 2026-03-16 20:00 Rome → slot 18:00-23:00 attivo
    const locationOpen = {
      ...BASE_LOCATION,
      opening_hours: { lunedì: [{ open: "18:00", close: "23:00" }] },
    };
    const supabase = makeSupabase({
      locations: makeChain({ data: locationOpen }),
      customers: makeChain({ data: EXISTING_CUSTOMER }),
      whatsapp_messages: makeChain({ data: null }),
      special_closures: makeChain({ data: null }),
    });

    await handleCallInitiated(supabase as any, PAYLOAD);

    expect(answerCall).toHaveBeenCalledWith(PAYLOAD.call_control_id);
    expect(sendWhatsAppMessage).toHaveBeenCalledWith(
      PAYLOAD.from,
      expect.objectContaining({ name: "missed_call_open" }),
      BASE_LOCATION.meta_phone_id,
    );
  });

  it("crea un nuovo cliente e invia WA se il numero non è in rubrica", async () => {
    const supabase = makeSupabase({
      locations: makeChain({ data: BASE_LOCATION }),
      // Primo from("customers") → maybySingle: nessun cliente esistente
      customers: {
        ...makeChain({ data: null }),
        // insert → restituisce il nuovo cliente
        insert: vi.fn(() => ({
          ...makeChain({ data: { id: "cust-new", tags: [] } }),
          then: (r: any) => Promise.resolve({ data: { id: "cust-new", tags: [] }, error: null }).then(r),
        })),
      },
      whatsapp_messages: makeChain({ data: null }),
      special_closures: makeChain({ data: null }),
    });

    await handleCallInitiated(supabase as any, PAYLOAD);

    // Deve comunque inviare il template (closed, perché opening_hours: null)
    expect(sendWhatsAppMessage).toHaveBeenCalled();
  });
});
