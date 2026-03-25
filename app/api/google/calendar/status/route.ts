import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { decryptConnectors } from "@/lib/business-connectors";

export async function GET(req: NextRequest) {
  const locationId = req.nextUrl.searchParams.get("locationId");
  if (!locationId) return NextResponse.json({ connected: false });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: loc } = await supabase
    .from("locations")
    .select("business_connectors")
    .eq("id", locationId)
    .single();

  if (!loc?.business_connectors) return NextResponse.json({ connected: false });

  try {
    const connectors = decryptConnectors(loc.business_connectors as string);
    return NextResponse.json({
      connected: !!connectors.google_calendar_access_token,
      calendarId: connectors.google_calendar_id ?? null,
      calendarName: connectors.google_calendar_name ?? null,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
