import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAuthContext } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("lib/auth — getAuthContext()", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: { getUser: vi.fn() },
      from: vi.fn(),
    };
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  const mockChain = (returnValue: any) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(returnValue),
    // for .order() chains that resolve directly (locations query)
    then: undefined as any,
  });

  it("throws 'Unauthorized' when no user is authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    await expect(getAuthContext()).rejects.toThrow("Unauthorized");
  });

  it("throws 'No organization found' when profile is missing", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null }) };
      }
      return mockChain({ data: null });
    });

    await expect(getAuthContext()).rejects.toThrow("No organization found");
  });

  it("throws 'No organization found' when profile exists but organization_id is null", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { organization_id: null } }),
        };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [] }), single: vi.fn().mockResolvedValue({ data: null }) };
    });

    await expect(getAuthContext()).rejects.toThrow("No organization found");
  });

  it("returns the full auth context on success", async () => {
    const fakeUser = { id: "user-1", email: "test@example.com" };
    const fakeProfile = { organization_id: "org-1" };
    const fakeLocations = [{ id: "loc-1", name: "Sede principale" }];
    const fakeOrganization = { id: "org-1", name: "Ristorante Test" };

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: fakeUser } });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: fakeProfile }),
        };
      }
      if (table === "locations") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: fakeLocations }),
        };
      }
      if (table === "organizations") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: fakeOrganization }),
        };
      }
      return mockChain({ data: null });
    });

    const ctx = await getAuthContext();

    expect(ctx.user).toEqual(fakeUser);
    expect(ctx.organizationId).toBe("org-1");
    expect(ctx.locations).toEqual(fakeLocations);
    expect(ctx.organization).toEqual(fakeOrganization);
    expect(ctx.supabase).toBe(mockSupabase);
  });

  it("returns multiple locations when org has many", async () => {
    const fakeUser = { id: "user-1" };
    const fakeProfile = { organization_id: "org-1" };
    const fakeLocations = [
      { id: "loc-1", name: "Sede A" },
      { id: "loc-2", name: "Sede B" },
      { id: "loc-3", name: "Sede C" },
    ];

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: fakeUser } });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: fakeProfile }) };
      }
      if (table === "locations") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: fakeLocations }) };
      }
      if (table === "organizations") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: "org-1" } }) };
      }
      return mockChain({ data: null });
    });

    const ctx = await getAuthContext();

    expect(ctx.locations).toHaveLength(3);
  });
});
