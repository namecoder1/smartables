"use server";

import { revalidatePath } from "next/cache";
import { PATHS } from "@/lib/revalidation-paths";
import { requireAuth } from "@/lib/supabase-helpers";
import { ok, okWith, fail, type ActionResult } from "@/lib/action-response";
import {
  decryptConnectors,
  encryptConnectors,
  type BusinessConnectors,
} from "@/lib/business-connectors";

// ── Shared ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readConnectors(supabase: any, locationId: string): Promise<BusinessConnectors> {
  const { data: loc } = await supabase
    .from("locations")
    .select("business_connectors")
    .eq("id", locationId)
    .single();

  if (!loc?.business_connectors) return {};
  try {
    return decryptConnectors(loc.business_connectors as string);
  } catch {
    return {};
  }
}

// ── TheFork ──────────────────────────────────────────────────────────────────

export type TheForkCredentials = {
  restaurantId: string;
  apiKey: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
};

export async function saveTheForkCredentials(
  locationId: string,
  credentials: TheForkCredentials,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const existing = await readConnectors(supabase, locationId);
  const encrypted = encryptConnectors({
    ...existing,
    thefork_restaurant_id: credentials.restaurantId,
    thefork_api_key: credentials.apiKey,
    thefork_client_id: credentials.clientId,
    thefork_client_secret: credentials.clientSecret,
    thefork_webhook_secret: credentials.webhookSecret,
  });

  const { error } = await supabase
    .from("locations")
    .update({
      business_connectors: encrypted,
      thefork_restaurant_id: credentials.restaurantId,
    })
    .eq("id", locationId);

  if (error) return fail("Impossibile salvare le credenziali TheFork");
  revalidatePath(PATHS.SITE_SETTINGS);
  return ok();
}

export async function disconnectTheFork(locationId: string): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const existing = await readConnectors(supabase, locationId);
  const {
    thefork_restaurant_id: _r,
    thefork_api_key: _k,
    thefork_client_id: _ci,
    thefork_client_secret: _cs,
    thefork_webhook_secret: _ws,
    thefork_access_token: _at,
    thefork_token_expires_at: _te,
    thefork_consumer_id: _co,
    ...rest
  } = existing;

  const encrypted = encryptConnectors(rest);

  const { error } = await supabase
    .from("locations")
    .update({ business_connectors: encrypted, thefork_restaurant_id: null })
    .eq("id", locationId);

  if (error) return fail("Impossibile scollegare TheFork");
  revalidatePath(PATHS.SITE_SETTINGS);
  return ok();
}

export async function verifyTheForkConnection(
  locationId: string,
): Promise<ActionResult<{ restaurantId: string }>> {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const connectors = await readConnectors(supabase, locationId);
  const { thefork_client_id, thefork_client_secret, thefork_restaurant_id } = connectors;

  if (!thefork_client_id || !thefork_client_secret || !thefork_restaurant_id) {
    return fail("Credenziali TheFork incomplete. Compila tutti i campi.");
  }

  try {
    const tokenRes = await fetch("https://auth.thefork.io/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: thefork_client_id,
        client_secret: thefork_client_secret,
        audience: "https://api.thefork.io",
        grant_type: "client_credentials",
      }),
    });

    if (!tokenRes.ok) return fail("Credenziali TheFork non valide");

    const { access_token, expires_in } = await tokenRes.json() as {
      access_token: string;
      expires_in: number;
    };

    const refreshed = encryptConnectors({
      ...connectors,
      thefork_access_token: access_token,
      thefork_token_expires_at: Date.now() + expires_in * 1000,
    });

    await supabase
      .from("locations")
      .update({ business_connectors: refreshed })
      .eq("id", locationId);

    return okWith({ restaurantId: thefork_restaurant_id });
  } catch {
    return fail("Errore di connessione con TheFork");
  }
}
