import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationType } from "@/types/general";

interface CreateNotificationParams {
  organizationId: string;
  locationId?: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Inserts a notification row. Silently swallows errors so callers never block.
 */
export async function createNotification(
  supabase: SupabaseClient,
  params: CreateNotificationParams,
) {
  try {
    await supabase.from("notifications").insert({
      organization_id: params.organizationId,
      location_id: params.locationId ?? null,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      link: params.link ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (err) {
    console.error("[createNotification] Failed:", err);
  }
}

/**
 * Checks WhatsApp usage against the cap and fires a notification at 50% and 75%.
 * Safe to call after every usage increment.
 */
export async function checkWhatsAppLimitNotification(
  supabase: SupabaseClient,
  organizationId: string,
) {
  try {
    const { data: org } = await supabase
      .from("organizations")
      .select("whatsapp_usage_count, usage_cap_whatsapp")
      .eq("id", organizationId)
      .single();

    if (!org || !org.usage_cap_whatsapp) return;

    const pct = (org.whatsapp_usage_count / org.usage_cap_whatsapp) * 100;

    // Fire at exactly 50%, 75%, or 90% (allow a small window: within 1 message of the threshold)
    const tolerance = (100 / org.usage_cap_whatsapp) * 2;
    const hit50 = pct >= 50 && pct < 50 + tolerance;
    const hit75 = pct >= 75 && pct < 75 + tolerance;
    const hit90 = pct >= 90 && pct < 90 + tolerance;

    if (!hit50 && !hit75 && !hit90) return;

    const threshold = hit90 ? 90 : hit75 ? 75 : 50;

    // Avoid duplicate notifications: check if we already sent one at this threshold
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("type", "whatsapp_limit_warning")
      .contains("metadata", { threshold })
      .limit(1)
      .maybeSingle();

    if (existing) return; // already notified

    await createNotification(supabase, {
      organizationId,
      type: "whatsapp_limit_warning",
      title: `Limite WhatsApp al ${threshold}%`,
      body: `Hai usato ${org.whatsapp_usage_count} di ${org.usage_cap_whatsapp} messaggi WhatsApp (${threshold}%).`,
      link: "/settings/billing",
      metadata: { threshold, usage: org.whatsapp_usage_count, cap: org.usage_cap_whatsapp },
    });
  } catch (err) {
    console.error("[checkWhatsAppLimitNotification] Failed:", err);
  }
}
