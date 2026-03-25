import { describe, it, expect, vi, beforeEach } from "vitest";
import { createOrder } from "@/app/actions/order-actions";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Mock Supabase Clients
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

// Mock Next.js cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock UUID
vi.mock("uuid", () => ({
  v4: () => "mock-uuid",
}));

// Mock push notifications to prevent unhandled rejections from createAdminClient
vi.mock("@/lib/push-notifications", () => ({
  sendPushToOrganization: vi.fn(),
}));

describe("order-actions", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  describe("createOrder", () => {
    it("successfully creates an order and its items", async () => {
      const orderData = {
        organization_id: "org-123",
        location_id: "loc-123",
        table_id: "table-123",
        guest_name: "Jane Doe",
        items: [
          { menu_item_id: "item-1", name: "Pizza", price: 10, quantity: 2 },
          { menu_item_id: "item-2", name: "Soda", price: 2, quantity: 1 },
        ],
      };

      // Mock booking check (no active booking)
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }),
          };
        }
        if (table === "orders") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === "order_items") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return mockSupabase;
      });

      const result = await createOrder(orderData);

      expect(result.success).toBe(true);
      if (result.success) expect(result.orderId).toBe("mock-uuid");
      expect(revalidatePath).toHaveBeenCalledWith(
        `/m/${orderData.location_id}`,
      );
    });

    it("returns error if order insertion fails", async () => {
      const orderData = {
        organization_id: "org-123",
        location_id: "loc-123",
        table_id: "table-123",
        items: [],
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "bookings") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }),
          };
        }
        if (table === "orders") {
          return {
            insert: vi
              .fn()
              .mockResolvedValue({ error: { message: "DB Error" } }),
          };
        }
        return mockSupabase;
      });

      const result = await createOrder(orderData);

      expect(result).toEqual({ success: false, error: "Impossibile creare l'ordine" });
    });
  });
});
