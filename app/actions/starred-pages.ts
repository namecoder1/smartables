"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/auth";

export async function toggleStarredPage(title: string, url: string) {
  const { supabase, user } = await getAuthContext();

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
  const { supabase, user } = await getAuthContext();

  const { data } = await supabase
    .from("starred_pages")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return data || [];
}
