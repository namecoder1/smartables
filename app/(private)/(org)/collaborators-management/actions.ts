"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import InviteEmail from "@/emails/invite";
import { render } from "@react-email/components";
import { revalidatePath } from "next/cache";
import { PATHS } from "@/lib/revalidation-paths";

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
  const locationType = formData.get("location_type") as string | null;
  const selectedLocationsStr = formData.get("selected_locations") as
    | string
    | null;

  if (!email) {
    return { error: "Email richiesta" };
  }

  if (role !== "admin" && role !== "staff") {
    return { error: "Ruolo non valido" };
  }

  // Parse accessible_locations
  let accessibleLocations: string[] | null = null;

  // If role is admin, they always have access to all locations.
  // Otherwise, if locationType is "selected", parse the locations array.
  if (role !== "admin" && locationType === "selected" && selectedLocationsStr) {
    try {
      const parsed = JSON.parse(selectedLocationsStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        accessibleLocations = parsed;
      }
    } catch (e) {
      console.error("Failed to parse selected_locations", e);
    }
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
        accessible_locations: accessibleLocations,
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

    revalidatePath(PATHS.MANAGE_COLLABORATORS);
    return { success: true };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { error: "Qualcosa è andato storto" };
  }
}

export async function removeCollaborators(ids: string[]) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non autorizzato" };

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!currentProfile?.organization_id) return { error: "Organizzazione non trovata" };
  if (currentProfile.role !== "admin" && currentProfile.role !== "owner") {
    return { error: "Solo gli amministratori possono rimuovere i collaboratori" };
  }

  // Prevent self-removal
  if (ids.includes(user.id)) {
    return { error: "Non puoi rimuovere te stesso" };
  }

  // Verify all targets belong to the same organization and are not owners
  const { data: targets } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .in("id", ids)
    .eq("organization_id", currentProfile.organization_id);

  if (!targets || targets.length !== ids.length) {
    return { error: "Uno o più collaboratori non trovati" };
  }

  const hasOwner = targets.some((t) => t.role === "owner");
  if (hasOwner) return { error: "Non puoi rimuovere il proprietario dell'organizzazione" };

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ organization_id: null, role: null })
    .in("id", ids);

  if (error) {
    console.error("Error removing collaborators:", error);
    return { error: "Errore nella rimozione dei collaboratori" };
  }

  revalidatePath(PATHS.MANAGE_COLLABORATORS);
  return { success: true };
}
