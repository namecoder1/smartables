"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import {
  uploadDocument,
  createRequirementGroup,
  createAddress,
  TELNYX_REQ_IDS,
} from "@/lib/telnyx";

import { resend } from "@/utils/resend/client";
import { render } from "@react-email/components";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/supabase-helpers";
import ComplianceRejectedEmail from "@/emails/compliance-rejected";
import { captureCritical, captureWarning } from "@/lib/monitoring";

export async function approveComplianceRequest(requirementId: string) {
  // 1. Verify Admin
  const auth = await requireAuth();
  if (!auth.success) return { success: false, error: "Non autorizzato" };
  const { supabase, user } = auth;
  if (user.app_metadata?.role !== "superadmin") {
    return { success: false, error: "Unauthorized: Admin Access Required" };
  }

  const supabaseAdmin = createAdminClient();

  // 2. Atomic Lock: Transition from 'pending_review' to 'pending'
  // This prevents race conditions where two admins click approve simultaneously.
  // We use 'pending' because 'processing' is not in the Enum, and 'pending' effectively locks it from being picked up again (since we query for pending_review)
  const { data: request, error: updateError } = await supabaseAdmin
    .from("locations")
    .update({ regulatory_status: "pending" })
    .eq("id", requirementId)
    .eq("regulatory_status", "pending_review")
    .select("*")
    .single();

  if (updateError || !request) {
    return { success: false, error: "Request not found given the criteria (it might be already processing or handled)." };
  }

  try {
    const { identity_path, address_path, identity_filename, address_filename } =
      request.documents_data;

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

    const customerReference = `loc_${request.id}_${request.documents_data?.area_code || "IT"}`; // Precise ref

    const requirementGroup = await createRequirementGroup(
      "IT",
      "local",
      "ordering",
      customerReference,
      requirements,
    );

    // 6. Update DB
    const {
      data: updatedData,
      error: finalUpdateError,
      count: updatedCount,
    } = await supabaseAdmin
      .from("locations")
      .update({
        regulatory_status:
          requirementGroup.status.toLowerCase() === "unapproved"
            ? "pending"
            : requirementGroup.status.toLowerCase(),
        telnyx_requirement_group_id: requirementGroup.id,
        regulatory_documents_data: {
          ...request.regulatory_documents_data,
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

    // 7. Notify User
    // Use organization owner email? simpler query for now
    // We assume the admin knows what they are doing. Implicitly we could notify the org owner.

    revalidatePath("/manage");
    return { success: true };
  } catch (error: any) {
    captureCritical(error, { service: "telnyx", flow: "compliance_approval", locationId: requirementId });
    console.error("[Admin] CRITICAL Approval Error:", error);
    // Rollback: Revert to pending_review so it reappears in dashboard and can be retried
    const { error: rollbackError } = await supabaseAdmin
      .from("locations")
      .update({ regulatory_status: "pending_review" })
      .eq("id", requirementId)
      .eq("regulatory_status", "pending"); // Safety check

    if (rollbackError) {
      captureCritical(rollbackError, { service: "supabase", flow: "compliance_approval_rollback", locationId: requirementId });
      console.error(
        "[Admin] CRITICAL: Failed to rollback status for req",
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
  // 1. Verify Admin
  const auth = await requireAuth();
  if (!auth.success) return { success: false, error: "Non autorizzato" };
  const { user } = auth;
  if (user.app_metadata?.role !== "superadmin") return { success: false, error: "Unauthorized" };

  const supabaseAdmin = createAdminClient();

  // 2. Update DB
  const { data: location } = await supabaseAdmin
    .from("locations")
    .update({
      regulatory_status: "rejected",
      regulatory_rejection_reason: reason,
    })
    .eq("id", requirementId)
    .select("organization:organizations(name, billing_email)")
    .single();

  // 3. Notify org owner by email
  try {
    const org = (location?.organization as any);
    if (org?.billing_email) {
      const html = await render(
        ComplianceRejectedEmail({ teamName: org.name ?? "Smartables", reason }),
      );
      await resend.emails.send({
        from: "Smartables <noreply@smartables.it>",
        to: org.billing_email,
        subject: "Richiesta di conformità rifiutata",
        html,
      });
    }
  } catch (emailErr) {
    captureWarning("Failed to send compliance-rejected email", { service: "resend", flow: "compliance_rejection_email", locationId: requirementId });
    console.error("[rejectComplianceRequest] Failed to send email:", emailErr);
  }

  revalidatePath("/manage");
  return { success: true };
}

export async function resetComplianceStatusAction(locationId: string) {
  const supabase = createAdminClient();

  await supabase
    .from("locations")
    .update({ regulatory_status: "pending_review" })
    .eq("id", locationId);

  revalidatePath("/manage");
}
