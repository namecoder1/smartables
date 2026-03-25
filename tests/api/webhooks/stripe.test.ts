import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("t=123,v1=abc"),
  }),
}));

const mockConstructEvent = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();
const mockSubscriptionsUpdate = vi.fn();
const mockSubscriptionsCancel = vi.fn();
const mockInvoicesRetrieve = vi.fn();

vi.mock("@/utils/stripe/client", () => ({
  stripe: {
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: {
      retrieve: mockSubscriptionsRetrieve,
      update: mockSubscriptionsUpdate,
      cancel: mockSubscriptionsCancel,
    },
    invoices: { retrieve: mockInvoicesRetrieve },
  },
}));

const mockResendSend = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: {}, error: null }),
);
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockResendSend } };
  }),
}));

vi.mock("@react-email/components", () => ({
  render: vi.fn().mockResolvedValue("<html>email</html>"),
}));

vi.mock("@/emails/payment-failed", () => ({ default: vi.fn() }));
vi.mock("@/emails/account-suspended", () => ({ default: vi.fn() }));
vi.mock("@/emails/subscription-expiring", () => ({ default: vi.fn() }));

vi.mock("@/lib/plans", () => ({
  findPlanByPriceId: vi.fn().mockReturnValue({ id: "growth" }),
}));

vi.mock("@/lib/addons", () => ({
  computeAddonConfig: vi.fn().mockReturnValue({
    extra_contacts_wa: 0,
    extra_kb_chars: 0,
    extra_storage_gb: 0,
  }),
  getAddonPriceMap: vi.fn().mockReturnValue({}),
}));

let mockSupabase: any;

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: string = "{}"): Request {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body,
    headers: { "Stripe-Signature": "t=123,v1=abc" },
  });
}

function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub_123",
    status: "active",
    cancel_at_period_end: false,
    current_period_start: 1700000000,
    current_period_end: 1702592000,
    items: {
      data: [
        {
          price: { id: "price_growth_monthly" },
          period: { start: 1700000000, end: 1702592000 },
        },
      ],
    },
    ...overrides,
  };
}

function makeInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: "inv_123",
    amount_paid: 2900,
    amount_due: 2900,
    currency: "eur",
    invoice_pdf: "https://invoice.pdf",
    lines: {
      data: [
        {
          description: "Growth Plan",
          period: { start: 1700000000, end: 1702592000 },
        },
      ],
    },
    payment_intent: "pi_123",
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
  });

  it("returns 400 when Stripe signature is invalid", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("Invalid signature");
  });

  describe("checkout.session.completed", () => {
    it("updates organization when subscription checkout completes", async () => {
      const subscription = makeSubscription();
      const invoice = makeInvoice();

      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            mode: "subscription",
            subscription: "sub_123",
            customer: "cus_123",
            metadata: { organization_id: "org_123" },
            invoice: "inv_123",
          },
        },
      });

      mockSubscriptionsRetrieve.mockResolvedValue(subscription);
      mockSubscriptionsUpdate.mockResolvedValue(subscription);
      mockInvoicesRetrieve.mockResolvedValue(invoice);

      // transactions dedup check returns null (no existing)
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "transactions") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(mockSubscriptionsRetrieve).toHaveBeenCalledWith("sub_123");
    });

    it("ignores non-subscription checkout sessions", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: {
            mode: "payment",
            metadata: { organization_id: "org_123" },
          },
        },
      });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(mockSubscriptionsRetrieve).not.toHaveBeenCalled();
    });

    it("ignores sessions without organization_id metadata", async () => {
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: {
          object: { mode: "subscription", metadata: {} },
        },
      });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(mockSubscriptionsRetrieve).not.toHaveBeenCalled();
    });
  });

  describe("customer.subscription.updated", () => {
    it("syncs subscription data and addon config", async () => {
      const subscription = makeSubscription({ status: "active" });
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: { object: { id: "sub_123" }, previous_attributes: {} },
      });
      mockSubscriptionsRetrieve.mockResolvedValue(subscription);

      const updateMock = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: updateMock }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { name: "Test", billing_email: "t@test.it" } }),
      });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(mockSubscriptionsRetrieve).toHaveBeenCalledWith("sub_123");
    });

    it("sends account-suspended email when status becomes past_due", async () => {
      const subscription = makeSubscription({ status: "past_due" });
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.updated",
        data: {
          object: { id: "sub_123" },
          previous_attributes: { status: "active" },
        },
      });
      mockSubscriptionsRetrieve.mockResolvedValue(subscription);

      mockSupabase.from.mockImplementation((table: string) => {
        const updateEq = vi.fn().mockResolvedValue({ error: null });
        return {
          update: vi.fn().mockReturnValue({ eq: updateEq }),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { name: "Ristorante", billing_email: "owner@rist.it" },
          }),
        };
      });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(mockResendSend).toHaveBeenCalled();
      const call = mockResendSend.mock.calls[0][0];
      expect(call.subject).toContain("sospeso");
    });
  });

  describe("customer.subscription.deleted", () => {
    it("sends subscription-expiring email", async () => {
      const subscription = makeSubscription({ status: "canceled" });
      mockConstructEvent.mockReturnValue({
        type: "customer.subscription.deleted",
        data: { object: { id: "sub_123" }, previous_attributes: {} },
      });
      mockSubscriptionsRetrieve.mockResolvedValue(subscription);

      mockSupabase.from.mockImplementation(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { name: "Ristorante", billing_email: "owner@rist.it" },
        }),
      }));

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(mockResendSend).toHaveBeenCalled();
      const call = mockResendSend.mock.calls[0][0];
      expect(call.subject).toContain("scaduto");
    });
  });

  describe("invoice.payment_succeeded", () => {
    it("resets whatsapp_usage_count and records transaction", async () => {
      const invoice = makeInvoice({ subscription: "sub_123" });
      mockConstructEvent.mockReturnValue({
        type: "invoice.payment_succeeded",
        data: { object: invoice },
      });

      const orgUpdate = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "organizations") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: "org_123" }, error: null }),
            update: vi.fn().mockReturnValue({ eq: orgUpdate }),
          };
        }
        if (table === "transactions") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return mockSupabase;
      });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(orgUpdate).toHaveBeenCalled();
    });

    it("skips org update when subscription not found", async () => {
      const invoice = makeInvoice({ subscription: "sub_missing" });
      mockConstructEvent.mockReturnValue({
        type: "invoice.payment_succeeded",
        data: { object: invoice },
      });

      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }));

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
    });
  });

  describe("invoice.payment_failed", () => {
    it("sends payment-failed email using subscription ID", async () => {
      mockConstructEvent.mockReturnValue({
        type: "invoice.payment_failed",
        data: {
          object: {
            id: "inv_123",
            subscription: "sub_123",
            customer: "cus_123",
            amount_due: 2900,
            lines: { data: [] },
          },
        },
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { name: "Ristorante", billing_email: "owner@rist.it" },
        }),
      });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(mockResendSend).toHaveBeenCalled();
      const call = mockResendSend.mock.calls[0][0];
      expect(call.subject).toContain("Pagamento fallito");
    });

    it("does not send email when org has no billing_email", async () => {
      mockConstructEvent.mockReturnValue({
        type: "invoice.payment_failed",
        data: {
          object: {
            id: "inv_123",
            subscription: "sub_123",
            amount_due: 2900,
            lines: { data: [] },
          },
        },
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null }),
      });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(mockResendSend).not.toHaveBeenCalled();
    });
  });

  describe("charge.refunded", () => {
    it("records refund, cancels subscription, and resets org status", async () => {
      mockConstructEvent.mockReturnValue({
        type: "charge.refunded",
        data: {
          object: {
            id: "ch_123",
            customer: "cus_123",
            amount_refunded: 2900,
            currency: "eur",
            payment_intent: "pi_123",
          },
        },
      });

      const orgUpdate = vi.fn().mockResolvedValue({ error: null });
      const transactionInsert = vi.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "organizations") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "org_123", stripe_subscription_id: "sub_123" },
              error: null,
            }),
            update: vi.fn().mockReturnValue({ eq: orgUpdate }),
          };
        }
        if (table === "transactions") {
          return {
            insert: transactionInsert,
          };
        }
        return mockSupabase;
      });

      mockSubscriptionsCancel.mockResolvedValue({ status: "canceled" });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(transactionInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "refund",
          amount: -29,
          organization_id: "org_123",
        }),
      );
      expect(mockSubscriptionsCancel).toHaveBeenCalledWith("sub_123");
      expect(orgUpdate).toHaveBeenCalled();
    });

    it("returns 500 when org not found for refund", async () => {
      mockConstructEvent.mockReturnValue({
        type: "charge.refunded",
        data: {
          object: {
            id: "ch_123",
            customer: "cus_missing",
            amount_refunded: 1000,
            currency: "eur",
          },
        },
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      });

      const { POST } = await import("@/app/api/webhooks/stripe/route");
      const res = await POST(makeRequest());

      expect(res.status).toBe(500);
    });
  });

  it("returns 200 for unknown event types", async () => {
    mockConstructEvent.mockReturnValue({
      type: "payment_intent.created",
      data: { object: {} },
    });

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
  });
});
