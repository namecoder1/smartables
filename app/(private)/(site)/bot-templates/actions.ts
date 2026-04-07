"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/supabase-helpers";
import { ok, okWith, fail, type ActionResult } from "@/lib/action-response";
import { checkResourceAvailability } from "@/lib/limiter";
import { PATHS } from "@/lib/revalidation-paths";
import {
  createMetaTemplate,
  deleteMetaTemplate,
  syncMetaTemplateStatus,
  validateTemplateWithLLM,
  toTemplateName,
  isValidTemplateName,
  TYPE_TO_CATEGORY,
  REQUIRED_ROLES,
} from "@/lib/waba-templates";
import type {
  WabaTemplate,
  WabaTemplateComponent,
  WabaTemplateType,
  WabaTemplateCategory,
  ButtonSemanticRole,
} from "@/types/general";

// ── Limits ──────────────────────────────────────────────────────────────────

/** Max chars per component (enforced server-side). */
const MAX_CHARS = { HEADER: 60, BODY: 768, FOOTER: 60, BUTTON: 25 } as const;



// ── Helpers ──────────────────────────────────────────────────────────────────

type LocationWithTemplates = {
  id: string;
  name: string;
  meta_phone_id: string;
  waba_templates: WabaTemplate[];
};

async function getLocationsWithTemplates(
  supabase: Extract<Awaited<ReturnType<typeof requireAuth>>, { success: true }>["supabase"],
  organizationId: string,
): Promise<LocationWithTemplates[]> {
  const { data, error } = await supabase
    .from("locations")
    .select("id, name, meta_phone_id, waba_templates")
    .eq("organization_id", organizationId)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((loc) => ({
    ...loc,
    waba_templates: (loc.waba_templates ?? []) as WabaTemplate[],
  }));
}

async function updateLocationTemplates(
  supabase: Extract<Awaited<ReturnType<typeof requireAuth>>, { success: true }>["supabase"],
  locationId: string,
  templates: WabaTemplate[],
): Promise<void> {
  const { error } = await supabase
    .from("locations")
    .update({ waba_templates: templates })
    .eq("id", locationId);
  if (error) throw error;
}

function validateComponents(
  components: WabaTemplateComponent[],
  template_type: WabaTemplateType = "custom",
): string | null {
  for (const c of components) {
    if (c.type === "HEADER" && "text" in c && c.text.length > MAX_CHARS.HEADER)
      return `Header supera ${MAX_CHARS.HEADER} caratteri`;
    if (c.type === "BODY" && c.text.length > MAX_CHARS.BODY)
      return `Body supera ${MAX_CHARS.BODY} caratteri`;
    if (c.type === "BODY" && !c.text.trim())
      return "Il corpo del template è obbligatorio";
    if (c.type === "FOOTER" && c.text.length > MAX_CHARS.FOOTER)
      return `Footer supera ${MAX_CHARS.FOOTER} caratteri`;
    if (c.type === "BUTTONS") {
      if (c.buttons.length > 3) return "Massimo 3 pulsanti consentiti";
      for (const b of c.buttons) {
        if (b.type === "FLOW") {
          if (!b.text.trim()) return "Il bottone di prenotazione deve avere un testo";
          continue;
        }
        if (b.type === "COPY_CODE") {
          if (!b.example?.trim()) return "Il pulsante 'Copia codice' richiede un codice di esempio";
          continue;
        }
        if (!b.text.trim()) return "Il testo del pulsante è obbligatorio";
        if (b.text.length > MAX_CHARS.BUTTON)
          return `Testo pulsante supera ${MAX_CHARS.BUTTON} caratteri`;
        if (b.type === "URL" && !b.url?.trim()) return "I pulsanti URL richiedono un indirizzo web";
        if (b.type === "PHONE_NUMBER" && !b.phone_number?.trim())
          return "I pulsanti Chiama richiedono un numero di telefono";
      }
    }
  }

  // Validate required semantic roles for structured template types
  const requiredRoles = REQUIRED_ROLES[template_type];
  if (requiredRoles) {
    const buttonsComp = components.find((c) => c.type === "BUTTONS");
    const buttons = buttonsComp && "buttons" in buttonsComp ? buttonsComp.buttons : [];
    for (const role of requiredRoles) {
      if (!buttons.some((b) => b.semantic_role === role))
        return `Bottone obbligatorio mancante (ruolo: ${role})`;
    }
    // FLOW button must always be last
    const lastBtn = buttons[buttons.length - 1];
    if (requiredRoles.includes("booking_flow") && lastBtn?.type !== "FLOW")
      return "Il pulsante di prenotazione deve essere l'ultimo";
  }

  return null;
}

// ── Read ─────────────────────────────────────────────────────────────────────

export type TemplateWithMeta = WabaTemplate & {
  locationId: string;
  locationName: string;
};

/** Returns all templates across all org locations, flat list. */
export async function getTemplates(organizationId: string): Promise<ActionResult<TemplateWithMeta[]>> {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);

  const locations = await getLocationsWithTemplates(auth.supabase, organizationId);
  const all: TemplateWithMeta[] = locations.flatMap((loc) =>
    loc.waba_templates.map((t) => ({
      ...t,
      locationId: loc.id,
      locationName: loc.name,
    })),
  );
  return okWith(all);
}

/** Returns a single template by ID, searching across all org locations. */
export async function getTemplate(
  organizationId: string,
  templateId: string,
): Promise<ActionResult<TemplateWithMeta>> {
  const res = await getTemplates(organizationId);
  if (!res.success) return fail(res.error);
  if (!res.data) return fail("Template non trovato");
  const found = res.data.find((t) => t.id === templateId);
  if (!found) return fail("Template non trovato");
  return okWith(found);
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createTemplate(
  locationId: string,
  input: {
    display_name: string;
    name: string;
    language: string;
    template_type: WabaTemplateType;
    components: WabaTemplateComponent[];
  },
): Promise<ActionResult<WabaTemplate>> {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase, organizationId } = auth;

  // Plan limit check
  const avail = await checkResourceAvailability(supabase, organizationId, "waba_templates");
  if (!avail.allowed) return fail("Limite template WABA raggiunto per il tuo piano.");

  // Name validation
  if (!isValidTemplateName(input.name))
    return fail("Nome template non valido. Usa solo lettere minuscole, numeri e underscore.");

  // Component validation (including required roles for the template type)
  const compError = validateComponents(input.components, input.template_type);
  if (compError) return fail(compError);

  // Uniqueness check: template name is global within the WABA
  const locations = await getLocationsWithTemplates(supabase, organizationId);
  const nameExists = locations.some((loc) =>
    loc.waba_templates.some((t) => t.name === input.name),
  );
  if (nameExists) return fail("Esiste già un template con questo nome. Scegli un nome diverso.");

  const thisLocation = locations.find((l) => l.id === locationId);
  if (!thisLocation) return fail("Sede non trovata");

  // Recovery templates: only one active (PENDING or APPROVED) per type per location
  if (input.template_type === "recovery_open" || input.template_type === "recovery_closed") {
    const conflict = thisLocation.waba_templates.find(
      (t) => t.template_type === input.template_type &&
             (t.meta_status === "PENDING" || t.meta_status === "APPROVED"),
    );
    if (conflict)
      return fail("Esiste già un template di recupero attivo per questa sede. Eliminalo prima di crearne uno nuovo.");
  }

  const now = new Date().toISOString();
  const newTemplate: WabaTemplate = {
    id: crypto.randomUUID(),
    name: input.name,
    display_name: input.display_name.trim(),
    template_type: input.template_type,
    meta_template_id: null,
    meta_status: "DRAFT",
    rejection_reason: null,
    language: input.language,
    category: TYPE_TO_CATEGORY[input.template_type],
    components: input.components,
    created_at: now,
    updated_at: now,
    last_synced_at: null,
  };

  await updateLocationTemplates(supabase, locationId, [
    ...thisLocation.waba_templates,
    newTemplate,
  ]);

  revalidatePath(PATHS.BOT_TEMPLATES);
  return okWith(newTemplate);
}

// ── Update ────────────────────────────────────────────────────────────────────

/** Only DRAFT templates can be edited. */
export async function updateTemplate(
  locationId: string,
  templateId: string,
  input: {
    display_name: string;
    name: string;
    language: string;
    components: WabaTemplateComponent[];
  },
): Promise<ActionResult<WabaTemplate>> {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase, organizationId } = auth;

  const locations = await getLocationsWithTemplates(supabase, organizationId);
  const thisLocation = locations.find((l) => l.id === locationId);
  if (!thisLocation) return fail("Sede non trovata");

  const idx = thisLocation.waba_templates.findIndex((t) => t.id === templateId);
  if (idx === -1) return fail("Template non trovato");
  const existing = thisLocation.waba_templates[idx];

  const compError = validateComponents(input.components, existing.template_type);
  if (compError) return fail(compError);

  if (!isValidTemplateName(input.name))
    return fail("Nome template non valido.");

  if (existing.meta_status !== "DRAFT")
    return fail("Solo i template in bozza possono essere modificati.");

  // Name uniqueness check (exclude self)
  const nameConflict = locations.some((loc) =>
    loc.waba_templates.some((t) => t.name === input.name && t.id !== templateId),
  );
  if (nameConflict) return fail("Esiste già un template con questo nome.");

  const updated: WabaTemplate = {
    ...existing,
    display_name: input.display_name.trim(),
    name: input.name,
    language: input.language,
    components: input.components,
    updated_at: new Date().toISOString(),
  };

  const newTemplates = [...thisLocation.waba_templates];
  newTemplates[idx] = updated;
  await updateLocationTemplates(supabase, locationId, newTemplates);

  revalidatePath(PATHS.BOT_TEMPLATES);
  return okWith(updated);
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteTemplate(
  locationId: string,
  templateId: string,
): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase, organizationId } = auth;

  const locations = await getLocationsWithTemplates(supabase, organizationId);
  const thisLocation = locations.find((l) => l.id === locationId);
  if (!thisLocation) return fail("Sede non trovata");

  const template = thisLocation.waba_templates.find((t) => t.id === templateId);
  if (!template) return fail("Template non trovato");

  // Remove from Meta if it was ever submitted
  if (template.meta_status !== "DRAFT") {
    try {
      await deleteMetaTemplate(template.name);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore sconosciuto";
      return fail(`Impossibile eliminare il template da Meta: ${message}. Riprova o eliminalo manualmente dalla dashboard Meta.`);
    }
  }

  const newTemplates = thisLocation.waba_templates.filter((t) => t.id !== templateId);
  await updateLocationTemplates(supabase, locationId, newTemplates);

  revalidatePath(PATHS.BOT_TEMPLATES);
  return ok();
}

// ── LLM Validation ───────────────────────────────────────────────────────────

export async function validateTemplate(
  components: WabaTemplateComponent[],
  template_type: WabaTemplateType = "custom",
) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);

  const compError = validateComponents(components, template_type);
  if (compError) return fail(compError);

  const result = await validateTemplateWithLLM(components);
  return okWith(result);
}

// ── Submit to Meta ────────────────────────────────────────────────────────────

/** Run LLM check (warn but don't block on issues) then submit to Meta API. */
export async function submitTemplateToMeta(
  locationId: string,
  templateId: string,
): Promise<ActionResult<WabaTemplate>> {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase, organizationId } = auth;

  const locations = await getLocationsWithTemplates(supabase, organizationId);
  const thisLocation = locations.find((l) => l.id === locationId);
  if (!thisLocation) return fail("Sede non trovata");

  const idx = thisLocation.waba_templates.findIndex((t) => t.id === templateId);
  if (idx === -1) return fail("Template non trovato");

  const template = thisLocation.waba_templates[idx];
  if (template.meta_status !== "DRAFT")
    return fail("Solo i template in bozza possono essere inviati a Meta.");

  const compError = validateComponents(template.components, template.template_type);
  if (compError) return fail(compError);

  // Submit to Meta
  const { meta_template_id, meta_status } = await createMetaTemplate({
    name: template.name,
    language: template.language,
    category: template.category,
    components: template.components,
  });

  const updated: WabaTemplate = {
    ...template,
    meta_template_id,
    meta_status,
    updated_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  };

  const newTemplates = [...thisLocation.waba_templates];
  newTemplates[idx] = updated;
  await updateLocationTemplates(supabase, locationId, newTemplates);

  revalidatePath(PATHS.BOT_TEMPLATES);
  return okWith(updated);
}

// ── Sync Status ───────────────────────────────────────────────────────────────

/** Poll Meta for the current approval status of a PENDING template. */
export async function syncTemplateStatus(
  locationId: string,
  templateId: string,
): Promise<ActionResult<WabaTemplate>> {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase, organizationId } = auth;

  const locations = await getLocationsWithTemplates(supabase, organizationId);
  const thisLocation = locations.find((l) => l.id === locationId);
  if (!thisLocation) return fail("Sede non trovata");

  const idx = thisLocation.waba_templates.findIndex((t) => t.id === templateId);
  if (idx === -1) return fail("Template non trovato");

  const template = thisLocation.waba_templates[idx];
  const remote = await syncMetaTemplateStatus(template.name);

  if (!remote) return fail("Impossibile recuperare lo stato da Meta. Template non ancora visibile.");

  const updated: WabaTemplate = {
    ...template,
    meta_template_id: remote.meta_template_id,
    meta_status: remote.meta_status,
    rejection_reason: remote.rejection_reason,
    updated_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
  };

  const newTemplates = [...thisLocation.waba_templates];
  newTemplates[idx] = updated;
  await updateLocationTemplates(supabase, locationId, newTemplates);

  revalidatePath(PATHS.BOT_TEMPLATES);
  return okWith(updated);
}
