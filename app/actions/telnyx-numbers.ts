"use server";

import { createClient } from "@/utils/supabase/server";
import { searchAvailableNumbers, purchasePhoneNumber } from "@/lib/telnyx";
import { revalidatePath } from "next/cache";

import { getAuthContext } from "@/lib/auth";

export async function searchNumbersAction(countryCode: string, region: string) {
  // Validate session
  await getAuthContext();

  try {
    const numbers = await searchAvailableNumbers(countryCode, region);
    return numbers;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function buyNumberAction(
  phoneNumber: string,
  locationId: string,
  requirementGroupId: string,
) {
  const { supabase } = await getAuthContext();

  try {
    // 1. Atomic Lock for Purchase (Double Spending Protection)
    // We attempt to set status to 'purchasing'. If it fails (already purchasing or has number), we abort.
    const { data: location, error: lockError } = await supabase
      .from("locations")
      .update({ activation_status: "purchasing" })
      .eq("id", locationId)
      .is("telnyx_phone_number", null)
      .neq("activation_status", "purchasing") // Prevent double-lock
      .select()
      .single();

    if (lockError || !location) {
      throw new Error(
        "Unable to initiate purchase. Location might already have a number or purchase is in progress.",
      );
    }

    // 2. Purchase on Telnyx
    // We pass the requirementGroupId to satisfy regulatory compliance
    // Telnyx allows linking 'pending'/'unapproved' bundles to the order.
    const purchase = await purchasePhoneNumber(phoneNumber, requirementGroupId);

    // 3. Save to Locations table
    // Set status to 'provisioning' because we are waiting for the Regulatory Bundle to match and be approved.
    // The Webhook will flip this to 'active' and trigger Meta WABA.
    await supabase
      .from("locations")
      .update({
        telnyx_phone_number: phoneNumber,
        activation_status: "provisioning",
      })
      .eq("id", locationId);

    revalidatePath("/compliance");
    return { success: true };
  } catch (error: any) {
    console.error("Buy Number Error:", error);
    // Revert lock if purchased failed
    const supabase = await createClient(); // Re-init if needed or reuse
    await supabase
      .from("locations")
      .update({ activation_status: "pending" }) // Revert to pending so user can try again.
      .eq("id", locationId)
      .eq("activation_status", "purchasing"); // Only revert if still purchasing

    throw new Error(error.message);
  }
}
