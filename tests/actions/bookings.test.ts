import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBooking } from "@/app/actions/bookings";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Mock Supabase Server Client
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock Next.js cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("bookings actions", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      // check_booking_capacity RPC — always returns available
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    };
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  describe("createBooking", () => {
    it("returns unauthorized error if no user is found", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const formData = new FormData();
      const result = await createBooking({}, formData);

      expect(result).toEqual({ error: "Unauthorized", success: false });
    });

    it("returns unauthorized error if no organization is found for the user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      });
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }),
          };
        }
        return mockSupabase;
      });

      const formData = new FormData();
      const result = await createBooking({}, formData);

      // getAuthContext throws for both no-user and no-org cases,
      // and createBooking catches it as a generic "Unauthorized"
      expect(result).toEqual({
        error: "Unauthorized",
        success: false,
      });
    });

    it("returns error for missing required fields", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      });
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi
              .fn()
              .mockResolvedValue({ data: { organization_id: "org-123" } }),
          };
        }
        return mockSupabase;
      });

      const formData = new FormData();
      // Missing guests, date, location
      const result = await createBooking({}, formData);

      expect(result).toEqual({
        error: "Missing required fields (guests, date, or location)",
        success: false,
      });
    });

    it("successfully creates a booking for a known customer", async () => {
      const orgId = "org-123";
      const locId = "loc-123";
      const customerId = "cust-123";

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
      });

      // Mock profile
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi
              .fn()
              .mockResolvedValue({ data: { organization_id: orgId } }),
          };
        }
        if (table === "customers") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { name: "John Doe", phone_number: "123456789" },
            }),
          };
        }
        if (table === "bookings") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "booking-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return mockSupabase;
      });

      const formData = new FormData();
      formData.append("isKnownCustomer", "true");
      formData.append("selectedCustomer", customerId);
      formData.append("location_id", locId);
      formData.append("guests", "2");
      formData.append("date", "2024-12-25T19:00:00Z");

      const result = await createBooking({}, formData);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Booking created successfully");
      expect(revalidatePath).toHaveBeenCalled();
    });
  });
});
