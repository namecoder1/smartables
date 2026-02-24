import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

// Load .env.local from the web directory
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWebhook() {
  console.log("--- Telnyx Webhook Verification Script ---");

  // 1. Find a test location/requirement
  const { data: req, error: reqError } = await supabase
    .from("telnyx_regulatory_requirements")
    .select("telnyx_requirement_group_id, location_id")
    .limit(1)
    .single();

  if (reqError || !req) {
    console.error(
      "No requirement group found in DB to test with:",
      reqError?.message,
    );
    return;
  }

  const payload = {
    data: {
      event_type: "requirement_group.status_updated",
      payload: {
        id: req.telnyx_requirement_group_id,
        status: "rejected",
        suborder_comments:
          "TEST REJECTION: Il documento è troppo sfocato. Caricare una scansione ad alta risoluzione.",
      },
    },
  };

  console.log(
    `Sending mock webhook for Requirement Group: ${req.telnyx_requirement_group_id}`,
  );

  try {
    const response = await fetch("http://localhost:3000/api/webhooks/telnyx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log("✅ Webhook sent successfully!");
      const result = await response.json();
      console.log("Response:", result);

      console.log("Waiting 2 seconds for DB updates...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 2. Verify DB update for Rejection Reason
      const { data: updatedReq } = await supabase
        .from("telnyx_regulatory_requirements")
        .select("status, rejection_reason")
        .eq("telnyx_requirement_group_id", req.telnyx_requirement_group_id)
        .single();

      console.log("Updated DB Record (Requirement):", updatedReq);
      if (updatedReq?.rejection_reason?.includes("TEST REJECTION")) {
        console.log("✅ Rejection reason updated successfully in DB!");
      } else {
        console.error("❌ Rejection reason NOT updated correctly.");
      }

      // 3. Verify Log Entry
      const { data: logEntry } = await supabase
        .from("telnyx_webhook_logs")
        .select("*")
        .eq("event_type", "requirement_group.status_updated")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (logEntry) {
        console.log("✅ Latest Log Entry Found!");
        console.log("Log linking:", {
          locationId: logEntry.location_id,
          organizationId: logEntry.organization_id,
          matches: logEntry.location_id === req.location_id,
        });
        if (logEntry.location_id === req.location_id) {
          console.log("✅ Log correctly linked to location!");
        } else {
          console.error("❌ Log linking mismatch.");
        }
      } else {
        console.error(
          "❌ No log entry found in telnyx_webhook_logs. (Did you run the migration?)",
        );
      }
    } else {
      console.error(
        `❌ Webhook failed: ${response.status}`,
        await response.text(),
      );
    }
  } catch (err: any) {
    console.error("❌ Error running test:", err.message);
    console.log(
      "\nTIP: Make sure the local server is running at http://localhost:3000 (npm run dev)",
    );
  }
}

testWebhook();
