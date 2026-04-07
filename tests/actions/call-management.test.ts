import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock("@/lib/supabase-helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

let mockClientSupabase: any;
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => mockClientSupabase),
}));

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

// ── markCallbackCompleted ──────────────────────────────────────────────────────

describe("markCallbackCompleted", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { markCallbackCompleted } = await import("@/app/actions/call-management");
    const result = await markCallbackCompleted("req_1");
    expect(result?.success).toBe(false);
  });

  it("updates callback status to completed and returns undefined (revalidate)", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: updateEq }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { markCallbackCompleted } = await import("@/app/actions/call-management");
    const result = await markCallbackCompleted("req_1");

    // Returns ok() on success
    expect(result).toEqual({ success: true });
    const updateFn = supabase.from.mock.results[0].value.update;
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed" }),
    );
  });

  it("returns fail when DB update fails", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "DB error" } }),
        }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { markCallbackCompleted } = await import("@/app/actions/call-management");
    const result = await markCallbackCompleted("req_1");

    expect(result?.success).toBe(false);
  });
});

// ── archiveCallback ────────────────────────────────────────────────────────────

describe("archiveCallback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { archiveCallback } = await import("@/app/actions/call-management");
    expect((await archiveCallback("req_1"))?.success).toBe(false);
  });

  it("updates callback status to archived", async () => {
    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const supabase = { from: vi.fn().mockReturnValue({ update: updateFn }) };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { archiveCallback } = await import("@/app/actions/call-management");
    await archiveCallback("req_1");

    expect(updateFn).toHaveBeenCalledWith({ status: "archived" });
  });
});

// ── removeContactTag ───────────────────────────────────────────────────────────

describe("removeContactTag", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { removeContactTag } = await import("@/app/actions/call-management");
    expect((await removeContactTag("cust_1", "fornitore"))?.success).toBe(false);
  });

  it("removes only the specified tag and keeps others", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: updateEq });

    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { tags: ["fornitore", "vip", "frequent"] },
        }),
        update: updateFn,
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { removeContactTag } = await import("@/app/actions/call-management");
    await removeContactTag("cust_1", "fornitore");

    expect(updateFn).toHaveBeenCalledWith({ tags: ["vip", "frequent"] });
  });

  it("handles customer with null tags gracefully", async () => {
    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { tags: null } }),
        update: updateFn,
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { removeContactTag } = await import("@/app/actions/call-management");
    await removeContactTag("cust_1", "fornitore");

    // tags: null → filters [] → update with []
    expect(updateFn).toHaveBeenCalledWith({ tags: [] });
  });

  it("does nothing when customer is not found", async () => {
    const updateFn = vi.fn();
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
        update: updateFn,
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { removeContactTag } = await import("@/app/actions/call-management");
    await removeContactTag("cust_missing", "fornitore");

    expect(updateFn).not.toHaveBeenCalled();
  });
});

// ── addSpecialClosure ──────────────────────────────────────────────────────────

describe("addSpecialClosure", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { addSpecialClosure } = await import("@/app/actions/call-management");
    expect((await addSpecialClosure("loc_1","2025-12-24","2025-12-26","Natale"))?.success).toBe(false);
  });

  it("inserts closure and returns undefined on success", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const supabase = { from: vi.fn().mockReturnValue({ insert: insertMock }) };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { addSpecialClosure } = await import("@/app/actions/call-management");
    const result = await addSpecialClosure("loc_1", "2025-12-24", "2025-12-26", "Natale");

    expect(result).toEqual({ success: true });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        location_id: "loc_1",
        start_date: "2025-12-24",
        end_date: "2025-12-26",
        reason: "Natale",
      }),
    );
  });

  it("returns fail when DB insert fails", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: "err" } }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { addSpecialClosure } = await import("@/app/actions/call-management");
    const result = await addSpecialClosure("loc_1", "2025-12-24", "2025-12-26", "Natale");

    expect(result?.success).toBe(false);
  });
});

// ── removeSpecialClosure ───────────────────────────────────────────────────────

describe("removeSpecialClosure", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { removeSpecialClosure } = await import("@/app/actions/call-management");
    expect((await removeSpecialClosure("cl_1"))?.success).toBe(false);
  });

  it("deletes closure and returns undefined on success", async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: deleteEq }) }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { removeSpecialClosure } = await import("@/app/actions/call-management");
    const result = await removeSpecialClosure("cl_1");

    expect(result).toEqual({ success: true });
    expect(deleteEq).toHaveBeenCalledWith("id", "cl_1");
  });
});

// ── getNotificationCounts ──────────────────────────────────────────────────────

describe("getNotificationCounts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns pendingCallbacks count", async () => {
    mockClientSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        // last .eq() resolves to count
      }),
    };
    // Build chain manually so the last eq returns the count
    const eqEq = vi.fn().mockResolvedValue({ count: 7 });
    const eqFn = vi.fn().mockReturnValue({ eq: eqEq });
    mockClientSupabase = {
      from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eqFn }) }),
    };

    const { getNotificationCounts } = await import("@/app/actions/call-management");
    const result = await getNotificationCounts("loc_1");

    expect(result).toEqual({ pendingCallbacks: 7 });
  });

  it("returns 0 when count is null", async () => {
    const eqEq = vi.fn().mockResolvedValue({ count: null });
    const eqFn = vi.fn().mockReturnValue({ eq: eqEq });
    mockClientSupabase = {
      from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eqFn }) }),
    };

    const { getNotificationCounts } = await import("@/app/actions/call-management");
    const result = await getNotificationCounts("loc_1");

    expect(result).toEqual({ pendingCallbacks: 0 });
  });
});

// ── getCallbackRequests (read-only) ───────────────────────────────────────────

describe("getCallbackRequests", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns callback requests ordered by date", async () => {
    const requests = [{ id: "r1" }, { id: "r2" }];
    mockClientSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: requests, error: null }),
      }),
    };

    const { getCallbackRequests } = await import("@/app/actions/call-management");
    const result = await getCallbackRequests("loc_1");

    expect(result).toEqual(requests);
  });

  it("returns empty array on error", async () => {
    mockClientSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "err" } }),
      }),
    };

    const { getCallbackRequests } = await import("@/app/actions/call-management");
    expect(await getCallbackRequests("loc_1")).toEqual([]);
  });
});
