import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { Resend } from "resend";
import { answerCall, hangupCall } from "@/lib/telnyx";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { transcribeAudio, extractVerificationCode } from "@/lib/openai";
import {
  registerNumberWithMeta,
  verifyCodeWithMeta,
} from "@/lib/meta-registration";
import NumberActiveEmail from "@/emails/number-active";
import { render } from "@react-email/components";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const event = body.data; // Telnyx wraps event data in 'data'
    const eventType = event.event_type;
    const payload = event.payload;

    const supabase = createAdminClient();

    // 1. Identify Location and Organization for logging
    let locationId = null;
    let organizationId = null;

    try {
      if (eventType.startsWith("requirement_group.") && payload.id) {
        const { data: reqData } = await supabase
          .from("telnyx_regulatory_requirements")
          .select("location_id, organization_id")
          .eq("telnyx_requirement_group_id", payload.id)
          .maybeSingle();

        if (reqData) {
          locationId = reqData.location_id;
          organizationId = reqData.organization_id;
        }
      } else if (
        payload.phone_number ||
        (payload.phone_numbers && payload.phone_numbers[0]?.phone_number)
      ) {
        const phoneNumber =
          payload.phone_number || payload.phone_numbers[0]?.phone_number;
        const { data: locData } = await supabase
          .from("locations")
          .select("id, organization_id")
          .eq("telnyx_phone_number", phoneNumber)
          .maybeSingle();

        if (locData) {
          locationId = locData.id;
          organizationId = locData.organization_id;
        }
      } else if (payload.to) {
        const { data: locData } = await supabase
          .from("locations")
          .select("id, organization_id")
          .eq("telnyx_phone_number", payload.to)
          .maybeSingle();

        if (locData) {
          locationId = locData.id;
          organizationId = locData.organization_id;
        }
      }

      // 2. Log Webhook Event
      await supabase.from("telnyx_webhook_logs").insert({
        event_type: eventType,
        payload: body,
        location_id: locationId,
        organization_id: organizationId,
      });
    } catch (logError) {
      console.error("[Telnyx Webhook] Error logging event:", logError);
    }

    if (eventType === "requirement_group.status_updated") {
      // requirement_group.status_updated
      // payload: { id: "...", status: "approved" | "rejected" | ... }
      const status = payload.status;
      const id = payload.id;
      const rejectionReason =
        payload.suborder_comments || payload.rejection_reason || null;

      // 1. Update Requirement Status
      const { data: reqGroup, error: updateError } = await supabase
        .from("telnyx_regulatory_requirements")
        .update({
          status: status,
          rejection_reason: rejectionReason,
        })
        .eq("telnyx_requirement_group_id", id)
        .select("location_id, organization_id")
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 },
        );
      }

      // 2. If Approved, Activate Location & Register with Meta
      if (status === "approved" && reqGroup?.location_id) {
        await activateLocation(reqGroup.location_id, supabase);
      }
    } else if (
      eventType === "number_order.complete" ||
      (eventType === "number_order.status_updated" &&
        payload.status === "complete")
    ) {
      // HANDLE NUMBER ORDER COMPLETION
      // This is the preferred way to detect activation as Req Group status can be unreliable.
      const phoneNumbers = payload.phone_numbers; // Array of objects or strings? Usually objects in order payload

      if (phoneNumbers && Array.isArray(phoneNumbers)) {
        for (const numObj of phoneNumbers) {
          const phoneNumber = numObj.phone_number; // e.g. +39...

          if (phoneNumber) {
            console.log(
              `Order Complete for ${phoneNumber}. Checking for location...`,
            );
            // 1. Find location by phone number
            const { data: location } = await supabase
              .from("locations")
              .select("id, telnyx_regulatory_requirements(id)")
              .eq("telnyx_phone_number", phoneNumber)
              .single();

            if (location) {
              console.log(`Found location ${location.id}. Activating...`);

              // 2. Force Requirement Status to Approved (since order is complete, checks passed)
              // @ts-ignore
              const reqId = location.telnyx_regulatory_requirements?.id;
              if (reqId) {
                await supabase
                  .from("telnyx_regulatory_requirements")
                  .update({ status: "approved" })
                  .eq("id", reqId);
              }

              // 3. Activate
              await activateLocation(location.id, supabase);
            } else {
              console.log(`No location found for ${phoneNumber}`);
            }
          }
        }
      }
    } else if (eventType === "call.initiated") {
      // INCOMING CALL — Production Smart Filter
      const callControlId = payload.call_control_id;
      const to = payload.to;
      const callerNumber = payload.from;
      console.log(
        `[Telnyx Webhook] 📞 Incoming call to ${to} from ${callerNumber} (CallID: ${callControlId})`,
      );

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
          console.log(
            `[Telnyx Webhook] 👻 Anonymous/invalid caller. Hanging up.`,
          );
          await hangupCall(callControlId);
          return NextResponse.json({ success: true, reason: "anonymous" });
        }

        // ── Step 3: TEST MODE — Simple flow for onboarding ──
        if (!location.is_test_completed) {
          console.log(
            `[Telnyx Webhook] 🧪 TEST MODE for location ${location.id}`,
          );
          await answerCall(callControlId);

          if (location.meta_phone_id) {
            try {
              const { sendWhatsAppMessage } = await import("@/lib/whatsapp");
              await sendWhatsAppMessage(
                callerNumber,
                { name: "test_tech", language: { code: "it" } },
                location.meta_phone_id,
              );
              await supabase
                .from("locations")
                .update({ is_test_completed: true })
                .eq("id", location.id);
              console.log(`[Telnyx Webhook] ✅ TEST completed!`);
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

        // ── Step 4: Rate limit (24h) ──
        const twentyFourHoursAgo = new Date(
          Date.now() - 24 * 60 * 60 * 1000,
        ).toISOString();
        const { data: recentMessage } = await supabase
          .from("message_logs")
          .select("id")
          .eq("location_id", location.id)
          .eq("phone_number", callerNumber)
          .gte("sent_at", twentyFourHoursAgo)
          .limit(1)
          .maybeSingle();

        if (recentMessage) {
          console.log(
            `[Telnyx Webhook] ⏱️ Rate limited: already messaged ${callerNumber} in last 24h. Hanging up.`,
          );
          await hangupCall(callControlId);
          return NextResponse.json({ success: true, reason: "rate_limited" });
        }

        // ── Step 5: Supplier suppression (7 days) ──
        const sevenDaysAgo = new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const { data: supplierTag } = await supabase
          .from("contact_attributes")
          .select("id")
          .eq("location_id", location.id)
          .eq("phone_number", callerNumber)
          .eq("tag", "supplier")
          .gte("updated_at", sevenDaysAgo)
          .limit(1)
          .maybeSingle();

        if (supplierTag) {
          console.log(
            `[Telnyx Webhook] 📦 Supplier suppressed: ${callerNumber}. Hanging up.`,
          );
          await hangupCall(callControlId);
          return NextResponse.json({ success: true, reason: "supplier" });
        }

        // ── Step 6: Determine open/closed status ──
        let isOpen = false;
        let closedReason = "";

        // 6a. Check special closures first
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
          console.log(
            `[Telnyx Webhook] 🔒 Special closure active: ${closedReason}`,
          );
        } else {
          // 6b. Check regular opening hours
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
          // Use Italy timezone for accurate day/time matching
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

          // Map English short day to Italian index
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
          const currentTime = italyTime; // "HH:MM"

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

          console.log(
            `[Telnyx Webhook] 🕐 ${todayName} ${currentTime} → ${isOpen ? "APERTO" : "CHIUSO"}`,
          );
        }

        // ── Step 7: Answer and send appropriate template ──
        await answerCall(callControlId);

        const templateName = isOpen ? "missed_call_open" : "missed_call_closed";
        const lang = callerNumber.startsWith("+39") ? "it" : "en";

        console.log(
          `[Telnyx Webhook] 📤 Sending template "${templateName}" (${lang}) to ${callerNumber}...`,
        );

        // Build button components based on template structure:
        // missed_call_closed: Quick Reply "Vedi menu" (0) + Flow "Prenota per dopo" (1)
        // missed_call_open:   Quick Reply "Sono un fornitore" (0) + Quick Reply "Richiamatemi" (1) + Flow "Prenota tavolo" (2)
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
                parameters: [],
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
                parameters: [],
              },
            ];

        try {
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

          // Log for rate limiting
          await supabase.from("message_logs").insert({
            location_id: location.id,
            organization_id: location.organization_id,
            phone_number: callerNumber,
            template_name: templateName,
            sent_at: new Date().toISOString(),
          });

          // Increment usage
          if (location.organization_id) {
            try {
              await supabase.rpc("increment_whatsapp_usage", {
                org_id: location.organization_id,
              });
            } catch (_e) {
              /* ignore */
            }
          }

          console.log(`[Telnyx Webhook] ✅ WhatsApp sent & logged.`);
        } catch (err) {
          console.error(`[Telnyx Webhook] ❌ Failed to send WhatsApp:`, err);
        }

        // Hang up
        await hangupCall(callControlId);
        console.log(`[Telnyx Webhook] 📵 Call completed.`);
      } catch (e) {
        console.error(
          `[Telnyx Webhook] 💥 FATAL ERROR in call.initiated handler:`,
          e,
        );
      }
    } else if (eventType === "call.recording.saved") {
      // RECORDING SAVED - Process transcription and Meta registration

      // Skip processing for WOW test recordings
      if (payload.client_state === "wow_test") {
        console.log(
          `[Telnyx Webhook] ⏩ Skipping transcription for WOW test recording.`,
        );
        return NextResponse.json({ success: true });
      }

      const recordingUrl = payload.recording_urls?.mp3;
      // In recording.saved, the number might be in 'to' or 'from' or nested
      const toNumber = payload.to || payload.from || payload.call_to;

      console.log(
        `[Telnyx Webhook] 🎧 Recording saved for call. TO: ${payload.to}, FROM: ${payload.from}, URL: ${recordingUrl}`,
      );

      // If still undefined, log full payload for debugging
      if (!toNumber) {
        console.log(
          "[Telnyx Webhook] 🔍 FULL PAYLOAD (for debug):",
          JSON.stringify(payload, null, 2),
        );
      }

      if (recordingUrl) {
        try {
          // 1. Transcribe
          const transStart = Date.now();
          console.log(`[Telnyx Webhook] 🤖 Starting Transcription (OpenAI)...`);
          const transcription = await transcribeAudio(recordingUrl);
          console.log(
            `[Telnyx Webhook] ✅ Transcription completed in ${Date.now() - transStart}ms: "${transcription}"`,
          );

          // 2. Extract Code
          const code = extractVerificationCode(transcription);
          console.log(`[Telnyx Webhook] 🔢 Extracted Code: "${code}"`);

          if (code) {
            // 3. Find Location & Meta ID
            const dbStart = Date.now();
            console.log(
              `[Telnyx Webhook] 🔍 Looking up location for number: ${toNumber} or connection: ${payload.connection_id}`,
            );

            // Try to find by number first, then connection_id
            let { data: location } = await supabase
              .from("locations")
              .select("id, meta_phone_id, telnyx_phone_number")
              .eq("telnyx_phone_number", toNumber || "")
              .maybeSingle();

            if (!location && payload.connection_id) {
              console.log(
                "[Telnyx Webhook] No location by number, trying by connection_id...",
              );
              const { data: locByConn } = await supabase
                .from("locations")
                .select("id, meta_phone_id, telnyx_phone_number")
                .eq("telnyx_connection_id", payload.connection_id)
                .maybeSingle();
              location = locByConn;
            }

            console.log(
              `[Telnyx Webhook] 📄 Location lookup took ${Date.now() - dbStart}ms. Found: ${location?.id || "None"}`,
            );

            if (location && location.meta_phone_id) {
              // 4. Verify & Register with Meta
              console.log(
                `[Telnyx Webhook] 🚀 Verifying code ${code} for location ${location.id}...`,
              );
              const regStart = Date.now();

              // Step 1: Verify Code
              await verifyCodeWithMeta(location.meta_phone_id, code);
              console.log(
                `[Telnyx Webhook] ✅ Code verified with Meta! Finalizing...`,
              );

              // Step 2: Register (Finalize)
              await registerNumberWithMeta(location.meta_phone_id);
              console.log(
                `[Telnyx Webhook] ✨ Number verified and registered with Meta in ${Date.now() - regStart}ms!`,
              );

              // 5. Update Status & Save OTP for frontend auto-fill
              console.log(
                `[Telnyx Webhook] 📝 Updating location status and saving OTP...`,
              );
              await supabase
                .from("locations")
                .update({
                  activation_status: "verified",
                  meta_verification_otp: code, // Save for auto-fill
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
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Helper to activate location and register with Meta
async function activateLocation(locationId: string, supabase: any) {
  // Fetch Location to get the phone number AND Organization info
  const { data: location, error: locationFetchError } = await supabase
    .from("locations")
    .select(
      "telnyx_phone_number, name, organization:organizations(name, billing_email)",
    )
    .eq("id", locationId)
    .single();

  if (locationFetchError || !location?.telnyx_phone_number) {
    console.error(
      "Could not find location or phone number for activation:",
      locationFetchError,
    );
    return;
  }

  // Idempotency check: if already active/verified, maybe skip?
  // But maybe we want to retry Meta registration if it failed before.
  // So we proceed.

  try {
    console.log(`Activating number ${location.telnyx_phone_number}...`);

    // 2a. Add to Meta WABA
    const cleanNumber = location.telnyx_phone_number.replace("+", "");

    console.log(`Adding ${cleanNumber} to Meta WABA...`);
    // Import strictly dynamically if needed, or top-level. Added top-level below.
    const { addNumberToWaba, requestVerificationCode } =
      await import("@/lib/meta-registration");

    const metaPhoneId = await addNumberToWaba(cleanNumber, location.name);
    console.log(`Meta Phone ID obtained: ${metaPhoneId}`);

    // 2b. Update Location with Status & Meta ID
    // We do NOT set it to "active" here. The user still needs to verify it via phone call.
    // We set it to "pending_verification" to indicate the number is ready to receive the call.
    const { error: locError } = await supabase
      .from("locations")
      .update({
        activation_status: "pending_verification",
        meta_phone_id: metaPhoneId,
      })
      .eq("id", locationId);

    if (locError) throw locError;

    // 2c. Trigger Voice Verification
    console.log("Requesting Voice Verification Code from Meta...");
    await requestVerificationCode(metaPhoneId, "VOICE");
    console.log("Verification Code Requested!");

    // 3. Send Notification Email
    try {
      const org = location.organization as any;
      const billingEmail = org?.billing_email;
      const teamName = org?.name || "Il tuo Team";

      if (billingEmail) {
        const emailHtml = await render(
          NumberActiveEmail({
            teamName: teamName,
            phoneNumber: location.telnyx_phone_number,
          }),
        );

        await resend.emails.send({
          from: "Smartables <onboarding@smartables.it>",
          to: billingEmail,
          subject: "Il tuo numero è attivo su Smartables!",
          html: emailHtml,
        });
        console.log(`Activation email sent to ${billingEmail}`);
      } else {
        console.warn(
          "No billing email found for organization, skipping email.",
        );
      }
    } catch (emailErr) {
      console.error("Failed to send activation email:", emailErr);
      // Don't block the flow
    }
  } catch (error: any) {
    console.error("Failed in automation flow (Meta Registration):", error);
    // Log error but don't crash webhook
  }
}
