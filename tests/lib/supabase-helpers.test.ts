import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUser, requireAuth } from "@/lib/supabase-helpers";
import { createClient } from "@/utils/supabase/server";

// Mock the Supabase server client
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock getAuthContext to isolate requireAuth from the DB layer
vi.mock("@/lib/auth", () => ({
  getAuthContext: vi.fn(),
}));

import { getAuthContext } from "@/lib/auth";

describe("lib/supabase-helpers", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: { getUser: vi.fn() },
    };
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  // ─── getUser() ───────────────────────────────────────────────────────────────

  describe("getUser()", () => {
    it("returns { supabase, user } when user is authenticated", async () => {
      const fakeUser = { id: "user-1", email: "a@b.com" };
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: fakeUser } });

      const result = await getUser();

      expect(result.user).toEqual(fakeUser);
      expect(result.supabase).toBe(mockSupabase);
    });

    it("returns user: null when session is missing", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await getUser();

      expect(result.user).toBeNull();
      expect(result.supabase).toBe(mockSupabase);
    });

    it("always returns supabase client regardless of auth state", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const result = await getUser();

      expect(result.supabase).toBeDefined();
    });
  });

  // ─── requireAuth() ───────────────────────────────────────────────────────────

  describe("requireAuth()", () => {
    it("returns { success: true, ...context } when auth succeeds", async () => {
      const fakeCtx = {
        supabase: mockSupabase,
        user: { id: "user-1" },
        organizationId: "org-1",
        organization: { id: "org-1", name: "Test Org" },
        locations: [{ id: "loc-1" }],
      };
      (getAuthContext as any).mockResolvedValue(fakeCtx);

      const result = await requireAuth();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.organizationId).toBe("org-1");
        expect(result.user).toEqual({ id: "user-1" });
        expect(result.locations).toHaveLength(1);
      }
    });

    it("returns { success: false, error: 'Unauthorized' } when getAuthContext throws", async () => {
      (getAuthContext as any).mockRejectedValue(new Error("Unauthorized"));

      const result = await requireAuth();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns { success: false } for any thrown error, not just auth errors", async () => {
      (getAuthContext as any).mockRejectedValue(new Error("DB connection failed"));

      const result = await requireAuth();

      expect(result.success).toBe(false);
    });

    it("never throws — always returns a typed result", async () => {
      (getAuthContext as any).mockRejectedValue(new Error("anything"));

      await expect(requireAuth()).resolves.toBeDefined();
    });

    it("returned success:false result can be used as a direct server action return", async () => {
      (getAuthContext as any).mockRejectedValue(new Error("Unauthorized"));

      const result = await requireAuth();

      // Verify the shape matches ActionResult failure
      expect(result).toMatchObject({ success: false, error: expect.any(String) });
    });

    it("includes all context fields on success", async () => {
      const fakeCtx = {
        supabase: mockSupabase,
        user: { id: "user-1" },
        organizationId: "org-42",
        organization: { id: "org-42" },
        locations: [],
      };
      (getAuthContext as any).mockResolvedValue(fakeCtx);

      const result = await requireAuth();

      if (result.success) {
        expect(result).toMatchObject({
          success: true,
          supabase: mockSupabase,
          organizationId: "org-42",
          organization: { id: "org-42" },
          locations: [],
        });
      }
    });
  });
});
