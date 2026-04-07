import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

const startTime = Date.now();

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
        { status: "degraded", db: "error", version: process.env.npm_package_version ?? "unknown" },
        { status: 503 },
      );
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "unknown",
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      db: "ok",
    });
  } catch {
    return NextResponse.json(
      { status: "error", version: process.env.npm_package_version ?? "unknown" },
      { status: 503 },
    );
  }
}
