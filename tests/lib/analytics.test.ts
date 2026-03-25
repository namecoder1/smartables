import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  calcBookingSources,
  calcHottestDays,
  calcHottestHours,
  calcAverageCovers,
  calcGroupSizeDistribution,
  calcWhatsAppStats,
  calcCustomerMetrics,
  calcLongTermTrend,
} from "@/lib/analytics/calculations";
import type { RawBooking, RawCustomer, RawWhatsAppMessage } from "@/lib/analytics/types";

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeBooking(overrides: Partial<RawBooking> = {}): RawBooking {
  return {
    id: "b1",
    booking_time: "2026-03-20T20:00:00Z", // Thursday
    created_at: "2026-03-20T10:00:00Z",
    source: "web",
    status: "confirmed",
    guests_count: 2,
    guest_name: "Mario",
    guest_phone: "+39123",
    customer_id: null,
    ...overrides,
  };
}

function makeCustomer(overrides: Partial<RawCustomer> = {}): RawCustomer {
  return {
    id: "c1",
    name: "Mario Rossi",
    phone_number: "+39123",
    total_visits: 1,
    last_visit: "2026-03-20T10:00:00Z",
    created_at: "2026-03-01T10:00:00Z",
    tags: [],
    ...overrides,
  };
}

function makeMessage(direction: RawWhatsAppMessage["direction"]): RawWhatsAppMessage {
  return { id: "m1", direction, status: "delivered", cost_implication: false, created_at: "" };
}

// ── calcBookingSources ────────────────────────────────────────────────────────

describe("calcBookingSources", () => {
  it("returns empty array for no bookings", () => {
    expect(calcBookingSources([])).toEqual([]);
  });

  it("counts bookings by source", () => {
    const bookings = [
      makeBooking({ source: "web" }),
      makeBooking({ source: "web" }),
      makeBooking({ source: "manual" }),
    ];
    const result = calcBookingSources(bookings);
    const webEntry = result.find((r) => r.source === "Sito Web");
    const manualEntry = result.find((r) => r.source === "Manuale");
    expect(webEntry?.value).toBe(2);
    expect(manualEntry?.value).toBe(1);
  });

  it("maps known source keys to Italian labels", () => {
    const bookings = [
      makeBooking({ source: "whatsapp_auto" }),
      makeBooking({ source: "manual" }),
      makeBooking({ source: "web" }),
      makeBooking({ source: "phone" }),
    ];
    const result = calcBookingSources(bookings);
    const labels = result.map((r) => r.source);
    expect(labels).toContain("WhatsApp Auto");
    expect(labels).toContain("Manuale");
    expect(labels).toContain("Sito Web");
    expect(labels).toContain("Telefono");
  });

  it("passes through unknown source keys as-is", () => {
    const result = calcBookingSources([makeBooking({ source: "custom_source" })]);
    expect(result[0].source).toBe("custom_source");
  });

  it("total value equals total bookings count", () => {
    const bookings = Array.from({ length: 5 }, () => makeBooking({ source: "web" }));
    const result = calcBookingSources(bookings);
    const total = result.reduce((sum, r) => sum + r.value, 0);
    expect(total).toBe(5);
  });
});

// ── calcHottestDays ───────────────────────────────────────────────────────────

describe("calcHottestDays", () => {
  it("always returns exactly 7 day entries", () => {
    expect(calcHottestDays([])).toHaveLength(7);
    expect(calcHottestDays([makeBooking()])).toHaveLength(7);
  });

  it("all bookings count is 0 for empty input", () => {
    const result = calcHottestDays([]);
    expect(result.every((d) => d.bookings === 0)).toBe(true);
  });

  it("total bookings across all days equals input count", () => {
    const bookings = [
      makeBooking({ booking_time: "2026-03-20T20:00:00Z" }), // Thursday
      makeBooking({ booking_time: "2026-03-21T12:00:00Z" }), // Saturday
      makeBooking({ booking_time: "2026-03-20T18:00:00Z" }), // Thursday again
    ];
    const result = calcHottestDays(bookings);
    const total = result.reduce((sum, d) => sum + d.bookings, 0);
    expect(total).toBe(3);
  });

  it("day names are Italian 3-letter abbreviations", () => {
    const result = calcHottestDays([]);
    const expectedDays = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
    expect(result.map((d) => d.day)).toEqual(expectedDays);
  });

  it("Sunday bookings land in the first entry (Dom)", () => {
    // 2026-03-22 is a Sunday
    const booking = makeBooking({ booking_time: "2026-03-22T12:00:00Z" });
    const result = calcHottestDays([booking]);
    expect(result[0].day).toBe("Dom");
    expect(result[0].bookings).toBe(1);
  });
});

// ── calcHottestHours ──────────────────────────────────────────────────────────

describe("calcHottestHours", () => {
  it("returns entries from startHour to endHour inclusive (default 10–23 = 14 entries)", () => {
    expect(calcHottestHours([])).toHaveLength(14);
  });

  it("respects custom startHour and endHour", () => {
    expect(calcHottestHours([], 12, 15)).toHaveLength(4);
  });

  it("hour labels are formatted as 'H:00'", () => {
    const result = calcHottestHours([]);
    expect(result[0].hour).toBe("10:00");
    expect(result[result.length - 1].hour).toBe("23:00");
  });

  it("the total booking count across all buckets matches the input", () => {
    // getHours() uses local time, so we don't assert a specific bucket —
    // instead we verify the booking is accounted for somewhere in the range.
    const booking = makeBooking({ booking_time: "2026-03-20T12:00:00Z" });
    const result = calcHottestHours([booking]);
    const total = result.reduce((sum, h) => sum + h.bookings, 0);
    expect(total).toBe(1);
  });

  it("all counts are 0 for empty input", () => {
    const result = calcHottestHours([]);
    expect(result.every((h) => h.bookings === 0)).toBe(true);
  });
});

// ── calcAverageCovers ─────────────────────────────────────────────────────────

describe("calcAverageCovers", () => {
  it("returns 0 for empty input", () => {
    expect(calcAverageCovers([])).toBe(0);
  });

  it("excludes cancelled bookings from the average", () => {
    const bookings = [
      makeBooking({ guests_count: 4, status: "confirmed" }),
      makeBooking({ guests_count: 10, status: "cancelled" }),
    ];
    expect(calcAverageCovers(bookings)).toBe(4);
  });

  it("excludes no_show bookings from the average", () => {
    const bookings = [
      makeBooking({ guests_count: 2, status: "confirmed" }),
      makeBooking({ guests_count: 20, status: "no_show" }),
    ];
    expect(calcAverageCovers(bookings)).toBe(2);
  });

  it("returns 0 when all bookings are cancelled/no_show", () => {
    const bookings = [
      makeBooking({ guests_count: 4, status: "cancelled" }),
      makeBooking({ guests_count: 2, status: "no_show" }),
    ];
    expect(calcAverageCovers(bookings)).toBe(0);
  });

  it("computes a rounded average", () => {
    const bookings = [
      makeBooking({ guests_count: 2, status: "confirmed" }),
      makeBooking({ guests_count: 3, status: "confirmed" }),
    ];
    // (2 + 3) / 2 = 2.5
    expect(calcAverageCovers(bookings)).toBe(2.5);
  });
});

// ── calcGroupSizeDistribution ─────────────────────────────────────────────────

describe("calcGroupSizeDistribution", () => {
  it("returns 4 buckets", () => {
    expect(calcGroupSizeDistribution([])).toHaveLength(4);
  });

  it("all counts are 0 for empty input", () => {
    const result = calcGroupSizeDistribution([]);
    expect(result.every((b) => b.count === 0)).toBe(true);
  });

  it("places a 2-person booking in the '1-2' bucket", () => {
    const result = calcGroupSizeDistribution([makeBooking({ guests_count: 2 })]);
    expect(result.find((b) => b.name === "1-2")?.count).toBe(1);
  });

  it("places a 6-person booking in the '5-6' bucket", () => {
    const result = calcGroupSizeDistribution([makeBooking({ guests_count: 6 })]);
    expect(result.find((b) => b.name === "5-6")?.count).toBe(1);
  });

  it("places a 10-person booking in the '7+' bucket", () => {
    const result = calcGroupSizeDistribution([makeBooking({ guests_count: 10 })]);
    expect(result.find((b) => b.name === "7+")?.count).toBe(1);
  });

  it("total across all buckets equals number of bookings", () => {
    const bookings = [1, 2, 3, 4, 5, 6, 8].map((n) =>
      makeBooking({ guests_count: n }),
    );
    const result = calcGroupSizeDistribution(bookings);
    const total = result.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(7);
  });
});

// ── calcWhatsAppStats ─────────────────────────────────────────────────────────

describe("calcWhatsAppStats", () => {
  it("computes usage percentage correctly", () => {
    const result = calcWhatsAppStats(200, 400, null, []);
    expect(result.usagePercentage).toBe(50);
  });

  it("caps usagePercentage at 100", () => {
    const result = calcWhatsAppStats(500, 400, null, []);
    expect(result.usagePercentage).toBe(100);
  });

  it("returns 0 percentage when usageCap is 0 (avoids division by zero)", () => {
    const result = calcWhatsAppStats(100, 0, null, []);
    expect(result.usagePercentage).toBe(0);
  });

  it("counts message directions correctly", () => {
    const messages = [
      makeMessage("inbound"),
      makeMessage("inbound"),
      makeMessage("outbound_bot"),
      makeMessage("outbound_human"),
    ];
    const result = calcWhatsAppStats(0, 100, "2026-03-01", messages);
    expect(result.inbound).toBe(2);
    expect(result.outboundBot).toBe(1);
    expect(result.outboundHuman).toBe(1);
    expect(result.totalMessages).toBe(4);
  });

  it("preserves billingCycleStart as-is", () => {
    const cycleStart = "2026-03-01T00:00:00Z";
    const result = calcWhatsAppStats(0, 100, cycleStart, []);
    expect(result.billingCycleStart).toBe(cycleStart);
  });
});

// ── calcCustomerMetrics ───────────────────────────────────────────────────────

describe("calcCustomerMetrics", () => {
  beforeEach(() => {
    // Fix time at 2026-03-20 so "last 30 days" = 2026-02-18 onwards
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-20T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns all zeros for empty customers list", () => {
    const result = calcCustomerMetrics([]);
    expect(result).toEqual({
      totalCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0,
      returningRate: 0,
      avgVisitsPerCustomer: 0,
    });
  });

  it("identifies returning customers (total_visits > 1)", () => {
    const customers = [
      makeCustomer({ total_visits: 3 }), // returning
      makeCustomer({ id: "c2", total_visits: 1 }), // not returning
    ];
    const result = calcCustomerMetrics(customers);
    expect(result.returningCustomers).toBe(1);
    expect(result.returningRate).toBe(50);
  });

  it("counts new customers created in the last 30 days", () => {
    const customers = [
      makeCustomer({ created_at: "2026-03-15T00:00:00Z" }), // 5 days ago → new
      makeCustomer({ id: "c2", created_at: "2026-01-01T00:00:00Z" }), // old
    ];
    const result = calcCustomerMetrics(customers);
    expect(result.newCustomers).toBe(1);
  });

  it("computes avgVisitsPerCustomer rounded to 1 decimal", () => {
    const customers = [
      makeCustomer({ total_visits: 1 }),
      makeCustomer({ id: "c2", total_visits: 2 }),
    ];
    const result = calcCustomerMetrics(customers);
    expect(result.avgVisitsPerCustomer).toBe(1.5);
  });

  it("returningRate is 0 when no customers are returning", () => {
    const result = calcCustomerMetrics([makeCustomer({ total_visits: 1 })]);
    expect(result.returningRate).toBe(0);
  });
});

// ── calcLongTermTrend ─────────────────────────────────────────────────────────

describe("calcLongTermTrend", () => {
  it("returns empty array for no bookings", () => {
    expect(calcLongTermTrend([])).toEqual([]);
  });

  it("groups bookings by date and returns sorted entries", () => {
    const bookings = [
      makeBooking({ booking_time: "2026-03-20T20:00:00Z" }),
      makeBooking({ booking_time: "2026-03-20T21:00:00Z" }),
      makeBooking({ booking_time: "2026-03-19T20:00:00Z" }),
    ];
    const result = calcLongTermTrend(bookings);
    const total = result.reduce((sum, p) => sum + p.visitors, 0);
    expect(result).toHaveLength(2); // 2 distinct dates
    expect(total).toBe(3);
  });

  it("each entry has a date string and visitors count", () => {
    const result = calcLongTermTrend([makeBooking()]);
    expect(result[0]).toHaveProperty("date");
    expect(result[0]).toHaveProperty("visitors");
    expect(typeof result[0].date).toBe("string");
    expect(typeof result[0].visitors).toBe("number");
  });
});
