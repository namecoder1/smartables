import { Metadata } from "next";
import { getAuthContext } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import type { WabaTemplate } from "@/types/general";
import TemplatesView from "./templates-view";

export const metadata: Metadata = {
  title: "Template Bot",
  description: "Crea e gestisci i template di messaggi WhatsApp personalizzati per il tuo locale.",
};

const BotTemplatesPage = async () => {
  const { organizationId } = await getAuthContext();
  const supabase = await createClient();

  const [{ data: locations }, { data: org }] = await Promise.all([
    supabase
      .from("locations")
      .select("id, name, meta_phone_id, waba_templates")
      .eq("organization_id", organizationId)
      .order("name"),
    supabase
      .from("organizations")
      .select("billing_tier, addons_config")
      .eq("id", organizationId)
      .single(),
  ]);

  const billingTier: string = org?.billing_tier ?? "starter";
  const templateLimit =
    billingTier === "business" ? 20 : billingTier === "growth" ? 12 : 5;

  const totalUsed = (locations ?? []).reduce(
    (sum, loc) => sum + ((loc.waba_templates as WabaTemplate[]) ?? []).length,
    0,
  );

  const locationsWithTemplates = (locations ?? []).map((loc) => ({
    id: loc.id,
    name: loc.name,
    meta_phone_id: loc.meta_phone_id,
    waba_templates: (loc.waba_templates ?? []) as WabaTemplate[],
  }));

  return (
    <TemplatesView
      organizationId={organizationId}
      locations={locationsWithTemplates}
      templateLimit={templateLimit}
      totalUsed={totalUsed}
    />
  );
};

export default BotTemplatesPage;
