const args = process.argv.slice(2);
const eventType = args[0]; // e.g., 'call.initiated'
const phoneNumber = args[1]; // e.g., '+390212345678'
const baseUrl = "http://localhost:3000"; // Assuming dev server running here

if (!eventType || !phoneNumber) {
  console.error(
    "Usage: npx tsx utils/scripts/simulate-telnyx-webhook.ts <EVENT_TYPE> <PHONE_NUMBER>",
  );
  process.exit(1);
}

async function sendWebhook() {
  let payload: any = {};
  const callControlId = "mock_cc_id_" + Date.now();

  if (eventType === "call.initiated") {
    payload = {
      call_control_id: callControlId,
      to: phoneNumber,
      direction: "incoming",
      from: "+393330000000",
    };
  } else if (eventType === "call.recording.saved") {
    payload = {
      call_control_id: callControlId,
      to: phoneNumber,
      recording_urls: {
        mp3: "https://mock.com/audio.mp3", // Matches the mock check in lib/openai.ts
      },
    };
  } else if (eventType === "requirement_group.status_updated") {
    // Usage: ... requirement_group.status_updated <REQ_GROUP_ID>
    // Note: phoneNumber arg is reused as ID here for convenience

    payload = {
      id: phoneNumber, // USER MUST PASS ID HERE
      status: "approved",
      requirements_status: "approved",
    };
  } else {
    console.error("Unsupported event type for simulation:", eventType);
    process.exit(1);
  }

  const body = {
    data: {
      event_type: eventType,
      id: "evt_" + Date.now(),
      payload: payload,
    },
  };

  console.log(
    `Sending ${eventType} for ${phoneNumber} to ${baseUrl}/api/webhooks/telnyx...`,
  );

  try {
    const response = await fetch(`${baseUrl}/api/webhooks/telnyx`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Body:", JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("✅ Webhook sent successfully!");
    } else {
      console.error("❌ Webhook failed. Check server logs.");
    }
  } catch (error) {
    console.error("Error sending webhook:", error);
    console.error("Is the dev server running on port 3000?");
  }
}

sendWebhook();
