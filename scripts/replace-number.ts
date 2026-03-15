import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const connectionId = process.env.TELNYX_CONNECTION_ID; // Must be set to your App/Connection ID

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Starting full replacement of number for 'Original Centro'...");

  const telnyx = await import("../lib/telnyx");
  const metaReg = await import("../lib/whatsapp-registration");

  // 1. Get the current location and its associated requirement group
  const { data: location, error: locError } = await supabase
    .from("locations")
    .select("id, name, telnyx_phone_number")
    .eq("name", "Original Centro")
    .single();

  if (locError || !location) {
    console.error("Could not find location 'Original Centro'.", locError);
    return;
  }

  const { data: reqs, error: reqError } = await supabase
    .from("telnyx_regulatory_requirements")
    .select("telnyx_requirement_group_id")
    .eq("location_id", location.id)
    .single();

  if (reqError || !reqs || !reqs.telnyx_requirement_group_id) {
    console.error(
      "Could not find an approved Requirement Group ID for this location!",
      reqError,
    );
    return;
  }

  const requirementGroupId = reqs.telnyx_requirement_group_id;
  console.log(`Found Location: ${location.name} (ID: ${location.id})`);
  console.log(`Requirement Group ID to reuse: ${requirementGroupId}`);

  try {
    // 2. Search for a new Italian number in the 0721 (Pesaro) region
    console.log(
      "Searching for a new available Italian number in region 0721...",
    );
    const available = await telnyx.searchAvailableNumbers("IT", "0721", 1);
    if (!available || available.length === 0) {
      console.error("No available numbers found in Italy (0721) right now.");
      return;
    }
    const newNumber = available[0].phoneNumber;
    console.log(`Found available number: ${newNumber}`);

    // 3. Purchase the number and assign the Requirement Group & Connection ID
    console.log(
      `Purchasing ${newNumber} and assigning to Requirement Group...`,
    );
    const orderData = await telnyx.purchasePhoneNumber(
      newNumber,
      requirementGroupId,
      connectionId,
    );
    console.log(`Purchase order placed! Telnyx Order ID: ${orderData.data.id}`);

    // 4. Clean up DB state with the new number
    console.log("Updating database to wipe old number details...");
    let { error: updateErr1 } = await supabase
      .from("locations")
      .update({
        telnyx_phone_number: newNumber,
        meta_phone_id: null,
        activation_status: "pending",
      })
      .eq("id", location.id);

    if (updateErr1) throw updateErr1;

    // 5. Add new number to WABA (Meta)
    const cleanNumber = newNumber.replace("+", "");
    console.log(`Registering the new number ${cleanNumber} with Meta WABA...`);

    // Add to WABA (this will bypass rate limits because it's a completely new number)
    const newPhoneId = await metaReg.addNumberToWaba(
      cleanNumber,
      location.name,
    );
    console.log(`Meta Business added! New Phone ID is: ${newPhoneId}`);

    // 6. Save new Meta Phone ID back to DB
    const { error: updateErr2 } = await supabase
      .from("locations")
      .update({
        meta_phone_id: newPhoneId,
      })
      .eq("id", location.id);

    if (updateErr2) throw updateErr2;

    console.log(
      "✅ ALL DONE! The system in the database has now completely swapped to the new number.",
    );
    console.log(`New Telnyx Number: ${newNumber}`);
    console.log(
      "Now go into your Telnyx dashboard, make sure the number is assigned to your Programmable Voice App with the Outbound Profile, set the Call Forwarding, and try the Voice Verification from Smartables!",
    );
  } catch (e) {
    console.error("An error occurred during the process:", e);
  }
}

run();
