import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock("@/lib/supabase-helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/monitoring", () => ({ captureCritical: vi.fn(), captureWarning: vi.fn() }));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAuth(supabase: any) {
  return {
    success: true as const,
    supabase,
    user: { id: "user_123", email: "admin@test.it" },
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

// ── searchCustomers ────────────────────────────────────────────────────────────

describe("searchCustomers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { searchCustomers } = await import("@/app/actions/customers");
    expect(await searchCustomers("mario")).toEqual([]);
  });

  it("returns matching customers", async () => {
    const customers = [{ id: "c1", name: "Mario Rossi" }];
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: customers, error: null }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { searchCustomers } = await import("@/app/actions/customers");
    const result = await searchCustomers("mario");

    expect(result).toEqual(customers);
  });

  it("returns empty array on DB error", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: "err" } }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { searchCustomers } = await import("@/app/actions/customers");
    expect(await searchCustomers("mario")).toEqual([]);
  });
});

// ── createCustomer ─────────────────────────────────────────────────────────────

describe("createCustomer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { createCustomer } = await import("@/app/actions/customers");
    const result = await createCustomer("loc_1", makeFormData({ name: "A", phone_number: "123" }));
    expect(result.success).toBe(false);
  });

  it("inserts customer and returns it", async () => {
    const customer = { id: "c1", name: "Luca Bianchi", phone_number: "+39123" };
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: customer, error: null }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { createCustomer } = await import("@/app/actions/customers");
    const result = await createCustomer(
      "loc_1",
      makeFormData({ name: "Luca Bianchi", phone_number: "+39123" }),
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual(customer);
  });

  it("returns fail on DB error", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "dup key" } }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { createCustomer } = await import("@/app/actions/customers");
    const result = await createCustomer("loc_1", makeFormData({ name: "X", phone_number: "0" }));

    expect(result.success).toBe(false);
  });
});

// ── updateCustomer ─────────────────────────────────────────────────────────────

describe("updateCustomer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { updateCustomer } = await import("@/app/actions/customers");
    const result = await updateCustomer("c1", makeFormData({ name: "A", phone_number: "0" }));
    expect(result.success).toBe(false);
  });

  it("updates customer and returns it", async () => {
    const updated = { id: "c1", name: "Updated Name" };
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updated, error: null }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateCustomer } = await import("@/app/actions/customers");
    const result = await updateCustomer(
      "c1",
      makeFormData({ name: "Updated Name", phone_number: "+39999" }),
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual(updated);
  });

  it("returns fail on DB error", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "err" } }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateCustomer } = await import("@/app/actions/customers");
    const result = await updateCustomer("c1", makeFormData({ name: "X", phone_number: "0" }));
    expect(result.success).toBe(false);
  });
});

// ── deleteCustomers ────────────────────────────────────────────────────────────

describe("deleteCustomers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { deleteCustomers } = await import("@/app/actions/customers");
    expect((await deleteCustomers(["c1"])).success).toBe(false);
  });

  it("returns fail when caller is staff (not admin/owner)", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { role: "staff" }, error: null }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { deleteCustomers } = await import("@/app/actions/customers");
    const result = await deleteCustomers(["c1"]);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Solo gli amministratori");
  });

  it("deletes customers for admin caller (GDPR 4-step flow)", async () => {
    // The action does: profile check → fetch phones → anonymize bookings → delete callbacks → delete customers
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
          };
        }
        if (table === "customers") {
          return {
            // Step 1: fetch phone numbers
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [{ id: "c1", phone_number: "+39123" }], error: null }),
              }),
            }),
            // Step 4: delete customer rows
            delete: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        if (table === "bookings") {
          // Step 2: anonymize bookings
          return {
            update: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        if (table === "callback_requests") {
          // Step 3: delete callbacks by phone
          return {
            delete: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {};
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { deleteCustomers } = await import("@/app/actions/customers");
    const result = await deleteCustomers(["c1", "c2"]);

    expect(result.success).toBe(true);
  });

  it("returns fail on DB delete error", async () => {
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { role: "owner" } }),
          };
        }
        if (table === "customers") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [{ id: "c1", phone_number: "+39123" }], error: null }),
              }),
            }),
            // Step 4 fails
            delete: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: { message: "delete error" } }),
              }),
            }),
          };
        }
        if (table === "bookings") {
          return {
            update: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        }
        if (table === "callback_requests") {
          return {
            delete: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {};
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { deleteCustomers } = await import("@/app/actions/customers");
    const result = await deleteCustomers(["c1"]);
    expect(result.success).toBe(false);
  });
});

// ── getAllCustomers ─────────────────────────────────────────────────────────────

describe("getAllCustomers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { getAllCustomers } = await import("@/app/actions/customers");
    expect(await getAllCustomers()).toEqual([]);
  });

  it("returns all customers ordered by name", async () => {
    const customers = [{ id: "c1", name: "Anna" }, { id: "c2", name: "Zara" }];
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: customers, error: null }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { getAllCustomers } = await import("@/app/actions/customers");
    const result = await getAllCustomers();

    expect(result).toEqual(customers);
  });

  it("returns empty array on DB error", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "err" } }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { getAllCustomers } = await import("@/app/actions/customers");
    expect(await getAllCustomers()).toEqual([]);
  });
});
