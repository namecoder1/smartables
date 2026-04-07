import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminResetWhatsappUsage, adminSetBillingTier } from "@/app/actions/admin-orgs";

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

function makeAdminSupabase(updateResult: { error: any }) {
  const mockEq = vi.fn().mockResolvedValue(updateResult);
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
  const supabase = { from: vi.fn().mockReturnValue({ update: mockUpdate }) };
  (createAdminClient as any).mockReturnValue(supabase);
  return { supabase, mockUpdate, mockEq };
}

describe("admin-orgs actions", () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── adminResetWhatsappUsage ──────────────────────────────────────────────────

  describe("adminResetWhatsappUsage()", () => {
    it("returns ok and revalidates both paths on success", async () => {
      makeAdminSupabase({ error: null });

      const result = await adminResetWhatsappUsage("org-1");

      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith("/organizations");
      expect(revalidatePath).toHaveBeenCalledWith("/organizations/org-1");
    });

    it("returns fail with DB error message on failure", async () => {
      makeAdminSupabase({ error: { message: "Update failed" } });

      const result = await adminResetWhatsappUsage("org-1");

      expect(result).toEqual({ success: false, error: "Update failed" });
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("resets whatsapp_usage_count to 0", async () => {
      const { mockUpdate } = makeAdminSupabase({ error: null });

      await adminResetWhatsappUsage("org-42");

      expect(mockUpdate).toHaveBeenCalledWith({ whatsapp_usage_count: 0 });
    });

    it("targets the correct organization by id", async () => {
      const { mockEq } = makeAdminSupabase({ error: null });

      await adminResetWhatsappUsage("org-42");

      expect(mockEq).toHaveBeenCalledWith("id", "org-42");
    });
  });

  // ─── adminSetBillingTier ─────────────────────────────────────────────────────

  describe("adminSetBillingTier()", () => {
    it("returns ok and revalidates on success", async () => {
      makeAdminSupabase({ error: null });

      const result = await adminSetBillingTier("org-1", "growth");

      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith("/organizations");
      expect(revalidatePath).toHaveBeenCalledWith("/organizations/org-1");
    });

    it("returns fail with DB error message on failure", async () => {
      makeAdminSupabase({ error: { message: "Permission denied" } });

      const result = await adminSetBillingTier("org-1", "business");

      expect(result).toEqual({ success: false, error: "Permission denied" });
    });

    it.each(["starter", "growth", "business"] as const)(
      "sets billing_tier to '%s' correctly",
      async (tier) => {
        const { mockUpdate } = makeAdminSupabase({ error: null });

        await adminSetBillingTier("org-1", tier);

        expect(mockUpdate).toHaveBeenCalledWith({ billing_tier: tier });
      },
    );

    it("targets the correct organization by id", async () => {
      const { mockEq } = makeAdminSupabase({ error: null });

      await adminSetBillingTier("org-99", "starter");

      expect(mockEq).toHaveBeenCalledWith("id", "org-99");
    });
  });
});
