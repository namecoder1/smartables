import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ locationId: string }> },
) {
  const { locationId } = await params;
  const supabase = createAdminClient();

  const { data: location } = await supabase
    .from("locations")
    .select("business_connectors")
    .eq("id", locationId)
    .single();

  if (!location?.business_connectors) {
    return NextResponse.redirect("https://smartables.it", { status: 302 });
  }

  try {
    const { decryptConnectors } = await import("@/lib/business-connectors");
    const connectors = decryptConnectors(location.business_connectors as string);

    if (!connectors.google_review_url) {
      return NextResponse.redirect("https://smartables.it", { status: 302 });
    }

    return NextResponse.redirect(connectors.google_review_url, { status: 302 });
  } catch {
    return NextResponse.redirect("https://smartables.it", { status: 302 });
  }
}
