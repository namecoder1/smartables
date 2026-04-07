import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateOrganizationStatus } from "@/app/actions/organization";

vi.mock("@/lib/supabase-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/revalidation-paths", () => ({
  PATHS: { ROOT_LAYOUT: "/" },
}));

import { requireAuth } from "@/lib/supabase-helpers";
import { revalidatePath } from "next/cache";

function makeAuthOk(supabase: any) {
  (requireAuth as any).mockResolvedValue({ success: true, supabase });
}
function makeAuthFail() {
  (requireAuth as any).mockResolvedValue({ success: false, error: "Unauthorized" });
}

describe("organization actions", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("updateOrganizationStatus()", () => {
    it("returns fail when auth fails", async () => {
      makeAuthFail();
      const result = await updateOrganizationStatus("org-1", "active");
      expect(result).toEqual({ success: false, error: "Non autorizzato" });
    });

    it("returns fail when DB update fails", async () => {
      const supabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
          }),
        }),
      };
      makeAuthOk(supabase);

      const result = await updateOrganizationStatus("org-1", "active");

      expect(result).toEqual({ success: false, error: "Failed to update organization status" });
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("returns ok and revalidates when update succeeds", async () => {
      const supabase = {
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      };
      makeAuthOk(supabase);

      const result = await updateOrganizationStatus("org-1", "active");

      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalled();
    });

    it("passes the correct organizationId and status to the DB", async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const supabase = {
        from: vi.fn().mockReturnValue({ update: mockUpdate }),
      };
      makeAuthOk(supabase);

      await updateOrganizationStatus("org-42", "suspended");

      expect(mockUpdate).toHaveBeenCalledWith({ activation_status: "suspended" });
      expect(mockEq).toHaveBeenCalledWith("id", "org-42");
    });
  });
});
