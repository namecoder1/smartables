/**
 * Canonical Stripe webhook event factories.
 *
 * These mirror the shape of Stripe events as received via `stripe.webhooks.constructEvent`.
 * Use in tests to avoid duplicating large inline object literals.
 */

export const ORG_ID = "org_test_123";
export const SUBSCRIPTION_ID = "sub_test_123";
export const CUSTOMER_ID = "cus_test_123";
export const PRICE_ID = "price_growth_monthly";

// ─── Object builders ─────────────────────────────────────────────────────────

export function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: SUBSCRIPTION_ID,
    customer: CUSTOMER_ID,
    status: "active",
    cancel_at_period_end: false,
    current_period_start: 1700000000,
    current_period_end: 1702592000,
    metadata: { organization_id: ORG_ID },
    items: {
      data: [
        {
          price: { id: PRICE_ID },
          period: { start: 1700000000, end: 1702592000 },
        },
      ],
    },
    ...overrides,
  };
}

export function makeInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: "inv_test_123",
    customer: CUSTOMER_ID,
    subscription: SUBSCRIPTION_ID,
    amount_paid: 2900,
    amount_due: 2900,
    currency: "eur",
    invoice_pdf: "https://example.com/invoice.pdf",
    lines: {
      data: [
        {
          description: "Growth Plan",
          period: { start: 1700000000, end: 1702592000 },
        },
      ],
    },
    payment_intent: "pi_test_123",
    ...overrides,
  };
}

// ─── Event envelope builder ───────────────────────────────────────────────────

export function makeStripeEvent(
  type: string,
  data: Record<string, unknown>,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: "evt_test_123",
    type,
    created: 1700000000,
    data: { object: data },
    ...overrides,
  };
}

// ─── Pre-built events ─────────────────────────────────────────────────────────

export const subscriptionCreatedEvent = makeStripeEvent(
  "customer.subscription.created",
  makeSubscription(),
);

export const subscriptionUpdatedEvent = makeStripeEvent(
  "customer.subscription.updated",
  makeSubscription({ status: "past_due" }),
);

export const subscriptionDeletedEvent = makeStripeEvent(
  "customer.subscription.deleted",
  makeSubscription({ status: "canceled" }),
);

export const invoicePaidEvent = makeStripeEvent(
  "invoice.paid",
  makeInvoice(),
);

export const invoicePaymentFailedEvent = makeStripeEvent(
  "invoice.payment_failed",
  makeInvoice({ amount_paid: 0 }),
);
