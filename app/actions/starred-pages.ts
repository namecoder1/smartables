"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/supabase-helpers";

export async function toggleStarredPage(title: string, url: string) {
  const auth = await requireAuth();
  if (!auth.success) return;
  const { supabase, user } = auth;

  // Check if page is already starred
  const { data: existing } = await supabase
    .from("starred_pages")
    .select("id")
    .eq("profile_id", user.id)
    .eq("url", url)
    .single();

  if (existing) {
    // Remove star
    await supabase.from("starred_pages").delete().eq("id", existing.id);
  } else {
    // Add star
    await supabase.from("starred_pages").insert({
      profile_id: user.id,
      url,
      title,
    });
  }

  revalidatePath("/", "layout");
}

export async function getStarredPages() {
  const auth = await requireAuth();
  if (!auth.success) return [];
  const { supabase, user } = auth;

  const { data } = await supabase
    .from("starred_pages")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return data || [];
}
