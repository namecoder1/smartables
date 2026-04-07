"use client";

import { useParams } from "next/navigation";
import { TemplateEditSkeleton, TemplateWizardSkeleton } from "@/components/private/page-skeletons";

export default function Loading() {
  const { id } = useParams<{ id: string }>();
  return id === "new" ? <TemplateWizardSkeleton /> : <TemplateEditSkeleton />;
}
