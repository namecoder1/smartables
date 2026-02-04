"use server";

import { createClient } from "@/supabase/server";
import { stripe } from "./client";
import { redirect } from "next/navigation";
import { isDev } from "@/lib/utils";

const getUrl = () => {
  if (isDev()) return "http://localhost:3000";
  return process.env.NEXT_PUBLIC_SITE_URL;
};

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
    .select("organization_id")
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
    // Create Stripe Customer
    const customer = await stripe.customers.create({
      email: org.billing_email || user.email,
      name: org.name,
      address: {
        country: "IT",
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
    billing_address_collection: "required",
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
    return_url: `${getUrl()}/billing`,
  });

  if (session.url) {
    redirect(session.url);
  }
}
