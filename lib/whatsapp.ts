import { NextResponse } from "next/server";

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

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
      };
      field: string;
    }[];
  }[];
};

export async function sendWhatsAppMessage(
  to: string,
  template: WhatsAppMessageTemplate,
) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error("Missing WhatsApp configuration");
  }

  try {
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
          type: "template",
          template: template,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API Error:", data);
      throw new Error(data.error?.message || "Failed to send WhatsApp message");
    }

    return data;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
}

export async function sendWhatsAppText(to: string, text: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error("Missing WhatsApp configuration");
  }

  try {
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
          type: "text",
          text: { body: text },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API Error:", data);
      throw new Error(data.error?.message || "Failed to send WhatsApp message");
    }

    return data;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
}

export async function updateBusinessProfile(
  phoneNumberId: string,
  data: {
    about?: string;
    address?: string;
    description?: string;
    email?: string;
    websites?: string[];
    vertical?: string; // Industry
  },
) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error("Missing WhatsApp configuration");

  try {
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
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

export async function updateProfilePicture(
  phoneNumberId: string,
  imageUrl: string,
) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error("Missing WhatsApp configuration");

  // 1. Download the image from the URL
  // Meta Resumable Upload requires sending the binary data
  // NOTE: This is a simplified version. For large files, use Resumable Upload.
  // For standard profile pics (<5MB), simple upload might work depending on the endpoint,
  // BUT Meta Cloud API specifically requires Resumable Upload for profile pictures in many contexts.
  // However, simpler standard upload is often supported for `messaging_product` endpoints if small.
  // Let's assume we need to fetch the bytes first.

  try {
    // A. Fetch Image
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error("Failed to download image from URL");
    const imgBuffer = await imgRes.arrayBuffer();

    // B. Create Upload Session (Resumable Upload Step 1)
    const sessionUrl = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_APP_ID}/uploads?file_length=${imgBuffer.byteLength}&file_type=${imgRes.headers.get("content-type")}&access_token=${token}`;

    const sessionRes = await fetch(sessionUrl, { method: "POST" });
    const sessionData = await sessionRes.json();

    if (!sessionData.id)
      throw new Error(`Upload session failed: ${JSON.stringify(sessionData)}`);

    const uploadId = sessionData.id;

    // C. Upload Data (Resumable Upload Step 2)
    // We upload to the handle: https://graph.facebook.com/v21.0/{upload_id}
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
    if (!uploadResult.h) {
      // 'h' is the handle usually
      // Sometimes the direct upload gives a handle?
      // Let's check documentation specifics.
      // "POST /app/uploads" -> ID. Then "POST /ID" with content -> Handle.
    }

    // Let's look for 'h' (handle) in result.
    const handle = uploadResult.h;

    if (!handle)
      throw new Error(
        `Failed to get image handle: ${JSON.stringify(uploadResult)}`,
      );

    // D. Update Profile Picture
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
  } catch (error) {
    console.error("Error updating profile picture:", error);
    throw error;
  }
}
