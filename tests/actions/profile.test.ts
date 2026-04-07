import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserRole } from "@/app/actions/profile";

vi.mock("@/lib/supabase-helpers", () => ({
  requireAuth: vi.fn(),
}));

import { requireAuth } from "@/lib/supabase-helpers";

const FAKE_USER = { id: "user-1" };

function makeAuthOk(supabase: any) {
  (requireAuth as any).mockResolvedValue({ success: true, user: FAKE_USER, supabase });
}
function makeAuthFail() {
  (requireAuth as any).mockResolvedValue({ success: false, error: "Unauthorized" });
}

describe("profile actions", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("getUserRole()", () => {
    it("returns null when auth fails", async () => {
      makeAuthFail();
      const result = await getUserRole();
      expect(result).toBeNull();
    });

    it("returns the role string when profile has a role", async () => {
      const supabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
        }),
      };
      makeAuthOk(supabase);

      const result = await getUserRole();

      expect(result).toBe("admin");
    });

    it("returns null when profile data is null (profile not found)", async () => {
      const supabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      };
      makeAuthOk(supabase);

      const result = await getUserRole();

      expect(result).toBeNull();
    });

    it("returns null when profile has no role field", async () => {
      const supabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { role: null } }),
        }),
      };
      makeAuthOk(supabase);

      const result = await getUserRole();

      expect(result).toBeNull();
    });

    it("queries the profiles table with the authenticated user's id", async () => {
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: { role: "member" } });
      const supabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: mockEq,
          single: mockSingle,
        }),
      };
      makeAuthOk(supabase);

      await getUserRole();

      expect(supabase.from).toHaveBeenCalledWith("profiles");
      expect(mockEq).toHaveBeenCalledWith("id", FAKE_USER.id);
    });
  });
});
