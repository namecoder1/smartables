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

  const body = await req.json();
  const { platform } = body;

  if (!platform || !["ios", "android", "web"].includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  // Web push: body contains a PushSubscription object
  // iOS/Android: body contains a plain token string
  let token: string;
  let subscription: object | null = null;

  if (platform === "web") {
    const { subscription: sub } = body;
    if (!sub?.endpoint) {
      return NextResponse.json({ error: "Missing subscription" }, { status: 400 });
    }
    token = sub.endpoint; // endpoint is unique per browser/device
    subscription = sub;
  } else {
    const { token: expoToken } = body;
    if (!expoToken) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }
    token = expoToken;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ error: "Organization not found" }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_tokens")
    .upsert(
      {
        token,
        platform,
        subscription,
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
