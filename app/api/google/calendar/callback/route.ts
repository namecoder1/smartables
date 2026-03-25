import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import {
  decryptConnectors,
  encryptConnectors,
} from "@/lib/business-connectors";

const SUCCESS_URL = "/site-settings?tab=connections&gcal_connected=1";
const errorUrl = (msg: string) =>
  `/site-settings?tab=connections&gcal_error=${msg}`;

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}${errorUrl(error)}`);
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const stored = cookieStore.get("gcal_oauth_state")?.value;
  if (!stored) {
    return NextResponse.redirect(`${origin}${errorUrl("invalid_state")}`);
  }

  let locationId: string;
  try {
    const parsed = JSON.parse(stored);
    if (parsed.state !== state) throw new Error("State mismatch");
    locationId = parsed.locationId;
  } catch {
    return NextResponse.redirect(`${origin}${errorUrl("invalid_state")}`);
  }

  cookieStore.delete("gcal_oauth_state");

  // Exchange code for tokens
  const redirectUri = `${origin}/api/google/calendar/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: code!,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}${errorUrl("token_failed")}`);
  }

  const tokenData = await tokenRes.json();
  const { access_token, refresh_token, expires_in } = tokenData;

  // Save tokens to business_connectors (merge with existing)
  const supabase = await createClient();
  const { data: loc } = await supabase
    .from("locations")
    .select("business_connectors")
    .eq("id", locationId)
    .single();

  let existing = {};
  if (loc?.business_connectors) {
    try {
      existing = decryptConnectors(loc.business_connectors as string);
    } catch {
      // start fresh if decryption fails
    }
  }

  const encrypted = encryptConnectors({
    ...existing,
    google_calendar_access_token: access_token,
    // Google only returns refresh_token on first consent; keep existing if not returned
    google_calendar_refresh_token:
      refresh_token ??
      (existing as Record<string, unknown>).google_calendar_refresh_token,
    google_calendar_token_expiry: Date.now() + expires_in * 1000,
  });

  const { error: dbError } = await supabase
    .from("locations")
    .update({ business_connectors: encrypted })
    .eq("id", locationId);

  if (dbError) {
    return NextResponse.redirect(`${origin}${errorUrl("save_failed")}`);
  }

  return NextResponse.redirect(`${origin}${SUCCESS_URL}`);
}
