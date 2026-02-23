import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Import dynamically after config
import { createAdminClient } from "@/utils/supabase/admin";

async function syncTelnyxStatus() {
  const { getRequirementGroup, getOwnedNumbers } = await import("@/lib/telnyx");
  const supabase = createAdminClient();

  console.log("Syncing Telnyx Status...");

  // --- PART 1: Check Requirement Groups ---
  console.log("\n--- Checking Requirement Groups ---");
  const { data: requirements, error } = await supabase
    .from("telnyx_regulatory_requirements")
    .select("id, telnyx_requirement_group_id, status")
    .neq("status", "approved");

  if (error) {
    console.error("Error fetching requirements:", error);
  } else if (requirements && requirements.length > 0) {
    console.log(`Found ${requirements.length} unapproved requirements.`);
    for (const req of requirements) {
      if (!req.telnyx_requirement_group_id) continue;
      try {
        const telnyxGroup = await getRequirementGroup(
          req.telnyx_requirement_group_id,
        );
        if (telnyxGroup.status === "approved" && req.status !== "approved") {
          console.log(
            `  -> Req Group ${req.telnyx_requirement_group_id} is APPROVED in Telnyx! Triggering webhook...`,
          );
          await triggerWebhook(req.telnyx_requirement_group_id);
        }
      } catch (e) {
        console.error(
          `Error checking req group ${req.telnyx_requirement_group_id}:`,
          e,
        );
      }
    }
  } else {
    console.log("No unapproved requirements found.");
  }

  // --- PART 2: Check Active Numbers ---
  console.log("\n--- Checking Active Numbers ---");

  // Fetch locations that are NOT verified yet but have a number
  const { data: locations, error: locError } = await supabase
    .from("locations")
    .select(
      `
        id, 
        name, 
        telnyx_phone_number, 
        activation_status,
        telnyx_regulatory_requirements:telnyx_regulatory_requirements!telnyx_regulatory_requirements_location_id_fkey (
            id,
            telnyx_requirement_group_id,
            status
        )
    `,
    )
    .not("telnyx_phone_number", "is", null)
    .neq("activation_status", "verified"); // "verified" means fully done (voice check passed)

  if (locError) {
    console.error("Error fetching locations:", locError);
    return;
  }

  if (!locations || locations.length === 0) {
    console.log("No pending locations found.");
    return;
  }

  console.log("Fetching owned numbers from Telnyx...");
  let ownedNumbers;
  try {
    ownedNumbers = await getOwnedNumbers();
  } catch (e) {
    console.error("Failed to get owned numbers from Telnyx:", e);
    return;
  }

  for (const loc of locations) {
    const telnyxNum = loc.telnyx_phone_number;
    // @ts-ignore
    const reqGroup = loc.telnyx_regulatory_requirements;

    console.log(
      `Checking location: ${loc.name} (${telnyxNum}) - Status: ${loc.activation_status}`,
    );

    const matchedNum = ownedNumbers.find(
      (n: any) => n.phoneNumber === telnyxNum,
    );

    if (matchedNum) {
      console.log(`  -> Found in Telnyx! Status: ${matchedNum.status}`);

      if (matchedNum.status === "active") {
        const reqGroupId =
          Array.isArray(reqGroup) && reqGroup.length > 0
            ? reqGroup[0].telnyx_requirement_group_id
            : (reqGroup as any)?.telnyx_requirement_group_id;

        const reqGroupStatus =
          Array.isArray(reqGroup) && reqGroup.length > 0
            ? reqGroup[0].status
            : (reqGroup as any)?.status;
        // If local requirements are NOT approved, but number IS active, force approval via webhook
        if (reqGroup && reqGroupStatus !== "approved" && reqGroupId) {
          console.log(
            `  -> Number is ACTIVE but requirements are '${reqGroupStatus}'. Triggering webhook to sync...`,
          );
          await triggerWebhook(reqGroupId);
        }
        // If requirements ARE approved but location is not 'active' (e.g. 'provisioning'), the webhook should handle it too.
        // But usually 'status_updated' webhook handles both.
        else if (loc.activation_status !== "active") {
          // If we are here, it means requirements might be approved but location didn't update?
          // Or maybe we just want to run the flow to be sure.
          if (reqGroupId) {
            console.log(
              `  -> Number is ACTIVE but location status is '${loc.activation_status}'. Triggering webhook to ensure activation...`,
            );
            await triggerWebhook(reqGroupId);
          } else {
            console.warn(
              "  -> Cannot trigger webhook: No Requirement Group ID linked.",
            );
          }
        } else {
          console.log(
            "  -> Location matches active status (or is waiting for voice verification). No action.",
          );
        }
      }
    } else {
      console.log(
        "  -> Number not found in Telnyx owned numbers (or format mismatch).",
      );
    }
  }
}

async function triggerWebhook(id: string) {
  const payload = {
    data: {
      event_type: "requirement_group.status_updated",
      payload: {
        id: id,
        status: "approved",
      },
    },
  };

  try {
    const response = await fetch("http://localhost:3000/api/webhooks/telnyx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log("    [Webhook] Triggered successfully!");
    } else {
      console.error("    [Webhook] Failed:", await response.text());
    }
  } catch (e) {
    console.error("    [Webhook] Error invoking:", e);
  }
}

syncTelnyxStatus();
