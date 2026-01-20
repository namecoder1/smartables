import { createClient } from "@/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { otp } = await request.json();

    if (!otp) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Get User
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch Org and OTP data
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, otp, otp_validity, credits, activation_status")
      .eq("created_by", user.id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // 3. Verify OTP
    if (org.activation_status === "active") {
      return NextResponse.json(
        { message: "Account already active" },
        { status: 200 }
      );
    }

    if (org.otp !== otp) {
      return NextResponse.json({ error: "Codice non valido" }, { status: 400 });
    }

    const now = new Date();
    const validity = new Date(org.otp_validity);

    if (now > validity) {
      return NextResponse.json({ error: "Codice scaduto" }, { status: 400 });
    }

    // 4. Activate and Add Bonus
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        activation_status: "active",
        otp: null, // Clear OTP
        otp_validity: null,
      })
      .eq("id", org.id);

    if (updateError) {
      console.error("Update Error:", updateError);
      return NextResponse.json(
        { error: "Failed to activate account" },
        { status: 500 }
      );
    }

    // Optional: Log transaction for bonus
    await supabase.from("transactions").insert({
      organization_id: org.id,
      amount: 10,
      type: "bonus",
      description: "Welcome Bonus (Account Activation)",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Internal Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
