"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import {
  uploadDocument,
  createRequirementGroup,
  createAddress,
} from "@/lib/telnyx";
import { TELNYX_REQ_IDS } from "@/lib/telnyx-req-ids";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function approveComplianceRequest(requirementId: string) {
  console.log("[Admin] approveComplianceRequest STARTED", { requirementId });

  // 1. Verify Admin
  const { supabase, user } = await getAuthContext();
  if (user.app_metadata?.role !== "superadmin") {
    console.error("[Admin] Unauthorized: User is not superadmin", {
      userId: user.id,
    });
    throw new Error("Unauthorized: Admin Access Required");
  }

  const supabaseAdmin = createAdminClient();

  console.log("[Admin] Locking request...");
  // 2. Atomic Lock: Transition from 'pending_review' to 'pending'
  // This prevents race conditions where two admins click approve simultaneously.
  // We use 'pending' because 'processing' is not in the Enum, and 'pending' effectively locks it from being picked up again (since we query for pending_review)
  const { data: request, error: updateError } = await supabaseAdmin
    .from("telnyx_regulatory_requirements")
    .update({ status: "pending" })
    .eq("id", requirementId)
    .eq("status", "pending_review")
    .select("*")
    .single();

  if (updateError || !request) {
    console.error("[Admin] Failed to lock request", { updateError, request });
    throw new Error(
      "Request not found given the criteria (it might be already processing or handled).",
    );
  }
  console.log("[Admin] Request locked and fetched", { requestId: request.id });

  try {
    const { identity_path, address_path, identity_filename, address_filename } =
      request.documents_data;

    console.log("[Admin] Downloading documents...", {
      identity_path,
      address_path,
    });

    // 3. Download files
    const { data: identityData, error: identityError } = await supabase.storage
      .from("compliance-docs")
      .download(identity_path);
    if (identityError) {
      console.error("[Admin] Identity download failed", identityError);
      throw new Error("Failed to download identity doc");
    }

    const { data: addressData, error: addressError } = await supabase.storage
      .from("compliance-docs")
      .download(address_path);
    if (addressError) {
      console.error("[Admin] Address download failed", addressError);
      throw new Error("Failed to download address doc");
    }

    console.log("[Admin] Documents downloaded. Uploading to Telnyx...");

    // 4. Upload to Telnyx
    const telnyxIdentityDoc = await uploadDocument(
      identityData,
      identity_filename,
    );
    console.log("[Admin] Identity uploaded to Telnyx", {
      id: telnyxIdentityDoc.id,
    });

    // 4. Create Address Object in Telnyx
    const addressDoc = await uploadDocument(addressData, address_filename); // Assuming addressData is the Blob and address_filename is the filename
    console.log("[Admin] Address doc uploaded to Telnyx", {
      id: addressDoc.id,
    });

    const telnyxAddressData = {
      customer_reference: `addr_loc_${request.location_id}`,
      street_address: request.documents_data.streetAddress, // e.g. "Via Roma 1"
      locality: request.documents_data.city, // e.g. "Milano"
      postal_code: request.documents_data.zipCode,
      country_code: "IT",
      administrative_area: request.documents_data.province, // e.g. "MI"
      business_name: request.documents_data.businessName,
      first_name: request.documents_data.firstName,
      last_name: request.documents_data.lastName,
    };
    console.log("[Admin] Creating Telnyx address...", telnyxAddressData);

    const telnyxAddress = await createAddress(telnyxAddressData); // Assuming createAddress is imported and available
    console.log("[Admin] Telnyx address created", { id: telnyxAddress.id });

    // 5. Prepare Requirements Array
    const {
      customerType,
      businessName,
      firstName,
      lastName,
      taxCode,
      vatNumber,
      idType,
      idNumber,
      idIssuer,
      idExpirationDate,
      placeOfBirth,
      dateOfBirth,
    } = request.documents_data;

    // Common Requirements
    const requirements = [
      {
        requirement_id: TELNYX_REQ_IDS.PROOF_OF_ADDRESS,
        field_value: addressDoc.id,
      },
      {
        requirement_id: TELNYX_REQ_IDS.ADDRESS_ID,
        field_value: telnyxAddress.id,
      },
      {
        requirement_id: TELNYX_REQ_IDS.CUSTOMER_TYPE,
        field_value: customerType,
      },
      {
        requirement_id: TELNYX_REQ_IDS.END_USER_NAME,
        field_value:
          customerType === "legal_entity"
            ? businessName
            : `${firstName} ${lastName}`,
      },
    ];

    // Specific Requirements based on Customer Type
    if (customerType === "legal_entity") {
      requirements.push(
        {
          requirement_id: TELNYX_REQ_IDS.LOCAL_ID_COPY,
          field_value: telnyxIdentityDoc.id,
        },
        { requirement_id: TELNYX_REQ_IDS.VAT_NUMBER, field_value: vatNumber },
        {
          requirement_id: TELNYX_REQ_IDS.TAX_CODE_COMPANY,
          field_value: taxCode || vatNumber,
        },
        {
          requirement_id: TELNYX_REQ_IDS.COMPANY_REGISTRATION,
          field_value: addressDoc.id,
        }, // Using same doc if Visura
        // For Legal Rep details (Telnyx asks for ID details of the rep)
        { requirement_id: TELNYX_REQ_IDS.ID_TYPE, field_value: idType },
        { requirement_id: TELNYX_REQ_IDS.ID_NUMBER, field_value: idNumber },
        { requirement_id: TELNYX_REQ_IDS.ID_ISSUER, field_value: idIssuer },
        {
          requirement_id: TELNYX_REQ_IDS.ID_EXPIRATION_DATE,
          field_value: idExpirationDate,
        },
        {
          requirement_id: TELNYX_REQ_IDS.PLACE_OF_BIRTH,
          field_value: placeOfBirth,
        },
        {
          requirement_id: TELNYX_REQ_IDS.DATE_OF_BIRTH,
          field_value: dateOfBirth,
        },
        // Supplemental Address for Legal Rep
        {
          requirement_id: TELNYX_REQ_IDS.LEGAL_REP_ADDRESS,
          field_value: telnyxAddress.id,
        },
      );
    } else {
      // Natural Person
      requirements.push(
        {
          requirement_id: TELNYX_REQ_IDS.LOCAL_ID_COPY,
          field_value: telnyxIdentityDoc.id,
        },
        {
          requirement_id: TELNYX_REQ_IDS.TAX_CODE_PERSONAL,
          field_value: taxCode,
        },
        { requirement_id: TELNYX_REQ_IDS.ID_TYPE, field_value: idType },
        { requirement_id: TELNYX_REQ_IDS.ID_NUMBER, field_value: idNumber },
        { requirement_id: TELNYX_REQ_IDS.ID_ISSUER, field_value: idIssuer },
        {
          requirement_id: TELNYX_REQ_IDS.ID_EXPIRATION_DATE,
          field_value: idExpirationDate,
        },
        {
          requirement_id: TELNYX_REQ_IDS.PLACE_OF_BIRTH,
          field_value: placeOfBirth,
        },
        {
          requirement_id: TELNYX_REQ_IDS.DATE_OF_BIRTH,
          field_value: dateOfBirth,
        },
      );
    }

    const customerReference = `loc_${request.location_id}_${request.area_code}`; // Precise ref
    console.log("[Admin] Creating Requirement Group...", {
      customerReference,
      requirementsCount: requirements.length,
    });

    const requirementGroup = await createRequirementGroup(
      "IT",
      "local",
      "ordering",
      customerReference,
      requirements,
    );
    console.log("[Admin] Requirement Group created", {
      id: requirementGroup.id,
      status: requirementGroup.status,
    });

    // 6. Update DB
    console.log("[Admin] Updating DB with Requirement Group ID...", {
      status: requirementGroup.status.toLowerCase(),
      telnyx_requirement_group_id: requirementGroup.id,
    });
    const {
      data: updatedData,
      error: finalUpdateError,
      count: updatedCount,
    } = await supabaseAdmin
      .from("telnyx_regulatory_requirements")
      .update({
        status:
          requirementGroup.status.toLowerCase() === "unapproved"
            ? "pending"
            : requirementGroup.status.toLowerCase(), // Map 'unapproved' to 'pending' as 'unapproved' might not be in our ENUM
        telnyx_requirement_group_id: requirementGroup.id,
        documents_data: {
          ...request.documents_data,
          telnyx_identity_id: telnyxIdentityDoc.id,
          telnyx_address_id: addressDoc.id,
        },
      })
      .eq("id", requirementId)
      .select()
      .single();

    if (finalUpdateError) {
      console.error("[Admin] DB Update FAILED", finalUpdateError);
      throw finalUpdateError;
    }

    console.log("[Admin] DB Updated successfully. Revalidating...", {
      updatedData,
      updatedCount,
    });

    // 7. Notify User
    // Use organization owner email? simpler query for now
    // We assume the admin knows what they are doing. Implicitly we could notify the org owner.

    revalidatePath("/manage");
    console.log("[Admin] approveComplianceRequest COMPLETED SUCCESSFULLY");
    return { success: true };
  } catch (error: any) {
    console.error("[Admin] CRITICAL Approval Error:", error);
    // Rollback: Revert to pending_review so it reappears in dashboard and can be retried
    const { error: rollbackError } = await supabaseAdmin
      .from("telnyx_regulatory_requirements")
      .update({ status: "pending_review" })
      .eq("id", requirementId)
      .eq("status", "pending"); // Safety check

    if (rollbackError) {
      console.error(
        "[Admin] CRITICAL: Failed to rollback status for req",
        requirementId,
        rollbackError,
      );
    } else {
      console.log("[Admin] Rolled back status to pending_review");
    }

    return { success: false, error: error.message };
  }
}

export async function rejectComplianceRequest(
  requirementId: string,
  reason: string,
) {
  // 1. Verify Admin
  const { user } = await getAuthContext();
  if (user.app_metadata?.role !== "superadmin") throw new Error("Unauthorized");

  const supabaseAdmin = createAdminClient();

  // 2. Update DB
  await supabaseAdmin
    .from("telnyx_regulatory_requirements")
    .update({
      status: "rejected",
      rejection_reason: reason,
    })
    .eq("id", requirementId);

  revalidatePath("/manage");
  return { success: true };
}

export async function resetComplianceStatusAction(requirementId: string) {
  const supabase = createAdminClient();

  await supabase
    .from("telnyx_regulatory_requirements")
    .update({ status: "pending_review" })
    .eq("id", requirementId);

  revalidatePath("/manage");
}
