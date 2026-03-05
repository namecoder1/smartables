import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/utils/stripe/client";
import { createAdminClient } from "@/utils/supabase/admin";
import { findPlanByPriceId } from "@/lib/plans";
import Stripe from "stripe";

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

  await supabase.from("transactions").insert({
    organization_id: organizationId,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    status: "succeeded",
    type: "subscription",
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: (invoice as any).payment_intent as string,
    invoice_pdf: invoice.invoice_pdf,
    period_start: new Date(
      invoice.lines.data[0].period.start * 1000,
    ).toISOString(),
    period_end: new Date(invoice.lines.data[0].period.end * 1000).toISOString(),
    description: invoice.lines.data[0].description || "Subscription Payment",
  });
}

export async function POST(req: Request) {
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
    console.error(
      `Webhook Error: ${
        error instanceof Error ? error.message : "Unknown Error"
      }`,
    );
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

    console.log("=== CHECKOUT.SESSION.COMPLETED ===");
    console.log("Organization ID:", organizationId);

    if (organizationId) {
      // If this is a subscription checkout
      if (session.mode === "subscription") {
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        // Retrieve the subscription to get the price ID and status
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);

        console.log("=== SUBSCRIPTION DEBUG ===");
        console.log("Subscription ID:", subscription.id);
        console.log("Subscription status:", subscription.status);
        console.log(
          "current_period_start (raw):",
          (subscription as any).current_period_start,
        );
        console.log(
          "current_period_end (raw):",
          (subscription as any).current_period_end,
        );
        console.log("Items data[0].plan:", subscription.items?.data?.[0]?.plan);
        console.log("Full subscription keys:", Object.keys(subscription));
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
          console.error(
            "Error updating organization subscription:",
            updateError,
          );
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
    const previousAttributes = (event.data as any).previous_attributes;
    if (previousAttributes?.items) {
      const oldPriceId = previousAttributes.items?.data?.[0]?.price?.id;
      const newPriceId = subscription.items.data[0].price.id;
      if (oldPriceId && oldPriceId !== newPriceId) {
        const oldPlan = findPlanByPriceId(oldPriceId);
        const newPlan = findPlanByPriceId(newPriceId);
        console.log(
          `=== PLAN CHANGE DETECTED === ${oldPlan?.name || oldPriceId} → ${newPlan?.name || newPriceId}`,
        );
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

    // Find organization with this subscription
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        stripe_status: subscription.status,
        stripe_price_id: subscription.items.data[0].price.id,
        billing_tier:
          findPlanByPriceId(subscription.items.data[0].price.id)?.id ||
          "starter",
        stripe_current_period_end: periodEnd,
        current_billing_cycle_start: periodStart,
        stripe_cancel_at_period_end: subscription.cancel_at_period_end,
        ...getPlanUpdates(subscription.items.data[0].price.id),
      })
      .eq("stripe_subscription_id", subscription.id);

    if (updateError) {
      console.error("Error syncing subscription status:", updateError);
      return new NextResponse("Error syncing subscription", { status: 500 });
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = (invoice as any).subscription as string;

    console.log("=== INVOICE.PAYMENT_SUCCEEDED ===");
    console.log("Invoice ID:", invoice.id);
    console.log(
      "invoice.period_start (raw):",
      invoice.period_start,
      "->",
      new Date((invoice.period_start || 0) * 1000).toISOString(),
    );
    console.log(
      "invoice.period_end (raw):",
      invoice.period_end,
      "->",
      new Date((invoice.period_end || 0) * 1000).toISOString(),
    );
    console.log(
      "invoice.lines.data[0]:",
      JSON.stringify(invoice.lines?.data?.[0], null, 2),
    );
    if (invoice.lines?.data?.[0]?.period) {
      const lineItem = invoice.lines.data[0];
      console.log(
        "lineItem.period.start:",
        lineItem.period.start,
        "->",
        new Date(lineItem.period.start * 1000).toISOString(),
      );
      console.log(
        "lineItem.period.end:",
        lineItem.period.end,
        "->",
        new Date(lineItem.period.end * 1000).toISOString(),
      );
    }

    if (subscriptionId) {
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("id")
        .eq("stripe_subscription_id", subscriptionId)
        .single();

      if (orgError || !orgData) {
        console.error("Error finding organization for invoice:", orgError);
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

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    const customerId =
      typeof charge.customer === "string"
        ? charge.customer
        : charge.customer?.id;

    console.log("=== CHARGE.REFUNDED ===");
    console.log("Charge ID:", charge.id);
    console.log("Customer ID:", customerId);
    console.log("Amount refunded:", charge.amount_refunded);

    if (customerId) {
      // Find organization by stripe_customer_id
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id, stripe_subscription_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (orgError || !org) {
        console.error("Error finding organization for refund:", orgError);
        return new NextResponse("Organization not found for refund", {
          status: 500,
        });
      }

      // 1. Record refund transaction
      await supabase.from("transactions").insert({
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

      // 2. Cancel the subscription if still active
      if (org.stripe_subscription_id) {
        try {
          await stripe.subscriptions.cancel(org.stripe_subscription_id);
        } catch (cancelError) {
          console.error(
            "[charge.refunded] Subscription cancel failed (may already be canceled):",
            cancelError,
          );
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
        console.error(
          "[charge.refunded] Error updating organization:",
          updateError,
        );
        return new NextResponse("Error updating organization after refund", {
          status: 500,
        });
      }

      console.log(
        `[charge.refunded] Organization ${org.id} refunded and canceled successfully`,
      );
    }
  }

  return new NextResponse(null, { status: 200 });
}

function getPlanUpdates(priceId: string) {
  const plan = findPlanByPriceId(priceId);

  if (!plan) return {};

  let limit = 150;
  if (plan.id === "pro") limit = 400; // Growth
  if (plan.id === "business") limit = 1000;

  return {
    usage_cap_whatsapp: limit,
  };
}

async function getDateFromSubscription(
  subscription: any,
  key: string,
): Promise<string> {
  // 1. Try direct access on subscription object (older API versions)
  let val = subscription[key];

  // 2. If not found, try from subscription.items.data[0].period (some API versions)
  if (val === undefined || val === null) {
    const item = subscription.items?.data?.[0];
    if (item?.period) {
      if (key === "current_period_end") {
        val = item.period.end;
      } else if (key === "current_period_start") {
        val = item.period.start;
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
        console.error("Error fetching latest invoice:", e);
      }
    }
  }

  // 4. Still not found? Log and return current date as fallback
  if (val === undefined || val === null) {
    console.warn(
      `Date value missing for key "${key}". Subscription keys:`,
      Object.keys(subscription),
      `Items period:`,
      subscription.items?.data?.[0]?.period,
    );
    return new Date().toISOString(); // Fallback
  }

  return new Date(val * 1000).toISOString();
}
