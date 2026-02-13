import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  uploadDocument,
  createRequirementGroup,
  createAddress,
  searchAvailableNumbers,
  purchasePhoneNumber,
  submitRequirementGroup,
} from "@/lib/telnyx";
import { TELNYX_REQ_IDS } from "@/lib/telnyx-req-ids";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { locationId, identityPath, addressPath, areaCode, ...otherData } =
      await req.json();

    // 1. Validation
    if (!locationId || !identityPath || !addressPath || !areaCode) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 2. Download files from Supabase
    const { data: identityData, error: identityError } = await supabase.storage
      .from("compliance-docs")
      .download(identityPath);

    if (identityError || !identityData) {
      console.error("Download identity error", identityError);
      throw new Error("Failed to download identity document");
    }

    const { data: addressData, error: addressError } = await supabase.storage
      .from("compliance-docs")
      .download(addressPath);

    if (addressError || !addressData) {
      console.error("Download address error", addressError);
      throw new Error("Failed to download address document");
    }

    // 3. Status check (Optional: prevent if already approved?)
    // For now, we allow re-submission if it was rejected or if user wants to update.
    // Telnyx creates a NEW requirement group each time we call this, which is fine for "correction".

    // 4. Upload to Telnyx
    // Filenames
    const identityFilename = identityPath.split("/").pop() || "identity.jpg";
    const addressFilename = addressPath.split("/").pop() || "address.jpg";

    const telnyxIdentityDoc = await uploadDocument(
      identityData,
      identityFilename,
    );
    const telnyxAddressDoc = await uploadDocument(addressData, addressFilename);

    // 5. Create Address in Telnyx
    // Map existing fields to Telnyx address structure
    const telnyxAddressData = {
      customer_reference: `addr_loc_${locationId}`,
      street_address: otherData.streetAddress,
      locality: otherData.city,
      postal_code: otherData.zipCode,
      country_code: "IT",
      administrative_area: otherData.province,
      business_name: otherData.businessName,
      first_name: otherData.firstName,
      last_name: otherData.lastName,
    };
    const telnyxAddress = await createAddress(telnyxAddressData);

    // 6. Construct Requirements Array
    const {
      customerType,
      businessName,
      firstName,
      lastName,
      taxCode, // For Personal: CF, For Business: P.IVA (often same field in form)
      vatNumber, // Explicit VAT if separate
      idType,
      idNumber,
      idIssuer,
      idExpirationDate,
      placeOfBirth,
      dateOfBirth,
    } = otherData;

    // Validate otherData fields
    const requiredFields = [
      "customerType",
      "businessName",
      "firstName",
      "lastName",
      "idType",
      "idNumber",
      "idIssuer",
      "idExpirationDate",
      "placeOfBirth",
      "dateOfBirth",
    ];

    const missingFields = requiredFields.filter((field) => {
      // businessName only needed for legal_entity
      if (field === "businessName" && otherData.customerType !== "legal_entity")
        return false;
      return !otherData[field];
    });

    if (missingFields.length > 0) {
      console.error("Missing fields in payload:", missingFields);
      return NextResponse.json(
        { error: `Missing fields: ${missingFields.join(", ")}` },
        { status: 400 },
      );
    }

    // Common Requirements
    const requirements = [
      {
        requirement_id: TELNYX_REQ_IDS.PROOF_OF_ADDRESS,
        field_value: telnyxAddressDoc.id,
      },
      {
        requirement_id: TELNYX_REQ_IDS.ADDRESS_ID,
        field_value: telnyxAddress.id,
      },
      {
        requirement_id: TELNYX_REQ_IDS.CUSTOMER_TYPE,
        field_value: customerType, // "natural_person", "legal_entity", "sole_proprietorship"
      },
      {
        requirement_id: TELNYX_REQ_IDS.END_USER_NAME,
        field_value:
          customerType === "legal_entity"
            ? businessName
            : `${firstName} ${lastName}`,
      },
    ];

    // Specific Requirements
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
          field_value: telnyxAddressDoc.id, // Using same doc if Visura serves currently
        },
        // Legal Rep Details
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
        // Company Fields Workaround for natural_person
        // Even with correct customer_type, Telnyx seems to require these fields to be present.
        {
          requirement_id: TELNYX_REQ_IDS.TAX_CODE_COMPANY,
          field_value: "00000000000", // 11 zeroes as dummy VAT/Tax Code
        },
        {
          requirement_id: TELNYX_REQ_IDS.VAT_NUMBER,
          field_value: "00000000000", // 11 zeroes
        },
        {
          requirement_id: TELNYX_REQ_IDS.COMPANY_REGISTRATION,
          field_value: telnyxIdentityDoc.id, // Reuse Personal ID Doc
        },
        {
          requirement_id: TELNYX_REQ_IDS.LEGAL_REP_ADDRESS,
          field_value: telnyxAddress.id, // Reuse Personal Address
        },
      );
    }

    console.log(
      "Constructed Requirements:",
      JSON.stringify(requirements, null, 2),
    );

    // Check for undefined values in requirements
    const undefinedReqs = requirements.filter((r) => !r.field_value);
    if (undefinedReqs.length > 0) {
      console.error("Found requirements with missing values:", undefinedReqs);
      return NextResponse.json(
        { error: "One or more requirements are missing values." },
        { status: 400 },
      );
    }

    // 7. Create Requirement Group
    const customerReference = `loc_${locationId}_${areaCode}`;
    const requirementGroup = await createRequirementGroup(
      "IT",
      "local",
      "ordering",
      customerReference,
      requirements,
    );
    console.log(
      "Created Requirement Group:",
      JSON.stringify(requirementGroup, null, 2),
    );

    // 7.5 Submit Requirement Group (Explicitly) - REMOVED as it returns 404 for ordering RGs
    // try {
    //   const submittedRG = await submitRequirementGroup(requirementGroup.id);
    //   console.log("Submitted Requirement Group:", JSON.stringify(submittedRG, null, 2));
    // } catch (submitError) {
    //   console.error("Warning: Failed to auto-submit RG:", submitError);
    // }

    // 8. Save to Database
    const { error: dbError } = await supabase
      .from("telnyx_regulatory_requirements")
      .upsert(
        // ... (upsert logic unchanged)
        {
          organization_id: (
            await supabase
              .from("locations")
              .select("organization_id")
              .eq("id", locationId)
              .single()
          ).data?.organization_id,
          area_code: areaCode,
          country_code: "IT",
          telnyx_requirement_group_id: requirementGroup.id,
          status: requirementGroup.status, // "unapproved" usually
          location_id: locationId,
          documents_data: {
            identity_path: identityPath,
            address_path: addressPath,
            identity_filename: identityFilename,
            address_filename: addressFilename,
            telnyx_identity_id: telnyxIdentityDoc.id,
            telnyx_address_id: telnyxAddressDoc.id,
            ...otherData,
          },
        },
        { onConflict: "location_id" },
      );

    if (dbError) {
      console.error("DB Save Error:", dbError);
      throw new Error("Failed to save requirement group to DB");
    }

    // 9. Search & Purchase Number - REMOVED AUTO-PURCHASE
    // User requested to decouple this step. Frontend will handle purchase separately.
    let purchasedNumber = null;

    // 10. Update Location with Requirement ID & Phone Number
    // Need to fetch the ID of the inserted row first
    const { data: insertedReq } = await supabase
      .from("telnyx_regulatory_requirements")
      .select("id")
      .eq("telnyx_requirement_group_id", requirementGroup.id)
      .single();

    if (insertedReq) {
      const updateData: any = {
        regulatory_requirement_id: insertedReq.id,
        // telnyx_phone_number: null, // Don't set yet
        // activation_status: "pending", // Don't set yet
      };
      await supabase.from("locations").update(updateData).eq("id", locationId);
    }

    return NextResponse.json({
      success: true,
      message:
        "Documents submitted, Requirement Group created, and Number purchased (if available).",
      requirementGroupId: requirementGroup.id,
      status: requirementGroup.status,
      purchasedNumber,
    });
  } catch (error: any) {
    console.error("Compliance Submit Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
