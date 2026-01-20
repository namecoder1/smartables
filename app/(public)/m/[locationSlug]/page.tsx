import { createClient } from "@/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, UtensilsCrossed } from "lucide-react";

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
  // We join `menu_locations` to filter, and get `menus` details.
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
    .eq("is_active", true) // Active in this location
    .filter("menu.is_active", "eq", true); // Globally active

  // Note: Nested filtering "menu.is_active" implies inner join behavior usually in Supabase/PostgREST if not careful, 
  // but here we just want to ensure we don't show archived menus.

  const activeMenus = (menus?.map((m) => m.menu).filter((m) => m !== null) as unknown as Menu[]) || [];
  const orgName = location.organizations?.name || "Ristorante";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with Hero Image Placeholder */}
      <div className="bg-slate-900 text-white p-8 pb-16 text-center relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">{orgName}</h1>
          <p className="opacity-80 text-sm mb-4">{location.name}</p>
        </div>

        {/* Floating CTA for Booking */}
        <div className="absolute -bottom-6 left-0 right-0 flex justify-center z-20">
          <Link href={`/p/${locationSlug}`}>
            <Button size="lg" className="rounded-full shadow-lg shadow-blue-900/20 px-8 text-lg font-medium">
              📅 Prenota Tavolo
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full p-6 pt-12 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 border-l-4 border-slate-900 pl-3">
          I Nostri Menu
        </h2>

        {activeMenus.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
            <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p>Nessun menu disponibile al momento.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeMenus.map((menu) => (
              <MenuCard key={menu.id} menu={menu} locationSlug={locationSlug} />
            ))}
          </div>
        )}
      </div>

      <footer className="p-6 text-center text-xs text-gray-300">
        Smartables Menu
      </footer>
    </div>
  );
}

function MenuCard({ menu, locationSlug }: { menu: Menu; locationSlug: string }) {
  const isPdf = !!menu.pdf_url;

  // If PDF, link externally. If Digital, link to sub-page (not implemented yet, or maybe toggle inline?)
  // For MVP, if Digital, we just assume we don't support full digital browsing yet OR we implemented a generic view?
  // Let's make "Digital" click go to a placeholder or simple list page. 
  // Ideally, `/m/[slug]/[menuId]`

  const href = isPdf && menu.pdf_url ? menu.pdf_url : `/m/${locationSlug}/${menu.id}`;
  const target = isPdf ? "_blank" : "_self";

  return (
    <Link
      href={href}
      target={target}
      className="group block bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-4 active:scale-95"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
            {menu.name}
          </h3>
          {menu.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
              {menu.description}
            </p>
          )}
        </div>
        <div className="ml-4 text-gray-400 group-hover:text-blue-600">
          {isPdf ? <FileText className="w-6 h-6" /> : <ExternalLink className="w-6 h-6" />}
        </div>
      </div>

      {isPdf && (
        <div className="mt-3 inline-flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
          <FileText className="w-3 h-3 mr-1" />
          PDF Menu
        </div>
      )}
    </Link>
  );
}
