import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks (accessible inside vi.mock factories) ───────────────────────

const mockResendSend = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: {}, error: null }),
);
const mockAddNumberToWaba = vi.hoisted(() =>
  vi.fn().mockResolvedValue("meta_phone_id_123"),
);
const mockRequestVerificationCode = vi.hoisted(() =>
  vi.fn().mockResolvedValue(undefined),
);

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/lib/whatsapp-registration", () => ({
  addNumberToWaba: mockAddNumberToWaba,
  requestVerificationCode: mockRequestVerificationCode,
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockResendSend } };
  }),
}));

vi.mock("@react-email/components", () => ({
  render: vi.fn().mockResolvedValue("<html>email</html>"),
}));

vi.mock("@/emails/compliance-rejected", () => ({ default: vi.fn() }));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSupabase(overrides: Record<string, any> = {}) {
  const base = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    ...overrides,
  };
  // Chain methods back to base by default
  base.from.mockReturnValue(base);
  base.update.mockReturnValue(base);
  base.select.mockReturnValue(base);
  base.eq.mockReturnValue(base);
  return base;
}

// ── Tests: handleRequirementGroupStatusUpdated ────────────────────────────────

describe("handleRequirementGroupStatusUpdated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates location regulatory status and returns null on success", async () => {
    const supabase = makeSupabase();
    supabase.single.mockResolvedValue({
      data: { id: "loc_123", organization_id: "org_123" },
      error: null,
    });

    const { handleRequirementGroupStatusUpdated } = await import(
      "@/app/api/webhooks/telnyx/_handlers/compliance"
    );

    const result = await handleRequirementGroupStatusUpdated(supabase, {
      id: "req_group_123",
      status: "pending",
    });

    expect(result).toBeNull();
    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ regulatory_status: "pending" }),
    );
  });

  it("returns error response when DB update fails", async () => {
    const supabase = makeSupabase();
    supabase.single.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const { handleRequirementGroupStatusUpdated } = await import(
      "@/app/api/webhooks/telnyx/_handlers/compliance"
    );

    const result = await handleRequirementGroupStatusUpdated(supabase, {
      id: "req_group_123",
      status: "approved",
    });

    expect(result).not.toBeNull();
    expect((result as Response).status).toBe(500);
  });

  it("calls activateLocation when status is approved", async () => {
    const supabase = makeSupabase();
    supabase.single
      // requirement group update
      .mockResolvedValueOnce({
        data: { id: "loc_123", organization_id: "org_123" },
        error: null,
      })
      // activateLocation: location fetch
      .mockResolvedValueOnce({
        data: { telnyx_phone_number: "+39340123456", name: "Ristorante" },
        error: null,
      })
      // activateLocation: location update
      .mockResolvedValueOnce({ error: null });

    const { handleRequirementGroupStatusUpdated } = await import(
      "@/app/api/webhooks/telnyx/_handlers/compliance"
    );

    await handleRequirementGroupStatusUpdated(supabase, {
      id: "req_group_123",
      status: "approved",
    });

    expect(mockAddNumberToWaba).toHaveBeenCalledWith("39340123456", "Ristorante");
    expect(mockRequestVerificationCode).toHaveBeenCalledWith(
      "meta_phone_id_123",
      "VOICE",
    );
  });

  it("sends rejection email when status is rejected", async () => {
    const supabase = makeSupabase();
    supabase.single
      // requirement group update
      .mockResolvedValueOnce({
        data: { id: "loc_123", organization_id: "org_456" },
        error: null,
      })
      // sendComplianceRejectedEmail: org fetch
      .mockResolvedValueOnce({
        data: { name: "Ristorante", billing_email: "owner@test.it" },
      });

    const { handleRequirementGroupStatusUpdated } = await import(
      "@/app/api/webhooks/telnyx/_handlers/compliance"
    );

    await handleRequirementGroupStatusUpdated(supabase, {
      id: "req_group_123",
      status: "rejected",
      rejection_reason: "Invalid documents",
    });

    expect(mockResendSend).toHaveBeenCalled();
    const call = mockResendSend.mock.calls[0][0];
    expect(call.to).toBe("owner@test.it");
    expect(call.subject).toContain("rifiutata");
  });

  it("does not send email when org has no billing_email", async () => {
    const supabase = makeSupabase();
    supabase.single
      .mockResolvedValueOnce({
        data: { id: "loc_123", organization_id: "org_456" },
        error: null,
      })
      .mockResolvedValueOnce({ data: { name: "Ristorante", billing_email: null } });

    const { handleRequirementGroupStatusUpdated } = await import(
      "@/app/api/webhooks/telnyx/_handlers/compliance"
    );

    await handleRequirementGroupStatusUpdated(supabase, {
      id: "req_group_123",
      status: "rejected",
    });

    expect(mockResendSend).not.toHaveBeenCalled();
  });
});

// ── Tests: handleNumberOrderCompleted ─────────────────────────────────────────

describe("handleNumberOrderCompleted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates location with failure status and sends email on order failure", async () => {
    const supabase = makeSupabase();
    supabase.maybeSingle.mockResolvedValue({
      data: {
        id: "loc_123",
        telnyx_phone_number: "+39340123456",
        organization: { name: "Ristorante", billing_email: "owner@test.it" },
      },
    });

    const { handleNumberOrderCompleted } = await import(
      "@/app/api/webhooks/telnyx/_handlers/compliance"
    );

    await handleNumberOrderCompleted(supabase, {
      status: "failure",
      phone_numbers: [{ phone_number: "+39340123456", status: "rejected" }],
      errors: [{ detail: "Number unavailable" }],
    });

    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ regulatory_status: "rejected" }),
    );
    expect(mockResendSend).toHaveBeenCalled();
  });

  it("does not crash when failed order has no phone numbers", async () => {
    const supabase = makeSupabase();

    const { handleNumberOrderCompleted } = await import(
      "@/app/api/webhooks/telnyx/_handlers/compliance"
    );

    await expect(
      handleNumberOrderCompleted(supabase, {
        status: "failure",
        phone_numbers: [],
        errors: [],
      }),
    ).resolves.not.toThrow();
  });

  it("activates location for each active phone number on success", async () => {
    const supabase = makeSupabase();
    supabase.single
      // location lookup for activation
      .mockResolvedValueOnce({ data: { id: "loc_123" } })
      // activateLocation: location fetch
      .mockResolvedValueOnce({
        data: { telnyx_phone_number: "+39340123456", name: "Ristorante" },
        error: null,
      })
      // activateLocation: location update
      .mockResolvedValueOnce({ error: null });

    const { handleNumberOrderCompleted } = await import(
      "@/app/api/webhooks/telnyx/_handlers/compliance"
    );

    await handleNumberOrderCompleted(supabase, {
      status: "success",
      phone_numbers: [{ phone_number: "+39340123456", status: "active" }],
    });

    expect(mockAddNumberToWaba).toHaveBeenCalledWith("39340123456", "Ristorante");
    expect(mockRequestVerificationCode).toHaveBeenCalled();
  });

  it("skips non-active numbers during success processing", async () => {
    const supabase = makeSupabase();

    const { handleNumberOrderCompleted } = await import(
      "@/app/api/webhooks/telnyx/_handlers/compliance"
    );

    await handleNumberOrderCompleted(supabase, {
      status: "success",
      phone_numbers: [{ phone_number: "+39340123456", status: "ported_in" }],
    });

    expect(mockAddNumberToWaba).not.toHaveBeenCalled();
  });
});

// ── Tests: activateLocation ────────────────────────────────────────────────────

describe("activateLocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("strips + from phone number before calling addNumberToWaba", async () => {
    const supabase = makeSupabase();
    supabase.single
      .mockResolvedValueOnce({
        data: { telnyx_phone_number: "+39340123456", name: "Test" },
        error: null,
      })
      .mockResolvedValueOnce({ error: null });

    const { activateLocation } = await import(
      "@/app/api/webhooks/telnyx/_handlers/compliance"
    );

    await activateLocation("loc_123", supabase);

    expect(mockAddNumberToWaba).toHaveBeenCalledWith("39340123456", "Test");
  });

  it("updates location with meta_phone_id and pending_verification status", async () => {
    const supabase = makeSupabase();
    supabase.single
      .mockResolvedValueOnce({
        data: { telnyx_phone_number: "+39340123456", name: "Test" },
        error: null,
      })
      .mockResolvedValueOnce({ error: null });

    mockAddNumberToWaba.mockResolvedValue("meta_phone_999");

    const { activateLocation } = await import(
      "@/app/api/webhooks/telnyx/_handlers/compliance"
    );

    await activateLocation("loc_123", supabase);

    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        activation_status: "pending_verification",
        meta_phone_id: "meta_phone_999",
      }),
    );
  });

  it("returns early when location has no phone number", async () => {
    const supabase = makeSupabase();
    supabase.single.mockResolvedValueOnce({
      data: { telnyx_phone_number: null, name: "Test" },
      error: null,
    });

    const { activateLocation } = await import(
      "@/app/api/webhooks/telnyx/_handlers/compliance"
    );

    await activateLocation("loc_123", supabase);

    expect(mockAddNumberToWaba).not.toHaveBeenCalled();
  });

  it("returns early when location fetch fails", async () => {
    const supabase = makeSupabase();
    supabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: "Not found" },
    });

    const { activateLocation } = await import(
      "@/app/api/webhooks/telnyx/_handlers/compliance"
    );

    await activateLocation("loc_999", supabase);

    expect(mockAddNumberToWaba).not.toHaveBeenCalled();
  });
});
