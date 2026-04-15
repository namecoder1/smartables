import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const refreshToken = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!refreshToken) {
    return NextResponse.json({ error: "Missing refresh token" }, { status: 401 });
  }

  const res = await fetch(
    `https://api.cal.com/v2/oauth/${process.env.CAL_OAUTH_CLIENT_ID}/refresh`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken,
        clientSecret: process.env.CAL_OAUTH_CLIENT_SECRET,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}
