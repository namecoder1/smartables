"use server";

import { createClient } from "@/supabase/server";
import { stripe } from "./client";
import { redirect } from "next/navigation";

const getUrl = () => {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
};

export async function createStripeCheckoutSession(amount: number) {
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
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "Ricarica Credito",
          },
          unit_amount: Math.round(amount * 100), // Amount in cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    invoice_creation: {
      enabled: true,
    },
    success_url: `${getUrl()}/billing?success=true`,
    cancel_url: `${getUrl()}/billing?canceled=true`,
    metadata: {
      organization_id: org.id,
      type: "topup",
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
