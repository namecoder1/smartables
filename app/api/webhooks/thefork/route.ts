import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { decryptConnectors } from "@/lib/business-connectors";
import { handleTheForkReservation } from "./_handlers/reservation";

// ── JWT verification ──────────────────────────────────────────────────────────
// TheFork signs webhooks with HS256 JWT using the oauthClientSecret we provided.

function verifyTheForkJwt(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [header, payload, signature] = parts;
  const expected = createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return signature === expected;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const rawBody = await req.text();

  // Extract TheFork headers
  const authHeader = req.headers.get("authorization") ?? "";
  const customerId = req.headers.get("customerid") ?? req.headers.get("CustomerId") ?? "";

  if (!authHeader.startsWith("Bearer ") || !customerId) {
    return NextResponse.json({ error: "Missing headers" }, { status: 400 });
  }

  const token = authHeader.slice(7);
  const supabase = createAdminClient();

  // Route to the correct location by TheFork CustomerId
  const { data: location } = await supabase
    .from("locations")
    .select("id, organization_id, business_connectors")
    .eq("thefork_restaurant_id", customerId)
    .maybeSingle();

  if (!location) {
    // Unknown restaurant — not our client, silently accept to avoid TheFork retries
    return new NextResponse(null, { status: 204 });
  }

  // Verify JWT signature with the stored webhook secret
  let webhookSecret: string | undefined;
  if (location.business_connectors) {
    try {
      const connectors = decryptConnectors(location.business_connectors as string);
      webhookSecret = connectors.thefork_webhook_secret;
    } catch {
      // Decryption failed — reject
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }
  }

  if (!webhookSecret || !verifyTheForkJwt(token, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse payload and dispatch
  try {
    const payload = JSON.parse(rawBody);

    await handleTheForkReservation(
      supabase,
      location.id,
      location.organization_id,
      payload,
    );
  } catch (err) {
    console.error("[TheFork webhook] Handler error:", err);
    // Return 500 so TheFork retries
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  // TheFork expects 204 on success
  return new NextResponse(null, { status: 204 });
}
