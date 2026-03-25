import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock("@/lib/supabase-helpers", () => ({ requireAuth: mockRequireAuth }));

const mockSendWhatsAppText = vi.fn();
vi.mock("@/lib/whatsapp", () => ({
  sendWhatsAppText: mockSendWhatsAppText,
}));

let mockClientSupabase: any;
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => mockClientSupabase),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAuth(supabase: any) {
  return {
    success: true as const,
    supabase,
    user: { id: "user_123" },
    organizationId: "org_123",
    organization: { id: "org_123" },
    locations: [],
  };
}

// ── getInboxCustomers ──────────────────────────────────────────────────────────

describe("getInboxCustomers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns formatted customers with latest messages", async () => {
    const customers = [
      {
        id: "c1",
        name: "Mario",
        whatsapp_messages: [
          { created_at: "2025-06-10T10:00:00Z", content: "Ciao", direction: "inbound", status: "delivered" },
        ],
      },
      {
        id: "c2",
        name: "Luigi",
        whatsapp_messages: [], // no messages → filtered out
      },
    ];
    mockClientSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: customers, error: null }),
      }),
    };

    const { getInboxCustomers } = await import("@/app/(private)/(site)/inbox/actions");
    const result = await getInboxCustomers("org_123");

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data![0].id).toBe("c1");
    expect(result.data![0].latestMessage).toBeDefined();
  });

  it("sorts customers by latest message date descending", async () => {
    const customers = [
      {
        id: "c1",
        name: "Mario",
        whatsapp_messages: [{ created_at: "2025-06-01T10:00:00Z", direction: "inbound" }],
      },
      {
        id: "c2",
        name: "Luigi",
        whatsapp_messages: [{ created_at: "2025-06-10T10:00:00Z", direction: "inbound" }],
      },
    ];
    mockClientSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: customers, error: null }),
      }),
    };

    const { getInboxCustomers } = await import("@/app/(private)/(site)/inbox/actions");
    const result = await getInboxCustomers("org_123");

    expect(result.success).toBe(true);
    // c2 (Jun 10) should be first
    expect(result.data![0].id).toBe("c2");
    expect(result.data![1].id).toBe("c1");
  });

  it("returns error on DB failure", async () => {
    mockClientSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
      }),
    };

    const { getInboxCustomers } = await import("@/app/(private)/(site)/inbox/actions");
    const result = await getInboxCustomers("org_123");

    expect(result.success).toBe(false);
  });
});

// ── getCustomerMessages ────────────────────────────────────────────────────────

describe("getCustomerMessages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns messages ordered by created_at ascending", async () => {
    const messages = [
      { id: "m1", content: "Hello", direction: "inbound" },
      { id: "m2", content: "Hi there", direction: "outbound" },
    ];
    mockClientSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: messages, error: null }),
      }),
    };

    const { getCustomerMessages } = await import("@/app/(private)/(site)/inbox/actions");
    const result = await getCustomerMessages("c1");

    expect(result.success).toBe(true);
    expect(result.data).toEqual(messages);
  });

  it("returns error on DB failure", async () => {
    mockClientSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "err" } }),
      }),
    };

    const { getCustomerMessages } = await import("@/app/(private)/(site)/inbox/actions");
    const result = await getCustomerMessages("c1");

    expect(result.success).toBe(false);
  });
});

// ── sendHumanMessage ───────────────────────────────────────────────────────────

describe("sendHumanMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendWhatsAppText.mockResolvedValue({ messages: [{ id: "wa_msg_123" }] });
  });

  it("returns error when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Unauthorized" });
    const { sendHumanMessage } = await import("@/app/(private)/(site)/inbox/actions");
    const result = await sendHumanMessage("c1", "Hello");
    expect(result.success).toBe(false);
  });

  it("returns error when customer not found", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { sendHumanMessage } = await import("@/app/(private)/(site)/inbox/actions");
    const result = await sendHumanMessage("missing_customer", "Hello");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Customer not found");
  });

  it("returns error when no inbound message location found", async () => {
    let callCount = 0;
    const supabase = {
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // customers lookup
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { phone_number: "+39123", organization_id: "org_123" },
            }),
          };
        }
        // whatsapp_messages lookup for location
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
        };
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { sendHumanMessage } = await import("@/app/(private)/(site)/inbox/actions");
    const result = await sendHumanMessage("c1", "Hello");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Nessuna location trovata");
  });

  it("returns error when location has no meta_phone_id", async () => {
    let callCount = 0;
    const supabase = {
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { phone_number: "+39123", organization_id: "org_123" },
            }),
          };
        }
        if (callCount === 2) {
          // last inbound message
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { location_id: "loc_1" } }),
          };
        }
        // location lookup
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { meta_phone_id: null } }),
        };
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { sendHumanMessage } = await import("@/app/(private)/(site)/inbox/actions");
    const result = await sendHumanMessage("c1", "Hello");

    expect(result.success).toBe(false);
    expect(result.error).toContain("numero WhatsApp");
  });

  it("sends message via WhatsApp and saves to DB", async () => {
    let callCount = 0;
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // customer lookup
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { phone_number: "+39123456789", organization_id: "org_123" },
            }),
          };
        }
        if (callCount === 2) {
          // last inbound message
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { location_id: "loc_1" } }),
          };
        }
        if (callCount === 3) {
          // location
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { meta_phone_id: "phone_id_999" } }),
          };
        }
        // DB insert
        return { insert: insertMock };
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { sendHumanMessage } = await import("@/app/(private)/(site)/inbox/actions");
    const result = await sendHumanMessage("c1", "Ciao, come posso aiutarti?");

    expect(result.success).toBe(true);
    expect(mockSendWhatsAppText).toHaveBeenCalledWith(
      "+39123456789",
      "Ciao, come posso aiutarti?",
      "phone_id_999",
    );
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        direction: "outbound_human",
        status: "sent",
        content: { type: "text", text: "Ciao, come posso aiutarti?" },
      }),
    );
  });

  it("returns error when WhatsApp send fails", async () => {
    mockSendWhatsAppText.mockRejectedValue(new Error("WA API down"));

    let callCount = 0;
    const supabase = {
      from: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { phone_number: "+39123", organization_id: "org_123" },
            }),
          };
        }
        if (callCount === 2) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { location_id: "loc_1" } }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { meta_phone_id: "phone_id_999" } }),
        };
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { sendHumanMessage } = await import("@/app/(private)/(site)/inbox/actions");
    const result = await sendHumanMessage("c1", "Ciao");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invio WhatsApp fallito");
  });
});

// ── setCustomerBotHandoff ──────────────────────────────────────────────────────

describe("setCustomerBotHandoff", () => {
  beforeEach(() => vi.clearAllMocks());

  it("pauses the bot for 24 hours by default", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: updateEq });
    mockClientSupabase = {
      from: vi.fn().mockReturnValue({ update: updateFn }),
    };

    const { setCustomerBotHandoff } = await import("@/app/(private)/(site)/inbox/actions");
    const result = await setCustomerBotHandoff("c1");

    expect(result.success).toBe(true);
    expect(result.pausedUntil).toBeDefined();
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ bot_paused_until: expect.any(String) }),
    );
  });

  it("reactivates the bot when pauseHours is 0", async () => {
    const updateFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    mockClientSupabase = {
      from: vi.fn().mockReturnValue({ update: updateFn }),
    };

    const { setCustomerBotHandoff } = await import("@/app/(private)/(site)/inbox/actions");
    const result = await setCustomerBotHandoff("c1", 0);

    expect(result.success).toBe(true);
    expect(result.pausedUntil).toBeNull();
    expect(updateFn).toHaveBeenCalledWith({ bot_paused_until: null });
  });

  it("returns error on DB failure", async () => {
    mockClientSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
        }),
      }),
    };

    const { setCustomerBotHandoff } = await import("@/app/(private)/(site)/inbox/actions");
    const result = await setCustomerBotHandoff("c1", 24);

    expect(result.success).toBe(false);
  });
});
