import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import type { WabaTemplate } from "@/types/general";
import TemplateForm from "./template-form";

export const metadata: Metadata = {
  title: "Template WhatsApp",
};

interface Props {
  params: Promise<{ id: string }>;
}

const TemplateDetailPage = async ({ params }: Props) => {
  const { id } = await params;
  const { organizationId } = await getAuthContext();
  const supabase = await createClient();

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, meta_phone_id, waba_templates")
    .eq("organization_id", organizationId)
    .order("name");

  const locationsData = (locations ?? []).map((loc) => ({
    id: loc.id,
    name: loc.name,
    meta_phone_id: loc.meta_phone_id as string,
    waba_templates: (loc.waba_templates ?? []) as WabaTemplate[],
  }));

  let template: WabaTemplate | null = null;
  let templateLocationId: string | null = null;

  if (id !== "new") {
    for (const loc of locationsData) {
      const found = loc.waba_templates.find((t) => t.id === id);
      if (found) {
        template = found;
        templateLocationId = loc.id;
        break;
      }
    }
    if (!template) notFound();
  }

  return (
    <TemplateForm
      locations={locationsData}
      template={template}
      templateLocationId={templateLocationId}
      organizationId={organizationId}
    />
  );
};

export default TemplateDetailPage;
