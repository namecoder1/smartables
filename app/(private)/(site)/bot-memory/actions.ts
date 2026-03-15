"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/supabase-helpers";
import { revalidatePath } from "next/cache";
import { ok, okWith, fail, type ActionResult } from "@/lib/action-response";
import { PATHS } from "@/lib/revalidation-paths";

export async function getKnowledgeBase(organizationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("knowledge_base")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching knowledge base:", error);
    return fail(error.message);
  }

  return okWith(data);
}

export async function createKnowledgeBaseEntry(
  organizationId: string,
  locationId: string,
  title: string,
  content: string,
) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("knowledge_base")
    .insert({
      organization_id: organizationId,
      location_id: locationId,
      title,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating knowledge base entry:", error);
    return fail(error.message);
  }

  revalidatePath(PATHS.BOT_MEMORY);
  return okWith(data);
}

export async function updateKnowledgeBaseEntry(
  id: string,
  title: string,
  content: string,
  isActive: boolean,
) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { data, error } = await supabase
    .from("knowledge_base")
    .update({ title, content, is_active: isActive })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating knowledge base entry:", error);
    return fail(error.message);
  }

  revalidatePath(PATHS.BOT_MEMORY);
  return okWith(data);
}

export async function toggleKnowledgeBaseStatus(id: string, isActive: boolean) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { error } = await supabase
    .from("knowledge_base")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    console.error("Error toggling knowledge base entry status:", error);
    return fail(error.message);
  }

  revalidatePath(PATHS.BOT_MEMORY);
  return ok();
}

export async function deleteKnowledgeBaseEntry(id: string): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { error } = await supabase.from("knowledge_base").delete().eq("id", id);

  if (error) {
    console.error("Error deleting knowledge base entry:", error);
    return fail(error.message);
  }

  revalidatePath(PATHS.BOT_MEMORY);
  return ok();
}
