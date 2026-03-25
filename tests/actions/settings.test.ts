import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock("@/lib/supabase-helpers", () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockEncryptConnectors = vi.fn().mockReturnValue("encrypted_data");
const mockDecryptConnectors = vi.fn().mockReturnValue({});
vi.mock("@/lib/business-connectors", () => ({
  encryptConnectors: mockEncryptConnectors,
  decryptConnectors: mockDecryptConnectors,
}));

vi.mock("@/lib/whatsapp", () => ({
  updateBusinessProfile: vi.fn().mockResolvedValue(undefined),
  updateProfilePicture: vi.fn().mockResolvedValue(undefined),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSupabase(overrides: Record<string, any> = {}) {
  const chain: any = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  chain.from.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  return chain;
}

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

// ── Tests: saveGoogleReviewUrl ────────────────────────────────────────────────

describe("saveGoogleReviewUrl", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });

    const { saveGoogleReviewUrl } = await import("@/app/actions/settings");
    const result = await saveGoogleReviewUrl("loc_123", "https://g.page/review");

    expect(result).toEqual({ success: false, error: "Non autorizzato" });
  });

  it("saves URL and returns success", async () => {
    const supabase = makeSupabase();
    supabase.single
      .mockResolvedValueOnce({ data: { business_connectors: null } })  // select
      .mockResolvedValueOnce({ error: null });  // update (single may not be called)

    // update chain
    supabase.update.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { saveGoogleReviewUrl } = await import("@/app/actions/settings");
    const result = await saveGoogleReviewUrl("loc_123", "https://g.page/review");

    expect(result).toEqual({ success: true });
    expect(mockEncryptConnectors).toHaveBeenCalledWith(
      expect.objectContaining({ google_review_url: "https://g.page/review" }),
    );
  });

  it("decrypts existing connectors before merging", async () => {
    const existingDecrypted = { some_other_key: "value" };
    mockDecryptConnectors.mockReturnValue(existingDecrypted);

    const supabase = makeSupabase();
    supabase.single.mockResolvedValueOnce({
      data: { business_connectors: "existing_encrypted" },
    });
    supabase.update.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { saveGoogleReviewUrl } = await import("@/app/actions/settings");
    await saveGoogleReviewUrl("loc_123", "https://g.page/review");

    expect(mockDecryptConnectors).toHaveBeenCalledWith("existing_encrypted");
    expect(mockEncryptConnectors).toHaveBeenCalledWith(
      expect.objectContaining({
        some_other_key: "value",
        google_review_url: "https://g.page/review",
      }),
    );
  });

  it("returns fail when DB update fails", async () => {
    const supabase = makeSupabase();
    supabase.single.mockResolvedValueOnce({ data: null });
    supabase.update.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
    });

    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { saveGoogleReviewUrl } = await import("@/app/actions/settings");
    const result = await saveGoogleReviewUrl("loc_123", "https://g.page/review");

    expect(result).toEqual({ success: false, error: "Failed to save Google review URL" });
  });

  it("removes google_review_url when empty string is passed", async () => {
    const supabase = makeSupabase();
    supabase.single.mockResolvedValueOnce({ data: { business_connectors: null } });
    supabase.update.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { saveGoogleReviewUrl } = await import("@/app/actions/settings");
    await saveGoogleReviewUrl("loc_123", "");

    // encryptConnectors should be called with google_review_url: undefined
    expect(mockEncryptConnectors).toHaveBeenCalledWith(
      expect.objectContaining({ google_review_url: undefined }),
    );
  });
});

// ── Tests: updateLocation ─────────────────────────────────────────────────────

describe("updateLocation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });

    const { updateLocation } = await import("@/app/actions/settings");
    const result = await updateLocation("loc_123", { name: "Nuovo Nome" });

    expect(result).toEqual({ success: false, error: "Non autorizzato" });
  });

  it("updates location and returns success", async () => {
    const supabase = makeSupabase();
    supabase.single.mockResolvedValue({
      data: { id: "loc_123", meta_phone_id: null, branding: {} },
      error: null,
    });
    supabase.update.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "loc_123", meta_phone_id: null, branding: {} },
            error: null,
          }),
        }),
      }),
    });

    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateLocation } = await import("@/app/actions/settings");
    const result = await updateLocation("loc_123", { name: "Nuovo Nome" });

    expect(result.success).toBe(true);
  });

  it("returns fail when DB update fails", async () => {
    const supabase = makeSupabase();
    supabase.update.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "DB error" },
          }),
        }),
      }),
    });

    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateLocation } = await import("@/app/actions/settings");
    const result = await updateLocation("loc_123", { name: "Test" });

    expect(result).toEqual({ success: false, error: "Failed to update location" });
  });
});
