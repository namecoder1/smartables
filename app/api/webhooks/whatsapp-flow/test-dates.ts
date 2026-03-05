import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function run() {
  const { data: defaultLocation, error } = await supabase
    .from("locations")
    .select("id, name, opening_hours")
    .limit(1)
    .single();
  if (error) console.error(error);
  console.log(
    "Location:",
    JSON.stringify(defaultLocation?.opening_hours, null, 2),
  );
}
run();
