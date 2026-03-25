import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock("@/lib/supabase-helpers", () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockAdminSupabase),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

let mockAdminSupabase: any;

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

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

// ── Tests: submitUserFeedback ─────────────────────────────────────────────────

describe("submitUserFeedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });

    const { submitUserFeedback } = await import("@/app/actions/user-feedback");
    const result = await submitUserFeedback(makeFormData({ type: "bug_report", title: "Test" }));

    expect(result).toEqual({ success: false, error: "Non autorizzato" });
  });

  it("returns fail when type is missing", async () => {
    const supabase = { from: vi.fn() };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { submitUserFeedback } = await import("@/app/actions/user-feedback");
    const result = await submitUserFeedback(makeFormData({ title: "Test" }));

    expect(result).toEqual({ success: false, error: "Tipo e titolo sono obbligatori" });
  });

  it("returns fail when title is blank", async () => {
    const supabase = { from: vi.fn() };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { submitUserFeedback } = await import("@/app/actions/user-feedback");
    const result = await submitUserFeedback(makeFormData({ type: "bug_report", title: "   " }));

    expect(result).toEqual({ success: false, error: "Tipo e titolo sono obbligatori" });
  });

  it("returns fail when type is invalid", async () => {
    const supabase = { from: vi.fn() };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { submitUserFeedback } = await import("@/app/actions/user-feedback");
    const result = await submitUserFeedback(makeFormData({ type: "invalid_type", title: "Test" }));

    expect(result).toEqual({ success: false, error: "Tipo non valido" });
  });

  it("inserts feedback and returns ok() on success", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({ insert: insertMock }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { submitUserFeedback } = await import("@/app/actions/user-feedback");
    const result = await submitUserFeedback(
      makeFormData({ type: "feature_request", title: "Add dark mode", description: "Please!" }),
    );

    expect(result).toEqual({ success: true });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organization_id: "org_123",
        profile_id: "user_123",
        type: "feature_request",
        title: "Add dark mode",
        description: "Please!",
      }),
    );
  });

  it("returns fail when DB insert fails", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { submitUserFeedback } = await import("@/app/actions/user-feedback");
    const result = await submitUserFeedback(
      makeFormData({ type: "general", title: "Test" }),
    );

    expect(result).toEqual({ success: false, error: "Errore nel salvataggio del feedback" });
  });

  it("accepts all valid feedback types", async () => {
    const validTypes = ["feature_request", "bug_report", "general", "praise"];

    for (const type of validTypes) {
      vi.clearAllMocks();
      const supabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
      mockRequireAuth.mockResolvedValue(makeAuth(supabase));

      const { submitUserFeedback } = await import("@/app/actions/user-feedback");
      const result = await submitUserFeedback(
        makeFormData({ type, title: "Test feedback" }),
      );

      expect(result.success).toBe(true);
    }
  });
});

// ── Tests: adminUpdateFeedback ─────────────────────────────────────────────────

describe("adminUpdateFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    };
  });

  it("updates feedback status and returns ok()", async () => {
    const { adminUpdateFeedback } = await import("@/app/actions/user-feedback");
    const result = await adminUpdateFeedback("fb_123", { status: "in_progress" });

    expect(result).toEqual({ success: true });
    const fromResult = mockAdminSupabase.from.mock.results[0].value;
    expect(fromResult.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "in_progress" }),
    );
  });

  it("sets admin_responded_at when admin_response is provided", async () => {
    const { adminUpdateFeedback } = await import("@/app/actions/user-feedback");
    await adminUpdateFeedback("fb_123", { admin_response: "Thanks for the feedback!" });

    const fromResult = mockAdminSupabase.from.mock.results[0].value;
    expect(fromResult.update).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_response: "Thanks for the feedback!",
        admin_responded_at: expect.any(String),
      }),
    );
  });

  it("sets admin_responded_at to null when admin_response is empty string", async () => {
    const { adminUpdateFeedback } = await import("@/app/actions/user-feedback");
    await adminUpdateFeedback("fb_123", { admin_response: "" });

    const fromResult = mockAdminSupabase.from.mock.results[0].value;
    expect(fromResult.update).toHaveBeenCalledWith(
      expect.objectContaining({ admin_responded_at: null }),
    );
  });

  it("returns fail when DB update fails", async () => {
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
        }),
      }),
    };

    const { adminUpdateFeedback } = await import("@/app/actions/user-feedback");
    const result = await adminUpdateFeedback("fb_123", { status: "done" });

    expect(result).toEqual({ success: false, error: "Errore nell'aggiornamento" });
  });
});

// ── Tests: adminDeleteFeedback ─────────────────────────────────────────────────

describe("adminDeleteFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    };
  });

  it("deletes feedback and returns ok()", async () => {
    const { adminDeleteFeedback } = await import("@/app/actions/user-feedback");
    const result = await adminDeleteFeedback("fb_123");

    expect(result).toEqual({ success: true });
    const fromResult = mockAdminSupabase.from.mock.results[0].value;
    expect(fromResult.delete).toHaveBeenCalled();
  });

  it("returns fail when DB delete fails", async () => {
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
        }),
      }),
    };

    const { adminDeleteFeedback } = await import("@/app/actions/user-feedback");
    const result = await adminDeleteFeedback("fb_123");

    expect(result).toEqual({ success: false, error: "Errore nell'eliminazione" });
  });
});
