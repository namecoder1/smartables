import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockGetRequirementGroup = vi.fn();
const mockGetOwnedNumbers = vi.fn();
const mockPurchasePhoneNumber = vi.fn();
vi.mock("@/lib/telnyx", () => ({
  getRequirementGroup: mockGetRequirementGroup,
  getOwnedNumbers: mockGetOwnedNumbers,
  purchasePhoneNumber: mockPurchasePhoneNumber,
}));

const mockAddNumberToWaba = vi.fn();
const mockRequestVerificationCode = vi.fn();
vi.mock("@/lib/whatsapp-registration", () => ({
  addNumberToWaba: mockAddNumberToWaba,
  requestVerificationCode: mockRequestVerificationCode,
}));

let mockAdminSupabase: any;
vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockAdminSupabase),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeStorageBucket(files: string[] = []) {
  const fileObjects = files.map((name) => ({ name }));
  return {
    list: vi.fn().mockResolvedValue({ data: fileObjects }),
    remove: vi.fn().mockResolvedValue({ error: null }),
  };
}

function makeStorageMock(buckets: Record<string, string[]> = {}) {
  return {
    from: vi.fn().mockImplementation((bucket: string) => makeStorageBucket(buckets[bucket] || [])),
  };
}

// ── syncTelnyxStatus ───────────────────────────────────────────────────────────

describe("syncTelnyxStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when location not found", async () => {
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
      }),
    };

    const { syncTelnyxStatus } = await import("@/app/actions/admin-automation");
    const result = await syncTelnyxStatus("loc_1");

    expect(result.success).toBe(false);
    expect(result.message).toContain("not found");
  });

  it("syncs requirement group status when out of sync", async () => {
    const location = {
      id: "loc_1",
      telnyx_phone_number: null,
      activation_status: "pending",
      regulatory_status: "pending",
      telnyx_requirement_group_id: "req_group_123",
    };
    mockGetRequirementGroup.mockResolvedValue({ status: "approved", rejection_reason: null });

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: location, error: null }),
        update: vi.fn().mockReturnValue({ eq: updateEq }),
      }),
    };

    const { syncTelnyxStatus } = await import("@/app/actions/admin-automation");
    const result = await syncTelnyxStatus("loc_1");

    expect(result.success).toBe(true);
    expect(result.message).toContain("approved");
    expect(updateEq).toHaveBeenCalled();
  });

  it("reports already in sync when status matches", async () => {
    const location = {
      id: "loc_1",
      telnyx_phone_number: null,
      activation_status: "pending",
      regulatory_status: "approved",
      telnyx_requirement_group_id: "req_group_123",
    };
    mockGetRequirementGroup.mockResolvedValue({ status: "approved" });

    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: location, error: null }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      }),
    };

    const { syncTelnyxStatus } = await import("@/app/actions/admin-automation");
    const result = await syncTelnyxStatus("loc_1");

    expect(result.success).toBe(true);
    expect(result.message).toContain("già in sync");
  });

  it("updates to pending_verification when active number found still provisioning", async () => {
    const location = {
      id: "loc_1",
      telnyx_phone_number: "+39021234567",
      activation_status: "provisioning",
      regulatory_status: "approved",
      telnyx_requirement_group_id: null,
    };
    mockGetOwnedNumbers.mockResolvedValue([
      { phoneNumber: "+39021234567", status: "active" },
    ]);

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: location, error: null }),
        update: vi.fn().mockReturnValue({ eq: updateEq }),
      }),
    };

    const { syncTelnyxStatus } = await import("@/app/actions/admin-automation");
    const result = await syncTelnyxStatus("loc_1");

    expect(result.success).toBe(true);
    expect(result.message).toContain("pending_verification");
  });
});

// ── manualPurchaseNumber ───────────────────────────────────────────────────────

describe("manualPurchaseNumber", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when location not found", async () => {
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "err" } }),
      }),
    };

    const { manualPurchaseNumber } = await import("@/app/actions/admin-automation");
    const result = await manualPurchaseNumber("loc_1", "req_1");

    expect(result.success).toBe(false);
    expect(result.message).toContain("not found");
  });

  it("purchases number and returns success", async () => {
    mockPurchasePhoneNumber.mockResolvedValue(undefined);
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { telnyx_phone_number: "+39021234567" },
          error: null,
        }),
      }),
    };

    const { manualPurchaseNumber } = await import("@/app/actions/admin-automation");
    const result = await manualPurchaseNumber("loc_1", "req_1");

    expect(result.success).toBe(true);
    expect(mockPurchasePhoneNumber).toHaveBeenCalledWith("+39021234567", "req_1");
  });
});

// ── manualMetaRegistration ─────────────────────────────────────────────────────

describe("manualMetaRegistration", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when location not found", async () => {
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "err" } }),
      }),
    };

    const { manualMetaRegistration } = await import("@/app/actions/admin-automation");
    expect((await manualMetaRegistration("loc_1")).success).toBe(false);
  });

  it("adds number to WABA and updates DB", async () => {
    mockAddNumberToWaba.mockResolvedValue("meta_phone_id_999");

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { telnyx_phone_number: "+39021234567", name: "Ristorante Test" },
          error: null,
        }),
        update: vi.fn().mockReturnValue({ eq: updateEq }),
      }),
    };

    const { manualMetaRegistration } = await import("@/app/actions/admin-automation");
    const result = await manualMetaRegistration("loc_1");

    expect(result.success).toBe(true);
    expect(result.metaPhoneId).toBe("meta_phone_id_999");
    expect(mockAddNumberToWaba).toHaveBeenCalledWith("39021234567", "Ristorante Test");
    expect(updateEq).toHaveBeenCalledWith("id", "loc_1");
  });
});

// ── manualVoiceVerification ────────────────────────────────────────────────────

describe("manualVoiceVerification", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when meta_phone_id not present", async () => {
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { meta_phone_id: null }, error: null }),
      }),
    };

    const { manualVoiceVerification } = await import("@/app/actions/admin-automation");
    const result = await manualVoiceVerification("loc_1");

    expect(result.success).toBe(false);
    expect(result.message).toContain("Meta Phone ID");
  });

  it("requests voice verification code", async () => {
    mockRequestVerificationCode.mockResolvedValue(undefined);
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { meta_phone_id: "phone_id_999" },
          error: null,
        }),
      }),
    };

    const { manualVoiceVerification } = await import("@/app/actions/admin-automation");
    const result = await manualVoiceVerification("loc_1");

    expect(result.success).toBe(true);
    expect(mockRequestVerificationCode).toHaveBeenCalledWith("phone_id_999", "VOICE");
  });
});

// ── deleteLocationAction ───────────────────────────────────────────────────────

describe("deleteLocationAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes location and returns success", async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({ eq: deleteEq }),
      }),
    };

    const { deleteLocationAction } = await import("@/app/actions/admin-automation");
    const result = await deleteLocationAction("loc_1");

    expect(result.success).toBe(true);
    expect(deleteEq).toHaveBeenCalledWith("id", "loc_1");
  });

  it("returns fail on DB error", async () => {
    mockAdminSupabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "constraint violation" } }),
        }),
      }),
    };

    const { deleteLocationAction } = await import("@/app/actions/admin-automation");
    const result = await deleteLocationAction("loc_1");

    expect(result.success).toBe(false);
  });
});

// ── deleteUserAction ───────────────────────────────────────────────────────────

describe("deleteUserAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes user with no org data (no locations)", async () => {
    mockAdminSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { organization_id: null } }),
          };
        }
        return {};
      }),
      auth: {
        admin: {
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
      storage: makeStorageMock(),
    };

    const { deleteUserAction } = await import("@/app/actions/admin-automation");
    const result = await deleteUserAction("user_123");

    expect(result.success).toBe(true);
    expect(mockAdminSupabase.auth.admin.deleteUser).toHaveBeenCalledWith("user_123");
  });

  it("cleans up storage files before deleting user", async () => {
    const removeLogoFn = vi.fn().mockResolvedValue({ error: null });
    const removeCompFn = vi.fn().mockResolvedValue({ error: null });
    const removeMenuImgFn = vi.fn().mockResolvedValue({ error: null });
    const removeMenuPdfFn = vi.fn().mockResolvedValue({ error: null });

    mockAdminSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { organization_id: "org_123" } }),
          };
        }
        if (table === "locations") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ id: "loc_1" }], error: null }),
          };
        }
        return {};
      }),
      auth: {
        admin: {
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
      storage: {
        from: vi.fn().mockImplementation((bucket: string) => {
          if (bucket === "location-logo") {
            return {
              list: vi.fn().mockResolvedValue({ data: [{ name: "logo.png" }] }),
              remove: removeLogoFn,
            };
          }
          if (bucket === "compliance-docs") {
            return {
              list: vi.fn().mockResolvedValue({ data: [{ name: "doc.pdf" }] }),
              remove: removeCompFn,
            };
          }
          if (bucket === "menu-images") {
            return {
              list: vi.fn().mockResolvedValue({ data: [{ name: "img.jpg" }] }),
              remove: removeMenuImgFn,
            };
          }
          if (bucket === "menu-files") {
            return {
              list: vi.fn().mockResolvedValue({ data: [{ name: "menu.pdf" }] }),
              remove: removeMenuPdfFn,
            };
          }
          return { list: vi.fn().mockResolvedValue({ data: [] }) };
        }),
      },
    };

    const { deleteUserAction } = await import("@/app/actions/admin-automation");
    const result = await deleteUserAction("user_123");

    expect(result.success).toBe(true);
    expect(removeLogoFn).toHaveBeenCalledWith(["loc_1/logo.png"]);
    expect(removeCompFn).toHaveBeenCalledWith(["loc_1/doc.pdf"]);
    expect(removeMenuImgFn).toHaveBeenCalledWith(["org_123/img.jpg"]);
    expect(removeMenuPdfFn).toHaveBeenCalledWith(["org_123/menu.pdf"]);
  });

  it("returns fail when auth delete fails", async () => {
    mockAdminSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { organization_id: null } }),
          };
        }
        return {};
      }),
      auth: {
        admin: {
          deleteUser: vi.fn().mockResolvedValue({ error: { message: "user not found" } }),
        },
      },
      storage: makeStorageMock(),
    };

    const { deleteUserAction } = await import("@/app/actions/admin-automation");
    const result = await deleteUserAction("user_missing");

    expect(result.success).toBe(false);
    expect(result.message).toBe("user not found");
  });
});
