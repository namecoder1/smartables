import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock("@/lib/supabase-helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

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

// ── updateOrganizationInfo ─────────────────────────────────────────────────────

describe("updateOrganizationInfo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { updateOrganizationInfo } = await import(
      "@/app/(private)/(org)/general-settings/actions"
    );
    const result = await updateOrganizationInfo(
      makeFormData({ name: "Ristorante Test", slug: "test", billing_email: "a@b.it" }),
    );
    expect(result.success).toBe(false);
  });

  it("returns fail when required fields are missing", async () => {
    const supabase = { from: vi.fn() };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateOrganizationInfo } = await import(
      "@/app/(private)/(org)/general-settings/actions"
    );

    // Missing billing_email
    const result = await updateOrganizationInfo(
      makeFormData({ name: "Ristorante Test", slug: "test" }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Tutti i campi sono obbligatori");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("returns fail when name is empty", async () => {
    const supabase = { from: vi.fn() };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateOrganizationInfo } = await import(
      "@/app/(private)/(org)/general-settings/actions"
    );
    const result = await updateOrganizationInfo(
      makeFormData({ name: "", slug: "test", billing_email: "a@b.it" }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Tutti i campi sono obbligatori");
  });

  it("updates organization and returns ok", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: updateEq }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateOrganizationInfo } = await import(
      "@/app/(private)/(org)/general-settings/actions"
    );
    const result = await updateOrganizationInfo(
      makeFormData({
        name: "Ristorante Test",
        slug: "ristorante-test",
        billing_email: "billing@test.it",
      }),
    );

    expect(result.success).toBe(true);
    expect(updateEq).toHaveBeenCalledWith("id", "org_123");
  });

  it("returns fail when DB update fails", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "duplicate slug" } }),
        }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateOrganizationInfo } = await import(
      "@/app/(private)/(org)/general-settings/actions"
    );
    const result = await updateOrganizationInfo(
      makeFormData({ name: "Test", slug: "test", billing_email: "a@b.it" }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Errore nel salvataggio");
  });
});

// ── updateUxSettings ───────────────────────────────────────────────────────────

describe("updateUxSettings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { updateUxSettings } = await import(
      "@/app/(private)/(org)/general-settings/actions"
    );
    const result = await updateUxSettings({ theme: "dark" } as any);
    expect(result.success).toBe(false);
  });

  it("saves UX settings and returns ok", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: updateEq });
    const supabase = {
      from: vi.fn().mockReturnValue({ update: updateFn }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateUxSettings } = await import(
      "@/app/(private)/(org)/general-settings/actions"
    );
    const settings = { theme: "light", language: "it" } as any;
    const result = await updateUxSettings(settings);

    expect(result.success).toBe(true);
    expect(updateFn).toHaveBeenCalledWith({ ux_settings: settings });
    expect(updateEq).toHaveBeenCalledWith("id", "org_123");
  });

  it("returns fail when DB update fails", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "constraint violation" } }),
        }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateUxSettings } = await import(
      "@/app/(private)/(org)/general-settings/actions"
    );
    const result = await updateUxSettings({ theme: "dark" } as any);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Errore nel salvataggio");
  });
});
