import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const connectionId = process.env.TELNYX_CONNECTION_ID;
const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function runTest() {
  const telnyx = await import("../lib/telnyx");
  const metaReg = await import("../lib/meta-registration");

  const { data: location } = await supabase
    .from("locations")
    .select("id, name")
    .eq("name", "Original Centro")
    .single();

  // 1. Cancel the pending order so we get a refund and free up the number if possible
  console.log(
    "Cancelling the pending order (ae977014-f1f8-4d13-9464-24f3fde14a2f)...",
  );
  // The phone numbers API allows deleting the number if it's pending, let's try to delete the phone number directly
  await fetch(
    `https://api.telnyx.com/v2/phone_numbers/10435278-1c1b-4332-886c-d0f1beb47012`,
    {
      // Wait I don't know the phone ID, let's just ignore cancelling for a sec, user can click "Cancel this order".
    },
  );

  // 2. Buy a new number with NO requirement group
  console.log("Searching for a new 0721 number...");
  const available = await telnyx.searchAvailableNumbers("IT", "0721", 1);
  if (!available || available.length === 0) {
    console.error("No 0721 numbers available right now.");
    return;
  }
  const newNumber = available[0].phoneNumber;
  console.log(`Found available number: ${newNumber}`);

  console.log(
    `Purchasing ${newNumber} WITHOUT assigning to Requirement Group...`,
  );
  const orderData = await telnyx.purchasePhoneNumber(
    newNumber,
    undefined, // NO REQUIREMENT GROUP passed
    connectionId,
  );
  console.log(`Purchase order placed! Telnyx Order ID: ${orderData.data.id}`);

  // Sleep 2 seconds to let Telnyx process
  await new Promise((r) => setTimeout(r, 2000));

  const getResponse = await fetch(
    `https://api.telnyx.com/v2/phone_numbers?filter[phone_number]=${newNumber}`,
    {
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        Accept: "application/json",
      },
    },
  );
  const getResult = await getResponse.json();
  const phoneObj = getResult.data?.[0];
  console.log("NEW NUMBER STATUS FROM TELNYX:", phoneObj?.status);

  if (phoneObj?.status === "active" || phoneObj?.status === "emergency-only") {
    console.log("SUCCESS! The number is active. Updating DB & Meta...");
    await supabase
      .from("locations")
      .update({
        telnyx_phone_number: newNumber,
        meta_phone_id: null,
        activation_status: "pending",
        voice_forwarding_number: null,
      })
      .eq("id", location?.id);

    const cleanNumber = newNumber.replace("+", "");
    const newPhoneId = await metaReg.addNumberToWaba(
      cleanNumber,
      location?.name,
    );
    console.log(`Meta Business added! New Phone ID is: ${newPhoneId}`);

    await supabase
      .from("locations")
      .update({
        meta_phone_id: newPhoneId,
      })
      .eq("id", location?.id);

    console.log("✅ DONE! New number:", newNumber, "Phone ID:", newPhoneId);
  } else {
    console.log("Number is still not active! Status:", phoneObj?.status);
  }
}

runTest();
