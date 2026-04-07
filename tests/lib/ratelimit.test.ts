import { describe, it, expect, vi, beforeEach } from "vitest";

// Stub env vars before the module is imported (top-level throw guard)
vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://fake-redis.upstash.io");
vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "fake-token");

// Mock @upstash/redis and @upstash/ratelimit before dynamic import
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(function () {}),
}));

const mockLimit = vi.fn();

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: Object.assign(
    vi.fn().mockImplementation(function () {
      this.limit = mockLimit;
    }),
    {
      slidingWindow: vi.fn().mockReturnValue("sliding-window-config"),
    }
  ),
}));

// Dynamic import so mocks are in place first
const { checkRateLimit, checkOrderRateLimit, checkFlowRateLimit } = await import(
  "@/lib/ratelimit"
);

describe("lib/ratelimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkRateLimit (booking)", () => {
    it("returns success:true with limit metadata when not rate-limited", async () => {
      mockLimit.mockResolvedValue({ success: true, limit: 2, reset: 1234567890, remaining: 1 });

      const result = await checkRateLimit("1.2.3.4");

      expect(result).toEqual({ success: true, limit: 2, reset: 1234567890, remaining: 1 });
    });

    it("returns success:false when rate limit is exceeded", async () => {
      mockLimit.mockResolvedValue({ success: false, limit: 2, reset: 9999999999, remaining: 0 });

      const result = await checkRateLimit("1.2.3.4");

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("calls limit with the provided IP", async () => {
      mockLimit.mockResolvedValue({ success: true, limit: 2, reset: 0, remaining: 2 });

      await checkRateLimit("5.6.7.8");

      expect(mockLimit).toHaveBeenCalledWith("5.6.7.8");
    });

    it("exposes limit, reset, remaining in the returned object", async () => {
      mockLimit.mockResolvedValue({ success: true, limit: 2, reset: 111, remaining: 1 });

      const result = await checkRateLimit("1.1.1.1");

      expect(Object.keys(result)).toEqual(
        expect.arrayContaining(["success", "limit", "reset", "remaining"])
      );
    });
  });

  describe("checkOrderRateLimit (order)", () => {
    it("returns success:true when not rate-limited", async () => {
      mockLimit.mockResolvedValue({ success: true, limit: 10, reset: 0, remaining: 9 });

      const result = await checkOrderRateLimit("1.2.3.4");

      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
    });

    it("returns success:false when rate limit is exceeded", async () => {
      mockLimit.mockResolvedValue({ success: false, limit: 10, reset: 0, remaining: 0 });

      const result = await checkOrderRateLimit("1.2.3.4");

      expect(result.success).toBe(false);
    });

    it("calls limit with the provided IP", async () => {
      mockLimit.mockResolvedValue({ success: true, limit: 10, reset: 0, remaining: 10 });

      await checkOrderRateLimit("9.8.7.6");

      expect(mockLimit).toHaveBeenCalledWith("9.8.7.6");
    });
  });

  describe("checkFlowRateLimit (WhatsApp flow)", () => {
    it("returns success:true when not rate-limited", async () => {
      mockLimit.mockResolvedValue({ success: true, limit: 60, reset: 0, remaining: 59 });

      const result = await checkFlowRateLimit("1.2.3.4");

      expect(result.success).toBe(true);
      expect(result.limit).toBe(60);
    });

    it("returns success:false when rate limit is exceeded", async () => {
      mockLimit.mockResolvedValue({ success: false, limit: 60, reset: 0, remaining: 0 });

      const result = await checkFlowRateLimit("1.2.3.4");

      expect(result.success).toBe(false);
    });

    it("calls limit with the provided IP", async () => {
      mockLimit.mockResolvedValue({ success: true, limit: 60, reset: 0, remaining: 60 });

      await checkFlowRateLimit("10.0.0.1");

      expect(mockLimit).toHaveBeenCalledWith("10.0.0.1");
    });
  });
});
