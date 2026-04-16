import webpush from "web-push";
import { createAdminClient } from "@/utils/supabase/admin";

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Configure VAPID once (safe to call multiple times — idempotent)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT_EMAIL ?? "noreply@smartables.it"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

/**
 * Sends a push notification to all registered tokens for an organization.
 * Handles both Expo (iOS/Android) and Web Push (PWA) tokens.
 */
export async function sendPushToOrganization(
  organizationId: string,
  payload: PushPayload,
) {
  const supabase = createAdminClient();

  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("token, platform, subscription")
    .eq("organization_id", organizationId);

  if (!tokens || tokens.length === 0) return;

  await Promise.allSettled([
    sendExpoNotifications(tokens, payload),
    sendWebPushNotifications(tokens, payload),
  ]);
}

// ── Expo (iOS / Android) ─────────────────────────────────────────────────────

async function sendExpoNotifications(
  tokens: { token: string; platform: string; subscription: unknown }[],
  payload: PushPayload,
) {
  const expoTokens = tokens
    .filter((t) => t.token.startsWith("ExponentPushToken"))
    .map((t) => t.token);

  if (expoTokens.length === 0) return;

  const messages = expoTokens.map((token) => ({
    to: token,
    sound: "default",
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  }));

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify(messages),
  });
}

// ── Web Push (PWA) ────────────────────────────────────────────────────────────

async function sendWebPushNotifications(
  tokens: { token: string; platform: string; subscription: unknown }[],
  payload: PushPayload,
) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const webTokens = tokens.filter((t) => t.platform === "web" && t.subscription);

  if (webTokens.length === 0) return;

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  });

  await Promise.allSettled(
    webTokens.map((t) =>
      webpush.sendNotification(
        t.subscription as webpush.PushSubscription,
        notificationPayload,
      ),
    ),
  );
}
