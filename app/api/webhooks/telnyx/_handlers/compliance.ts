import { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { render } from "@react-email/components";
import ComplianceRejectedEmail from "@/emails/compliance-rejected";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendComplianceRejectedEmail(
  supabase: SupabaseClient,
  organizationId: string,
  reason: string | null,
) {
  try {
    const { data: org } = await supabase
      .from("organizations")
      .select("name, billing_email")
      .eq("id", organizationId)
      .single();
    if (org?.billing_email) {
      const html = await render(
        ComplianceRejectedEmail({
          teamName: org.name ?? "Smartables",
          reason: reason ?? undefined,
        }),
      );
      await resend.emails.send({
        from: "Smartables <noreply@smartables.it>",
        to: org.billing_email,
        subject: "Richiesta di conformità rifiutata",
        html,
      });
    }
  } catch (emailErr) {
    console.error(
      "[Telnyx Webhook] Failed to send compliance-rejected email:",
      emailErr,
    );
  }
}

export async function handleRequirementGroupStatusUpdated(
  supabase: SupabaseClient,
  payload: Record<string, any>,
) {
  const status = payload.status;
  const id = payload.id;
  const rejectionReason =
    payload.suborder_comments || payload.rejection_reason || null;

  const { data: locGroup, error: updateError } = await supabase
    .from("locations")
    .update({
      regulatory_status: status,
      regulatory_rejection_reason: rejectionReason,
    })
    .eq("telnyx_requirement_group_id", id)
    .select("id, organization_id")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (status === "approved" && locGroup?.id) {
    await activateLocation(locGroup.id, supabase);
  }

  if (status === "rejected" && locGroup?.organization_id) {
    await sendComplianceRejectedEmail(
      supabase,
      locGroup.organization_id,
      rejectionReason,
    );
  }

  return null;
}

export async function handleNumberOrderCompleted(
  supabase: SupabaseClient,
  payload: Record<string, any>,
) {
  const orderStatus = payload.status;
  const phoneNumbers = payload.phone_numbers;

  if (orderStatus === "failure") {
    const telnyxErrors: string[] = [];
    if (Array.isArray(payload.errors)) {
      for (const e of payload.errors) {
        if (e.detail || e.title) telnyxErrors.push(e.detail || e.title);
      }
    }
    if (Array.isArray(phoneNumbers)) {
      for (const n of phoneNumbers) {
        if (n.status && n.status !== "active" && n.phone_number) {
          telnyxErrors.push(`${n.phone_number}: ${n.status}`);
        }
      }
    }
    const errorDetail =
      telnyxErrors.length > 0
        ? telnyxErrors.join("; ")
        : "Nessun dettaglio disponibile";

    const firstPhone = phoneNumbers?.[0]?.phone_number ?? null;
    if (firstPhone) {
      const { data: location } = await supabase
        .from("locations")
        .select(
          "id, telnyx_phone_number, organization:organizations(name, billing_email)",
        )
        .eq("telnyx_phone_number", firstPhone)
        .maybeSingle();

      if (location) {
        await supabase
          .from("locations")
          .update({
            regulatory_status: "rejected",
            regulatory_rejection_reason: errorDetail,
          })
          .eq("id", location.id);

        const org = location.organization as unknown as
          | { name: string; billing_email: string }
          | null;
        if (org?.billing_email) {
          try {
            const html = await render(
              ComplianceRejectedEmail({
                teamName: org.name ?? "Smartables",
                reason: errorDetail,
              }),
            );
            await resend.emails.send({
              from: "Smartables <noreply@smartables.it>",
              to: org.billing_email,
              subject: "Richiesta di conformità rifiutata",
              html,
            });
          } catch (emailErr) {
            console.error(
              "[Telnyx Webhook] Failed to send compliance-rejected email:",
              emailErr,
            );
          }
        }
      } else {
        console.log(
          `[Telnyx Webhook] Order failed but no location found for ${firstPhone}`,
        );
      }
    }
  } else if (phoneNumbers && Array.isArray(phoneNumbers)) {
    for (const numObj of phoneNumbers) {
      const phoneNumber = numObj.phone_number;
      const numStatus = numObj.status;

      if (phoneNumber && numStatus === "active") {
        console.log(
          `[Telnyx Webhook] Order success for ${phoneNumber}. Checking for location...`,
        );
        const { data: location } = await supabase
          .from("locations")
          .select("id")
          .eq("telnyx_phone_number", phoneNumber)
          .single();

        if (location) {
          console.log(
            `[Telnyx Webhook] Found location ${location.id}. Activating...`,
          );
          await supabase
            .from("locations")
            .update({ regulatory_status: "approved" })
            .eq("id", location.id);
          await activateLocation(location.id, supabase);
        } else {
          console.log(
            `[Telnyx Webhook] No location found for ${phoneNumber}`,
          );
        }
      } else if (phoneNumber) {
        console.warn(
          `[Telnyx Webhook] Number ${phoneNumber} has status "${numStatus}", skipping activation.`,
        );
      }
    }
  }
}

export async function activateLocation(
  locationId: string,
  supabase: SupabaseClient,
) {
  const { data: location, error: locationFetchError } = await supabase
    .from("locations")
    .select("telnyx_phone_number, name")
    .eq("id", locationId)
    .single();

  if (locationFetchError || !location?.telnyx_phone_number) {
    console.error(
      "Could not find location or phone number for activation:",
      locationFetchError,
    );
    return;
  }

  try {
    console.log(`Activating number ${location.telnyx_phone_number}...`);

    const cleanNumber = location.telnyx_phone_number.replace("+", "");
    console.log(`Adding ${cleanNumber} to Meta WABA...`);

    const { addNumberToWaba, requestVerificationCode } = await import(
      "@/lib/whatsapp-registration"
    );

    const metaPhoneId = await addNumberToWaba(cleanNumber, location.name);
    console.log(`Meta Phone ID obtained: ${metaPhoneId}`);

    const { error: locError } = await supabase
      .from("locations")
      .update({
        activation_status: "pending_verification",
        meta_phone_id: metaPhoneId,
      })
      .eq("id", locationId);

    if (locError) throw locError;

    console.log("Requesting Voice Verification Code from Meta...");
    await requestVerificationCode(metaPhoneId, "VOICE");
    console.log("Verification Code Requested!");

    console.log(
      `Number ${location.telnyx_phone_number} activated and pending verification.`,
    );
  } catch (error: unknown) {
    console.error("Failed in automation flow (Meta Registration):", error);
  }
}
