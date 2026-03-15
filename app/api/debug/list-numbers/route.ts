import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.META_SYSTEM_USER_TOKEN;
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  if (!token || !wabaId) {
    return NextResponse.json({ error: "Missing config" }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();
    console.log("WABA Phone Numbers:", JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
