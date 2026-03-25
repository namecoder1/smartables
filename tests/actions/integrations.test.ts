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

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSupabase(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain.from as any).mockReturnValue(chain);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain.select as any).mockReturnValue(chain);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain.update as any).mockReturnValue(chain);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain.eq as any).mockReturnValue(chain);
  return chain;
}

function makeAuth(supabase: unknown) {
  return {
    success: true as const,
    supabase,
    user: { id: "user_123" },
    organizationId: "org_123",
    organization: { id: "org_123" },
    locations: [],
  };
}

const validCredentials = {
  restaurantId: "rest_abc",
  apiKey: "api_key_xyz",
  clientId: "client_id_123",
  clientSecret: "client_secret_456",
  webhookSecret: "webhook_secret_789",
};

// ── saveTheForkCredentials ────────────────────────────────────────────────────

describe("saveTheForkCredentials", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });

    const { saveTheForkCredentials } = await import("@/app/actions/integrations");
    const result = await saveTheForkCredentials("loc_123", validCredentials);

    expect(result).toEqual({ success: false, error: "Non autorizzato" });
  });

  it("saves credentials, encrypts them, and stores thefork_restaurant_id plain", async () => {
    const supabase = makeSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.single as any).mockResolvedValueOnce({ data: { business_connectors: null } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.update as any).mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { saveTheForkCredentials } = await import("@/app/actions/integrations");
    const result = await saveTheForkCredentials("loc_123", validCredentials);

    expect(result).toEqual({ success: true });
    expect(mockEncryptConnectors).toHaveBeenCalledWith(
      expect.objectContaining({
        thefork_restaurant_id: "rest_abc",
        thefork_api_key: "api_key_xyz",
        thefork_client_id: "client_id_123",
        thefork_client_secret: "client_secret_456",
        thefork_webhook_secret: "webhook_secret_789",
      }),
    );
  });

  it("merges with existing connectors before encrypting", async () => {
    const existing = { google_review_url: "https://g.page/review" };
    mockDecryptConnectors.mockReturnValue(existing);

    const supabase = makeSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.single as any).mockResolvedValueOnce({ data: { business_connectors: "existing_encrypted" } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.update as any).mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { saveTheForkCredentials } = await import("@/app/actions/integrations");
    await saveTheForkCredentials("loc_123", validCredentials);

    expect(mockDecryptConnectors).toHaveBeenCalledWith("existing_encrypted");
    expect(mockEncryptConnectors).toHaveBeenCalledWith(
      expect.objectContaining({
        google_review_url: "https://g.page/review",
        thefork_restaurant_id: "rest_abc",
      }),
    );
  });

  it("returns fail when DB update fails", async () => {
    const supabase = makeSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.single as any).mockResolvedValueOnce({ data: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.update as any).mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
    });
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { saveTheForkCredentials } = await import("@/app/actions/integrations");
    const result = await saveTheForkCredentials("loc_123", validCredentials);

    expect(result).toEqual({ success: false, error: "Impossibile salvare le credenziali TheFork" });
  });
});

// ── disconnectTheFork ─────────────────────────────────────────────────────────

describe("disconnectTheFork", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });

    const { disconnectTheFork } = await import("@/app/actions/integrations");
    const result = await disconnectTheFork("loc_123");

    expect(result).toEqual({ success: false, error: "Non autorizzato" });
  });

  it("strips all thefork_* keys from connectors and nullifies plain column", async () => {
    const existing = {
      google_review_url: "https://g.page/review",
      thefork_restaurant_id: "rest_abc",
      thefork_api_key: "key",
      thefork_client_id: "cid",
      thefork_client_secret: "csec",
      thefork_webhook_secret: "wsec",
      thefork_access_token: "token",
      thefork_token_expires_at: 9999999999,
      thefork_consumer_id: "cons_uuid",
    };
    mockDecryptConnectors.mockReturnValue(existing);

    const supabase = makeSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.single as any).mockResolvedValueOnce({ data: { business_connectors: "encrypted" } });
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.update as any).mockReturnValue({ eq: mockEq });
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { disconnectTheFork } = await import("@/app/actions/integrations");
    const result = await disconnectTheFork("loc_123");

    expect(result).toEqual({ success: true });
    // Only google_review_url should remain after stripping thefork_* keys
    expect(mockEncryptConnectors).toHaveBeenCalledWith(
      expect.objectContaining({ google_review_url: "https://g.page/review" }),
    );
    expect(mockEncryptConnectors).toHaveBeenCalledWith(
      expect.not.objectContaining({ thefork_restaurant_id: expect.anything() }),
    );
    // Plain column should be nullified
    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ thefork_restaurant_id: null }),
    );
  });

  it("returns fail when DB update fails", async () => {
    const supabase = makeSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.single as any).mockResolvedValueOnce({ data: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.update as any).mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
    });
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { disconnectTheFork } = await import("@/app/actions/integrations");
    const result = await disconnectTheFork("loc_123");

    expect(result).toEqual({ success: false, error: "Impossibile scollegare TheFork" });
  });
});

// ── verifyTheForkConnection ───────────────────────────────────────────────────

describe("verifyTheForkConnection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });

    const { verifyTheForkConnection } = await import("@/app/actions/integrations");
    const result = await verifyTheForkConnection("loc_123");

    expect(result).toEqual({ success: false, error: "Non autorizzato" });
  });

  it("returns fail when credentials are incomplete", async () => {
    mockDecryptConnectors.mockReturnValue({ thefork_api_key: "key" }); // missing client_id, client_secret, restaurant_id
    const supabase = makeSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.single as any).mockResolvedValueOnce({ data: { business_connectors: "encrypted" } });
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { verifyTheForkConnection } = await import("@/app/actions/integrations");
    const result = await verifyTheForkConnection("loc_123");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/incomplete|incompleto|Compila/i);
  });

  it("returns fail when TheFork OAuth returns non-ok", async () => {
    mockDecryptConnectors.mockReturnValue({
      thefork_client_id: "cid",
      thefork_client_secret: "csec",
      thefork_restaurant_id: "rest_abc",
    });
    const supabase = makeSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.single as any).mockResolvedValueOnce({ data: { business_connectors: "encrypted" } });
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fetch as any).mockResolvedValue({ ok: false });

    const { verifyTheForkConnection } = await import("@/app/actions/integrations");
    const result = await verifyTheForkConnection("loc_123");

    expect(result).toEqual({ success: false, error: "Credenziali TheFork non valide" });
  });

  it("returns okWith restaurantId and persists token on success", async () => {
    const connectors = {
      thefork_client_id: "cid",
      thefork_client_secret: "csec",
      thefork_restaurant_id: "rest_abc",
    };
    mockDecryptConnectors.mockReturnValue(connectors);

    const supabase = makeSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.single as any).mockResolvedValueOnce({ data: { business_connectors: "encrypted" } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.update as any).mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ access_token: "new_token_xyz", expires_in: 8600 }),
    });

    const { verifyTheForkConnection } = await import("@/app/actions/integrations");
    const result = await verifyTheForkConnection("loc_123");

    expect(result).toEqual({ success: true, data: { restaurantId: "rest_abc" } });
    // Token should be persisted
    expect(mockEncryptConnectors).toHaveBeenCalledWith(
      expect.objectContaining({
        thefork_access_token: "new_token_xyz",
        thefork_token_expires_at: expect.any(Number),
      }),
    );
  });
});
