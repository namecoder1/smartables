"use server";

import { cookies } from "next/headers";

export async function setLocationCookie(locationId: string) {
  const cookieStore = await cookies();
  cookieStore.set("smartables-location-id", locationId, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}
