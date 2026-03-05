import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, logout, deleteBooking } from "@/utils/supabase/actions";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Mock Supabase Server Client
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock Next.js
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("supabase actions", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      auth: {
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
      },
      from: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  describe("login", () => {
    it("redirects to home on successful login", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({ error: null });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");

      await login(formData);

      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
      expect(redirect).toHaveBeenCalledWith("/home");
    });

    it("redirects to login with error on failure", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        error: { message: "Invalid" },
      });

      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "wrong");

      await login(formData);

      expect(redirect).toHaveBeenCalledWith(
        "/login?error=Password errata o email non esistente",
      );
    });
  });

  describe("logout", () => {
    it("signs out and redirects to root", async () => {
      await logout();

      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
      expect(redirect).toHaveBeenCalledWith("/");
    });
  });

  describe("deleteBooking", () => {
    it("successfully deletes a booking", async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const result = await deleteBooking("booking-123");

      expect(result).toEqual({ success: true });
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });

    it("returns error if deletion fails", async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: "Delete failed" } }),
      });

      const result = await deleteBooking("booking-123");

      expect(result).toEqual({ success: false, error: "Delete failed" });
    });
  });
});
