"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";

export async function submitOnboarding(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const restaurantName = formData.get("restaurantName") as string;
  const openingHoursRaw = formData.get("openingHours") as string;
  const address = formData.get("address") as string;

  // 1. Create the Organization
  let openingHours = {};
  if (openingHoursRaw) {
    try {
      openingHours = JSON.parse(openingHoursRaw);
    } catch (e) {
      console.error("Failed to parse opening hours", e);
    }
  }

  // 1. Create the Organization (Brand)
  const { data: orgData, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: restaurantName,
      credits: 10, // Welcome bonus
    })
    .select()
    .single();

  if (orgError) {
    console.error("Error creating organization:", orgError);
    return redirect("/onboarding?error=Could not create organization");
  }

  // 2. Create the First Location (Physical Branch)
  const slug =
    restaurantName
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "") + `-${Date.now().toString().slice(-4)}`;

  const { error: locError } = await supabase.from("locations").insert({
    organization_id: orgData.id,
    name: restaurantName, // Default name for first location
    address: address,
    opening_hours: openingHours,
    slug: slug,
    // phone_number: ... (add input if needed, or update later)
  });

  if (locError) {
    console.error("Error creating location:", locError);
    // Optional: rollback organization creation? For now, just failing is okay during prototype.
    return redirect("/onboarding?error=Could not create location");
  }

  // 3. Link User Profile to Organization
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ organization_id: orgData.id })
    .eq("id", user.id);

  if (profileError) {
    console.error("Error updating profile:", profileError);
    return redirect("/onboarding?error=Could not link profile");
  }

  // if (error) {
  //   console.error(error)
  //   return redirect('/onboarding?error=Could not save details')
  // }

  redirect("/dashboard");
}
