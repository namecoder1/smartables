import { WHATSAPP_API_URL } from "./constants/api";

/**
 * Requests the verification code from Meta.
 * We specifically use 'VOICE' method for landline/virtual numbers like Telnyx.
 */
export async function requestVerificationCode(
  phoneNumberId: string,
  method: "SMS" | "VOICE" = "VOICE",
  language: string = "it_IT",
) {
  const token = process.env.META_SYSTEM_USER_TOKEN;

  if (!token) throw new Error("Missing META_SYSTEM_USER_TOKEN");

  try {
    const startTime = Date.now();

    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/request_code`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code_method: method,
          language: language,
        }),
      },
    );

    const duration = Date.now() - startTime;

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Meta] Request Code Error (Data):`, data);
      throw new Error(data.error?.message || "Failed to request code");
    }

    return data.success;
  } catch (error) {
    console.error(
      `[Meta] Error requesting verification code for ${phoneNumberId}:`,
      error,
    );
    throw error;
  }
}

/**
 * Verifies the phone number with the OTP code received via SMS or Voice.
 * This is the step that actually validates the code.
 */
export async function verifyCodeWithMeta(phoneNumberId: string, code: string) {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  if (!token) throw new Error("Missing META_SYSTEM_USER_TOKEN");

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/verify_code`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("[Meta] Verify Code Error:", data);
      throw new Error(data.error?.message || "Failed to verify code");
    }

    return data.success;
  } catch (error) {
    console.error("[Meta] Error in verifyCodeWithMeta:", error);
    throw error;
  }
}

/**
 * Registers the phone number with Meta after it has been verified.
 * This is the final step to enable the number for sending messages.
 */
export async function registerNumberWithMeta(
  phoneNumberId: string,
  pin?: string,
) {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  if (!token) throw new Error("Missing META_SYSTEM_USER_TOKEN");

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/register`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          ...(pin ? { pin } : {}),
        }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("[Meta] Registration Error:", data);
      throw new Error(data.error?.message || "Failed to register number");
    }

    // AUTOMATION: Register the Public Key for WhatsApp Flows immediately after registration
    try {
      const { registerWhatsAppPublicKey } = await import("./whatsapp-crypto");
      await registerWhatsAppPublicKey(phoneNumberId);
    } catch (encryptError) {
      console.error(
        "[Meta] Warning: Failed to register public key for flows:",
        encryptError,
      );
      // We don't throw here to avoid failing the whole registration
      // if only the Flow encryption part fails.
    }

    return data.success;
  } catch (error) {
    console.error("[Meta] Error in registerNumberWithMeta:", error);
    throw error;
  }
}

/**
 * Adds a phone number to the WhatsApp Business Account.
 * This is the FIRST step before requesting a code.
 * It returns the new Phone Number ID.
 */
export async function addNumberToWaba(
  phoneNumber: string,
  displayName: string,
) {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  if (!token || !wabaId) throw new Error("Missing WhatsApp configuration");

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${wabaId}/phone_numbers`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cc: phoneNumber.substring(0, 2), // Assuming IT +39. Need better parsing if global.
          phone_number: phoneNumber.substring(2), // Remove CC
          display_name: displayName,
          verified_name: displayName, // REQUIRED: This field is mandatory
          verify_code: false, // We will verify later via Voice
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Meta Add Number Error:", data);
      throw new Error(data.error?.message || "Failed to add number to WABA");
    }

    // data: { id: "PHONE_NUMBER_ID" }
    return data.id as string;
  } catch (error) {
    console.error("Error adding number to WABA:", error);
    throw error;
  }
}

/**
 * Deregisters a phone number from the WhatsApp Business Account.
 * This effectively "deletes" it from the WABA context, allowing re-registration.
 * WARNING: This may lose chat history if not backed up, but for a fresh number it's fine.
 */
export async function deregisterNumberFromWaba(phoneNumberId: string) {
  const token = process.env.META_SYSTEM_USER_TOKEN;

  if (!token) throw new Error("Missing META_SYSTEM_USER_TOKEN");

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/deregister`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("[Meta] Deregister Number Error:", data);
      throw new Error(data.error?.message || "Failed to deregister number");
    }

    return data.success;
  } catch (error) {
    console.error("[Meta] Error deregistering number:", error);
    throw error;
  }
}
