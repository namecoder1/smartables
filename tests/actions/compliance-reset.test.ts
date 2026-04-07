import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetComplianceAction } from "@/app/actions/compliance-reset";

vi.mock("@/lib/supabase-helpers", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/revalidation-paths", () => ({
  PATHS: { COMPLIANCE: "/connections" },
}));

import { requireAuth } from "@/lib/supabase-helpers";
import { revalidatePath } from "next/cache";

const FAKE_USER = { id: "user-owner" };

function makeAuthOk(supabase: any) {
  (requireAuth as any).mockResolvedValue({ success: true, user: FAKE_USER, supabase });
}
function makeAuthFail() {
  (requireAuth as any).mockResolvedValue({ success: false, error: "Unauthorized" });
}

function makeSupabase({
  location = { data: { organization_id: "org-1" } },
  org = { data: { created_by: FAKE_USER.id } },
  updateResult = { error: null },
}: {
  location?: any;
  org?: any;
  updateResult?: any;
} = {}) {
  return {
    from: vi.fn((table: string) => {
      if (table === "locations") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(location),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue(updateResult),
          }),
        };
      }
      if (table === "organizations") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(org),
        };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    }),
  };
}

describe("compliance-reset actions", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("resetComplianceAction()", () => {
    it("returns fail when auth fails", async () => {
      makeAuthFail();
      const result = await resetComplianceAction("loc-1");
      expect(result).toEqual({ success: false, error: "Non autorizzato" });
    });

    it("returns fail when location is not found", async () => {
      makeAuthOk(makeSupabase({ location: { data: null } }));
      const result = await resetComplianceAction("loc-1");
      expect(result).toEqual({ success: false, error: "Location not found" });
    });

    it("returns fail when org is not found", async () => {
      makeAuthOk(makeSupabase({ org: { data: null } }));
      const result = await resetComplianceAction("loc-1");
      expect(result).toEqual({ success: false, error: "Non autorizzato" });
    });

    it("returns fail when user is not the org owner", async () => {
      makeAuthOk(makeSupabase({ org: { data: { created_by: "other-user" } } }));
      const result = await resetComplianceAction("loc-1");
      expect(result).toEqual({ success: false, error: "Non autorizzato" });
    });

    it("returns fail when DB update fails", async () => {
      makeAuthOk(makeSupabase({ updateResult: { error: { message: "DB reset failed" } } }));
      const result = await resetComplianceAction("loc-1");
      expect(result).toEqual({ success: false, error: "DB reset failed" });
    });

    it("returns ok and revalidates on success", async () => {
      makeAuthOk(makeSupabase());
      const result = await resetComplianceAction("loc-1");
      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith("/connections");
    });

    it("resets all regulatory fields to their defaults", async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      const supabase = {
        from: vi.fn((table: string) => {
          if (table === "locations") {
            // First call: select for ownership check
            // Second call: update to reset
            let callCount = 0;
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: { organization_id: "org-1" } }),
              update: mockUpdate,
            };
          }
          if (table === "organizations") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({ data: { created_by: FAKE_USER.id } }),
            };
          }
          return {};
        }),
      };
      makeAuthOk(supabase);

      await resetComplianceAction("loc-1");

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          telnyx_requirement_group_id: null,
          telnyx_bundle_request_id: null,
          regulatory_status: "pending",
          regulatory_rejection_reason: null,
          telnyx_phone_number: null,
          activation_status: "pending",
        }),
      );
    });
  });
});
