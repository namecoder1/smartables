import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { assertEnv } from "@/lib/env-check";
import { stripe } from "@/utils/stripe/client";
import { createAdminClient } from "@/utils/supabase/admin";
import { findPlanByPriceId } from "@/lib/plans";
import { computeAddonConfig, getAddonPriceMap } from "@/lib/addons";
import Stripe from "stripe";
import { resend } from "@/utils/resend/client";
import { render } from "@react-email/components";
import PaymentFailedEmail from "@/emails/payment-failed";
import AccountSuspendedEmail from "@/emails/account-suspended";
import SubscriptionExpiringEmail from "@/emails/subscription-expiring";
import { captureError, captureCritical, captureWarning } from "@/lib/monitoring";

async function getBillingEmailForSubscription(
  supabase: ReturnType<typeof createAdminClient>,
  subscriptionId: string,
) {
  const { data: org } = await supabase
    .from("organizations")
    .select("name, billing_email")
    .eq("stripe_subscription_id", subscriptionId)
    .single();
  return org ?? null;
}

async function getBillingEmailForCustomer(
  supabase: ReturnType<typeof createAdminClient>,
  customerId: string,
) {
  const { data: org } = await supabase
    .from("organizations")
    .select("name, billing_email")
    .eq("stripe_customer_id", customerId)
    .single();
  return org ?? null;
}

// ── Helpers ──

async function createTransactionRecord(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
  invoice: Stripe.Invoice,
) {
  // Check if transaction already exists (avoid duplicates)
  const { data: existingTx } = await supabase
    .from("transactions")
    .select("id")
    .eq("stripe_invoice_id", invoice.id)
    .single();

  if (existingTx) return; // already recorded

  const { error: txError } = await supabase.from("transactions").insert({
    organization_id: organizationId,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    status: "succeeded",
    type: "subscription",
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: (() => {
      const pi = (invoice as unknown as { payment_intent?: string | Stripe.PaymentIntent | null }).payment_intent;
      if (!pi) return null;
      return typeof pi === "string" ? pi : pi.id;
    })(),
    invoice_pdf: invoice.invoice_pdf,
    period_start: new Date(
      invoice.lines.data[0].period.start * 1000,
    ).toISOString(),
    period_end: new Date(invoice.lines.data[0].period.end * 1000).toISOString(),
    description: invoice.lines.data[0].description || "Subscription Payment",
  });

  if (txError) {
    captureCritical(txError, {
      service: "supabase",
      flow: "transaction_record",
      organizationId,
      stripeInvoiceId: invoice.id,
    });
  }
}

export async function POST(req: Request) {
  assertEnv();
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.NODE_ENV === "production"
        ? process.env.STRIPE_WEBHOOK_KEY!
        : process.env.STRIPE_WEBHOOK_KEY_TEST!,
    );
  } catch (error) {
    captureError(error, { service: "stripe", flow: "webhook_signature_validation" });
    return new NextResponse(
      `Webhook Error: ${
        error instanceof Error ? error.message : "Unknown Error"
      }`,
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const organizationId = session.metadata?.organization_id;

    if (organizationId) {
      // If this is a subscription checkout
      if (session.mode === "subscription") {
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        // Retrieve the subscription to get the price ID and status
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);

        const priceId = subscription.items.data[0].price.id;

        // Auto-disable auto-renewal (User Request: "mettere l'autorinnovo disabilitato per ora")
        if (!subscription.cancel_at_period_end) {
          await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
          });
        }

        // Get period dates (async fetch from latest invoice if needed)
        const periodEnd = await getDateFromSubscription(
          subscription,
          "current_period_end",
        );
        const periodStart = await getDateFromSubscription(
          subscription,
          "current_period_start",
        );

        // Update Organization with subscription details
        const { error: updateError } = await supabase
          .from("organizations")
          .update({
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            stripe_price_id: priceId,
            stripe_status: subscription.status,
            stripe_current_period_end: periodEnd,
            current_billing_cycle_start: periodStart,
            billing_tier: findPlanByPriceId(priceId)?.id || "starter",
            stripe_cancel_at_period_end: subscription.cancel_at_period_end,

            ...getPlanUpdates(priceId),
          })
          .eq("id", organizationId);

        if (updateError) {
          captureCritical(updateError, { service: "stripe", flow: "checkout_subscription_update", organizationId });
          return new NextResponse("Error updating organization", {
            status: 500,
          });
        }

        // CREATE TRANSACTION FOR INITIAL PAYMENT
        if (session.invoice) {
          const invoiceId = session.invoice as string;
          const invoice = await stripe.invoices.retrieve(invoiceId);

          await createTransactionRecord(supabase, organizationId, invoice);
        }
      }
      // Handle legacy topup or just ignore?
      // For now we ignore topups as the model is pivoted.
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscriptionEvent = event.data.object as Stripe.Subscription;

    // The webhook event object may not have all fields (like current_period_end).
    // Retrieve the full subscription from the API.
    const subscription = await stripe.subscriptions.retrieve(
      subscriptionEvent.id,
    );

    // Detect plan change (proration) via previous_attributes
    type SubscriptionEventData = Stripe.Event.Data & {
      previous_attributes?: {
        status?: string;
        items?: { data?: Array<{ price?: { id?: string } }> };
      };
    };
    const previousAttributes = (event.data as SubscriptionEventData).previous_attributes;
    if (previousAttributes?.items) {
      const oldPriceId = previousAttributes.items?.data?.[0]?.price?.id;
      const newPriceId = subscription.items.data[0].price.id;
      if (oldPriceId && oldPriceId !== newPriceId) {
        const oldPlan = findPlanByPriceId(oldPriceId);
        const newPlan = findPlanByPriceId(newPriceId);
      }
    }

    // Get period dates (async fetch from latest invoice if needed)
    const periodEnd = await getDateFromSubscription(
      subscription,
      "current_period_end",
    );
    const periodStart = await getDateFromSubscription(
      subscription,
      "current_period_start",
    );

    // Separate base plan item from addon items
    const addonPriceMap = getAddonPriceMap();
    const basePlanItem =
      subscription.items.data.find((item) => !addonPriceMap[item.price.id]) ??
      subscription.items.data[0];
    const basePriceId = basePlanItem.price.id;

    // Compute addon capacities from subscription items
    const addonConfig = computeAddonConfig(subscription.items.data);

    // Effective WA cap = base plan cap + addon extra
    const basePlanUpdates = getPlanUpdates(basePriceId);
    const effectiveWaCap =
      (basePlanUpdates.usage_cap_whatsapp ?? 400) + addonConfig.extra_contacts_wa;

    // Find organization with this subscription
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        stripe_status: subscription.status,
        stripe_price_id: basePriceId,
        billing_tier: findPlanByPriceId(basePriceId)?.id || "starter",
        stripe_current_period_end: periodEnd,
        current_billing_cycle_start: periodStart,
        stripe_cancel_at_period_end: subscription.cancel_at_period_end,
        addons_config: addonConfig,
        usage_cap_whatsapp: effectiveWaCap,
      })
      .eq("stripe_subscription_id", subscription.id);

    if (updateError) {
      captureCritical(updateError, { service: "stripe", flow: "subscription_status_sync", stripeSubscriptionId: subscription.id });
      return new NextResponse("Error syncing subscription", { status: 500 });
    }

    // ── Account sospeso: send email when subscription becomes past_due ──
    if (subscription.status === "past_due" && previousAttributes?.status && previousAttributes.status !== "past_due") {
      try {
        const org = await getBillingEmailForSubscription(supabase, subscription.id);
        if (org?.billing_email) {
          const html = await render(AccountSuspendedEmail({ teamName: org.name ?? "Smartables" }));
          await resend.emails.send({
            from: "Smartables <noreply@smartables.it>",
            to: org.billing_email,
            subject: "Il tuo account è stato sospeso",
            html,
          });
        }
      } catch (emailErr) {
        captureWarning("Failed to send account-suspended email", {
          service: "resend",
          flow: "subscription_status_email",
          stripeSubscriptionId: subscription.id,
        });
      }
    }

    // ── Scadenza abbonamento: send email when subscription is deleted ──
    if (event.type === "customer.subscription.deleted") {
      try {
        const org = await getBillingEmailForSubscription(supabase, subscription.id);
        if (org?.billing_email) {
          const expiry = periodEnd
            ? new Date(periodEnd).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })
            : undefined;
          const html = await render(SubscriptionExpiringEmail({ teamName: org.name ?? "Smartables", expiryDate: expiry }));
          await resend.emails.send({
            from: "Smartables <noreply@smartables.it>",
            to: org.billing_email,
            subject: "Il tuo abbonamento Smartables è scaduto",
            html,
          });
        }
      } catch (emailErr) {
        captureWarning("Failed to send subscription-expiring email", {
          service: "resend",
          flow: "subscription_status_email",
          stripeSubscriptionId: subscription.id,
        });
      }
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = (invoice as any).subscription as string;

    if (subscriptionId) {
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("id")
        .eq("stripe_subscription_id", subscriptionId)
        .single();

      if (orgError || !orgData) {
        captureWarning("Organization not found for invoice.payment_succeeded", {
          service: "supabase",
          flow: "payment_succeeded",
          stripeSubscriptionId: subscriptionId,
          stripeInvoiceId: invoice.id,
        });
      } else {
        // Reset monthly usage counters
        // NOTE: invoice.period_start/end refers to the invoice billing period (today),
        // NOT the subscription period. Use invoice.lines.data[0].period for correct dates.
        const lineItem = invoice.lines.data[0];
        await supabase
          .from("organizations")
          .update({
            whatsapp_usage_count: 0,
            current_billing_cycle_start: new Date(
              lineItem.period.start * 1000,
            ).toISOString(),
            stripe_current_period_end: new Date(
              lineItem.period.end * 1000,
            ).toISOString(),
          })
          .eq("id", orgData.id);

        // CHECK IF TRANSACTION ALREADY EXISTS (To avoid duplicates from Checkout Session)
        const { data: existingTx } = await supabase
          .from("transactions")
          .select("id")
          .eq("stripe_invoice_id", invoice.id)
          .single();

        if (!existingTx) {
          await createTransactionRecord(supabase, orgData.id, invoice);
        }
      }
    }
  }

  // ── Pagamento fallito ──────────────────────────────────────────────────────
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const rawSub = (invoice as unknown as { subscription?: string | Stripe.Subscription | null }).subscription;
    const subscriptionId = typeof rawSub === "string" ? rawSub : rawSub?.id ?? null;
    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

    try {
      const org = subscriptionId
        ? await getBillingEmailForSubscription(supabase, subscriptionId)
        : customerId
          ? await getBillingEmailForCustomer(supabase, customerId)
          : null;

      if (org?.billing_email) {
        const amount = invoice.amount_due
          ? `€${(invoice.amount_due / 100).toFixed(2).replace(".", ",")}`
          : undefined;
        const html = await render(PaymentFailedEmail({ teamName: org.name ?? "Smartables", amount }));
        await resend.emails.send({
          from: "Smartables <noreply@smartables.it>",
          to: org.billing_email,
          subject: "Pagamento fallito — aggiorna il metodo di pagamento",
          html,
        });
      }
    } catch (emailErr) {
      captureWarning("Failed to send payment-failed email", {
        service: "resend",
        flow: "payment_failed_email",
        stripeInvoiceId: invoice.id,
      });
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const customerId =
      typeof charge.customer === "string"
        ? charge.customer
        : charge.customer?.id;

    if (customerId) {
      // Find organization by stripe_customer_id
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id, stripe_subscription_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (orgError || !org) {
        captureCritical(orgError ?? new Error("Organization not found for refund"), {
          service: "supabase",
          flow: "charge_refunded",
          stripeCustomerId: customerId,
          stripeChargeId: charge.id,
        });
        return new NextResponse("Organization not found for refund", {
          status: 500,
        });
      }

      // 1. Record refund transaction
      const { error: refundTxError } = await supabase.from("transactions").insert({
        organization_id: org.id,
        amount: -(charge.amount_refunded / 100),
        currency: charge.currency,
        status: "succeeded",
        type: "refund",
        stripe_payment_intent_id:
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id || null,
        description: "Rimborso effettuato da Stripe",
        metadata: {
          charge_id: charge.id,
          refund_amount: charge.amount_refunded,
        },
      });

      if (refundTxError) {
        captureCritical(refundTxError, {
          service: "supabase",
          flow: "charge_refunded",
          organizationId: org.id,
          stripeChargeId: charge.id,
        });
      }

      // 2. Cancel the subscription if still active
      if (org.stripe_subscription_id) {
        try {
          await stripe.subscriptions.cancel(org.stripe_subscription_id);
        } catch (cancelError) {
          captureWarning("Subscription cancel failed during refund (may already be canceled)", {
            service: "stripe",
            flow: "charge_refunded",
            organizationId: org.id,
            stripeSubscriptionId: org.stripe_subscription_id,
            stripeChargeId: charge.id,
          });
        }
      }

      // 3. Update organization status
      const { error: updateError } = await supabase
        .from("organizations")
        .update({
          stripe_status: "canceled",
          stripe_price_id: null,
          stripe_subscription_id: null,
          stripe_cancel_at_period_end: false,
        })
        .eq("id", org.id);

      if (updateError) {
        captureCritical(updateError, {
          service: "supabase",
          flow: "charge_refunded",
          organizationId: org.id,
          stripeChargeId: charge.id,
        });
        return new NextResponse("Error updating organization after refund", {
          status: 500,
        });
      }

    }
  }

  return new NextResponse(null, { status: 200 });
}

function getPlanUpdates(priceId: string): { usage_cap_whatsapp: number } {
  const plan = findPlanByPriceId(priceId);
  if (!plan) return { usage_cap_whatsapp: 400 };

  // Base plan WA contact limits (matching subscription_plans.limits.wa_contacts)
  if (plan.id === "growth") return { usage_cap_whatsapp: 1200 };
  if (plan.id === "business") return { usage_cap_whatsapp: 3500 };
  return { usage_cap_whatsapp: 400 }; // starter
}

type SubscriptionWithPeriod = Stripe.Subscription & {
  current_period_start?: number;
  current_period_end?: number;
  latest_invoice?: string | Stripe.Invoice | null;
};

async function getDateFromSubscription(
  subscription: SubscriptionWithPeriod,
  key: "current_period_start" | "current_period_end",
): Promise<string> {
  // 1. Try direct access on subscription object (older API versions)
  let val = subscription[key];

  // 2. If not found, try from subscription.items.data[0].period (some API versions)
  if (val === undefined || val === null) {
    const item = subscription.items?.data?.[0];
    const itemPeriod = (item as unknown as { period?: { start: number; end: number } } | undefined)?.period;
    if (itemPeriod) {
      if (key === "current_period_end") {
        val = itemPeriod.end;
      } else if (key === "current_period_start") {
        val = itemPeriod.start;
      }
    }
  }

  // 3. If still not found, fetch the latest invoice and get period from line items
  if (val === undefined || val === null) {
    const latestInvoiceId = subscription.latest_invoice;
    if (latestInvoiceId) {
      try {
        const invoice = await stripe.invoices.retrieve(
          typeof latestInvoiceId === "string"
            ? latestInvoiceId
            : latestInvoiceId.id,
        );
        const lineItem = invoice.lines?.data?.[0];
        if (lineItem?.period) {
          if (key === "current_period_end") {
            val = lineItem.period.end;
          } else if (key === "current_period_start") {
            val = lineItem.period.start;
          }
        }
      } catch (e) {
        captureWarning("Error fetching latest invoice for subscription period dates", { service: "stripe", flow: "subscription_period_sync" });
      }
    }
  }

  // 4. Still not found? Log and return current date as fallback
  if (val === undefined || val === null) {
    captureWarning(`Subscription period date "${key}" not found — using current date as fallback`, {
      service: "stripe",
      flow: "subscription_period_sync",
      stripeSubscriptionId: subscription.id,
      missingKey: key,
    });
    return new Date().toISOString(); // Fallback
  }

  return new Date(val * 1000).toISOString();
}
