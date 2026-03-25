import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock("@/lib/supabase-helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockSearchAvailableNumbers = vi.fn();
const mockPurchasePhoneNumber = vi.fn();
vi.mock("@/lib/telnyx", () => ({
  searchAvailableNumbers: mockSearchAvailableNumbers,
  purchasePhoneNumber: mockPurchasePhoneNumber,
}));

let mockRollbackSupabase: any;
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => mockRollbackSupabase),
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

// ── searchNumbersAction ────────────────────────────────────────────────────────

describe("searchNumbersAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { searchNumbersAction } = await import("@/app/actions/telnyx-numbers");
    const result = await searchNumbersAction("IT", "MI");
    expect(result.success).toBe(false);
  });

  it("returns available numbers on success", async () => {
    const numbers = [{ phone_number: "+39021234567" }, { phone_number: "+39029876543" }];
    mockSearchAvailableNumbers.mockResolvedValue(numbers);
    mockRequireAuth.mockResolvedValue(makeAuth({}));

    const { searchNumbersAction } = await import("@/app/actions/telnyx-numbers");
    const result = await searchNumbersAction("IT", "MI");

    expect(result).toEqual(numbers);
    expect(mockSearchAvailableNumbers).toHaveBeenCalledWith("IT", "MI");
  });

  it("returns fail when Telnyx API throws", async () => {
    mockSearchAvailableNumbers.mockRejectedValue(new Error("Telnyx API down"));
    mockRequireAuth.mockResolvedValue(makeAuth({}));

    const { searchNumbersAction } = await import("@/app/actions/telnyx-numbers");
    const result = await searchNumbersAction("IT", "MI");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Telnyx API down");
  });
});

// ── buyNumberAction ────────────────────────────────────────────────────────────

describe("buyNumberAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRollbackSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }),
    };
  });

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { buyNumberAction } = await import("@/app/actions/telnyx-numbers");
    const result = await buyNumberAction("+39021234567", "loc_1", "req_group_1");
    expect(result.success).toBe(false);
  });

  it("returns fail when location is already purchasing (lock denied)", async () => {
    // Atomic lock fails → data is null
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { buyNumberAction } = await import("@/app/actions/telnyx-numbers");
    const result = await buyNumberAction("+39021234567", "loc_1", "req_group_1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unable to initiate purchase");
  });

  it("purchases number and saves to location on success", async () => {
    const location = { id: "loc_1", telnyx_phone_number: null };
    mockPurchasePhoneNumber.mockResolvedValue(undefined);

    const updateInEq = vi.fn().mockResolvedValue({ error: null });
    const secondUpdate = vi.fn().mockReturnValue({ eq: updateInEq });
    let callIndex = 0;

    const supabase = {
      from: vi.fn().mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) {
          // Atomic lock update
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  neq: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: location, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        // Second update: save phone number
        return { update: secondUpdate };
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { buyNumberAction } = await import("@/app/actions/telnyx-numbers");
    const result = await buyNumberAction("+39021234567", "loc_1", "req_group_1");

    expect(result).toEqual({ success: true });
    expect(mockPurchasePhoneNumber).toHaveBeenCalledWith("+39021234567", "req_group_1");
    expect(secondUpdate).toHaveBeenCalledWith({
      telnyx_phone_number: "+39021234567",
      activation_status: "provisioning",
    });
  });

  it("rolls back lock when Telnyx purchase fails", async () => {
    const location = { id: "loc_1" };
    mockPurchasePhoneNumber.mockRejectedValue(new Error("Payment failed"));

    const supabase = {
      from: vi.fn().mockImplementation(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              neq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: location, error: null }),
                }),
              }),
            }),
          }),
        }),
      })),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const rollbackUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    mockRollbackSupabase = {
      from: vi.fn().mockReturnValue({ update: rollbackUpdate }),
    };

    const { buyNumberAction } = await import("@/app/actions/telnyx-numbers");
    const result = await buyNumberAction("+39021234567", "loc_1", "req_group_1");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Payment failed");
    // Rollback should have been called
    expect(rollbackUpdate).toHaveBeenCalledWith({ activation_status: "pending" });
  });
});
