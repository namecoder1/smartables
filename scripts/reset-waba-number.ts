import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { addNumberToWaba } from "../lib/whatsapp-registration";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetNumber() {
  const { data: location, error } = await supabase
    .from("locations")
    .select("id, name, telnyx_phone_number")
    .eq("name", "Original Centro")
    .single();

  if (error || !location) {
    console.error("Error fetching location:", error);
    return;
  }

  console.log(
    `Found location: ${location.name}. Telnyx Number: ${location.telnyx_phone_number}`,
  );

  try {
    const cleanNumber = location.telnyx_phone_number.replace("+", "");
    console.log(`Adding ${cleanNumber} to WABA...`);

    // Add to WABA to get a new phone ID
    const newPhoneId = await addNumberToWaba(cleanNumber, location.name);
    console.log(`Successfully added! New Phone ID is: ${newPhoneId}`);

    // Update the DB
    const { error: updateError } = await supabase
      .from("locations")
      .update({
        meta_phone_id: newPhoneId,
        activation_status: "pending",
      })
      .eq("id", location.id);

    if (updateError) {
      console.error(
        "Failed to update database with new Phone ID:",
        updateError,
      );
    } else {
      console.log(
        "Database updated successfully. You can now try the voice verification again!",
      );
    }
  } catch (err) {
    console.error("Error resetting number:", err);
  }
}

resetNumber();
