import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { uploadDocument, createRequirementGroup } from "@/lib/telnyx";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// IDs for Italy Local Requirements (These are example IDs, in production you might dynamic query them)
// Usually found via Telnyx Portal or API: GET /v2/requirements?country_code=IT&phone_number_type=local
// Common requirement IDs for Italy Local:
// 1. Identity Proof (e.g., ID Card)
// 2. Address Proof (e.g., Utility Bill)
// Note: These are placeholders. You MUST verify these IDs with Telnyx for your specific bundle.
// If you don't have them, the creation might fail or prompt for them.
// For now, let's assume we map:
// - Identity File -> specific requirement ID
// - Address File -> specific requirement ID
//
// Since we don't have the exact IDs, we will try to submit with generic flow or assume we need to fetch them.
// However, the prompt implies "submit documents" then "create requirement group".
// Best approach without knowing IDs: Try to find a "Bundle" or just upload docs and let user attach manually?
// No, user wants flow automation.
//
// Strategy:
// We will use a standard set of Requirement IDs for Italy if known, or generic.
// Since we can't query Telnyx dynamically easily in this "one-shot" code without more context,
// we will assume the User has these IDs or we use a "best guess" structural approach.
//
// Better approach for MVP:
// Just upload documents to Telnyx and return the Document IDs.
// Then Create Requirement Group with those Doc IDs.
// We need the `requirement_id` to link the doc to.
//
// Let's use placeholders and specific comments telling the user to replace them.
const REQ_ID_IDENTITY_PROOF = "86649686-5e33-469b-8169-2f5407cb591d"; // Example ID for "Government ID"
const REQ_ID_ADDRESS_PROOF = "363e79bd-1002-4217-8854-5188c0051e73"; // Example ID for "Proof of Address"
// To get real IDs: `curl -X GET "https://api.telnyx.com/v2/requirements?country_code=IT&phone_number_type=local" ...`

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

    // 3. Status check to prevent overwrites of approved/processing requests
    const { data: existingReq } = await supabase
      .from("telnyx_regulatory_requirements")
      .select("status")
      .eq("location_id", locationId)
      .single();

    if (
      existingReq &&
      (existingReq.status === "approved" || existingReq.status === "pending")
    ) {
      // 'pending_review' can be overwritten (user corrections), but 'approved' or 'pending' (Telnyx) should not.
      return NextResponse.json(
        {
          error:
            "Cannot modify documents while verification is in progress or approved.",
        },
        { status: 409 },
      );
    }

    // 4. Create Database Record (Status: pending_review)
    // WE DO NOT CALL TELNYX HERE. "Shared Fate" protection.

    // We need a filename. Extract from path.
    const identityFilename = identityPath.split("/").pop() || "identity.jpg";
    const addressFilename = addressPath.split("/").pop() || "address.jpg";

    // 5. Save to Database
    const { error: dbError } = await supabase
      .from("telnyx_regulatory_requirements")
      .upsert(
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
          // telnyx_requirement_group_id: null, // Not created yet
          status: "pending_review",
          location_id: locationId,
          documents_data: {
            identity_path: identityPath,
            address_path: addressPath,
            identity_filename: identityFilename,
            address_filename: addressFilename,
            ...otherData, // Includes: customerType, taxCode, city, streetAddress, etc.
          },
        },
        { onConflict: "location_id" },
      ); // Note: We now enforce one compliance request per location.

    if (dbError) {
      console.error("DB Save Error:", dbError);
      throw new Error("Failed to save requirement group to DB");
    }

    // 6. Link to Location
    // We need to find the ID we just upserted.
    // Since we don't have the ID returned from upsert in all cases easily without select, let's query it or use returning.
    // Supabase upsert with .select() returns data.

    // Revised upsert to get ID:
    const { data: insertedReq, error: fetchError } = await supabase
      .from("telnyx_regulatory_requirements")
      .select("id")
      .eq(
        "organization_id",
        (
          await supabase
            .from("locations")
            .select("organization_id")
            .eq("id", locationId)
            .single()
        ).data?.organization_id,
      )
      .eq("area_code", areaCode)
      .single();

    if (insertedReq) {
      await supabase
        .from("locations")
        .update({ regulatory_requirement_id: insertedReq.id })
        .eq("id", locationId);
    }

    // 7. Send Email Notifications

    // a) To the User
    if (user.email) {
      await resend.emails.send({
        from: "Smartables <onboarding@smartables.it>",
        to: user.email,
        subject: "Documenti in revisione",
        html: `
            <h1>Documenti ricevuti</h1>
            <p>Abbiamo ricevuto i tuoi documenti per la verifica del numero locale (prefisso ${areaCode}).</p>
            <p>Il nostro team verificherà la validità dei documenti nelle prossime 24 ore.</p>
            <p>Status attuale: <strong>In Revisione</strong></p>
            `,
      });
    }

    // b) To the Admin (You)
    await resend.emails.send({
      from: "Smartables System <system@smartables.it>", // Ensure this domain is verified or use onboarding@
      to: "bartolomei.private@gmail.com",
      subject: `[ACTION REQUIRED] Nuova richiesta compliance: ${areaCode}`,
      html: `
            <h1>Nuova richiesta di attivazione</h1>
            <p>Un cliente ha caricato i documenti per l'attivazione.</p>
            <ul>
                <li><strong>Location ID:</strong> ${locationId}</li>
                <li><strong>Prefisso:</strong> ${areaCode}</li>
                <li><strong>Utente:</strong> ${user.email}</li>
            </ul>
            <p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/manage" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    Vai alla Dashboard Admin
                </a>
            </p>
        `,
    });

    return NextResponse.json({
      success: true,
      message: "Documents submitted for internal review",
    });
  } catch (error: any) {
    console.error("Compliance Submit Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
