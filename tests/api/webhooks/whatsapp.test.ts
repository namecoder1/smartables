import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockHandleStatusUpdates = vi.fn();
const mockHandleButtonClick = vi.fn();
const mockHandleFlowCompletion = vi.fn();
const mockHandleTextMessage = vi.fn();

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

vi.mock(
  "@/app/api/webhooks/whatsapp/_handlers/status",
  () => ({
    handleStatusUpdates: mockHandleStatusUpdates,
  }),
);

vi.mock(
  "@/app/api/webhooks/whatsapp/_handlers/messages",
  () => ({
    handleButtonClick: mockHandleButtonClick,
    handleFlowCompletion: mockHandleFlowCompletion,
    handleTextMessage: mockHandleTextMessage,
  }),
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGetRequest(params: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/webhooks/whatsapp");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString(), { method: "GET" });
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/whatsapp", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeWebhookPayload(messageType: string, extra: Record<string, unknown> = {}) {
  return {
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: "phone_123" },
              messages: [
                {
                  type: messageType,
                  from: "393401234567",
                  id: "wamid_123",
                  timestamp: "1700000000",
                  ...extra,
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/webhooks/whatsapp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("WHATSAPP_WEBHOOK_VERIFY_TOKEN", "my-secret-token");
  });

  it("returns challenge when mode=subscribe and token matches", async () => {
    const { GET } = await import("@/app/api/webhooks/whatsapp/route");
    const req = makeGetRequest({
      "hub.mode": "subscribe",
      "hub.verify_token": "my-secret-token",
      "hub.challenge": "12345",
    });

    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toBe("12345");
  });

  it("returns 403 when token does not match", async () => {
    const { GET } = await import("@/app/api/webhooks/whatsapp/route");
    const req = makeGetRequest({
      "hub.mode": "subscribe",
      "hub.verify_token": "wrong-token",
      "hub.challenge": "12345",
    });

    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it("returns 403 when mode is not subscribe", async () => {
    const { GET } = await import("@/app/api/webhooks/whatsapp/route");
    const req = makeGetRequest({
      "hub.mode": "unsubscribe",
      "hub.verify_token": "my-secret-token",
      "hub.challenge": "12345",
    });

    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it("returns 400 when query params are missing", async () => {
    const { GET } = await import("@/app/api/webhooks/whatsapp/route");
    const req = makeGetRequest({});

    const res = await GET(req);

    expect(res.status).toBe(400);
  });
});

describe("POST /api/webhooks/whatsapp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleStatusUpdates.mockResolvedValue(
      new Response("EVENT_RECEIVED", { status: 200 }),
    );
    mockHandleButtonClick.mockResolvedValue(null);
    mockHandleFlowCompletion.mockResolvedValue(null);
    mockHandleTextMessage.mockResolvedValue(null);
  });

  it("routes status updates to handleStatusUpdates", async () => {
    const { POST } = await import("@/app/api/webhooks/whatsapp/route");
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: "phone_123" },
                statuses: [{ id: "wamid_123", status: "delivered" }],
              },
            },
          ],
        },
      ],
    };

    const res = await POST(makePostRequest(payload));

    expect(mockHandleStatusUpdates).toHaveBeenCalledWith(
      expect.anything(),
      [{ id: "wamid_123", status: "delivered" }],
    );
  });

  it("routes button messages to handleButtonClick", async () => {
    const { POST } = await import("@/app/api/webhooks/whatsapp/route");

    const res = await POST(makePostRequest(makeWebhookPayload("button")));

    expect(mockHandleButtonClick).toHaveBeenCalled();
    expect(mockHandleTextMessage).not.toHaveBeenCalled();
  });

  it("routes text messages to handleTextMessage", async () => {
    const { POST } = await import("@/app/api/webhooks/whatsapp/route");

    const res = await POST(
      makePostRequest(makeWebhookPayload("text", { text: { body: "Ciao" } })),
    );

    expect(mockHandleTextMessage).toHaveBeenCalled();
    expect(mockHandleButtonClick).not.toHaveBeenCalled();
  });

  it("routes interactive nfm_reply to handleFlowCompletion", async () => {
    const { POST } = await import("@/app/api/webhooks/whatsapp/route");
    const payload = makeWebhookPayload("interactive", {
      interactive: { type: "nfm_reply", nfm_reply: { response_json: "{}" } },
    });

    const res = await POST(makePostRequest(payload));

    expect(mockHandleFlowCompletion).toHaveBeenCalled();
    expect(mockHandleButtonClick).not.toHaveBeenCalled();
  });

  it("does not route non-nfm interactive messages to flowCompletion", async () => {
    const { POST } = await import("@/app/api/webhooks/whatsapp/route");
    const payload = makeWebhookPayload("interactive", {
      interactive: { type: "button_reply", button_reply: { id: "btn1" } },
    });

    const res = await POST(makePostRequest(payload));

    expect(mockHandleFlowCompletion).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it("returns 200 for payload with no messages and no statuses", async () => {
    const { POST } = await import("@/app/api/webhooks/whatsapp/route");
    const payload = {
      entry: [{ changes: [{ value: { metadata: { phone_number_id: "p1" } } }] }],
    };

    const res = await POST(makePostRequest(payload));

    expect(res.status).toBe(200);
    expect(mockHandleTextMessage).not.toHaveBeenCalled();
  });

  it("returns 200 for empty entry array", async () => {
    const { POST } = await import("@/app/api/webhooks/whatsapp/route");

    const res = await POST(makePostRequest({ entry: [] }));

    expect(res.status).toBe(200);
  });

  it("returns 500 on unexpected error", async () => {
    const { POST } = await import("@/app/api/webhooks/whatsapp/route");

    // Pass a non-JSON body to force an error
    const req = new NextRequest("http://localhost/api/webhooks/whatsapp", {
      method: "POST",
      body: "not json {{{",
    });

    const res = await POST(req);

    expect(res.status).toBe(500);
  });
});

describe("handleStatusUpdates", () => {
  it("updates each message status in the database", async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const supabase = {
      from: vi.fn().mockReturnValue({ update: mockUpdate }),
    };

    const { handleStatusUpdates } = await vi.importActual<
      typeof import("@/app/api/webhooks/whatsapp/_handlers/status")
    >("@/app/api/webhooks/whatsapp/_handlers/status");
    const statuses = [
      { id: "wamid_1", status: "delivered" },
      { id: "wamid_2", status: "read" },
    ];

    const res = await handleStatusUpdates(supabase as any, statuses);

    expect(res.status).toBe(200);
    expect(supabase.from).toHaveBeenCalledTimes(2);
    expect(supabase.from).toHaveBeenCalledWith("whatsapp_messages");
    expect(mockEq).toHaveBeenCalledWith("meta_message_id", "wamid_1");
    expect(mockEq).toHaveBeenCalledWith("meta_message_id", "wamid_2");
  });

  it("includes error_message when errors are present", async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const supabase = {
      from: vi.fn().mockReturnValue({ update: mockUpdate }),
    };

    const { handleStatusUpdates } = await vi.importActual<
      typeof import("@/app/api/webhooks/whatsapp/_handlers/status")
    >("@/app/api/webhooks/whatsapp/_handlers/status");

    await handleStatusUpdates(supabase as any, [
      { id: "wamid_1", status: "failed", errors: [{ code: 131047 }] },
    ]);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        error_message: JSON.stringify([{ code: 131047 }]),
      }),
    );
  });

  it("sets error_message to null when no errors", async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const supabase = {
      from: vi.fn().mockReturnValue({ update: mockUpdate }),
    };

    const { handleStatusUpdates } = await vi.importActual<
      typeof import("@/app/api/webhooks/whatsapp/_handlers/status")
    >("@/app/api/webhooks/whatsapp/_handlers/status");

    await handleStatusUpdates(supabase as any, [
      { id: "wamid_1", status: "sent" },
    ]);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ error_message: null }),
    );
  });

  it("handles empty statuses array without calling DB", async () => {
    const supabase = { from: vi.fn() };

    const { handleStatusUpdates } = await vi.importActual<
      typeof import("@/app/api/webhooks/whatsapp/_handlers/status")
    >("@/app/api/webhooks/whatsapp/_handlers/status");

    const res = await handleStatusUpdates(supabase as any, []);

    expect(supabase.from).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});
