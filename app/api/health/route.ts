import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Lightweight DB connectivity check
    const { error } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json(
        { status: "degraded", db: "error" },
        { status: 503 },
      );
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      db: "ok",
    });
  } catch {
    return NextResponse.json(
      { status: "error" },
      { status: 503 },
    );
  }
}
