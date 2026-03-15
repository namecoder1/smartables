"use server"

import { requireAuth } from "@/lib/supabase-helpers"
import { ok, fail } from "@/lib/action-response"
import { getStr } from "@/lib/form-parsers"
import { revalidatePath } from "next/cache"
import { PATHS } from "@/lib/revalidation-paths"
import type { UxSettings } from "@/types/general"

export async function updateOrganizationInfo(formData: FormData) {
  const auth = await requireAuth()
  if (!auth.success) return fail("Non autorizzato")
  const { supabase, organizationId } = auth

  const name = getStr(formData, "name").trim()
  const slug = getStr(formData, "slug").trim()
  const billing_email = getStr(formData, "billing_email").trim()

  if (!name || !slug || !billing_email) return fail("Tutti i campi sono obbligatori")

  const { error } = await supabase
    .from("organizations")
    .update({ name, slug, billing_email })
    .eq("id", organizationId)

  if (error) return fail("Errore nel salvataggio dei dati")

  revalidatePath(PATHS.GENERAL_SETTINGS, "page")
  return ok()
}

export async function updateUxSettings(settings: UxSettings) {
  const auth = await requireAuth()
  if (!auth.success) return fail("Non autorizzato")
  const { supabase, organizationId } = auth

  const { error } = await supabase
    .from("organizations")
    .update({ ux_settings: settings })
    .eq("id", organizationId)

  if (error) return fail("Errore nel salvataggio delle impostazioni")

  revalidatePath(PATHS.GENERAL_SETTINGS, "page")
  return ok()
}
