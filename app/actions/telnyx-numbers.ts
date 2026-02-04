"use server";

import { createClient } from "@/supabase/server";
import { searchAvailableNumbers, purchasePhoneNumber } from "@/lib/telnyx";
import { revalidatePath } from "next/cache";

export async function searchNumbersAction(countryCode: string, region: string) {
  // Validate session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

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
    // MOCK PURCHASE FOR TESTING (To save $)
    // const purchase = await purchasePhoneNumber(phoneNumber, requirementGroupId);
    const purchase = { id: "mock_order_id", status: "pending" };

    // 2. Save to Locations table
    // We also want to save the 'connection_id' if we created one?
    // For now, let's assume we just save the number.
    // Also update activation_status.

    await supabase
      .from("locations")
      .update({
        telnyx_phone_number: phoneNumber,
        // If we get an ID from purchase, we might save it?
        // purchase response usually has order details.
        // We'll update status to 'active' definitively if not already.
        // We set it to 'pending' initially. The webhook will flip it to 'active'
        // once the requirement group is fully approved (if not already).
        activation_status: purchase.status === "active" ? "active" : "pending",
      })
      .eq("id", locationId);

    revalidatePath("/compliance");
    return { success: true };
  } catch (error: any) {
    // Revert lock if purchased failed
    const supabase = await createClient(); // Re-init if needed or reuse
    await supabase
      .from("locations")
      .update({ activation_status: "active" }) // Revert to active so user can try again. 'active' means 'compliance approved' in this context map.
      .eq("id", locationId)
      .eq("activation_status", "purchasing"); // Only revert if still purchasing

    throw new Error(error.message);
  }
}
