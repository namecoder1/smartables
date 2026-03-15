"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  registerNumberWithMeta,
  requestVerificationCode,
  verifyCodeWithMeta,
} from "@/lib/whatsapp-registration";

export async function triggerVoiceVerification(
  locationId: string,
  forwardingNumber?: string,
) {
  const supabase = await createClient();

  const { data: location, error } = await supabase
    .from("locations")
    .select("id, telnyx_phone_number, meta_phone_id, activation_status")
    .eq("id", locationId)
    .single();

  if (error || !location) {
    console.error(
      `[verify-voice] Error fetching location ${locationId}:`,
      error,
    );
    return { success: false, error: "Location not found" };
  }

  if (!location.meta_phone_id) {
    return { success: false, error: "Meta Phone ID not found" };
  }

  // Manual forwarding is no longer stored in DB as the bot handles verification.
  // We keep the argument for backward compatibility if needed, but don't save it.

  console.log(
    `[verify-voice] Triggering voice verification for ${location.telnyx_phone_number} (ID: ${location.meta_phone_id})`,
  );

  // ... inside try/catch for Meta call
  try {
    const startTime = Date.now();
    const success = await requestVerificationCode(
      location.meta_phone_id,
      "VOICE", // Explicitly request VOICE
    );
    const duration = Date.now() - startTime;
    console.log(
      `[verify-voice] Verification requested. Success: ${success}. Duration: ${duration}ms`,
    );

    return {
      success,
      forwardingSaved: !!forwardingNumber,
      error: success ? undefined : "Request call failed",
    };
  } catch (e: any) {
    console.error(
      `[verify-voice] Error triggering voice verification for ${locationId}:`,
      e,
    );
    // Return distinct error but indicate forwarding was saved if we got this far
    return {
      success: false,
      forwardingSaved: !!forwardingNumber,
      error: e.message,
    };
  }
}

export async function submitVerificationCode(
  locationId: string,
  code: string,
  pin?: string,
) {
  console.log(
    `[verify-voice] Submitting manual code for location ${locationId}${pin ? " with PIN" : ""}`,
  );
  const supabase = await createAdminClient();

  // 1. Get Location & Meta ID
  const { data: location, error } = await supabase
    .from("locations")
    .select("id, meta_phone_id")
    .eq("id", locationId)
    .single();

  if (error || !location || !location.meta_phone_id) {
    return { success: false, error: "Location or Meta ID not found" };
  }

  try {
    // 2. Verify Code with Meta
    await verifyCodeWithMeta(location.meta_phone_id, code);
    console.log(
      `[verify-voice] Code verified with Meta! Finalizing registration...`,
    );

    // 3. Register with Meta (final step)
    await registerNumberWithMeta(location.meta_phone_id, pin);
    console.log(`[verify-voice] Successfully registered with Meta!`);

    // 3. Update Status & Clear Forwarding Number
    await supabase
      .from("locations")
      .update({
        activation_status: "verified",
        meta_verification_otp: null, // Clear OTP after success
      })
      .eq("id", locationId);

    return { success: true };
  } catch (e: any) {
    console.error("[verify-voice] Manual verification failed:", e);
    return { success: false, error: e.message || "Verification failed" };
  }
}
