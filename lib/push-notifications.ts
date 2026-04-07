import { createAdminClient } from "@/utils/supabase/admin";

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Sends a push notification to all registered tokens for an organization.
 * Uses Expo Push Notification Service (works for both iOS and Android via Expo).
 */
export async function sendPushToOrganization(
  organizationId: string,
  payload: PushPayload,
) {
  const supabase = createAdminClient();

  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("token, platform")
    .eq("organization_id", organizationId);

  if (!tokens || tokens.length === 0) return;

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

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    // Log error ?
  }
}
