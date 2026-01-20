import { NextResponse } from "next/server";
import { getOwnedNumbers } from "@/lib/telnyx";

export async function GET() {
  try {
    const numbers = await getOwnedNumbers();
    return NextResponse.json({ numbers });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch owned numbers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
