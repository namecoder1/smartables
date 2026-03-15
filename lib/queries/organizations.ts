/**
 * Query centralizzate per la tabella `organizations`.
 *
 * Importare queste funzioni invece di scrivere query `.from("organizations")` inline.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Organization } from "@/types/general";

// ─── Read ────────────────────────────────────────────────────────────────────

/**
 * Restituisce un'organizzazione per ID.
 */
export async function getOrganizationById(
  supabase: SupabaseClient,
  id: string,
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getOrganizationById]", error.message, { id });
    }
    return null;
  }
  return data as Organization;
}

/**
 * Restituisce l'organizzazione creata da un utente specifico.
 * Usato nel layout per gli utenti owner (non staff invitati).
 */
export async function getOrganizationByCreatedBy(
  supabase: SupabaseClient,
  userId: string,
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("created_by", userId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getOrganizationByCreatedBy]", error.message, { userId });
    }
    return null;
  }
  return data as Organization;
}

/**
 * Restituisce l'organizzazione tramite Stripe Customer ID.
 * Usato nel webhook Stripe per risolvere l'organizzazione dall'evento.
 */
export async function getOrganizationByStripeCustomerId(
  supabase: SupabaseClient,
  stripeCustomerId: string,
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getOrganizationByStripeCustomerId]", error.message, { stripeCustomerId });
    }
    return null;
  }
  return data as Organization;
}

/**
 * Restituisce l'organizzazione tramite Stripe Subscription ID.
 * Usato nel webhook Stripe per eventi `customer.subscription.*`.
 */
export async function getOrganizationByStripeSubscriptionId(
  supabase: SupabaseClient,
  stripeSubscriptionId: string,
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getOrganizationByStripeSubscriptionId]", error.message, { stripeSubscriptionId });
    }
    return null;
  }
  return data as Organization;
}

/**
 * Restituisce l'organizzazione con i limiti del piano corrente.
 * Join con `subscription_plans` per avere i limiti aggiornati dal DB.
 */
export async function getOrganizationWithPlan(
  supabase: SupabaseClient,
  id: string,
): Promise<(Organization & { subscription_plans: { limits: Record<string, unknown> } | null }) | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select(
      `
      *,
      subscription_plans:billing_tier (limits)
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[getOrganizationWithPlan]", error.message, { id });
    }
    return null;
  }
  return data as (Organization & { subscription_plans: { limits: Record<string, unknown> } | null });
}
