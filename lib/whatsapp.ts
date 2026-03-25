import { WHATSAPP_API_URL } from "./constants/api";
import { captureError } from "@/lib/monitoring";

type WhatsAppMessageTemplate = {
  name: string;
  language: {
    code: string;
  };
  components?: any[];
};

export type WhatsAppWebhookPayload = {
  object: string;
  entry: {
    id: string;
    changes: {
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts: {
          profile: {
            name: string;
          };
          wa_id: string;
        }[];
        messages: {
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
        }[];
        statuses?: {
          id: string; // The message ID
          status: "sent" | "delivered" | "read" | "failed";
          timestamp: string;
          recipient_id: string;
          errors?: any[];
        }[];
      };
      field: string;
    }[];
  }[];
};

// ── Shared internal helpers ──

function getWhatsAppToken(customToken?: string) {
  const token =
    customToken ||
    process.env.META_SYSTEM_USER_TOKEN;

  if (!token) throw new Error("Missing WhatsApp configuration");
  return token;
}

async function sendWhatsApp(
  to: string,
  messageBody: Record<string, any>,
  customPhoneNumberId?: string,
  customToken?: string,
) {
  const token = getWhatsAppToken(customToken);
  const phoneNumberId =
    customPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!phoneNumberId) throw new Error("Missing WhatsApp phone number ID");

  const response = await fetch(
    `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        ...messageBody,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    const err = new Error(data.error?.message || "Failed to send WhatsApp message");
    captureError(err, {
      service: "whatsapp",
      flow: "send_message",
      metaErrorCode: data.error?.code,
      metaErrorType: data.error?.type,
      httpStatus: response.status,
      recipient: to,
    });
    console.error("WhatsApp API Error:", data);
    throw err;
  }

  return data;
}

// ── Public API ──

export async function sendWhatsAppMessage(
  to: string,
  template: WhatsAppMessageTemplate,
  customPhoneNumberId?: string,
  customToken?: string,
) {
  return sendWhatsApp(
    to,
    { type: "template", template },
    customPhoneNumberId,
    customToken,
  );
}

export async function sendWhatsAppText(
  to: string,
  text: string,
  customPhoneNumberId?: string,
  customToken?: string,
) {
  return sendWhatsApp(
    to,
    { type: "text", text: { body: text } },
    customPhoneNumberId,
    customToken,
  );
}

export async function updateBusinessProfile(
  phoneNumberId: string,
  data: {
    about?: string;
    address?: string;
    description?: string;
    email?: string;
    websites?: string[];
    vertical?: string;
  },
) {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  if (!token) throw new Error("Missing WhatsApp configuration");

  const payload: any = {
    messaging_product: "whatsapp",
    ...data,
  };

  const response = await fetch(
    `${WHATSAPP_API_URL}/${phoneNumberId}/whatsapp_business_profile`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const resData = await response.json();

  if (!response.ok) {
    console.error("WhatsApp Profile Update Error:", resData);
    throw new Error(resData.error?.message || "Failed to update profile");
  }

  return resData.success;
}

export async function updateProfilePicture(
  phoneNumberId: string,
  imageUrl: string,
) {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  if (!token) throw new Error("Missing WhatsApp configuration");

  // 1. Download the image from the URL
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error("Failed to download image from URL");
  const imgBuffer = await imgRes.arrayBuffer();

  // 2. Create Upload Session (Resumable Upload Step 1)
  const appId = process.env.WHATSAPP_APP_ID;
  if (!appId)
    throw new Error(
      "Missing WHATSAPP_APP_ID. This is required for profile picture uploads.",
    );

  const sessionUrl = `https://graph.facebook.com/v21.0/${appId}/uploads?file_length=${imgBuffer.byteLength}&file_type=${imgRes.headers.get("content-type")}&access_token=${token}`;

  const sessionRes = await fetch(sessionUrl, { method: "POST" });
  const sessionData = await sessionRes.json();

  if (!sessionData.id)
    throw new Error(`Upload session failed: ${JSON.stringify(sessionData)}`);

  const uploadId = sessionData.id;

  // 3. Upload Data (Resumable Upload Step 2)
  const uploadRes = await fetch(
    `https://graph.facebook.com/v21.0/${uploadId}`,
    {
      method: "POST",
      headers: {
        Authorization: `OAuth ${token}`,
        file_offset: "0",
      },
      body: Buffer.from(imgBuffer),
    },
  );

  const uploadResult = await uploadRes.json();
  const handle = uploadResult.h;

  if (!handle)
    throw new Error(
      `Failed to get image handle: ${JSON.stringify(uploadResult)}`,
    );

  // 4. Update Profile Picture
  const profileRes = await fetch(
    `${WHATSAPP_API_URL}/${phoneNumberId}/whatsapp_business_profile`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        profile_picture_handle: handle,
      }),
    },
  );

  const profileData = await profileRes.json();
  if (!profileRes.ok) throw new Error(profileData.error?.message);

  return profileData.success;
}

export async function getBusinessProfile(phoneNumberId: string) {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  if (!token) throw new Error("Missing WhatsApp configuration");

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API Fetch Error:", data);
      return null;
    }

    return data.data?.[0] || null;
  } catch (error) {
    console.error("Error fetching business profile:", error);
    return null;
  }
}

export async function getPhoneNumberDetails(phoneNumberId: string) {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  if (!token) throw new Error("Missing WhatsApp configuration");

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API Phone Details Error:", data);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching phone number details:", error);
    return null;
  }
}
