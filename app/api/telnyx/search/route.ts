import { searchAvailableNumbers } from "@/lib/telnyx";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") || "IT";
    const areaCode = searchParams.get("areaCode") || undefined;
    const limit = parseInt(searchParams.get("limit") || "10");

    const numbers = await searchAvailableNumbers(country, areaCode, limit);

    return NextResponse.json({ numbers });
  } catch (error) {
    console.error("Error searching Telnyx numbers:", error);
    return NextResponse.json(
      { error: "Failed to search numbers" },
      { status: 500 }
    );
  }
}
