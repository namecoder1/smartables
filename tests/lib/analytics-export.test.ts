import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock("@/lib/supabase-helpers", () => ({
  requireAuth: mockRequireAuth,
}));

const mockQueryBookings = vi.fn();
const mockQueryOrders = vi.fn();
const mockQueryCustomers = vi.fn();
const mockQueryWhatsAppMessages = vi.fn();

vi.mock("@/lib/analytics/queries", () => ({
  queryBookings: mockQueryBookings,
  queryOrders: mockQueryOrders,
  queryCustomers: mockQueryCustomers,
  queryWhatsAppMessages: mockQueryWhatsAppMessages,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAuth(orgId = "org_123") {
  return {
    success: true as const,
    supabase: {},
    user: { id: "user_123" },
    organizationId: orgId,
    organization: { id: orgId },
    locations: [],
  };
}

// ── Tests: CSV formatting (via exportBookingsCSV) ──────────────────────────────

describe("CSV formatting", () => {
  beforeEach(() => vi.clearAllMocks());

  it("produces a header row followed by data rows", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    mockQueryBookings.mockResolvedValue([
      { id: "b1", booking_time: "2025-01-01T20:00:00Z", guest_name: "Mario", guest_phone: "+39340123", guests_count: 2, source: "whatsapp", status: "confirmed", customer_id: "c1", created_at: "2025-01-01" },
    ]);

    const { exportBookingsCSV } = await import("@/lib/analytics/export");
    const result = await exportBookingsCSV();

    expect("error" in result).toBe(false);
    if ("csv" in result) {
      const lines = result.csv.split("\n");
      expect(lines[0]).toBe("id,booking_time,guest_name,guest_phone,guests_count,source,status,customer_id,created_at");
      expect(lines[1]).toContain("b1");
      expect(lines[1]).toContain("Mario");
    }
  });

  it("escapes values containing commas with double quotes", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    mockQueryBookings.mockResolvedValue([
      { id: "b1", booking_time: "", guest_name: "Rossi, Mario", guest_phone: "", guests_count: 1, source: "", status: "", customer_id: null, created_at: "" },
    ]);

    const { exportBookingsCSV } = await import("@/lib/analytics/export");
    const result = await exportBookingsCSV();

    if ("csv" in result) {
      expect(result.csv).toContain('"Rossi, Mario"');
    }
  });

  it("escapes values containing double quotes by doubling them", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    mockQueryBookings.mockResolvedValue([
      { id: "b1", booking_time: "", guest_name: 'He said "ciao"', guest_phone: "", guests_count: 1, source: "", status: "", customer_id: null, created_at: "" },
    ]);

    const { exportBookingsCSV } = await import("@/lib/analytics/export");
    const result = await exportBookingsCSV();

    if ("csv" in result) {
      expect(result.csv).toContain('"He said ""ciao"""');
    }
  });

  it("renders null values as empty strings", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    mockQueryBookings.mockResolvedValue([
      { id: "b1", booking_time: null, guest_name: null, guest_phone: null, guests_count: null, source: null, status: null, customer_id: null, created_at: null },
    ]);

    const { exportBookingsCSV } = await import("@/lib/analytics/export");
    const result = await exportBookingsCSV();

    if ("csv" in result) {
      const dataLine = result.csv.split("\n")[1];
      expect(dataLine).toBe("b1,,,,,,,,");
    }
  });

  it("produces only header row when data is empty", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    mockQueryBookings.mockResolvedValue([]);

    const { exportBookingsCSV } = await import("@/lib/analytics/export");
    const result = await exportBookingsCSV();

    if ("csv" in result) {
      const lines = result.csv.split("\n");
      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe("id,booking_time,guest_name,guest_phone,guests_count,source,status,customer_id,created_at");
    }
  });
});

// ── Tests: exportBookingsCSV ──────────────────────────────────────────────────

describe("exportBookingsCSV", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });

    const { exportBookingsCSV } = await import("@/lib/analytics/export");
    const result = await exportBookingsCSV();

    expect(result).toEqual({ error: "Non autorizzato" });
  });

  it("returns CSV with correct filename", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    mockQueryBookings.mockResolvedValue([]);

    const { exportBookingsCSV } = await import("@/lib/analytics/export");
    const result = await exportBookingsCSV();

    if ("filename" in result) {
      expect(result.filename).toBe("prenotazioni.csv");
    }
  });

  it("passes date filters to queryBookings", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    mockQueryBookings.mockResolvedValue([]);

    const { exportBookingsCSV } = await import("@/lib/analytics/export");
    await exportBookingsCSV("2025-01-01", "2025-01-31");

    expect(mockQueryBookings).toHaveBeenCalledWith(
      "org_123",
      new Date("2025-01-01"),
      new Date("2025-01-31"),
    );
  });

  it("passes undefined dates when no filter provided", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    mockQueryBookings.mockResolvedValue([]);

    const { exportBookingsCSV } = await import("@/lib/analytics/export");
    await exportBookingsCSV();

    expect(mockQueryBookings).toHaveBeenCalledWith("org_123", undefined, undefined);
  });
});

// ── Tests: exportCustomersCSV ─────────────────────────────────────────────────

describe("exportCustomersCSV", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });

    const { exportCustomersCSV } = await import("@/lib/analytics/export");
    const result = await exportCustomersCSV();

    expect(result).toEqual({ error: "Non autorizzato" });
  });

  it("returns CSV with correct filename and columns", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    mockQueryCustomers.mockResolvedValue([
      { id: "c1", name: "Mario Rossi", phone_number: "+39340123", total_visits: 5, last_visit: "2025-01-01", created_at: "2024-06-01" },
    ]);

    const { exportCustomersCSV } = await import("@/lib/analytics/export");
    const result = await exportCustomersCSV();

    if ("csv" in result && "filename" in result) {
      expect(result.filename).toBe("clienti.csv");
      const header = result.csv.split("\n")[0];
      expect(header).toBe("id,name,phone_number,total_visits,last_visit,created_at");
    }
  });
});

// ── Tests: exportOrdersCSV ────────────────────────────────────────────────────

describe("exportOrdersCSV", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });

    const { exportOrdersCSV } = await import("@/lib/analytics/export");
    const result = await exportOrdersCSV();

    expect(result).toEqual({ error: "Non autorizzato" });
  });

  it("returns CSV with correct filename and columns", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    mockQueryOrders.mockResolvedValue([
      { id: "o1", created_at: "2025-01-01", total_amount: 45.50, status: "completed" },
    ]);

    const { exportOrdersCSV } = await import("@/lib/analytics/export");
    const result = await exportOrdersCSV();

    if ("csv" in result && "filename" in result) {
      expect(result.filename).toBe("ordini.csv");
      const header = result.csv.split("\n")[0];
      expect(header).toBe("id,created_at,total_amount,status");
    }
  });
});

// ── Tests: exportWhatsAppCSV ──────────────────────────────────────────────────

describe("exportWhatsAppCSV", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });

    const { exportWhatsAppCSV } = await import("@/lib/analytics/export");
    const result = await exportWhatsAppCSV();

    expect(result).toEqual({ error: "Non autorizzato" });
  });

  it("returns CSV with correct filename and columns", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    mockQueryWhatsAppMessages.mockResolvedValue([
      { id: "m1", direction: "inbound", status: "delivered", cost_implication: false, created_at: "2025-01-01" },
    ]);

    const { exportWhatsAppCSV } = await import("@/lib/analytics/export");
    const result = await exportWhatsAppCSV();

    if ("csv" in result && "filename" in result) {
      expect(result.filename).toBe("messaggi-whatsapp.csv");
      const header = result.csv.split("\n")[0];
      expect(header).toBe("id,direction,status,cost_implication,created_at");
    }
  });

  it("passes date filters to queryWhatsAppMessages", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    mockQueryWhatsAppMessages.mockResolvedValue([]);

    const { exportWhatsAppCSV } = await import("@/lib/analytics/export");
    await exportWhatsAppCSV("2025-01-01", "2025-01-31");

    expect(mockQueryWhatsAppMessages).toHaveBeenCalledWith(
      "org_123",
      new Date("2025-01-01"),
      new Date("2025-01-31"),
    );
  });
});
