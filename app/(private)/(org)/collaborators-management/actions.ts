"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { requireAuth } from "@/lib/supabase-helpers";
import { checkResourceAvailability } from "@/lib/limiter";
import InviteEmail from "@/emails/invite";
import { render } from "@react-email/components";
import { revalidatePath } from "next/cache";
import { PATHS } from "@/lib/revalidation-paths";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function inviteCollaborator(prevState: any, formData: FormData) {
  const auth = await requireAuth();
  if (!auth.success) return { error: auth.error };
  const { supabase, user, organizationId, organization } = auth;
  const supabaseAdmin = createAdminClient();

  const staffAvail = await checkResourceAvailability(supabase, organizationId, "staff");
  if (!staffAvail.allowed) {
    return { error: "Limite account staff raggiunto. Aggiorna il piano o acquista lo Staff Power Pack." };
  }

  // Fetch sender's display name (not in auth context — profiles only stores organization_id)
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const senderName = senderProfile?.full_name || "Un amministratore";
  const organizationName = organization?.name || "Smartables";

  const email = formData.get("email") as string;
  const role = formData.get("role") as string;
  const locationType = formData.get("location_type") as string | null;
  const selectedLocationsStr = formData.get("selected_locations") as string | null;

  if (!email) return { error: "Email richiesta" };
  if (role !== "admin" && role !== "staff") return { error: "Ruolo non valido" };

  let accessibleLocations: string[] | null = null;
  if (role !== "admin" && locationType === "selected" && selectedLocationsStr) {
    try {
      const parsed = JSON.parse(selectedLocationsStr);
      if (Array.isArray(parsed) && parsed.length > 0) accessibleLocations = parsed;
    } catch {
      // ignore malformed JSON — default to full access
    }
  }

  try {
    const siteUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "invite",
        email,
        options: { redirectTo: `${siteUrl}/accept-invite` },
      });

    if (inviteError) return { error: "Errore nella generazione del link di invito" };

    const newUser = inviteData.user;
    const inviteLink = inviteData.properties.action_link;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: newUser.id,
        email: newUser.email,
        organization_id: organizationId,
        role,
        accessible_locations: accessibleLocations,
      });

    if (profileError) return { error: "Errore nel salvataggio del profilo utente" };

    const emailHtml = await render(
      // @ts-ignore
      InviteEmail({
        username: email.split("@")[0],
        invitedByUsername: senderName,
        invitedByEmail: user.email || "",
        teamName: organizationName,
        teamImage: `${process.env.NEXT_PUBLIC_SITE_URL}/static/smartables-logo.png`,
        inviteLink,
      }),
    );

    const { error: emailError } = await resend.emails.send({
      from: "Smartables <onboarding@smartables.it>",
      to: email,
      subject: "Sei stato invitato su Smartables",
      html: emailHtml,
    });

    if (emailError) return { error: "Invito creato ma errore nell'invio dell'email" };

    revalidatePath(PATHS.MANAGE_COLLABORATORS);
    return { success: true };
  } catch {
    return { error: "Qualcosa è andato storto" };
  }
}

export async function removeCollaborators(ids: string[]) {
  const auth = await requireAuth();
  if (!auth.success) return { error: auth.error };
  const { supabase, user, organizationId } = auth;
  const supabaseAdmin = createAdminClient();

  // Fetch only the role — organizationId comes from auth context
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (currentProfile?.role !== "admin" && currentProfile?.role !== "owner") {
    return { error: "Solo gli amministratori possono rimuovere i collaboratori" };
  }

  if (ids.includes(user.id)) return { error: "Non puoi rimuovere te stesso" };

  const { data: targets } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .in("id", ids)
    .eq("organization_id", organizationId);

  if (!targets || targets.length !== ids.length) {
    return { error: "Uno o più collaboratori non trovati" };
  }

  if (targets.some((t) => t.role === "owner")) {
    return { error: "Non puoi rimuovere il proprietario dell'organizzazione" };
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ organization_id: null, role: null })
    .in("id", ids);

  if (error) return { error: "Errore nella rimozione dei collaboratori" };

  revalidatePath(PATHS.MANAGE_COLLABORATORS);
  return { success: true };
}
