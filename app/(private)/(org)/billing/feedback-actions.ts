"use server";

import { createClient } from "@/utils/supabase/server";

export async function submitFeedback(reason: string, message: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    throw new Error("No organization found");
  }

  await supabase.from("feedbacks").insert({
    organization_id: profile.organization_id,
    profile_id: user.id,
    type: "refund",
    reason,
    message,
    metadata: {
      submitted_after_refund: true,
    },
  });

  return { success: true };
}
