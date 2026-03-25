import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { normalizePhoneNumber } from "@/lib/utils";
import { answerCall, hangupCall } from "@/lib/telnyx";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { createNotification, checkWhatsAppLimitNotification } from "@/lib/notifications";
import { sendPushToOrganization } from "@/lib/push-notifications";
import { transcribeAudio, extractVerificationCode } from "@/lib/openai";
import {
  registerNumberWithMeta,
  verifyCodeWithMeta,
} from "@/lib/whatsapp-registration";

export async function handleCallInitiated(
  supabase: SupabaseClient,
  payload: Record<string, any>,
) {
  const callControlId = payload.call_control_id;
  const to = payload.to;
  const rawFrom = payload.from;
  const callerNumber = normalizePhoneNumber(rawFrom || "");

  try {
    // ── Step 1: Lookup location ──
    const { data: location, error: dbError } = await supabase
      .from("locations")
      .select(
        "id, organization_id, meta_phone_id, opening_hours, is_test_completed, name",
      )
      .eq("telnyx_phone_number", to)
      .single();

    if (dbError || !location) {
      console.error(
        `[Telnyx Webhook] ❌ Location not found for ${to}`,
        dbError,
      );
      await hangupCall(callControlId);
      return NextResponse.json({ success: true, reason: "no_location" });
    }

    // ── Step 2: Filter anonymous/invalid callers ──
    if (
      !callerNumber ||
      callerNumber === "anonymous" ||
      callerNumber.length < 8
    ) {
      await hangupCall(callControlId);
      return NextResponse.json({ success: true, reason: "anonymous" });
    }

    // ── Step 3: TEST MODE — Simple flow for onboarding ──
    if (!location.is_test_completed) {
      await answerCall(callControlId);

      if (location.meta_phone_id) {
        try {
          const { sendWhatsAppMessage: sendMsg } = await import(
            "@/lib/whatsapp"
          );
          await sendMsg(
            callerNumber,
            { name: "test_tech", language: { code: "it" } },
            location.meta_phone_id,
          );
          await supabase
            .from("locations")
            .update({ is_test_completed: true })
            .eq("id", location.id);
        } catch (err) {
          console.error(`[Telnyx Webhook] ❌ TEST failed:`, err);
        }
      }

      await hangupCall(callControlId);
      return NextResponse.json({ success: true, reason: "test" });
    }

    // ═══════════════════════════════════════════════════
    // PRODUCTION MODE — Full Smart Filter Chain
    // ═══════════════════════════════════════════════════

    // ── Step 4 & 5 Preparation: Get or Create Customer ──
    let customerId: string | undefined;
    let customerTags: string[] = [];

    const { data: customerData } = await supabase
      .from("customers")
      .select("id, tags")
      .eq("location_id", location.id)
      .eq("phone_number", callerNumber)
      .maybeSingle();

    if (customerData) {
      customerId = customerData.id;
      customerTags = customerData.tags || [];
    } else {
      const { data: newCustomer } = await supabase
        .from("customers")
        .insert({
          organization_id: location.organization_id,
          location_id: location.id,
          phone_number: callerNumber,
          name: "Nuovo Cliente",
          total_visits: 0,
        })
        .select("id, tags")
        .single();

      if (newCustomer) {
        customerId = newCustomer.id;
        customerTags = newCustomer.tags || [];

        createNotification(supabase, {
          organizationId: location.organization_id,
          locationId: location.id,
          type: "new_customer",
          title: "Nuovo cliente",
          body: `${callerNumber} ha contattato il locale per la prima volta.`,
          link: "/customers",
          metadata: { customerId: newCustomer.id, phone: callerNumber },
        });
      }
    }

    // ── Step 4: Rate limit (24h) ──
    if (customerId) {
      const twentyFourHoursAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      ).toISOString();
      const { data: recentMessage } = await supabase
        .from("whatsapp_messages")
        .select("id")
        .eq("location_id", location.id)
        .eq("customer_id", customerId)
        .gte("created_at", twentyFourHoursAgo)
        .limit(1)
        .maybeSingle();

      if (recentMessage) {
        // Log the dropped call for dashboard visibility — non-blocking
        Promise.resolve(
          supabase.from("telnyx_webhook_logs").insert({
            event_type: "call.dropped_rate_limited",
            location_id: location.id,
            organization_id: location.organization_id,
            payload: {
              caller_number: callerNumber,
              customer_id: customerId,
              reason: "rate_limited_24h",
            },
          })
        ).catch(() => {});

        await hangupCall(callControlId);
        return NextResponse.json({ success: true, reason: "rate_limited" });
      }
    }

    // ── Step 5: Supplier suppression ──
    const isSupplier = customerTags.includes("supplier");
    if (isSupplier) {
      await hangupCall(callControlId);
      return NextResponse.json({ success: true, reason: "supplier" });
    }

    // ── Step 6: Determine open/closed status ──
    let isOpen = false;
    let closedReason = "";

    const now = new Date().toISOString();
    const { data: activeClosure } = await supabase
      .from("special_closures")
      .select("reason")
      .eq("location_id", location.id)
      .lte("start_date", now)
      .gte("end_date", now)
      .limit(1)
      .maybeSingle();

    if (activeClosure) {
      isOpen = false;
      closedReason = activeClosure.reason || "Chiusura straordinaria";
    } else {
      const dayNames = [
        "domenica",
        "lunedì",
        "martedì",
        "mercoledì",
        "giovedì",
        "venerdì",
        "sabato",
      ];
      const nowDate = new Date();
      const italyTime = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Rome",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(nowDate);
      const italyDay = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Rome",
        weekday: "short",
      }).format(nowDate);

      const engDayMap: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
      };
      const dayIndex = engDayMap[italyDay] ?? nowDate.getDay();
      const todayName = dayNames[dayIndex];
      const currentTime = italyTime;

      const openingHours = location.opening_hours as Record<
        string,
        { open: string; close: string }[]
      > | null;
      const todaySlots = openingHours?.[todayName];

      if (todaySlots && todaySlots.length > 0) {
        isOpen = todaySlots.some(
          (slot) => currentTime >= slot.open && currentTime <= slot.close,
        );
      }
    }

    // ── Step 7: Answer and send appropriate template ──
    await answerCall(callControlId);

    const templateName = isOpen ? "missed_call_open" : "missed_call_closed";
    const lang = callerNumber.startsWith("39") ? "it" : "en";

    const buttonComponents = isOpen
      ? [
          {
            type: "button",
            sub_type: "quick_reply",
            index: "0",
            parameters: [{ type: "payload", payload: "fornitore" }],
          },
          {
            type: "button",
            sub_type: "quick_reply",
            index: "1",
            parameters: [{ type: "payload", payload: "richiama" }],
          },
          {
            type: "button",
            sub_type: "flow",
            index: "2",
            parameters: [
              {
                type: "action",
                action: {
                  flow_token: `booking_${location.id}_${Date.now()}`,
                },
              },
            ],
          },
        ]
      : [
          {
            type: "button",
            sub_type: "quick_reply",
            index: "0",
            parameters: [{ type: "payload", payload: "menu" }],
          },
          {
            type: "button",
            sub_type: "flow",
            index: "1",
            parameters: [
              {
                type: "action",
                action: {
                  flow_token: `booking_${location.id}_${Date.now()}`,
                },
              },
            ],
          },
        ];

    try {
      if (customerId) {
        await supabase.from("whatsapp_messages").insert({
          location_id: location.id,
          organization_id: location.organization_id,
          customer_id: customerId,
          direction: "inbound",
          status: "delivered",
          content: { text: "📞 Chiamata persa" },
          cost_implication: false,
        });
      }

      await sendWhatsAppMessage(
        callerNumber,
        {
          name: templateName,
          language: { code: lang },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: location.name || "il ristorante" },
              ],
            },
            ...buttonComponents,
          ],
        },
        location.meta_phone_id,
      );

      if (customerId) {
        await supabase.from("whatsapp_messages").insert({
          location_id: location.id,
          organization_id: location.organization_id,
          customer_id: customerId,
          template_name: templateName,
          direction: "outbound_bot",
          status: "sent",
          content: { text: "Missed call template sent" },
          cost_implication: true,
        });
      }

      if (location.organization_id) {
        try {
          await supabase.rpc("increment_whatsapp_usage", {
            org_id: location.organization_id,
          });
          await checkWhatsAppLimitNotification(
            supabase,
            location.organization_id,
          );
        } catch (_e) {
          /* ignore */
        }

        // Push notification to staff — non-blocking
        sendPushToOrganization(location.organization_id, {
          title: "📞 Chiamata persa recuperata",
          body: `${callerNumber} ha ricevuto un messaggio WhatsApp automatico.`,
          data: { type: "missed_call", phone: callerNumber, locationId: location.id },
        }).catch(() => {/* ignore */});
      }

    } catch (err) {
      console.error(`[Telnyx Webhook] ❌ Failed to send WhatsApp:`, err);
    }

    await hangupCall(callControlId);
  } catch (e) {
    console.error(
      `[Telnyx Webhook] 💥 FATAL ERROR in call.initiated handler:`,
      e,
    );
  }

  return null;
}

export async function handleCallRecordingSaved(
  supabase: SupabaseClient,
  payload: Record<string, any>,
) {
  if (payload.client_state === "wow_test") {
    return NextResponse.json({ success: true });
  }

  const recordingUrl = payload.recording_urls?.mp3;
  const toNumber = payload.to || payload.from || payload.call_to;

  if (recordingUrl) {
    try {
      const transcription = await transcribeAudio(recordingUrl);

      const code = extractVerificationCode(transcription);

      if (code) {
        let { data: location } = await supabase
          .from("locations")
          .select("id, meta_phone_id, telnyx_phone_number")
          .eq("telnyx_phone_number", toNumber || "")
          .maybeSingle();

        if (!location && payload.connection_id) {
          const { data: locByConn } = await supabase
            .from("locations")
            .select("id, meta_phone_id, telnyx_phone_number")
            .eq("telnyx_connection_id", payload.connection_id)
            .maybeSingle();
          location = locByConn;
        }

        if (location && location.meta_phone_id) {
          await verifyCodeWithMeta(location.meta_phone_id, code);

          await registerNumberWithMeta(location.meta_phone_id);

          await supabase
            .from("locations")
            .update({
              activation_status: "verified",
              meta_verification_otp: code,
            })
            .eq("id", location.id);
        } else {
          console.error(
            `[Telnyx Webhook] ❌ Could not find location/meta_id for number: ${toNumber}`,
          );
        }
      } else {
        console.warn(
          `[Telnyx Webhook] ⚠️ No code extracted from transcription.`,
        );
      }
    } catch (error) {
      console.error(
        `[Telnyx Webhook] 💥 Error processing recording/verification:`,
        error,
      );
    }
  }

  return null;
}
