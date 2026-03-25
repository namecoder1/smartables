import { createClient } from "@/utils/supabase/server";
import {
  BusinessConnectors,
  decryptConnectors,
  encryptConnectors,
} from "./business-connectors";

async function refreshOAuthToken(
  token: string,
): Promise<{ access_token: string; expires_in: number } | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Core logic — works with any supabase client (server or admin).
 * Used by both Next.js server routes and Trigger.dev workers.
 */
async function _getTokenWithClient(
  locationId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<{ accessToken: string; connectors: BusinessConnectors } | null> {
  const { data: loc } = await supabase
    .from("locations")
    .select("business_connectors")
    .eq("id", locationId)
    .single();

  if (!loc?.business_connectors) return null;

  let connectors: BusinessConnectors;
  try {
    connectors = decryptConnectors(loc.business_connectors as string);
  } catch {
    return null;
  }

  if (!connectors.google_calendar_access_token) return null;

  const now = Date.now();
  const expiry = connectors.google_calendar_token_expiry ?? 0;

  if (now > expiry - 60_000) {
    if (!connectors.google_calendar_refresh_token) return null;

    const refreshed = await refreshOAuthToken(connectors.google_calendar_refresh_token);
    if (!refreshed) return null;

    connectors = {
      ...connectors,
      google_calendar_access_token: refreshed.access_token,
      google_calendar_token_expiry: now + refreshed.expires_in * 1000,
    };

    const encrypted = encryptConnectors(connectors);
    await supabase
      .from("locations")
      .update({ business_connectors: encrypted })
      .eq("id", locationId);
  }

  return { accessToken: connectors.google_calendar_access_token!, connectors };
}

/**
 * For Next.js server routes and server actions (uses cookie-based auth).
 */
export async function getCalendarAccessToken(
  locationId: string,
): Promise<{ accessToken: string; connectors: BusinessConnectors } | null> {
  const supabase = await createClient();
  return _getTokenWithClient(locationId, supabase);
}

/**
 * For Trigger.dev workers and other non-Next.js contexts.
 * Caller is responsible for providing an admin supabase client.
 */
export async function getCalendarAccessTokenAdmin(
  locationId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<{ accessToken: string; connectors: BusinessConnectors } | null> {
  return _getTokenWithClient(locationId, supabase);
}
