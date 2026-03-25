import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock("@/lib/supabase-helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockEncryptConnectors = vi.fn().mockReturnValue("encrypted_data");
const mockDecryptConnectors = vi.fn().mockReturnValue({});
vi.mock("@/lib/business-connectors", () => ({
  encryptConnectors: mockEncryptConnectors,
  decryptConnectors: mockDecryptConnectors,
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

// ── saveGoogleCalendar ─────────────────────────────────────────────────────────

describe("saveGoogleCalendar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { saveGoogleCalendar } = await import("@/app/actions/google-calendar");
    expect((await saveGoogleCalendar("loc_1", "cal_id", "My Cal")).success).toBe(false);
  });

  it("encrypts and saves calendar credentials", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { business_connectors: null } }),
        update: vi.fn().mockReturnValue({ eq: updateEq }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { saveGoogleCalendar } = await import("@/app/actions/google-calendar");
    const result = await saveGoogleCalendar("loc_1", "my_cal_id", "Ristorante Calendar");

    expect(result).toEqual({ success: true });
    expect(mockEncryptConnectors).toHaveBeenCalledWith(
      expect.objectContaining({
        google_calendar_id: "my_cal_id",
        google_calendar_name: "Ristorante Calendar",
      }),
    );
  });

  it("merges with existing connector data", async () => {
    const existingData = { google_review_url: "https://g.page/review" };
    mockDecryptConnectors.mockReturnValue(existingData);

    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { business_connectors: "existing_encrypted" } }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { saveGoogleCalendar } = await import("@/app/actions/google-calendar");
    await saveGoogleCalendar("loc_1", "cal_id", "Cal");

    expect(mockDecryptConnectors).toHaveBeenCalledWith("existing_encrypted");
    expect(mockEncryptConnectors).toHaveBeenCalledWith(
      expect.objectContaining({
        google_review_url: "https://g.page/review",
        google_calendar_id: "cal_id",
      }),
    );
  });

  it("returns fail when DB update fails", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: "err" } }) }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { saveGoogleCalendar } = await import("@/app/actions/google-calendar");
    const result = await saveGoogleCalendar("loc_1", "cal_id", "Cal");

    expect(result.success).toBe(false);
    expect(result.error).toContain("salvare il calendario");
  });
});

// ── disconnectGoogleCalendar ───────────────────────────────────────────────────

describe("disconnectGoogleCalendar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { disconnectGoogleCalendar } = await import("@/app/actions/google-calendar");
    expect((await disconnectGoogleCalendar("loc_1")).success).toBe(false);
  });

  it("removes all google calendar keys from connectors", async () => {
    const existingData = {
      google_review_url: "https://g.page/review",
      google_calendar_id: "old_cal_id",
      google_calendar_name: "Old Cal",
      google_calendar_access_token: "token_123",
    };
    mockDecryptConnectors.mockReturnValue(existingData);

    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { business_connectors: "encrypted" } }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { disconnectGoogleCalendar } = await import("@/app/actions/google-calendar");
    const result = await disconnectGoogleCalendar("loc_1");

    expect(result).toEqual({ success: true });
    // google calendar keys should be undefined in the encrypted object
    expect(mockEncryptConnectors).toHaveBeenCalledWith(
      expect.objectContaining({
        google_review_url: "https://g.page/review",
        google_calendar_id: undefined,
        google_calendar_name: undefined,
        google_calendar_access_token: undefined,
      }),
    );
  });

  it("succeeds even when no existing connectors", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { business_connectors: null } }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { disconnectGoogleCalendar } = await import("@/app/actions/google-calendar");
    const result = await disconnectGoogleCalendar("loc_1");

    expect(result).toEqual({ success: true });
  });
});

// ── moveBooking ────────────────────────────────────────────────────────────────

describe("moveBooking", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { moveBooking } = await import("@/app/actions/google-calendar");
    expect((await moveBooking("b_1", new Date())).success).toBe(false);
  });

  it("updates booking_time and returns ok", async () => {
    const newTime = new Date("2025-06-15T20:00:00Z");
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: updateEq });
    const supabase = { from: vi.fn().mockReturnValue({ update: updateFn }) };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { moveBooking } = await import("@/app/actions/google-calendar");
    const result = await moveBooking("b_1", newTime);

    expect(result).toEqual({ success: true });
    expect(updateFn).toHaveBeenCalledWith({ booking_time: newTime.toISOString() });
    expect(updateEq).toHaveBeenCalledWith("id", "b_1");
  });

  it("returns fail when DB update fails", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: "err" } }) }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { moveBooking } = await import("@/app/actions/google-calendar");
    const result = await moveBooking("b_1", new Date());

    expect(result.success).toBe(false);
    expect(result.error).toContain("spostare la prenotazione");
  });
});

// ── linkGoogleEvent ────────────────────────────────────────────────────────────

describe("linkGoogleEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { linkGoogleEvent } = await import("@/app/actions/google-calendar");
    expect((await linkGoogleEvent("b_1", "evt_1")).success).toBe(false);
  });

  it("sets google_event_id on booking and returns ok", async () => {
    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const supabase = { from: vi.fn().mockReturnValue({ update: updateFn }) };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { linkGoogleEvent } = await import("@/app/actions/google-calendar");
    const result = await linkGoogleEvent("b_1", "google_event_123");

    expect(result).toEqual({ success: true });
    expect(updateFn).toHaveBeenCalledWith({ google_event_id: "google_event_123" });
  });

  it("returns fail when DB update fails", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: "err" } }) }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { linkGoogleEvent } = await import("@/app/actions/google-calendar");
    const result = await linkGoogleEvent("b_1", "evt_1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("collegare l'evento");
  });
});

// ── unlinkGoogleEvent ──────────────────────────────────────────────────────────

describe("unlinkGoogleEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { unlinkGoogleEvent } = await import("@/app/actions/google-calendar");
    expect((await unlinkGoogleEvent("b_1")).success).toBe(false);
  });

  it("sets google_event_id to null and returns ok", async () => {
    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const supabase = { from: vi.fn().mockReturnValue({ update: updateFn }) };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { unlinkGoogleEvent } = await import("@/app/actions/google-calendar");
    const result = await unlinkGoogleEvent("b_1");

    expect(result).toEqual({ success: true });
    expect(updateFn).toHaveBeenCalledWith({ google_event_id: null });
  });

  it("returns fail when DB update fails", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: "err" } }) }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { unlinkGoogleEvent } = await import("@/app/actions/google-calendar");
    const result = await unlinkGoogleEvent("b_1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("scollegare l'evento");
  });
});
