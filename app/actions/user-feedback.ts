"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { requireAuth } from "@/lib/supabase-helpers";
import { ok, fail, type ActionResult } from "@/lib/action-response";
import { getStr, getNullableStr } from "@/lib/form-parsers";
import { revalidatePath } from "next/cache";
import { PATHS } from "@/lib/revalidation-paths";
import type { UserFeedbackStatus, UserFeedbackPriority } from "@/types/general";

// ── Client-facing: submit feedback ──────────────────────────────────────────

export async function submitUserFeedback(
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase, user, organizationId } = auth;

  const type = getStr(formData, "type");
  const title = getStr(formData, "title");
  const description = getNullableStr(formData, "description");

  if (!type || !title.trim()) return fail("Tipo e titolo sono obbligatori");

  const validTypes = ["feature_request", "bug_report", "general", "praise"];
  if (!validTypes.includes(type)) return fail("Tipo non valido");

  const { error } = await supabase.from("user_feedback").insert({
    organization_id: organizationId,
    profile_id: user.id,
    type,
    title: title.trim(),
    description: description?.trim() || null,
    metadata: {
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent : null,
    },
  });

  if (error) return fail("Errore nel salvataggio del feedback");
  return ok();
}

// ── Admin-facing: update status, priority, admin response ───────────────────

export async function adminUpdateFeedback(
  feedbackId: string,
  updates: {
    status?: UserFeedbackStatus;
    priority?: UserFeedbackPriority;
    admin_response?: string;
  }
): Promise<ActionResult> {
  const supabase = createAdminClient();

  const payload: Record<string, unknown> = { ...updates };
  if (updates.admin_response !== undefined) {
    payload.admin_responded_at = updates.admin_response
      ? new Date().toISOString()
      : null;
  }

  const { error } = await supabase
    .from("user_feedback")
    .update(payload)
    .eq("id", feedbackId);

  if (error) return fail("Errore nell'aggiornamento");
  revalidatePath(PATHS.MANAGE);
  return ok();
}

export async function adminDeleteFeedback(
  feedbackId: string
): Promise<ActionResult> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("user_feedback")
    .delete()
    .eq("id", feedbackId);

  if (error) return fail("Errore nell'eliminazione");
  revalidatePath(PATHS.MANAGE);
  return ok();
}
