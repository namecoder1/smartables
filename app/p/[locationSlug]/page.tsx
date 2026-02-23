import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, MapPin, Users, Clock, CheckCircle, Smartphone, User } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
// We might need client-side interactivity, so this page likely needs to be a Client Component or have a Client Component for the form.
// For now, let's make the page async server component and putting the form in a separate client component would be ideal, 
// but to keep it simple and consistent with the request, I'll make the whole page generic or use a client component for the form.
// Actually, looking at the layout, let's stick to a Server Component for data fetching and a Client Component for the form.
// But validtion request said "Create/Update `app/p/[locationSlug]/page.tsx`". 
// I'll make the page.tsx a Server Component and import a new client component for the form to handle state. 
// Wait, I can just make the whole page "use client" if it's simpler for this task, but Server Component is better for SEO and initial data.
// Let's do Server Component + Client Form.
import { BookingForm } from "./booking-form";

export const metadata = {
  title: "Prenota un Tavolo | Smartables",
  description: "Prenota il tuo tavolo online.",
};

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ locationSlug: string }>;
}) {
  const { locationSlug } = await params;
  const supabase = await createClient();

  // 1. Fetch Location
  const { data: location, error: locationError } = await supabase
    .from("locations")
    .select("*, organizations(name)")
    .eq("slug", locationSlug)
    .single();

  if (locationError || !location) {
    return notFound();
  }

  const orgName = location.organizations?.name || "Ristorante";

  // Branding Logic
  const branding = location.branding;
  const primaryColor = branding?.colors?.primary || "#3b82f6"; // Default Blue-500
  const secondaryColor = branding?.colors?.secondary || "#a855f7"; // Default Purple-500
  const logoUrl = branding?.logo_url;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100">
      {/* Hero Section */}
      <div
        className="relative text-white pb-12 pt-12 px-6 overflow-hidden max-h-[40vh] flex flex-col items-center justify-center transition-all duration-700 ease-in-out"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
        }}
      >
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-black/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md mx-auto text-center space-y-4">

          {logoUrl && (
            <div className="mx-auto w-20 h-20 relative mb-2 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={`${location.name} Logo`}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <div className="space-y-1">
            {!logoUrl && (
              <Badge variant="outline" className="text-white/90 border-white/20 px-3 py-1 backdrop-blur-md bg-white/10">
                {orgName}
              </Badge>
            )}

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight drop-shadow-sm">
              Prenota da {location.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content Form - Overlapping Hero */}
      <div className="flex-1 -mt-8 px-4 pb-20 z-20">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full h-1"
            style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
          />

          <BookingForm
            locationId={location.id}
            organizationId={location.organization_id}
            primaryColor={primaryColor}
            locationName={location.name}
            locationSlug={locationSlug}
            openingHours={location.opening_hours}
          />

        </div>

        <div className="mt-8 text-center">
          <Link href={`/m/${locationSlug}`} className="text-sm text-slate-500 hover:text-slate-800 underline transition-colors">
            Torna al Menu
          </Link>
        </div>
      </div>

      <footer className="py-8 text-center text-xs text-slate-400 bg-white border-t border-slate-100 mt-auto">
        <p>© {new Date().getFullYear()} {orgName}</p>
        <div className="mt-2 flex items-center justify-center gap-1 opacity-70">
          <span>Powered by</span>
          <span className="font-semibold text-slate-600">Smartables</span>
        </div>
      </footer>
    </div>
  );
}
