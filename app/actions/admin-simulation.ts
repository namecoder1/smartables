"use server";

import { revalidatePath } from "next/cache";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function sendTelnyxMockWebhook(eventType: string, payload: any) {
  try {
    const body = {
      data: {
        event_type: eventType,
        id: "evt_mock_" + Date.now(),
        payload: payload,
      },
    };

    const response = await fetch(`${BASE_URL}/api/webhooks/telnyx`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Webhook failed: ${response.status} ${text}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function simulateTelnyxApproval(
  requirementGroupId: string,
  phoneNumber: string,
) {
  // Telnyx sends specific IDs. We mock them.
  // We need to ensure the location has this phone number if we want the purchase logic to work?
  // Actually, 'purchasePhoneNumber' uses the phone number stored in DB for that location?
  // The webhook logic for 'requirement_group.status_updated' USES 'telnyx_requirement_group_id' to find the requirement and location.
  // It then fetches the phone number from the location.
  // So we just need the correct requirementGroupId.

  return await sendTelnyxMockWebhook("requirement_group.status_updated", {
    id: requirementGroupId,
    status: "approved",
    requirements_status: "approved",
    phone_number: phoneNumber, // Just in case logic changes
  });
}

export async function simulateIncomingCall(phoneNumber: string) {
  // phoneNumber should be E.164, e.g. +39...
  const callControlId = "mock_cc_" + Date.now();

  await sendTelnyxMockWebhook("call.initiated", {
    call_control_id: callControlId,
    to: phoneNumber,
    direction: "incoming",
    from: "+393330000000",
  });

  revalidatePath("/manage");
  return { success: true };
}

export async function simulateNumberOrderCompleted(phoneNumber: string) {
  return await sendTelnyxMockWebhook("number_order.completed", {
    status: "success",
    phone_numbers: [
      {
        phone_number: phoneNumber,
        status: "active",
        requirements_met: true,
      },
    ],
  });
}

export async function simulateNumberOrderFailed(phoneNumber: string) {
  return await sendTelnyxMockWebhook("number_order.completed", {
    status: "failure",
    phone_numbers: [
      {
        phone_number: phoneNumber,
        status: "requirement-info-exception",
        requirements_met: false,
      },
    ],
    errors: [
      {
        title: "Requirement Info Exception",
        detail:
          "Il documento caricato non è stato accettato. Ricarica un documento di identità valido.",
      },
    ],
  });
}

export async function simulateRecordingSaved(phoneNumber: string) {
  const callControlId = "mock_cc_" + Date.now();

  await sendTelnyxMockWebhook("call.recording.saved", {
    call_control_id: callControlId,
    to: phoneNumber,
    recording_urls: {
      mp3: "https://mock.com/audio.mp3",
    },
  });

  revalidatePath("/manage");
  return { success: true };
}
