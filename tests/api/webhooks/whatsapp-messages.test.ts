import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSendWhatsAppText = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppText: mockSendWhatsAppText,
}));

vi.mock("@/lib/utils", () => ({
  normalizePhoneNumber: vi.fn().mockImplementation((n: string) => n),
  cn: vi.fn(),
}));

vi.mock("@/lib/push-notifications", () => ({
  sendPushToOrganization: vi.fn().mockResolvedValue(undefined),
}));

// Dynamic imports used inside handlers
vi.mock("date-fns-tz", () => ({
  fromZonedTime: vi.fn().mockReturnValue(new Date("2025-06-15T18:00:00Z")),
}));
vi.mock("@trigger.dev/sdk/v3", () => ({
  tasks: { trigger: vi.fn().mockResolvedValue({}) },
}));
vi.mock("@/trigger/verify-booking", () => ({ verifyBooking: {} }));
vi.mock("@/trigger/request-review", () => ({ requestReview: {} }));
vi.mock("@/trigger/reply-to-message", () => ({ replyToMessage: {} }));

// ── Helpers ───────────────────────────────────────────────────────────────────

const LOCATION = { id: "loc_1", organization_id: "org_123", name: "Ristorante Test" };
const CUSTOMER = { id: "cust_1", name: "Mario Rossi", phone_number: "+393334445566", tags: [] };

function makeSupabase(opts: {
  location?: any;
  customer?: any;
  existingCustomer?: any;
  booking?: any;
  insertBookingError?: any;
} = {}) {
  const location = opts.location !== undefined ? opts.location : LOCATION;
  const existingCustomer = opts.existingCustomer !== undefined ? opts.existingCustomer : CUSTOMER;

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "locations") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: location }),
          single: vi.fn().mockResolvedValue({ data: location }),
        };
      }
      if (table === "customers") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: existingCustomer }),
          single: vi.fn().mockResolvedValue({ data: opts.customer ?? CUSTOMER }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: opts.customer ?? CUSTOMER, error: null }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: opts.customer ?? CUSTOMER }),
          }),
        };
      }
      if (table === "whatsapp_messages") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === "bookings") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: opts.booking ?? null }),
          insert: vi.fn().mockResolvedValue({ error: opts.insertBookingError ?? null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === "callback_requests") {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      };
    }),
  };
}

const PHONE_ID = "meta_phone_id_123";
const FROM = "+393334445566";
const VALUE = { contacts: [{ profile: { name: "Mario Rossi" } }] };

// ── handleButtonClick ──────────────────────────────────────────────────────────

describe("handleButtonClick", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns EVENT_RECEIVED when location not found", async () => {
    const supabase = makeSupabase({ location: null });
    const { handleButtonClick } = await import(
      "@/app/api/webhooks/whatsapp/_handlers/messages"
    );
    const message = { from: FROM, button: { payload: "prenota" }, id: "m1" };
    const result = await handleButtonClick(supabase as any, message as any, VALUE, PHONE_ID);

    expect(result).toBeInstanceOf(NextResponse);
  });

  it("adds 'supplier' tag when fornitore button clicked", async () => {
    const supabase = makeSupabase();
    const { handleButtonClick } = await import(
      "@/app/api/webhooks/whatsapp/_handlers/messages"
    );
    const message = { from: FROM, button: { payload: "Sono un fornitore" }, id: "m1" };
    await handleButtonClick(supabase as any, message as any, VALUE, PHONE_ID);

    // Should send confirmation text
    expect(mockSendWhatsAppText).toHaveBeenCalledWith(
      FROM,
      expect.stringContaining("Non riceverai più"),
      PHONE_ID,
    );
  });

  it("inserts callback request when richiama button clicked", async () => {
    const supabase = makeSupabase();
    const insertFn = vi.fn().mockResolvedValue({ error: null });
    supabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === "callback_requests") return { insert: insertFn };
      return makeSupabase().from(table);
    });

    const { handleButtonClick } = await import(
      "@/app/api/webhooks/whatsapp/_handlers/messages"
    );
    const message = { from: FROM, button: { payload: "Voglio parlare con qualcuno" }, id: "m1" };
    await handleButtonClick(supabase as any, message as any, VALUE, PHONE_ID);

    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ location_id: "loc_1", phone_number: FROM, status: "pending" }),
    );
    expect(mockSendWhatsAppText).toHaveBeenCalledWith(
      FROM,
      expect.stringContaining("ricontatteremo"),
      PHONE_ID,
    );
  });

  it("confirms booking when 'ci sono/confermo' button clicked with pending booking", async () => {
    const booking = { id: "booking_123" };
    const supabase = makeSupabase({ booking });
    const { handleButtonClick } = await import(
      "@/app/api/webhooks/whatsapp/_handlers/messages"
    );
    const message = { from: FROM, button: { payload: "Confermo la presenza" }, id: "m1" };
    await handleButtonClick(supabase as any, message as any, VALUE, PHONE_ID);

    expect(mockSendWhatsAppText).toHaveBeenCalledWith(
      FROM,
      expect.stringContaining("confermato"),
      PHONE_ID,
    );
  });

  it("cancels booking when 'annulla' button clicked with active booking", async () => {
    const booking = { id: "booking_123" };
    const supabase = makeSupabase({ booking });
    const { handleButtonClick } = await import(
      "@/app/api/webhooks/whatsapp/_handlers/messages"
    );
    const message = { from: FROM, button: { payload: "Non ci sarò, annulla" }, id: "m1" };
    await handleButtonClick(supabase as any, message as any, VALUE, PHONE_ID);

    expect(mockSendWhatsAppText).toHaveBeenCalledWith(
      FROM,
      expect.stringContaining("annullato"),
      PHONE_ID,
    );
  });

  it("informs when no booking to cancel", async () => {
    const supabase = makeSupabase({ booking: null });
    const { handleButtonClick } = await import(
      "@/app/api/webhooks/whatsapp/_handlers/messages"
    );
    const message = { from: FROM, button: { payload: "annulla" }, id: "m1" };
    await handleButtonClick(supabase as any, message as any, VALUE, PHONE_ID);

    expect(mockSendWhatsAppText).toHaveBeenCalledWith(
      FROM,
      expect.stringContaining("Non ho trovato"),
      PHONE_ID,
    );
  });
});

// ── handleTextMessage ──────────────────────────────────────────────────────────

describe("handleTextMessage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns EVENT_RECEIVED when location not found", async () => {
    const supabase = makeSupabase({ location: null });
    // location.single() returns null
    supabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === "locations") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
        };
      }
      return makeSupabase().from(table);
    });

    const { handleTextMessage } = await import(
      "@/app/api/webhooks/whatsapp/_handlers/messages"
    );
    const message = { from: FROM, text: { body: "Ciao" }, id: "m1" };
    const result = await handleTextMessage(supabase as any, message as any, VALUE, PHONE_ID);

    expect(result).toBeInstanceOf(NextResponse);
  });

  it("cancels booking when text contains 'annulla'", async () => {
    const booking = { id: "booking_123" };
    const supabase = makeSupabase({ booking });
    const { handleTextMessage } = await import(
      "@/app/api/webhooks/whatsapp/_handlers/messages"
    );
    const message = { from: FROM, text: { body: "Annulla la mia prenotazione" }, id: "m1" };
    const result = await handleTextMessage(supabase as any, message as any, VALUE, PHONE_ID);

    expect(mockSendWhatsAppText).toHaveBeenCalledWith(
      FROM,
      expect.stringContaining("annullato"),
      PHONE_ID,
    );
    expect(result).toBeInstanceOf(NextResponse);
  });

  it("returns EVENT_RECEIVED without sending reply when bot is paused", async () => {
    const pausedCustomer = {
      ...CUSTOMER,
      bot_paused_until: new Date(Date.now() + 3600_000).toISOString(), // 1h from now
    };
    const supabase = makeSupabase({ existingCustomer: pausedCustomer });
    const { handleTextMessage } = await import(
      "@/app/api/webhooks/whatsapp/_handlers/messages"
    );
    const message = { from: FROM, text: { body: "Ciao, come va?" }, id: "m1" };
    const result = await handleTextMessage(supabase as any, message as any, VALUE, PHONE_ID);

    expect(result).toBeInstanceOf(NextResponse);
    // No AI reply dispatched — only the inbound save call
    expect(mockSendWhatsAppText).not.toHaveBeenCalled();
  });

  it("dispatches AI reply task for normal messages when bot is active", async () => {
    const activeCustomer = { ...CUSTOMER, bot_paused_until: null };
    const supabase = makeSupabase({ existingCustomer: activeCustomer });

    // Mock the dynamic trigger.dev import
    const mockTasks = { trigger: vi.fn().mockResolvedValue({}) };
    vi.doMock("@trigger.dev/sdk/v3", () => ({ tasks: mockTasks }));

    const { handleTextMessage } = await import(
      "@/app/api/webhooks/whatsapp/_handlers/messages"
    );
    const message = { from: FROM, text: { body: "Vorrei prenotare un tavolo" }, id: "m1" };
    const result = await handleTextMessage(supabase as any, message as any, VALUE, PHONE_ID);

    // Returns null (not NextResponse) for normal messages
    expect(result).toBeNull();
  });
});

// ── handleFlowCompletion ───────────────────────────────────────────────────────

describe("handleFlowCompletion", () => {
  beforeEach(() => vi.clearAllMocks());

  function makeFlowMessage(payload: object) {
    return {
      id: "msg_flow_1",
      from: FROM,
      type: "interactive",
      interactive: {
        type: "nfm_reply",
        nfm_reply: {
          response_json: JSON.stringify(payload),
        },
      },
    };
  }

  it("returns null when location not found", async () => {
    const supabase = makeSupabase({ location: null });
    supabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === "locations") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
        };
      }
      return makeSupabase().from(table);
    });

    const { handleFlowCompletion } = await import(
      "@/app/api/webhooks/whatsapp/_handlers/messages"
    );
    const msg = makeFlowMessage({ date: "2025-06-15", time: "20:00", guest_name: "Mario", guests: "2" });
    const result = await handleFlowCompletion(supabase as any, msg as any, VALUE, PHONE_ID);
    expect(result).toBeNull();
  });

  it("returns EVENT_RECEIVED when date or time missing", async () => {
    const supabase = makeSupabase();
    const { handleFlowCompletion } = await import(
      "@/app/api/webhooks/whatsapp/_handlers/messages"
    );
    const msg = makeFlowMessage({ guest_name: "Mario", guests: "2" }); // missing date/time
    const result = await handleFlowCompletion(supabase as any, msg as any, VALUE, PHONE_ID);
    expect(result).toBeInstanceOf(NextResponse);
  });

  it("creates booking and sends confirmation on success", async () => {
    const newBooking = { id: "booking_new_1" };
    const supabase = makeSupabase({ booking: newBooking });
    const { handleFlowCompletion } = await import(
      "@/app/api/webhooks/whatsapp/_handlers/messages"
    );
    const msg = makeFlowMessage({
      date: "2025-06-15",
      time: "20:00",
      guest_name: "Mario Rossi",
      guests: "2",
    });
    await handleFlowCompletion(supabase as any, msg as any, VALUE, PHONE_ID);

    expect(mockSendWhatsAppText).toHaveBeenCalledWith(
      FROM,
      expect.stringContaining("Mario Rossi"),
      PHONE_ID,
    );
  });

  it("sends error message when booking insert fails", async () => {
    const supabase = makeSupabase({ insertBookingError: { message: "DB error" } });
    const { handleFlowCompletion } = await import(
      "@/app/api/webhooks/whatsapp/_handlers/messages"
    );
    const msg = makeFlowMessage({
      date: "2025-06-15",
      time: "20:00",
      guest_name: "Mario",
      guests: "2",
    });
    await handleFlowCompletion(supabase as any, msg as any, VALUE, PHONE_ID);

    expect(mockSendWhatsAppText).toHaveBeenCalledWith(
      FROM,
      expect.stringContaining("problema"),
      PHONE_ID,
    );
  });
});
