import { NextResponse } from "next/server";
import { decryptFlowRequest, encryptFlowResponse } from "@/lib/whatsapp-crypto";
import { getAvailableDates, getAvailableTimes } from "@/lib/whatsapp-flow";
import { createAdminClient } from "@/utils/supabase/admin";
import { captureError, captureWarning } from "@/lib/monitoring";
import { checkFlowRateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success: rateLimitOk } = await checkFlowRateLimit(ip);
  if (!rateLimitOk) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  try {
    const body = await req.json();

    // The payload from Meta is encrypted
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

    const privateKey = process.env.WHATSAPP_PRIVATE_KEY;
    if (!privateKey) {
      captureError(new Error("Missing WHATSAPP_PRIVATE_KEY in environment"), { service: "whatsapp", flow: "whatsapp_flow_webhook" });
      return new NextResponse("Internal Server Error", { status: 500 });
    }

    // Decrypt the payload
    let decryptedBody, aesKeyBuffer, initialVectorBuffer;
    try {
      const decrypted = decryptFlowRequest(
        encrypted_aes_key,
        encrypted_flow_data,
        initial_vector,
        privateKey,
      );
      decryptedBody = decrypted.decryptedBody;
      aesKeyBuffer = decrypted.aesKeyBuffer;
      initialVectorBuffer = decrypted.initialVectorBuffer;
    } catch (decryptError) {
      captureError(decryptError, { service: "whatsapp", flow: "whatsapp_flow_decrypt" });
      return new NextResponse("Decryption failed", { status: 400 });
    }

    const { action, data, routing_model, screen, version } = decryptedBody;

    let responseData: any = {
      version: version || "3.0",
    };

    if (action === "ping") {
      responseData = { ...responseData, data: { status: "active" } };
    } else if (action === "INIT") {
      const supabase = createAdminClient();
      const { data: location } = await supabase
        .from("locations")
        .select("id, name")
        .limit(1)
        .single();

      if (!location) {
        return new NextResponse("No location found", { status: 400 });
      }

      const now = new Date().toISOString();
      const { data: zones } = await supabase
        .from("restaurant_zones")
        .select("id, name, blocked_from, blocked_until")
        .eq("location_id", location.id);

      // Filter out zones currently fully blocked (block covers today + beyond)
      const activeZones = (zones ?? []).filter((z) => {
        if (!z.blocked_from || !z.blocked_until) return true;
        return !(z.blocked_from <= now && z.blocked_until >= now);
      });
      const zoneOptions = activeZones.map((z) => ({ id: z.id, title: z.name }));
      const dateOptions = await getAvailableDates(location.id, 14);

      responseData = {
        ...responseData,
        screen: "APPOINTMENT",
        data: {
          guests: [
            { id: "1", title: "1 Persona" },
            { id: "2", title: "2 Persone" },
            { id: "3", title: "3 Persone" },
            { id: "4", title: "4 Persone" },
            { id: "5", title: "5 Persone" },
            { id: "6", title: "6 Persone" },
            { id: "7", title: "7 Persone" },
            { id: "8", title: "8+ Persone" },
          ],
          location: zoneOptions,
          is_location_enabled: zoneOptions.length > 0,
          date: dateOptions,
          is_date_enabled: dateOptions.length > 0,
          time: [],
          is_time_enabled: false,
        },
      };
    } else if (action === "data_exchange") {
      const payload = data ? data.payload || data : {};
      const supabase = createAdminClient();

      const { data: location } = await supabase
        .from("locations")
        .select("id, name")
        .limit(1)
        .single();

      if (!location) {
        return new NextResponse("No location found", { status: 400 });
      }

      const trigger = payload.trigger;

      // ── Handle Transitions from APPOINTMENT ──
      if (screen === "APPOINTMENT") {
        if (trigger === "guests_selected") {
          const dateOptions = await getAvailableDates(location.id, 14);
          responseData = {
            ...responseData,
            screen: "APPOINTMENT",
            data: { date: dateOptions, is_date_enabled: true },
          };
        } else if (
          trigger === "location_selected" ||
          trigger === "date_selected"
        ) {
          const guests = parseInt(payload.guests || "2");
          const zoneId = payload.location;
          const dateId = payload.date;

          let timeOptions: { id: string; title: string; enabled: boolean }[] =
            [];
          if (zoneId && dateId) {
            timeOptions = await getAvailableTimes(
              location.id,
              dateId,
              zoneId,
              guests,
            );
          }

          responseData = {
            ...responseData,
            screen: "APPOINTMENT",
            data: {
              time: timeOptions,
              is_time_enabled: timeOptions.length > 0,
            },
          };
        } else if (trigger === "appointment_submitted") {
          responseData = {
            ...responseData,
            screen: "DETAILS",
            data: {
              ...payload,
              children_options: [
                { id: "0", title: "Nessun bambino" },
                { id: "1", title: "1 Bambino (seggiolone)" },
                { id: "2", title: "2+ Bambini" },
              ],
            },
          };
        }
      }
      // ── Handle Transitions from DETAILS ──
      else if (screen === "DETAILS") {
        if (trigger === "details_submitted") {
          // Prepare human-readable summary
          const [y, m, d] = (payload.date || "").split("-");
          const formattedDate = y ? `${d}/${m}/${y}` : payload.date;

          // Fetch zone name
          const { data: zone } = await supabase
            .from("restaurant_zones")
            .select("name")
            .eq("id", payload.location)
            .single();

          const allergies =
            payload.allergies && payload.allergies.trim() !== ""
              ? payload.allergies
              : "Nulla";
          const extra_notes =
            payload.extra_notes && payload.extra_notes.trim() !== ""
              ? payload.extra_notes
              : "Nulla";

          const summary_text = `Ospite: ${payload.guest_name || "Ospite"}
Tavolo per: ${payload.guests} persone (${payload.children_count} b.)
Zona: ${zone?.name || payload.location || "Qualsiasi"}
Quando: ${formattedDate} alle ${payload.time}

Note Speciali:
Intolleranze: ${allergies}
Altro: ${extra_notes}`;

          responseData = {
            ...responseData,
            screen: "SUMMARY",
            data: {
              ...payload,
              summary_text,
              date_text: formattedDate,
              location_text: zone?.name || payload.location || "Qualsiasi zona",
              guest_name_summary: payload.guest_name || "Ospite",
              allergies_text: allergies,
              notes_text: extra_notes,
              summary_main: `Tavolo per ${payload.guests} persone (${payload.children_count} b.)`,
              summary_details: `Zona: ${zone?.name || payload.location || "Qualsiasi"} il ${formattedDate} alle ${payload.time}`,
              children_count: payload.children_count || "0",
            },
          };
        }
      }
      // ── Final Submission from SUMMARY ──
      else if (screen === "SUMMARY") {
        responseData = {
          ...responseData,
          screen: "SUCCESS",
          data: {
            extension_message_response: {
              params: {
                ...payload,
                notes: `Allergie: ${payload.allergies_text || "Nulla"} | Note: ${payload.notes_text || "Nulla"}`,
                flow_token: decryptedBody.flow_token,
              },
            },
          },
        };
      }
    } else {
      captureWarning(`[WhatsApp Flow] Unhandled action: ${action}`, { service: "whatsapp", flow: "whatsapp_flow_webhook" });
      return new NextResponse("Unhandled action", { status: 400 });
    }

    // Encrypt response
    const encryptedResponse = encryptFlowResponse(
      responseData,
      aesKeyBuffer,
      initialVectorBuffer,
    );

    return new NextResponse(encryptedResponse, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err: any) {
    captureError(err, { service: "whatsapp", flow: "whatsapp_flow_webhook" });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
