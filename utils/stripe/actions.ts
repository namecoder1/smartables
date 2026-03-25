"use server";

import { getAuthContext } from "@/lib/auth";
import { stripe } from "./client";
import { redirect } from "next/navigation";
import { isDev } from "@/lib/utils";
import { PLANS } from "@/lib/plans";

const getUrl = () => {
  if (isDev()) return "http://localhost:3000";
  return process.env.NEXT_PUBLIC_SITE_URL;
};

/**
 * Get or create a Stripe customer for the given organization.
 * Centralizes the duplicated customer creation logic.
 */
async function getOrCreateStripeCustomer(
  supabase: any,
  orgId: string,
  user: { email?: string },
) {
  const { data: org } = await supabase
    .from("organizations")
    .select("id, stripe_customer_id, name, billing_email")
    .eq("id", orgId)
    .single();

  if (!org) throw new Error("Organization not found");

  if (org.stripe_customer_id) return org.stripe_customer_id;

  // Fetch the location address saved during onboarding
  const { data: location } = await supabase
    .from("locations")
    .select("address")
    .eq("organization_id", org.id)
    .limit(1)
    .single();

  // Fetch profile for individual name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.email ? undefined : "") // skip if not needed
    .limit(1)
    .maybeSingle();

  const customer = await stripe.customers.create({
    email: org.billing_email || user.email,
    name: org.name,
    preferred_locales: ["it"],
    address: {
      country: "IT",
      line1: location?.address || "",
    },
    metadata: {
      organization_id: org.id,
    },
  });

  await supabase
    .from("organizations")
    .update({ stripe_customer_id: customer.id })
    .eq("id", org.id);

  return customer.id;
}

/**
 * Change an existing subscription to a new price (upgrade, downgrade, or interval switch).
 */
export async function changeSubscription(newPriceId: string) {
  const { supabase, user, organizationId } = await getAuthContext();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, stripe_subscription_id, stripe_price_id, stripe_status")
    .eq("id", organizationId)
    .single();

  if (!org) throw new Error("Organization not found");
  if (!org.stripe_subscription_id || org.stripe_status !== "active") {
    throw new Error("No active subscription found");
  }

  // Retrieve the current subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(
    org.stripe_subscription_id,
  );

  const currentItemId = subscription.items.data[0].id;
  const currentPriceId = subscription.items.data[0].price.id;

  if (currentPriceId === newPriceId) {
    throw new Error("Already on this plan");
  }

  // Determine if upgrade or downgrade by comparing plan tier indexes
  const currentPlanIndex = PLANS.findIndex(
    (p) =>
      p.priceIdMonth === currentPriceId || p.priceIdYear === currentPriceId,
  );
  const newPlanIndex = PLANS.findIndex(
    (p) => p.priceIdMonth === newPriceId || p.priceIdYear === newPriceId,
  );

  if (newPlanIndex === -1) {
    throw new Error("Invalid plan selected");
  }

  const isUpgrade =
    newPlanIndex > currentPlanIndex ||
    (newPlanIndex === currentPlanIndex &&
      newPriceId === PLANS[newPlanIndex].priceIdYear);

  const updatedSubscription = await stripe.subscriptions.update(
    org.stripe_subscription_id,
    {
      items: [{ id: currentItemId, price: newPriceId }],
      proration_behavior: "always_invoice",
      cancel_at_period_end: false,
    },
  );

  // Update local DB immediately for responsiveness
  const { createAdminClient } = await import("@/utils/supabase/admin");
  const adminSupabase = createAdminClient();

  await adminSupabase
    .from("organizations")
    .update({
      stripe_price_id: updatedSubscription.items.data[0].price.id,
      stripe_status: updatedSubscription.status,
      stripe_cancel_at_period_end: updatedSubscription.cancel_at_period_end,
    })
    .eq("id", org.id);

  return {
    success: true,
    type: isUpgrade ? ("upgrade" as const) : ("downgrade" as const),
  };
}

export async function createStripeSubscriptionCheckout(
  priceId: string,
  successPath: string = "/billing?success=true",
) {
  const { supabase, user, organizationId } = await getAuthContext();

  const customerId = await getOrCreateStripeCustomer(
    supabase,
    organizationId,
    user,
  );

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
      ...(process.env.NEXT_PUBLIC_ENABLE_SETUP_FEE === "true" &&
      process.env.STRIPE_SETUP_FEE_PRICE_ID
        ? [
            {
              price: process.env.STRIPE_SETUP_FEE_PRICE_ID,
              quantity: 1,
            },
          ]
        : []),
    ],
    mode: "subscription",
    locale: "it",
    success_url: `${getUrl()}${successPath}`,
    cancel_url: `${getUrl()}/billing?canceled=true`,
    metadata: {
      organization_id: organizationId,
      type: "subscription",
    },
  });

  if (session.url) {
    redirect(session.url);
  }
}

export async function createStripePortalSession() {
  const { supabase, user, organizationId } = await getAuthContext();

  const customerId = await getOrCreateStripeCustomer(
    supabase,
    organizationId,
    user,
  );

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    locale: "it",
    return_url: `${getUrl()}/billing`,
  });

  if (session.url) {
    redirect(session.url);
  }
}

/**
 * Add an add-on pack to the active subscription.
 * If the same price already exists as a subscription item, increments its quantity.
 * Charges prorated amount immediately via always_invoice.
 */
export async function addAddonToSubscription(formData: FormData) {
  const priceId = formData.get("priceId") as string;
  if (!priceId) throw new Error("Missing price ID");

  const { supabase, organizationId } = await getAuthContext();

  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_subscription_id, stripe_status")
    .eq("id", organizationId)
    .single();

  if (!org?.stripe_subscription_id || org.stripe_status !== "active") {
    throw new Error("Nessun abbonamento attivo trovato");
  }

  const subscription = await stripe.subscriptions.retrieve(
    org.stripe_subscription_id,
  );
  const existingItem = subscription.items.data.find(
    (item) => item.price.id === priceId,
  );

  if (existingItem) {
    await stripe.subscriptions.update(org.stripe_subscription_id, {
      items: [{ id: existingItem.id, quantity: (existingItem.quantity ?? 1) + 1 }],
      proration_behavior: "always_invoice",
    });
  } else {
    await stripe.subscriptions.update(org.stripe_subscription_id, {
      items: [{ price: priceId, quantity: 1 }],
      proration_behavior: "always_invoice",
    });
  }

  // Save transaction directly using admin client (bypasses RLS, same as webhook)
  try {
    const { createAdminClient } = await import("@/utils/supabase/admin");
    const adminSupabase = createAdminClient();

    const updatedSub = await stripe.subscriptions.retrieve(org.stripe_subscription_id);
    if (updatedSub.latest_invoice) {
      const invoice = await stripe.invoices.retrieve(updatedSub.latest_invoice as string);
      if (invoice.status === "paid" && invoice.amount_paid > 0) {
        const { data: existingTx } = await adminSupabase
          .from("transactions")
          .select("id")
          .eq("stripe_invoice_id", invoice.id)
          .maybeSingle();
        if (!existingTx) {
          const lineItem = invoice.lines?.data?.[0];
          await adminSupabase.from("transactions").insert({
            organization_id: organizationId,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: "succeeded",
            type: "subscription",
            stripe_invoice_id: invoice.id,
            stripe_payment_intent_id: (invoice as any).payment_intent as string,
            invoice_pdf: invoice.invoice_pdf,
            description: lineItem?.description || "Add-on acquistato",
            period_start: lineItem ? new Date(lineItem.period.start * 1000).toISOString() : null,
            period_end: lineItem ? new Date(lineItem.period.end * 1000).toISOString() : null,
          });
        }
      }
    }
  } catch (e) {
    console.error("[addAddon] Failed to save transaction directly:", e);
  }

  redirect(`${getUrl()}/billing?success=true&event=purchase`);
}

/**
 * Remove an add-on from the active subscription.
 * immediately=true  → credit_proration: credit for remaining days issued immediately
 * immediately=false → proration_behavior: none: no refund, item removed now
 */
export async function removeAddonFromSubscription(priceId: string, immediately: boolean) {
  if (!priceId) throw new Error("Missing price ID");

  const { supabase, organizationId } = await getAuthContext();

  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_subscription_id, stripe_status")
    .eq("id", organizationId)
    .single();

  if (!org?.stripe_subscription_id || org.stripe_status !== "active") {
    throw new Error("Nessun abbonamento attivo trovato");
  }

  const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id);
  const existingItem = subscription.items.data.find((item) => item.price.id === priceId);

  if (!existingItem) throw new Error("Add-on non trovato nell'abbonamento");

  await stripe.subscriptionItems.del(existingItem.id, {
    proration_behavior: immediately ? "always_invoice" : "none",
  });

  redirect(`${getUrl()}/billing?success=true?event=cancel`);
}
