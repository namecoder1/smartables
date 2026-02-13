const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

/**
 * Requests the verification code from Meta.
 * We specifically use 'VOICE' method for landline/virtual numbers like Telnyx.
 */
export async function requestVerificationCode(
  phoneNumberId: string,
  method: "SMS" | "VOICE" = "VOICE",
  language: string = "it_IT",
) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN; // Or System User Token

  if (!token) throw new Error("Missing WHATSAPP_ACCESS_TOKEN");

  try {
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

    const data = await response.json();

    if (!response.ok) {
      console.error("Meta Request Code Error:", data);
      throw new Error(data.error?.message || "Failed to request code");
    }

    return data.success;
  } catch (error) {
    console.error("Error requesting verification code:", error);
    throw error;
  }
}

/**
 * Registers the phone number with the verification code.
 * This is the final step to enable the number for sending messages.
 */
export async function registerNumberWithMeta(
  phoneNumberId: string,
  code: string,
  pin?: string, // 6-digit PIN for 2-step verification (optional but recommended)
) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!token) throw new Error("Missing WHATSAPP_ACCESS_TOKEN");

  let payload: any = {
    messaging_product: "whatsapp",
    code: code,
  };

  // If a PIN for 2-step verification is needed (or setting it up)
  // Usually this endpoint is strictly for verifying the OTP code.
  // There is a separate endpoint for setting the 2-step PIN.
  // But for the initial "register" call, we pass the OTP code.

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/register`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Meta Registration Error:", data);
      throw new Error(data.error?.message || "Failed to register number");
    }

    return data.success;
  } catch (error) {
    console.error("Error registering number:", error);
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
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
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
