import { NextResponse } from "next/server";
import {
  decryptFlowRequest,
  encryptFlowResponse,
} from "@/lib/whatsapp-flow-crypto";
import { getAvailableDates, getAvailableTimes } from "@/lib/whatsapp-flow";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // The payload from Meta is encrypted
    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

    const privateKey = process.env.WHATSAPP_PRIVATE_KEY;
    if (!privateKey) {
      console.error("Missing WHATSAPP_PRIVATE_KEY in environment");
      return new NextResponse("Internal Server Error", { status: 500 });
    }

    // Decrypt the payload
    const { decryptedBody, aesKeyBuffer, initialVectorBuffer } =
      decryptFlowRequest(
        encrypted_aes_key,
        encrypted_flow_data,
        initial_vector,
        privateKey,
      );

    const { action, data, routing_model, screen, version } = decryptedBody;
    console.log(`[WhatsApp Flow] Received action: ${action}`, decryptedBody);

    let responseData: any = {};

    if (action === "ping") {
      // Endpoint Health Check from Meta
      responseData = {
        data: {
          status: "active",
        },
      };
    } else if (action === "data_exchange" || action === "INIT") {
      const payload = data ? data.payload || data : {};
      const supabase = getSupabaseAdmin();

      // For the first location (assuming single location MVP or pulling from payload in future)
      const { data: defaultLocation } = await supabase
        .from("locations")
        .select("id, name")
        .limit(1)
        .single();
      const locationId = defaultLocation?.id;

      if (!locationId) {
        return new NextResponse("No location found", { status: 400 });
      }

      const trigger = action === "INIT" ? "INIT" : payload.trigger;

      // Ensure we are working with correct triggers
      if (trigger === "INIT" || trigger === "guests_selected") {
        // Fetch Zones
        const { data: zones } = await supabase
          .from("restaurant_zones")
          .select("id, name")
          .eq("location_id", locationId);
        const zoneOptions =
          zones?.map((z) => ({ id: z.id, title: z.name })) || [];

        // Fetch Dates
        const dateOptions = await getAvailableDates(locationId, 14);

        responseData = {
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
            time: [], // Hidden until date is selected
            is_time_enabled: false,
          },
        };
      } else if (
        trigger === "location_selected" ||
        trigger === "date_selected"
      ) {
        // We need guests, location (zoneId) and date to compute time
        const guests = parseInt(payload.guests || "2");
        const zoneId = payload.location;
        const dateId = payload.date;

        let timeOptions: { id: string; title: string; enabled: boolean }[] = [];

        if (zoneId && dateId) {
          timeOptions = await getAvailableTimes(
            locationId,
            dateId,
            zoneId,
            guests,
          );
        }

        responseData = {
          screen: "APPOINTMENT",
          data: {
            time: timeOptions,
            is_time_enabled: timeOptions.length > 0,
          },
        };
      } else {
        // Fallback for final submission or unknown
        if (
          payload.guests &&
          payload.date &&
          payload.time &&
          payload.guest_name
        ) {
          // It's the final submission from SUMMARY
          console.log("[WhatsApp Flow] Booking Submitted", payload);

          // The actual save will happen in `api/webhooks/whatsapp/route.ts`
          // when we receive the `nfm_reply` message from the native WhatsApp client.

          responseData = {
            screen: "SUCCESS",
            data: {
              extension_message_response: {
                params: {
                  flow_token: data.flow_token,
                },
              },
            },
          };
        }
      }
    } else {
      console.warn(`[WhatsApp Flow] Unhandled action: ${action}`);
      return new NextResponse("Unhandled action", { status: 400 });
    }

    console.log(
      `[WhatsApp Flow] Sending Response:`,
      JSON.stringify(responseData, null, 2),
    );

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
    console.error("[WhatsApp Flow] Error handling webhook", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
