"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import InviteEmail from "@/emails/invite";
import { render } from "@react-email/components";
import { revalidatePath } from "next/cache";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function inviteCollaborator(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // 1. Verify current user is admin/logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Non autorizzato" };
  }

  // 2. Get Organization ID and Name
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("organization_id, full_name, organizations (name)")
    .eq("id", user.id)
    .single();

  if (!currentUserProfile?.organization_id) {
    return { error: "Organizzazione non trovata" };
  }

  const orgData = currentUserProfile.organizations as any;
  const organizationName = Array.isArray(orgData)
    ? orgData[0]?.name
    : orgData?.name || "Smartables";

  const email = formData.get("email") as string;
  const role = formData.get("role") as string;

  if (!email) {
    return { error: "Email richiesta" };
  }

  if (role !== "admin" && role !== "staff") {
    return { error: "Ruolo non valido" };
  }

  try {
    const siteUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Point directly to the client page. Supabase will append the hash fragment.
    const redirectUrl = `${siteUrl}/accept-invite`;

    // 3. Generate Invite Link
    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "invite",
        email: email,
        options: {
          redirectTo: redirectUrl,
        },
      });

    if (inviteError) {
      console.error("Error generating link:", inviteError);
      return { error: "Errore nella generazione del link di invito" };
    }

    const newUser = inviteData.user;
    const inviteLink = inviteData.properties.action_link;

    // 4. Upsert Profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: newUser.id,
        email: newUser.email,
        organization_id: currentUserProfile.organization_id,
        role: role,
        // full_name is left null until they accept
      });

    if (profileError) {
      console.error("Error updating/creating profile:", profileError);
      return { error: "Errore nel salvataggio del profilo utente" };
    }

    // 5. Send User Invitation Email
    const emailHtml = await render(
      // @ts-ignore
      InviteEmail({
        username: email.split("@")[0],
        invitedByUsername: currentUserProfile.full_name || "Un amministratore",
        invitedByEmail: user.email || "",
        teamName: organizationName,
        teamImage: `${process.env.NEXT_PUBLIC_SITE_URL}/static/smartables-logo.png`,
        inviteLink: inviteLink,
      }),
    );

    const { error: emailError } = await resend.emails.send({
      from: "Smartables <onboarding@smartables.it>",
      to: email,
      subject: "Sei stato invitato su Smartables",
      html: emailHtml,
    });

    if (emailError) {
      console.error("Email sending error:", emailError);
      return { error: "Invito creato ma errore nell'invio dell'email" };
    }

    revalidatePath("/(private)/(org)/manage-collaborators");
    return { success: true };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { error: "Qualcosa è andato storto" };
  }
}
