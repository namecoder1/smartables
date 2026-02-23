import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkDb() {
  const { data: loc } = await supabase
    .from("locations")
    .select("id")
    .eq("name", "Original Centro")
    .single();
  const { data } = await supabase
    .from("telnyx_regulatory_requirements")
    .select("*")
    .eq("location_id", loc?.id);
  console.log("DB Requirements for location:", data);
}

checkDb();
