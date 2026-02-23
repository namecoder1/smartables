import { createAdminClient } from "@/utils/supabase/admin";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function verifyWebhook() {
  const supabase = createAdminClient();

  console.log("Verifying Telnyx Webhook Execution...");
  console.log("Fetching locations with Telnyx phone numbers...");

  const { data: locations, error } = await supabase
    .from("locations")
    .select(
      `
      id,
      name,
      telnyx_phone_number,
      activation_status,
      meta_phone_id,
      organization:organizations(telnyx_managed_account_id),
      telnyx_regulatory_requirements:telnyx_regulatory_requirements!telnyx_regulatory_requirements_location_id_fkey (
        status,
        telnyx_requirement_group_id,
        rejection_reason
      )
    `,
    )
    .not("telnyx_phone_number", "is", null);

  if (error) {
    console.error("Error fetching locations:", error);
    return;
  }

  if (!locations || locations.length === 0) {
    console.log("No locations found with Telnyx phone numbers.");
    return;
  }

  console.table(
    locations.map((loc: any) => {
      const req = Array.isArray(loc.telnyx_regulatory_requirements)
        ? loc.telnyx_regulatory_requirements[0]
        : loc.telnyx_regulatory_requirements;
      const org = Array.isArray(loc.organization)
        ? loc.organization[0]
        : loc.organization;

      return {
        "Location Name": loc.name,
        "Phone Number": loc.telnyx_phone_number,
        "Activation Status": loc.activation_status,
        "Meta Phone ID": loc.meta_phone_id || "N/A",
        "Org WABA ID": org?.telnyx_managed_account_id || "N/A",
        "Req Status": req?.status || "N/A",
        "Req ID": req?.telnyx_requirement_group_id || "N/A",
      };
    }),
  );
}

verifyWebhook();
