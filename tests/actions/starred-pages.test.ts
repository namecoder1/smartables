import { describe, it, expect, vi, beforeEach } from "vitest";
import { toggleStarredPage, getStarredPages } from "@/app/actions/starred-pages";

vi.mock("@/lib/supabase-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { requireAuth } from "@/lib/supabase-helpers";
import { revalidatePath } from "next/cache";

const FAKE_USER = { id: "user-1" };

function makeAuthOk(supabase: any) {
  (requireAuth as any).mockResolvedValue({ success: true, user: FAKE_USER, supabase });
}
function makeAuthFail() {
  (requireAuth as any).mockResolvedValue({ success: false, error: "Unauthorized" });
}

function makeSupabase(overrides: Record<string, any> = {}) {
  const base: any = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    delete: vi.fn().mockReturnThis(),
  };
  return { ...base, ...overrides };
}

describe("starred-pages actions", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── toggleStarredPage ───────────────────────────────────────────────────────

  describe("toggleStarredPage()", () => {
    it("returns undefined (no-op) when auth fails", async () => {
      makeAuthFail();
      const result = await toggleStarredPage("Dashboard", "/dashboard");
      expect(result).toBeUndefined();
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("removes the star when the page is already starred", async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
      const supabase: any = {
        from: vi.fn((table: string) => {
          if (table === "starred_pages") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              // First call (.select.eq.eq.single) → already starred
              single: vi.fn().mockResolvedValue({ data: { id: "star-1" } }),
              delete: vi.fn().mockReturnValue({ eq: mockDeleteEq }),
            };
          }
          return { select: vi.fn().mockReturnThis() };
        }),
      };
      makeAuthOk(supabase);

      await toggleStarredPage("Dashboard", "/dashboard");

      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("adds the star when the page is not yet starred", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const supabase: any = {
        from: vi.fn((table: string) => {
          if (table === "starred_pages") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: null }), // not starred
              insert: mockInsert,
            };
          }
          return {};
        }),
      };
      makeAuthOk(supabase);

      await toggleStarredPage("Settings", "/settings");

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          profile_id: FAKE_USER.id,
          url: "/settings",
          title: "Settings",
        }),
      );
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("calls revalidatePath with layout scope on both add and remove", async () => {
      const supabase = makeSupabase();
      // not starred → insert path
      supabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      });
      makeAuthOk(supabase);

      await toggleStarredPage("Home", "/home");

      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });
  });

  // ─── getStarredPages ─────────────────────────────────────────────────────────

  describe("getStarredPages()", () => {
    it("returns empty array when auth fails", async () => {
      makeAuthFail();
      const result = await getStarredPages();
      expect(result).toEqual([]);
    });

    it("returns list of starred pages ordered by created_at", async () => {
      const fakePages = [
        { id: "s-1", url: "/dashboard", title: "Dashboard" },
        { id: "s-2", url: "/billing", title: "Billing" },
      ];
      const supabase: any = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: fakePages }),
        }),
      };
      makeAuthOk(supabase);

      const result = await getStarredPages();

      expect(result).toEqual(fakePages);
    });

    it("returns empty array when data is null (no starred pages)", async () => {
      const supabase: any = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: null }),
        }),
      };
      makeAuthOk(supabase);

      const result = await getStarredPages();

      expect(result).toEqual([]);
    });
  });
});
