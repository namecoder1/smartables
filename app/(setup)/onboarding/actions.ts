"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PLANS } from "@/lib/plans";
import { createStripeSubscriptionCheckout } from "@/utils/stripe/actions";

export async function submitOnboarding(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const restaurantName = formData.get("restaurantName") as string;
  const totalSeats = formData.get("totalSeats") as string;
  const fullName = formData.get("fullName") as string;
  const openingHoursRaw = formData.get("openingHours") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const address = formData.get("address") as string;

  // Validate form data
  if (!restaurantName || restaurantName.length < 2) {
    return redirect("/onboarding?error=Nome del ristorante non valido");
  }
  if (!fullName || fullName.length < 2) {
    return redirect("/onboarding?error=Nome completo non valido");
  }
  if (!address || address.length < 5) {
    return redirect("/onboarding?error=Indirizzo non valido");
  }
  if (!phoneNumber || phoneNumber.length < 5) {
    return redirect("/onboarding?error=Numero di telefono non valido");
  }

  const seatsInt = parseInt(totalSeats);
  if (isNaN(seatsInt) || seatsInt <= 0) {
    return redirect("/onboarding?error=Numero di coperti non valido");
  }

  // 1. Parse Opening Hours
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
      whatsapp_usage_count: 0,
      stripe_status: "incomplete",
      created_by: user.id,
    })
    .select()
    .single();

  if (orgError) {
    console.error("Error creating organization:", orgError);
    return redirect("/onboarding?error=Could not create organization");
  }

  // 2. Link User Profile to Organization
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      organization_id: orgData.id,
      full_name: fullName,
      email: user.email,
      role: "owner",
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("Error updating profile:", profileError);
    return redirect("/onboarding?error=Could not link profile");
  }

  // 3. Create the First Location (Physical Branch)
  const slug =
    restaurantName
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "") + `-${Date.now().toString().slice(-4)}`;

  const { data: locData, error: locError } = await supabase
    .from("locations")
    .insert({
      organization_id: orgData.id,
      name: restaurantName, // Default name for first location
      address: address,
      opening_hours: openingHours,
      phone_number: phoneNumber,
      seats: totalSeats,
      slug: slug,
    })
    .select()
    .single();

  if (locError) {
    console.error("Error creating location:", locError);
    // Optional: rollback organization creation? For now, just failing is okay during prototype.
    return redirect("/onboarding?error=Could not create location");
  }

  // Set the admin's accessible_locations to include this new location
  await supabase
    .from("profiles")
    .update({
      accessible_locations: [locData.id],
    })
    .eq("id", user.id);

  // 4. Check for Plan Selection and Trigger Checkout
  const planId = formData.get("plan") as string;
  const interval = formData.get("interval") as string;

  if (planId) {
    const selectedPlan = PLANS.find((p) => p.id === planId);

    if (selectedPlan) {
      const isAnnual = interval === "year";
      const priceId = isAnnual
        ? selectedPlan.priceIdYear
        : selectedPlan.priceIdMonth;

      if (priceId) {
        // After payment, land directly on compliance so the user submits documents ASAP.
        // Telnyx approval takes 24-48h — every hour saved counts.
        await createStripeSubscriptionCheckout(priceId, "/compliance?welcome=1");
        return;
      }
    }
  }

  // No plan selected (free trial or bypass) — still go to compliance first.
  redirect("/compliance?welcome=1");
}
