import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const mockResendSend = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: {}, error: null }),
);

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock("@/lib/supabase-helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@react-email/components", () => ({ render: vi.fn().mockResolvedValue("<html>invite</html>") }));
vi.mock("@/emails/invite", () => ({ default: vi.fn() }));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockResendSend } };
  }),
}));

const mockCheckResourceAvailability = vi.fn();
vi.mock("@/lib/limiter", () => ({ checkResourceAvailability: mockCheckResourceAvailability }));

let mockAdminSupabase: any;
vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockAdminSupabase),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAuth(supabase: any, orgId = "org_123") {
  return {
    success: true as const,
    supabase,
    user: { id: "user_123", email: "admin@test.it" },
    organizationId: orgId,
    organization: { id: orgId, name: "Ristorante Test" },
    locations: [],
  };
}

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

// ── inviteCollaborator ─────────────────────────────────────────────────────────

describe("inviteCollaborator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckResourceAvailability.mockResolvedValue({ allowed: true, remaining: 5 });

    mockAdminSupabase = {
      auth: {
        admin: {
          generateLink: vi.fn().mockResolvedValue({
            data: {
              user: { id: "new_user_id", email: "staff@test.it" },
              properties: { action_link: "https://app.smartables.it/accept-invite?token=abc" },
            },
            error: null,
          }),
        },
      },
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }),
    };
  });

  it("returns error when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { inviteCollaborator } = await import(
      "@/app/(private)/(org)/collaborators-management/actions"
    );
    const result = await inviteCollaborator(null, makeFormData({ email: "staff@test.it", role: "staff" }));
    expect(result.error).toBe("Non autorizzato");
  });

  it("returns error when staff limit is reached", async () => {
    mockCheckResourceAvailability.mockResolvedValue({ allowed: false });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { full_name: "Admin" } }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { inviteCollaborator } = await import(
      "@/app/(private)/(org)/collaborators-management/actions"
    );
    const result = await inviteCollaborator(null, makeFormData({ email: "staff@test.it", role: "staff" }));

    expect(result.error).toContain("Limite account staff");
  });

  it("returns error when email is missing", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { full_name: "Admin" } }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { inviteCollaborator } = await import(
      "@/app/(private)/(org)/collaborators-management/actions"
    );
    const result = await inviteCollaborator(null, makeFormData({ role: "admin" }));

    expect(result.error).toBe("Email richiesta");
  });

  it("returns error for invalid role", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { full_name: "Admin" } }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { inviteCollaborator } = await import(
      "@/app/(private)/(org)/collaborators-management/actions"
    );
    const result = await inviteCollaborator(
      null,
      makeFormData({ email: "staff@test.it", role: "superadmin" }),
    );

    expect(result.error).toContain("Ruolo non valido");
  });

  it("sends invite email and returns success for valid admin invite", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { full_name: "Mario Rossi" } }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { inviteCollaborator } = await import(
      "@/app/(private)/(org)/collaborators-management/actions"
    );
    const result = await inviteCollaborator(
      null,
      makeFormData({ email: "newadmin@test.it", role: "admin" }),
    );

    expect(result.success).toBe(true);
    expect(mockAdminSupabase.auth.admin.generateLink).toHaveBeenCalledWith(
      expect.objectContaining({ type: "invite", email: "newadmin@test.it" }),
    );
    expect(mockResendSend).toHaveBeenCalled();
  });

  it("returns error when email send fails", async () => {
    mockResendSend.mockResolvedValueOnce({ data: null, error: { message: "Send failed" } });

    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { full_name: "Admin" } }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { inviteCollaborator } = await import(
      "@/app/(private)/(org)/collaborators-management/actions"
    );
    const result = await inviteCollaborator(
      null,
      makeFormData({ email: "staff@test.it", role: "staff" }),
    );

    expect(result.error).toContain("errore nell'invio dell'email");
  });

  it("parses selected_locations for staff with limited access", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { full_name: "Admin" } }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { inviteCollaborator } = await import(
      "@/app/(private)/(org)/collaborators-management/actions"
    );
    await inviteCollaborator(
      null,
      makeFormData({
        email: "staff@test.it",
        role: "staff",
        location_type: "selected",
        selected_locations: JSON.stringify(["loc_1", "loc_2"]),
      }),
    );

    expect(mockAdminSupabase.from().upsert).toHaveBeenCalledWith(
      expect.objectContaining({ accessible_locations: ["loc_1", "loc_2"] }),
    );
  });
});

// ── removeCollaborators ────────────────────────────────────────────────────────

describe("removeCollaborators", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
      }),
    };
  });

  it("returns error when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { removeCollaborators } = await import(
      "@/app/(private)/(org)/collaborators-management/actions"
    );
    const result = await removeCollaborators(["u_1"]);
    expect(result.error).toBe("Non autorizzato");
  });

  it("returns error when caller is not admin or owner", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { role: "staff" } }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { removeCollaborators } = await import(
      "@/app/(private)/(org)/collaborators-management/actions"
    );
    const result = await removeCollaborators(["u_1"]);

    expect(result.error).toContain("Solo gli amministratori");
  });

  it("returns error when trying to remove self", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { removeCollaborators } = await import(
      "@/app/(private)/(org)/collaborators-management/actions"
    );
    // user_123 is the current user's id
    const result = await removeCollaborators(["user_123"]);

    expect(result.error).toBe("Non puoi rimuovere te stesso");
  });

  it("returns error when trying to remove the org owner", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
      }),
    };

    // Admin client returns target with role "owner"
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ id: "owner_id", role: "owner" }],
        }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { removeCollaborators } = await import(
      "@/app/(private)/(org)/collaborators-management/actions"
    );
    const result = await removeCollaborators(["owner_id"]);

    expect(result.error).toContain("proprietario");
  });

  it("removes collaborators successfully for admin caller", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
      }),
    };

    const updateIn = vi.fn().mockResolvedValue({ error: null });
    mockAdminSupabase = {
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ id: "staff_1", role: "staff" }],
        }),
        update: vi.fn().mockReturnValue({ in: updateIn }),
      })),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { removeCollaborators } = await import(
      "@/app/(private)/(org)/collaborators-management/actions"
    );
    const result = await removeCollaborators(["staff_1"]);

    expect(result.success).toBe(true);
    expect(updateIn).toHaveBeenCalledWith("id", ["staff_1"]);
  });

  it("returns error when targets count does not match (user not in org)", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
      }),
    };

    // Admin returns empty (user not found in this org)
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [] }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { removeCollaborators } = await import(
      "@/app/(private)/(org)/collaborators-management/actions"
    );
    const result = await removeCollaborators(["u_missing"]);

    expect(result.error).toContain("non trovati");
  });
});
