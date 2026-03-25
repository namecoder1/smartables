"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/supabase-helpers";
import { searchAvailableNumbers, purchasePhoneNumber } from "@/lib/telnyx";
import { revalidatePath } from "next/cache";
import { PATHS } from "@/lib/revalidation-paths";
import { fail } from "@/lib/action-response";
import { captureCritical } from "@/lib/monitoring";

export async function searchNumbersAction(countryCode: string, region: string) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);

  try {
    const numbers = await searchAvailableNumbers(countryCode, region);
    return numbers;
  } catch (error: any) {
    return fail(error.message);
  }
}

export async function buyNumberAction(
  phoneNumber: string,
  locationId: string,
  requirementGroupId: string,
) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  try {
    // 1. Atomic Lock for Purchase (Double Spending Protection)
    const { data: location, error: lockError } = await supabase
      .from("locations")
      .update({ activation_status: "purchasing" })
      .eq("id", locationId)
      .is("telnyx_phone_number", null)
      .neq("activation_status", "purchasing")
      .select()
      .single();

    if (lockError || !location) {
      throw new Error(
        "Unable to initiate purchase. Location might already have a number or purchase is in progress.",
      );
    }

    // 2. Purchase on Telnyx
    await purchasePhoneNumber(phoneNumber, requirementGroupId);

    // 3. Save to Locations table
    const { error: saveError } = await supabase
      .from("locations")
      .update({
        telnyx_phone_number: phoneNumber,
        activation_status: "provisioning",
      })
      .eq("id", locationId);

    if (saveError) {
      // Phone purchased but not saved — critical: inconsistent state
      captureCritical(saveError, {
        service: "supabase",
        flow: "phone_purchase",
        locationId,
        phoneNumber,
      });
      throw saveError;
    }

    revalidatePath(PATHS.COMPLIANCE);
    return { success: true };
  } catch (error: any) {
    // Revert lock if purchase failed
    const supabaseRollback = await createClient();
    await supabaseRollback
      .from("locations")
      .update({ activation_status: "pending" })
      .eq("id", locationId)
      .eq("activation_status", "purchasing");

    return fail(error.message);
  }
}
