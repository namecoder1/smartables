import { createClient } from "@/supabase/server";
import { notFound } from "next/navigation";
import { BookingForm } from "./booking-form";

export const metadata = {
  title: "Prenota un Tavolo | Smartables",
  description: "Prenota il tuo tavolo in pochi secondi.",
};

export default async function PublicBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locationSlug: string }>;
  searchParams: Promise<{ phone?: string }>;
}) {
  const { locationSlug } = await params;
  const { phone } = await searchParams; // Pre-fill phone if passed from WhatsApp link

  const supabase = await createClient();

  // 1. Fetch Location by Slug
  const { data: location, error } = await supabase
    .from("locations")
    .select("*, organizations(name)")
    .eq("slug", locationSlug)
    .single();

  if (error || !location) {
    console.error("Location not found:", error);
    return notFound();
  }

  // 2. Fetch Organization Name (included in join above)
  const orgName = location.organizations?.name || "Ristorante";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-6 text-white text-center">
          <h1 className="text-xl font-bold">{orgName}</h1>
          <p className="text-sm opacity-80">{location.name}</p>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
            Prenota il tuo tavolo
          </h2>

          <BookingForm
            locationId={location.id}
            organizationId={location.organization_id}
            locationSlug={locationSlug}
            initialPhone={phone || ""}
          />
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400">
        Powered by Smartables
      </p>
    </div>
  );
}
