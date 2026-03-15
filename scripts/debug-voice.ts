import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  const { data: locations, error } = await supabase
    .from("locations")
    .select(
      "id, name, telnyx_phone_number, meta_phone_id, activation_status",
    );

  if (error) {
    console.error("Error fetching locations:", error);
    return;
  }

  console.log("Found locations:", locations.length);

  for (const loc of locations) {
    console.log(`\nLocation: ${loc.name} (${loc.id})`);
    console.log(`- Telnyx Number: ${loc.telnyx_phone_number}`);
    console.log(`- Meta Phone ID: ${loc.meta_phone_id}`);
    console.log(`- Activation Status: ${loc.activation_status}`);

    // If verified, maybe we reset it to pending for testing
    if (loc.activation_status === "verified") {
      console.log(
        `--> Resetting activation_status to 'pending' for testing...`,
      );
      const { error: updateError } = await supabase
        .from("locations")
        .update({ activation_status: "pending" })
        .eq("id", loc.id);

      if (updateError) {
        console.error("Failed to update status:", updateError);
      } else {
        console.log("--> Status reset successfully.");
      }
    }
  }
}

checkDb();
