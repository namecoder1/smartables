import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELNYX_API_KEY = process.env.TELNYX_API_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function fetchTelnyx(endpoint: string) {
  const res = await fetch(`https://api.telnyx.com/v2/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${TELNYX_API_KEY}`,
      Accept: "application/json",
    },
  });
  return res.json();
}

async function runAudit() {
  console.log("\n========================================");
  console.log("🔍 SUPABASE DATABASE STATE");
  console.log("========================================");

  const { data: locations, error: locErr } = await supabase
    .from("locations")
    .select("id, name, telnyx_phone_number, meta_phone_id, activation_status");
  if (locErr) console.error("Error fetching locations:", locErr);

  if (locations) {
    for (const loc of locations) {
      console.log(`\nLocation: ${loc.name} (ID: ${loc.id})`);
      console.log(`  - Assigned Number: ${loc.telnyx_phone_number || "NONE"}`);
      console.log(`  - Meta Phone ID: ${loc.meta_phone_id || "NONE"}`);
      console.log(`  - Status: ${loc.activation_status}`);

      const { data: reqs } = await supabase
        .from("telnyx_regulatory_requirements")
        .select("*")
        .eq("location_id", loc.id);
      if (reqs && reqs.length > 0) {
        reqs.forEach((r) => {
          console.log(
            `  - DB Requirement Group: ${r.telnyx_requirement_group_id} (Status: ${r.status})`,
          );
        });
      } else {
        console.log(`  - DB Requirement Group: NONE`);
      }
    }
  }

  console.log("\n========================================");
  console.log("📡 TELNYX REQUIREMENT GROUPS");
  console.log("========================================");

  const reqGroupsRes = await fetchTelnyx("requirement_groups");
  const reqGroups = reqGroupsRes.data || [];
  if (reqGroups.length === 0)
    console.log("No requirement groups found on Telnyx.");
  reqGroups.forEach((rg: any) => {
    console.log(`Group ID: ${rg.id}`);
    console.log(`  - Status: ${rg.status}`);
    console.log(`  - Action: ${rg.action}`);
    console.log(`  - Ref: ${rg.customer_reference}`);
    console.log(`  - Country: ${rg.country_code}`);
    console.log("---");
  });

  console.log("\n========================================");
  console.log("📞 TELNYX PHONE NUMBERS");
  console.log("========================================");

  const numbersRes = await fetchTelnyx("phone_numbers");
  const numbers = numbersRes.data || [];
  if (numbers.length === 0) console.log("No phone numbers found on Telnyx.");
  numbers.forEach((num: any) => {
    console.log(`Number: ${num.phone_number}`);
    console.log(`  - ID: ${num.id}`);
    console.log(`  - Status: ${num.status}`);
    console.log(`  - Req Group ID: ${num.requirement_group_id || "NONE"}`);
    console.log(
      `  - Connection: ${num.connection_name || num.connection_id || "NONE"}`,
    );
    console.log(
      `  - Action Needed: ${num.status === "requirement-info-under-review" ? "PENDING MANUAL REVIEW BY TELNYX" : "NONE"}`,
    );
    console.log("---");
  });

  console.log("\n========================================");
  console.log("📦 TELNYX PENDING ORDERS");
  console.log("========================================");
  const ordersRes = await fetchTelnyx("number_orders?filter[status]=pending");
  const orders = ordersRes.data || [];
  if (orders.length === 0) console.log("No pending orders found.");
  orders.forEach((ord: any) => {
    console.log(`Order ID: ${ord.id}`);
    console.log(`  - Status: ${ord.status}`);
    console.log(`  - Created: ${ord.created_at}`);
    console.log(
      `  - Requirements: ${ord.requirements?.length > 0 ? "YES" : "NO"}`,
    );
    console.log("---");
  });

  console.log("\n========================================");
  console.log("💡 SUMMARY & NEXT STEPS");
  console.log("========================================");
  console.log(
    "If your requirement groups are 'unapproved' on Telnyx, you CANNOT buy a new number and instantly activate it by attaching that group. Telnyx will block it.",
  );
  console.log(
    "If you have an existing 'active' number that has NO requirement group attached, it can route calls temporarily, but might have reduced features.",
  );
  console.log(
    "To bypass Meta block, we must use a completely fresh number that Meta has never seen.",
  );
  console.log("\nAudit complete.\n");
}

runAudit();
