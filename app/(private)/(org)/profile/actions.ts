"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";
import { stripe } from "@/utils/stripe/client";
import { ok, fail, type ActionResult } from "@/lib/action-response";

export async function updateMailingConsentAction(consent: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Non autenticato");

  const { error } = await supabase
    .from("profiles")
    .update({
      mailing_consent: consent,
      mailing_consent_updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return fail("Errore nell'aggiornamento delle preferenze email");
  return ok();
}

/**
 * Recursively deletes all files inside a storage folder (handles nested subfolders).
 */
async function deleteStorageFolder(
  client: SupabaseClient,
  bucket: string,
  folderPath: string,
) {
  const { data: items } = await client.storage.from(bucket).list(folderPath);
  if (!items?.length) return;

  const files: string[] = [];
  const subfolders: string[] = [];

  for (const item of items) {
    const fullPath = `${folderPath}/${item.name}`;
    // Supabase returns items with id=null for folders
    if (item.id === null) {
      subfolders.push(fullPath);
    } else {
      files.push(fullPath);
    }
  }

  // Recurse into subfolders first
  for (const sub of subfolders) {
    await deleteStorageFolder(client, bucket, sub);
  }

  // Delete all files in this folder
  if (files.length > 0) {
    await client.storage.from(bucket).remove(files);
  }
}

/**
 * Deletes the current user's account and all associated data.
 * Only the admin who created the organization can delete the account.
 *
 * Cleanup order:
 * 1. Stripe: refund → cancel subscription → delete customer
 * 2. Storage: delete all files from buckets
 * 3. Auth: delete user (triggers DB cascade via handle_user_deleted trigger)
 */
export async function deleteAccountAction() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autenticato");

  // 1. Verify user is the org admin (created_by)
  const { data: profile } = await admin
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    // No org — just delete the user
    await admin.auth.admin.deleteUser(user.id);
    redirect("/login");
  }

  // Check that this user is the one who created the org
  const { data: org } = await admin
    .from("organizations")
    .select(
      "created_by, stripe_customer_id, stripe_subscription_id, stripe_status",
    )
    .eq("id", profile.organization_id)
    .single();

  if (org?.created_by !== user.id) {
    throw new Error(
      "Solo l'amministratore principale può eliminare l'account e l'organizzazione.",
    );
  }

  const orgId = profile.organization_id;

  // 2. Stripe cleanup: refund → cancel subscription → delete customer
  // Each step is wrapped in try/catch so Stripe failures don't block account deletion

  // 2a. Refund the latest payment + cancel subscription
  if (org.stripe_subscription_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        org.stripe_subscription_id,
      );

      // Attempt refund of latest invoice
      const latestInvoiceId =
        typeof subscription.latest_invoice === "string"
          ? subscription.latest_invoice
          : (subscription.latest_invoice as any)?.id;

      if (latestInvoiceId) {
        try {
          const invoice = await stripe.invoices.retrieve(latestInvoiceId);
          const paymentIntentId = (invoice as any).payment_intent as string;
          if (paymentIntentId) {
            await stripe.refunds.create({
              payment_intent: paymentIntentId,
              reason: "requested_by_customer",
            });
          }
        } catch (refundError) {
          // Refund may fail if already refunded or no charge — continue anyway
          console.error(
            "[deleteAccount] Refund failed (non-blocking):",
            refundError,
          );
        }
      }

      // Cancel the subscription immediately
      await stripe.subscriptions.cancel(org.stripe_subscription_id);
    } catch (subError) {
      // Subscription may already be canceled — continue anyway
      console.error(
        "[deleteAccount] Subscription cancel failed (non-blocking):",
        subError,
      );
    }
  }

  // 2b. Delete the Stripe customer entirely
  if (org.stripe_customer_id) {
    try {
      await stripe.customers.del(org.stripe_customer_id);
    } catch (customerError) {
      console.error(
        "[deleteAccount] Customer delete failed (non-blocking):",
        customerError,
      );
    }
  }

  // 3. Get all location IDs
  const { data: locations } = await admin
    .from("locations")
    .select("id")
    .eq("organization_id", orgId);

  const locationIds = locations?.map((l) => l.id) || [];

  // 4. Clean storage buckets via Storage API (recursive to handle subfolders)

  // location-logo: {locId}/...
  for (const locId of locationIds) {
    await deleteStorageFolder(admin, "location-logo", locId);
  }

  // compliance-docs: {locId}/address_proof/..., {locId}/identity_proof/...
  for (const locId of locationIds) {
    await deleteStorageFolder(admin, "compliance-docs", locId);
  }

  // menu-images: {orgId}/...
  await deleteStorageFolder(admin, "menu-images", orgId);

  // menu-files: {orgId}/...
  await deleteStorageFolder(admin, "menu-files", orgId);

  // promotion-images: {orgId}/...
  await deleteStorageFolder(admin, "promotion-images", orgId);

  // 5. Delete user from auth (triggers cascade for relational data)
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw new Error(error.message);

  // 6. Sign out and redirect
  await supabase.auth.signOut();
  redirect("/login");
}
