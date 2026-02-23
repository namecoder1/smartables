"use server";

import { createClient } from "@/utils/supabase/server";
import { stripe } from "./client";
import { redirect } from "next/navigation";
import { isDev } from "@/lib/utils";
import { PLANS } from "@/lib/plans";

const getUrl = () => {
  if (isDev()) return "http://localhost:3000";
  return process.env.NEXT_PUBLIC_SITE_URL;
};

/**
 * Change an existing subscription to a new price (upgrade, downgrade, or interval switch).
 * - Upgrade: immediate proration (user pays the difference now)
 * - Downgrade: no proration, change takes effect at next billing cycle
 * - Reactivates auto-renewal (cancel_at_period_end: false)
 */
export async function changeSubscription(newPriceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // 1. Get profile → organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    throw new Error("No organization found");
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, stripe_subscription_id, stripe_price_id, stripe_status")
    .eq("id", profile.organization_id)
    .single();

  if (!org) throw new Error("Organization not found");
  if (!org.stripe_subscription_id || org.stripe_status !== "active") {
    throw new Error("No active subscription found");
  }

  // 2. Retrieve the current subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(
    org.stripe_subscription_id,
  );

  const currentItemId = subscription.items.data[0].id;
  const currentPriceId = subscription.items.data[0].price.id;

  if (currentPriceId === newPriceId) {
    throw new Error("Already on this plan");
  }

  // 3. Determine if upgrade or downgrade by comparing plan tier indexes
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

  // Determine change type for UI feedback/logging
  // Compare by tier first, then by price (annual > monthly within same tier)
  const isUpgrade =
    newPlanIndex > currentPlanIndex ||
    (newPlanIndex === currentPlanIndex &&
      newPriceId === PLANS[newPlanIndex].priceIdYear);

  // 4. Update the subscription
  // We use "always_invoice" for BOTH upgrades and downgrades to ensure proration is applied immediately.
  // - Upgrades: Customer pays the difference now.
  // - Downgrades: Customer gets a credit balance for the unused time.
  const updatedSubscription = await stripe.subscriptions.update(
    org.stripe_subscription_id,
    {
      items: [{ id: currentItemId, price: newPriceId }],
      proration_behavior: "always_invoice",
      // Reactivate auto-renewal on plan change
      cancel_at_period_end: false,
    },
  );

  // 5. Update local DB immediately for responsiveness
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Fetch organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    throw new Error("No organization found");
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, stripe_customer_id, name, billing_email")
    .eq("id", profile.organization_id)
    .single();

  if (!org) {
    throw new Error("Organization not found");
  }

  let customerId = org.stripe_customer_id;

  if (!customerId) {
    // Fetch the location address saved during onboarding
    const { data: location } = await supabase
      .from("locations")
      .select("address")
      .eq("organization_id", org.id)
      .limit(1)
      .single();

    // Create Stripe Customer
    const customer = await stripe.customers.create({
      email: org.billing_email || user.email,
      name: org.name,
      business_name: org.name,
      individual_name: profile.full_name,
      preferred_locales: ["it"],
      address: {
        country: "IT",
        line1: location?.address || "",
      },
      metadata: {
        organization_id: org.id,
      },
    });
    customerId = customer.id;

    // Save to DB
    await supabase
      .from("organizations")
      .update({ stripe_customer_id: customerId })
      .eq("id", org.id);
  }

  // Create Checkout Session
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
      organization_id: org.id,
      type: "subscription",
    },
  });

  if (session.url) {
    redirect(session.url);
  }
}

export async function createStripePortalSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    throw new Error("No organization found");
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", profile.organization_id)
    .single();

  let customerId = org?.stripe_customer_id;

  if (!customerId) {
    // If no customer ID, create one first
    const { data: orgData } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .single();

    if (!orgData) {
      throw new Error("Organization details not found");
    }

    const customer = await stripe.customers.create({
      email: orgData.billing_email || user.email,
      name: orgData.name,
      metadata: {
        organization_id: orgData.id,
      },
    });

    await supabase
      .from("organizations")
      .update({ stripe_customer_id: customer.id })
      .eq("id", orgData.id);

    customerId = customer.id;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    locale: "it",
    return_url: `${getUrl()}/billing`,
  });

  if (session.url) {
    redirect(session.url);
  }
}
