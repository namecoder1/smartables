import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";

// ── Mocks ─────────────────────────────────────────────────────────────────────
//
// vi.mock() is hoisted to the top of the file by Vitest, so it runs before any
// imports. The factory functions must be self-contained (no outer-scope refs)
// unless you use vi.hoisted() for shared mock references.

vi.mock("@/lib/monitoring", () => ({
  captureError: vi.fn(),
  captureCritical: vi.fn(),
  captureWarning: vi.fn(),
}));

const mockDecryptConnectors = vi.fn();
vi.mock("@/lib/business-connectors", () => ({
  decryptConnectors: mockDecryptConnectors,
}));

const mockHandleReservation = vi.fn();
vi.mock("@/app/api/webhooks/thefork/_handlers/reservation", () => ({
  handleTheForkReservation: mockHandleReservation,
}));

const mockCreateAdminClient = vi.fn();
vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: mockCreateAdminClient,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = "super-secret-key-for-tests";
const CUSTOMER_ID = "rest_abc_123";

const LOCATION = {
  id: "loc_123",
  organization_id: "org_456",
  business_connectors: "encrypted_blob",
};

const BASE_BODY = {
  mealUuid: "meal-uuid-001",
  mealStatus: "RECORDED",
  mealDate: "2026-03-24T20:00:00.000Z",
  covers: 2,
};

/**
 * Build a valid HS256 JWT signed with the given secret.
 * Uses the same algorithm as verifyTheForkJwt in route.ts so we test the
 * real signature check without mocking the crypto module.
 */
function makeJwt(secret: string): string {
  const header  = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ iat: Math.floor(Date.now() / 1000) })).toString("base64url");
  const sig     = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

/**
 * Minimal Supabase admin client mock.
 * The route only uses: from("locations").select(...).eq(...).maybeSingle()
 */
function makeAdminSupabase(locationData: unknown) {
  const chain = {
    from:        vi.fn(),
    select:      vi.fn(),
    eq:          vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data: locationData }),
  };
  chain.from.mockReturnValue(chain);
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  return chain;
}

/** Build a POST request with arbitrary headers and body. */
function buildRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/webhooks/thefork", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/thefork", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleReservation.mockResolvedValue(undefined);
  });

  // ── Header validation ────────────────────────────────────────────────────

  describe("header validation", () => {
    it("returns 400 when Authorization header is absent", async () => {
      const { POST } = await import("@/app/api/webhooks/thefork/route");
      const req = buildRequest(BASE_BODY, { customerid: CUSTOMER_ID });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when Authorization does not start with 'Bearer '", async () => {
      const { POST } = await import("@/app/api/webhooks/thefork/route");
      const req = buildRequest(BASE_BODY, {
        authorization: "Basic dXNlcjpwYXNz",
        customerid: CUSTOMER_ID,
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when CustomerId header is absent", async () => {
      const { POST } = await import("@/app/api/webhooks/thefork/route");
      const req = buildRequest(BASE_BODY, {
        authorization: `Bearer ${makeJwt(WEBHOOK_SECRET)}`,
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  // ── Restaurant routing ───────────────────────────────────────────────────

  describe("restaurant routing", () => {
    it("returns 204 silently when CustomerId is unknown (not our client)", async () => {
      const supabase = makeAdminSupabase(null); // location not found
      mockCreateAdminClient.mockReturnValue(supabase);

      const { POST } = await import("@/app/api/webhooks/thefork/route");
      const req = buildRequest(BASE_BODY, {
        authorization: `Bearer ${makeJwt(WEBHOOK_SECRET)}`,
        customerid: "unknown_restaurant_id",
      });
      const res = await POST(req);

      // Silently accept to avoid TheFork retry storms
      expect(res.status).toBe(204);
      expect(mockHandleReservation).not.toHaveBeenCalled();
    });
  });

  // ── JWT verification ─────────────────────────────────────────────────────

  describe("JWT verification", () => {
    it("returns 500 when connector decryption throws", async () => {
      const supabase = makeAdminSupabase(LOCATION);
      mockCreateAdminClient.mockReturnValue(supabase);
      mockDecryptConnectors.mockImplementation(() => { throw new Error("AES-GCM failure"); });

      const { POST } = await import("@/app/api/webhooks/thefork/route");
      const req = buildRequest(BASE_BODY, {
        authorization: `Bearer ${makeJwt(WEBHOOK_SECRET)}`,
        customerid: CUSTOMER_ID,
      });
      const res = await POST(req);

      expect(res.status).toBe(500);
    });

    it("returns 401 when webhook secret is not configured for the location", async () => {
      // location exists but business_connectors is null → no secret can be recovered
      const supabase = makeAdminSupabase({ ...LOCATION, business_connectors: null });
      mockCreateAdminClient.mockReturnValue(supabase);

      const { POST } = await import("@/app/api/webhooks/thefork/route");
      const req = buildRequest(BASE_BODY, {
        authorization: `Bearer ${makeJwt(WEBHOOK_SECRET)}`,
        customerid: CUSTOMER_ID,
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
    });

    it("returns 401 when JWT is signed with the wrong secret", async () => {
      const supabase = makeAdminSupabase(LOCATION);
      mockCreateAdminClient.mockReturnValue(supabase);
      mockDecryptConnectors.mockReturnValue({ thefork_webhook_secret: WEBHOOK_SECRET });

      const { POST } = await import("@/app/api/webhooks/thefork/route");
      const req = buildRequest(BASE_BODY, {
        authorization: `Bearer ${makeJwt("completely-wrong-secret")}`,
        customerid: CUSTOMER_ID,
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
    });

    it("returns 401 when JWT does not have exactly three dot-separated parts", async () => {
      const supabase = makeAdminSupabase(LOCATION);
      mockCreateAdminClient.mockReturnValue(supabase);
      mockDecryptConnectors.mockReturnValue({ thefork_webhook_secret: WEBHOOK_SECRET });

      const { POST } = await import("@/app/api/webhooks/thefork/route");
      const req = buildRequest(BASE_BODY, {
        authorization: "Bearer not.a.valid.jwt.here",
        customerid: CUSTOMER_ID,
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
    });
  });

  // ── Happy path ───────────────────────────────────────────────────────────

  describe("happy path", () => {
    it("returns 204 and dispatches to handleTheForkReservation with correct args", async () => {
      const supabase = makeAdminSupabase(LOCATION);
      mockCreateAdminClient.mockReturnValue(supabase);
      mockDecryptConnectors.mockReturnValue({ thefork_webhook_secret: WEBHOOK_SECRET });

      const { POST } = await import("@/app/api/webhooks/thefork/route");
      const req = buildRequest(BASE_BODY, {
        authorization: `Bearer ${makeJwt(WEBHOOK_SECRET)}`,
        customerid: CUSTOMER_ID,
      });
      const res = await POST(req);

      expect(res.status).toBe(204);
      expect(mockHandleReservation).toHaveBeenCalledOnce();
      expect(mockHandleReservation).toHaveBeenCalledWith(
        supabase,
        LOCATION.id,
        LOCATION.organization_id,
        BASE_BODY,
      );
    });

    it("passes the same admin supabase instance to the handler (no new client per request)", async () => {
      const supabase = makeAdminSupabase(LOCATION);
      mockCreateAdminClient.mockReturnValue(supabase);
      mockDecryptConnectors.mockReturnValue({ thefork_webhook_secret: WEBHOOK_SECRET });

      const { POST } = await import("@/app/api/webhooks/thefork/route");
      const req = buildRequest(BASE_BODY, {
        authorization: `Bearer ${makeJwt(WEBHOOK_SECRET)}`,
        customerid: CUSTOMER_ID,
      });
      await POST(req);

      // createAdminClient must be called exactly once per request
      expect(mockCreateAdminClient).toHaveBeenCalledOnce();
    });
  });

  // ── Error handling ───────────────────────────────────────────────────────

  describe("error handling", () => {
    it("returns 500 when handler throws so TheFork will retry", async () => {
      const supabase = makeAdminSupabase(LOCATION);
      mockCreateAdminClient.mockReturnValue(supabase);
      mockDecryptConnectors.mockReturnValue({ thefork_webhook_secret: WEBHOOK_SECRET });
      mockHandleReservation.mockRejectedValue(new Error("DB connection lost"));

      const { POST } = await import("@/app/api/webhooks/thefork/route");
      const req = buildRequest(BASE_BODY, {
        authorization: `Bearer ${makeJwt(WEBHOOK_SECRET)}`,
        customerid: CUSTOMER_ID,
      });
      const res = await POST(req);

      // 500 is intentional: TheFork retries on any 5xx
      expect(res.status).toBe(500);
    });

    it("calls captureError with location context when handler throws", async () => {
      const supabase = makeAdminSupabase(LOCATION);
      mockCreateAdminClient.mockReturnValue(supabase);
      mockDecryptConnectors.mockReturnValue({ thefork_webhook_secret: WEBHOOK_SECRET });
      mockHandleReservation.mockRejectedValue(new Error("Unexpected failure"));

      const { POST } = await import("@/app/api/webhooks/thefork/route");
      const { captureError } = await import("@/lib/monitoring");

      const req = buildRequest(BASE_BODY, {
        authorization: `Bearer ${makeJwt(WEBHOOK_SECRET)}`,
        customerid: CUSTOMER_ID,
      });
      await POST(req);

      expect(vi.mocked(captureError)).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          flow: "thefork_reservation_handler",
          locationId: LOCATION.id,
          organizationId: LOCATION.organization_id,
        }),
      );
    });
  });
});
