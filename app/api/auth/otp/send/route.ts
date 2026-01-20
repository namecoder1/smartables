import { createClient } from "@/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();
    console.log("[OTP Send] Request for:", phoneNumber);

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Check user and organization
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[OTP Send] Unauthorized: No user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[OTP Send] User ID:", user.id);

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .eq("created_by", user.id)
      .single();

    if (orgError || !org) {
      console.error("[OTP Send] Org lookup error:", orgError);
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    console.log("[OTP Send] Organization found:", org.id);

    // 2. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const validity = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // 3. Save to DB
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        otp,
        otp_validity: validity.toISOString(),
      })
      .eq("id", org.id);

    if (updateError) {
      console.error("[OTP Send] Error saving OTP to DB:", updateError);
      return NextResponse.json(
        { error: "Failed to generate OTP" },
        { status: 500 }
      );
    }

    console.log("[OTP Send] OTP saved to DB for org:", org.id);

    // 4. Send via Meta API
    const metaToken = process.env.META_WHATSAPP_TOKEN;
    const metaPhoneId = process.env.META_PHONE_NUMBER_ID;

    if (!metaToken || !metaPhoneId) {
      console.error("[OTP Send] Meta credentials missing in .env");
      return NextResponse.json(
        { error: "Configuration error" },
        { status: 500 }
      );
    }

    // Format phone number: Meta often prefers no '+' but it depends.
    // Usually they want country code without +. RPNInput returns +39333...
    // Let's strip the '+' if present.
    const formattedPhone = phoneNumber.replace("+", "");

    // For Sandbox/Dev: We want to send the actual OTP.
    // The 'hello_world' template is static.
    // We will try to send a plain text message.
    // NOTE: This requires the user to have messaged the bot in the last 24h.

    const textPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "text",
      text: {
        preview_url: false,
        body: `Il tuo codice di verifica Smartables è: ${otp}`,
      },
    };

    console.log("[OTP Send] Sending Text Payload to Meta:", formattedPhone);

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${metaPhoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(textPayload),
      }
    );

    const data = await response.json();
    console.log("[OTP Send] Meta Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("Meta API Error:", data);
      // Check for specific error regarding 24h window
      if (
        data.error?.code === 131047 ||
        data.error?.type === "OAuthException"
      ) {
        return NextResponse.json(
          {
            error:
              "Per ricevere il codice in Sandbox, devi prima inviare un messaggio WhatsApp al numero di test.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: data.error?.message || "Failed to send WhatsApp message" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[OTP Send] Internal Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
