import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

// We need to polyfill fetch for the Supabase client in raw Node if necessary, but tsx usually handles it or next does.
import { getAvailableDates, getAvailableTimes } from "./lib/whatsapp-flow";

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data: defaultLocation } = await supabase
    .from("locations")
    .select("id, name")
    .limit(1)
    .single();

  if (!defaultLocation) {
    console.error("No location");
    return;
  }

  const dates = await getAvailableDates(defaultLocation.id, 14);
  console.log("Dates:", dates);

  if (dates.length > 0) {
    // try to get zones
    const { data: zones } = await supabase
      .from("restaurant_zones")
      .select("id")
      .eq("location_id", defaultLocation.id)
      .limit(1);
    const zoneId = zones?.[0]?.id;
    if (zoneId) {
      const times = await getAvailableTimes(
        defaultLocation.id,
        dates[0].id,
        zoneId,
        2,
      );
      console.log("Times for first date:", times);
    }
  }
}

run();
