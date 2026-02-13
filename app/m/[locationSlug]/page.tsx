import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, ChevronRight, Utensils, CalendarDays, MapPin, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Menu Digitale | Smartables",
  description: "Sfoglia il nostro menu.",
};

type Menu = {
  id: string;
  name: string;
  description: string | null;
  pdf_url: string | null;
  is_active: boolean;
};

export default async function PublicMenuPage({
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
    console.error("Location not found:", locationError);
    return notFound();
  }

  // 2. Fetch MENUS active for this location
  const { data: menus, error: menusError } = await supabase
    .from("menu_locations")
    .select(`
      is_active,
      menu:menus (
        id,
        name,
        description,
        pdf_url,
        is_active
      )
    `)
    .eq("location_id", location.id)
    .eq("is_active", true)
    .filter("menu.is_active", "eq", true);

  const activeMenus = (menus?.map((m) => m.menu).filter((m) => m !== null) as unknown as Menu[]) || [];
  const orgName = location.organizations?.name || "Ristorante";

  // Create a gradient based on the location name length to give it some variety or just a nice default
  const gradientClass = "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100">
      {/* Hero Section */}
      <div className={`relative ${gradientClass} text-white pb-12 pt-16 px-6 overflow-hidden`}>
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md mx-auto text-center space-y-4">
          <Badge variant="outline" className="text-white/80 border-white/20 px-3 py-1 mb-2 backdrop-blur-sm">
            {orgName}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            {location.name}
          </h1>
          <div className="flex items-center justify-center text-slate-300 text-sm gap-2">
            <MapPin className="w-4 h-4" />
            <span className="max-w-[250px] truncate">{location.address || "Vieni a trovarci"}</span>
          </div>
        </div>
      </div>

      {/* Main Content Card - Overlapping Hero */}
      <div className="flex-1 -mt-8 px-4 pb-20 z-20">
        <div className="max-w-md mx-auto space-y-6">

          {/* Booking CTA Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 to-purple-500" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Vuoi prenotare un tavolo?</h3>
            <p className="text-slate-500 text-sm mb-5">Riserva il tuo posto in pochi click.</p>
            <Link href={`/p/${locationSlug}`} className="block">
              <Button size="lg" className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98]">
                <CalendarDays className="w-5 h-5 mr-2" />
                Prenota Ora
              </Button>
            </Link>
          </div>

          {/* Menus Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="h-8 w-1 bg-blue-600 rounded-full" />
              <h2 className="text-xl font-bold text-slate-800">
                I Nostri Menu
              </h2>
            </div>

            {activeMenus.length === 0 ? (
              <div className="text-center py-16 px-6 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UtensilsCrossed className="w-8 h-8 opacity-40" />
                </div>
                <p className="font-medium">Nessun menu disponibile al momento.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeMenus.map((menu) => (
                  <MenuCard key={menu.id} menu={menu} locationSlug={locationSlug} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="py-8 text-center text-xs text-slate-400 bg-white border-t border-slate-100">
        <p>© {new Date().getFullYear()} {orgName}</p>
        <div className="mt-2 flex items-center justify-center gap-1 opacity-70">
          <span>Powered by</span>
          <span className="font-semibold text-slate-600">Smartables</span>
        </div>
      </footer>
    </div>
  );
}

function MenuCard({ menu, locationSlug }: { menu: Menu; locationSlug: string }) {
  const isPdf = !!menu.pdf_url;
  const href = isPdf && menu.pdf_url ? menu.pdf_url : `/m/${locationSlug}/${menu.id}`;
  const target = isPdf ? "_blank" : "_self";

  return (
    <Link
      href={href}
      target={target}
      className="group block bg-white rounded-2xl shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-slate-100"
    >
      <div className="flex p-5 gap-4">
        {/* Icon/Image Placeholder */}
        <div className={`shrink-0 w-16 h-16 rounded-xl flex items-center justify-center ${isPdf ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'} group-hover:scale-105 transition-transform`}>
          {isPdf ? <FileText className="w-8 h-8" /> : <Utensils className="w-8 h-8" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="font-bold text-lg text-slate-800 truncate pr-2 group-hover:text-blue-600 transition-colors">
              {menu.name}
            </h3>
            {isPdf ? (
              <ExternalLink className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 mt-1 group-hover:text-blue-600 transition-colors" />
            )}
          </div>

          <p className="text-sm text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {menu.description || "Scopri i deliziosi piatti di questo menu."}
          </p>

          <div className="mt-3 flex items-center gap-2">
            {isPdf ? (
              <Badge variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-100 border-red-100 text-[10px] px-2 h-5">PDF</Badge>
            ) : (
              <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100 text-[10px] px-2 h-5">DIGITALE</Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
