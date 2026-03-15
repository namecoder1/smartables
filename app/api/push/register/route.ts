import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token, platform } = await req.json();

  if (!token || !platform) {
    return NextResponse.json({ error: "Missing token or platform" }, { status: 400 });
  }

  if (!["ios", "android", "web"].includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ error: "Organization not found" }, { status: 400 });
  }

  // Upsert: update the existing token row or insert a new one
  const { error } = await supabase
    .from("push_tokens")
    .upsert(
      {
        token,
        platform,
        organization_id: profile.organization_id,
        profile_id: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    );

  if (error) {
    console.error("[push/register] DB error:", error);
    return NextResponse.json({ error: "Failed to register token" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  await supabase
    .from("push_tokens")
    .delete()
    .eq("token", token)
    .eq("profile_id", user.id);

  return NextResponse.json({ success: true });
}
