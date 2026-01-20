import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/stripe/client";
import { createAdminClient } from "@/supabase/admin";
import Stripe from "stripe";

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
        : process.env.STRIPE_WEBHOOK_KEY_TEST!
    );
  } catch (error) {
    console.error(
      `Webhook Error: ${
        error instanceof Error ? error.message : "Unknown Error"
      }`
    );
    return new NextResponse(
      `Webhook Error: ${
        error instanceof Error ? error.message : "Unknown Error"
      }`,
      { status: 400 }
    );
  }

  console.log(`🔔  Webhook received: ${event.type}`);

  const supabase = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const organizationId = session.metadata?.organization_id;
    const amountTotal = session.amount_total; // in cents

    if (organizationId && amountTotal) {
      // 1. Insert Payment
      const { error: paymentError } = await supabase.from("payments").insert({
        organization_id: organizationId,
        amount: amountTotal / 100, // convert to units
        currency: session.currency,
        status: "succeeded",
        type: session.metadata?.type === "topup" ? "topup" : "activation", // or other types
        stripe_payment_id: session.payment_intent as string,
      });

      if (paymentError) {
        console.error("Error inserting payment:", paymentError);
        return new NextResponse("Error inserting payment", { status: 500 });
      }

      // 2. Insert Transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          organization_id: organizationId,
          amount: amountTotal / 100,
          type: "topup",
          description: `Ricarica credito via Stripe (${session.payment_intent})`,
        });

      if (transactionError) {
        console.error("Error inserting transaction:", transactionError);
        return new NextResponse("Error inserting transaction", { status: 500 });
      }

      // 3. Update Organization Credits
      // We need to fetch current credits first or use an atomic increment if possible.
      // With simple update, we risk race conditions but for now it's acceptable or we can write a function.
      // Let's fetch and update.
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("credits")
        .eq("id", organizationId)
        .single();

      if (orgError) {
        console.error("Error fetching org:", orgError);
        return new NextResponse("Error fetching org", { status: 500 });
      }

      const newCredits = (Number(org.credits) || 0) + amountTotal / 100;

      const { error: updateError } = await supabase
        .from("organizations")
        .update({ credits: newCredits })
        .eq("id", organizationId);

      if (updateError) {
        console.error("Error updating credits:", updateError);
        return new NextResponse("Error updating credits", { status: 500 });
      }
    }
  }

  return new NextResponse(null, { status: 200 });
}
