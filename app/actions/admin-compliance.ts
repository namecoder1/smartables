"use server";

import { createClient } from "@/supabase/server";
import {
  uploadDocument,
  createRequirementGroup,
  createAddress,
} from "@/lib/telnyx";
import { TELNYX_REQ_IDS } from "@/lib/telnyx-req-ids";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";

const resend = new Resend(process.env.RESEND_API_KEY);

const REQ_ID_IDENTITY_PROOF = "86649686-5e33-469b-8169-2f5407cb591d";
const REQ_ID_ADDRESS_PROOF = "363e79bd-1002-4217-8854-5188c0051e73";

export async function approveComplianceRequest(requirementId: string) {
  const supabase = await createClient();

  // 1. Verify Admin (Basic role check or rely on RLS/Middleware if admin path is protected)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Optional: Check if user has admin role from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const ADMIN_ID = "0a82970f-1fc5-4a52-97a1-a8613de0e3f7";
  if (profile?.role !== "admin" && user.id !== ADMIN_ID) {
    throw new Error("Unauthorized: Admin Access Required");
  }

  // 2. Atomic Lock: Transition from 'pending_review' to 'processing'
  // This prevents race conditions where two admins click approve simultaneously.
  const { data: request, error: updateError } = await supabase
    .from("telnyx_regulatory_requirements")
    .update({ status: "processing" })
    .eq("id", requirementId)
    .eq("status", "pending_review")
    .select("*")
    .single();

  if (updateError || !request) {
    throw new Error(
      "Request not found given the criteria (it might be already processing or handled).",
    );
  }

  try {
    const { identity_path, address_path, identity_filename, address_filename } =
      request.documents_data;

    // 3. Download files
    const { data: identityData, error: identityError } = await supabase.storage
      .from("compliance-docs")
      .download(identity_path);
    if (identityError) throw new Error("Failed to download identity doc");

    const { data: addressData, error: addressError } = await supabase.storage
      .from("compliance-docs")
      .download(address_path);
    if (addressError) throw new Error("Failed to download address doc");

    // 4. Upload to Telnyx
    const telnyxIdentityDoc = await uploadDocument(
      identityData,
      identity_filename,
    );
    // 4. Create Address Object in Telnyx
    const addressDoc = await uploadDocument(addressData, address_filename); // Assuming addressData is the Blob and address_filename is the filename
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

    const telnyxAddress = await createAddress(telnyxAddressData); // Assuming createAddress is imported and available

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

    const requirementGroup = await createRequirementGroup(
      "IT",
      "local",
      "ordering",
      customerReference,
      requirements,
    );

    // 6. Update DB
    await supabase
      .from("telnyx_regulatory_requirements")
      .update({
        status: requirementGroup.status.toLowerCase(), // 'pending' usually from Telnyx
        telnyx_requirement_group_id: requirementGroup.id,
        documents_data: {
          ...request.documents_data,
          telnyx_identity_id: telnyxIdentityDoc.id,
          telnyx_address_id: addressDoc.id,
        },
      })
      .eq("id", requirementId);

    // 7. Notify User
    // Use organization owner email? simpler query for now
    // We assume the admin knows what they are doing. Implicitly we could notify the org owner.

    revalidatePath("/manage");
    return { success: true };
  } catch (error: any) {
    console.error("Approval Error:", error);
    // Rollback: Revert to pending_review so it reappears in dashboard and can be retried
    const { error: rollbackError } = await supabase
      .from("telnyx_regulatory_requirements")
      .update({ status: "pending_review" })
      .eq("id", requirementId)
      .eq("status", "processing"); // Safety check

    if (rollbackError) {
      console.error(
        "Critical: Failed to rollback status for req",
        requirementId,
        rollbackError,
      );
    }

    return { success: false, error: error.message };
  }
}

export async function rejectComplianceRequest(
  requirementId: string,
  reason: string,
) {
  const supabase = await createClient();

  // 1. Verify Admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const ADMIN_ID = "0a82970f-1fc5-4a52-97a1-a8613de0e3f7";
  if (profile?.role !== "admin" && user.id !== ADMIN_ID)
    throw new Error("Unauthorized");

  // 2. Update DB
  await supabase
    .from("telnyx_regulatory_requirements")
    .update({
      status: "rejected",
      rejection_reason: reason,
    })
    .eq("id", requirementId);

  revalidatePath("/manage");
  return { success: true };
}
