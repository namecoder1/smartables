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

export async function createStripeSubscriptionCheckout(priceId: string) {
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
    success_url: `${getUrl()}/billing?success=true`,
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
