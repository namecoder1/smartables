import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, ChevronRight, Utensils, CalendarDays, MapPin, UtensilsCrossed, Percent, DollarSign, Package, UtensilsCrossed as CoverIcon, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TbRosetteDiscount } from "react-icons/tb";

import { Metadata } from "next";

type MetaProps = { params: Promise<{ locationSlug: string }> }

export async function generateMetadata({ params }: MetaProps): Promise<Metadata> {
  const { locationSlug } = await params
  const supabase = await createClient()
  const { data: location } = await supabase
    .from("locations")
    .select("name, organizations(name)")
    .eq("slug", locationSlug)
    .single()

  if (!location) {
    return { title: "Menu Digitale" }
  }

  const orgName = (location.organizations as { name: string } | null)?.name || "Ristorante"
  const title = `Menu di ${location.name} | ${orgName}`
  const description = `Sfoglia il menu digitale di ${location.name}. Scopri piatti, prezzi e promozioni. Nessuna app richiesta.`

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/m/${locationSlug}` },
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
    },
  }
}

type Menu = {
  id: string;
  name: string;
  description: string | null;
  pdf_url: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

type PublicPromotion = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  type: string;
  value: number | null;
  starts_at: string | null;
  ends_at: string | null;
  visit_threshold: number | null;
  // The menu IDs this promo applies to (empty if all_menus)
  all_menus?: boolean;
  menuIds?: string[];
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
      daily_from,
      daily_until,
      menu:menus (
        id,
        name,
        description,
        pdf_url,
        is_active,
        starts_at,
        ends_at
      )
    `)
    .eq("location_id", location.id)
    .eq("is_active", true)
    .filter("menu.is_active", "eq", true);

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const allFetchedMenus = (menus?.map((m) => ({
    ...(m.menu as unknown as Menu),
    daily_from: (m as any).daily_from as string | null,
    daily_until: (m as any).daily_until as string | null,
  })).filter((m) => (m as any).id !== undefined)) || [];
  // Filter out menus outside their validity window and daily time range
  const activeMenus = allFetchedMenus.filter((m) => {
    if (m.starts_at && new Date(m.starts_at) > now) return false;
    if (m.ends_at && new Date(m.ends_at) < now) return false;
    if (m.daily_from && m.daily_until) {
      const [fromH, fromM] = m.daily_from.split(':').map(Number);
      const [untilH, untilM] = m.daily_until.split(':').map(Number);
      if (nowMinutes < fromH * 60 + fromM || nowMinutes > untilH * 60 + untilM) return false;
    }
    return true;
  });
  const activeMenuIds = activeMenus.map((m) => m.id);
  const orgName = location.organizations?.name || "Ristorante";

  // 3. Fetch ACTIVE PROMOTIONS for this location

  // Fetch all active promotions for this organization
  const { data: allPromotions } = await supabase
    .from("promotions")
    .select(`
      id, name, description, image_url, type, value, starts_at, ends_at, visit_threshold,
      all_locations, all_menus, target_location_ids, target_menu_ids
    `)
    .eq("organization_id", location.organization_id)
    .eq("is_active", true);

  // Filter client-side for location + menu scope + date validity
  const activePromotions: PublicPromotion[] = (allPromotions || []).filter((promo) => {
    // Check location scope
    const locationMatch = promo.all_locations ||
      (promo.target_location_ids || []).includes(location.id);
    if (!locationMatch) return false;

    // Check menu scope
    const menuMatch = promo.all_menus ||
      (promo.target_menu_ids || []).some((mid: string) => activeMenuIds.includes(mid));
    if (!menuMatch) return false;

    // Check date range
    if (promo.starts_at && new Date(promo.starts_at) > new Date(now)) return false;
    if (promo.ends_at && new Date(promo.ends_at) < new Date(now)) return false;

    // Skip visit-threshold-only promotions from public view (they're triggered per-customer)
    if (promo.visit_threshold && promo.visit_threshold > 0 && !promo.description) return false;

    return true;
  }).map((promo) => ({
    ...promo,
    all_menus: promo.all_menus,
    menuIds: promo.target_menu_ids || [],
  }));

  // Helper: count promotions per menu
  const getPromoCountForMenu = (menuId: string) =>
    activePromotions.filter((p) => p.all_menus || p.menuIds?.includes(menuId)).length;

  // Branding Logic
  const branding = location.branding;
  const primaryColor = branding?.colors?.primary || "#3b82f6";
  const secondaryColor = branding?.colors?.secondary || "#a855f7";
  const logoUrl = branding?.logo_url;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100">
      {/* Hero Section */}
      <div
        className="relative text-white pb-12 pt-16 px-6 overflow-hidden transition-all duration-700 ease-in-out"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
        }}
      >
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-black/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md mx-auto text-center space-y-6">

          {logoUrl && (
            <div className="mx-auto w-24 h-24 relative mb-4 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 bg-white p-2">
              <Image
                src={logoUrl}
                alt={`${location.name} Logo`}
                width={96}
                height={96}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <div className="space-y-2">
            {!logoUrl && (
              <Badge variant="outline" className="text-white/90 border-white/20 px-3 py-1 backdrop-blur-md bg-white/10">
                {orgName}
              </Badge>
            )}

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-sm">
              {location.name}
            </h1>
          </div>

          <div className="flex items-center justify-center text-white/90 text-sm gap-2 font-medium bg-white/10 backdrop-blur-sm py-1.5 px-4 rounded-full w-fit mx-auto border border-white/10">
            <MapPin className="w-4 h-4" />
            <span className="max-w-62.5 truncate">{location.address || "Vieni a trovarci"}</span>
          </div>
        </div>
      </div>

      {/* Main Content Card - Overlapping Hero */}
      <div className="flex-1 -mt-8 px-4 pb-20 z-20">
        <div className="max-w-md mx-auto space-y-6">

          {/* Booking CTA Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100 text-center relative overflow-hidden">
            <div
              className="absolute top-0 left-0 w-full h-1"
              style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
            />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Vuoi prenotare un tavolo?</h3>
            <p className="text-slate-500 text-sm mb-5">Riserva il tuo posto in pochi click.</p>
            <Link href={`/p/${locationSlug}`} className="block">
              <Button
                size="lg"
                className="w-full rounded-xl text-white shadow-lg transition-all active:scale-[0.98]"
                style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}40` }}
              >
                <CalendarDays className="w-5 h-5 mr-2" />
                Prenota Ora
              </Button>
            </Link>
          </div>

          {/* Menus Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div
                className="h-8 w-1 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
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
                  <MenuCard
                    key={menu.id}
                    menu={menu}
                    locationSlug={locationSlug}
                    primaryColor={primaryColor}
                    promoCount={getPromoCountForMenu(menu.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Promotions Section */}
          {activePromotions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div
                  className="h-8 w-1 rounded-full"
                  style={{ background: `linear-gradient(to bottom, ${primaryColor}, ${secondaryColor})` }}
                />
                <h2 className="text-xl font-bold text-slate-800">
                  Promozioni Attive
                </h2>
              </div>

              <div className="grid gap-3">
                {activePromotions.map((promo) => (
                  <PromotionCard
                    key={promo.id}
                    promotion={promo}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="py-8 text-center text-xs text-slate-400 bg-white border-t border-slate-100">
        <p>© {new Date().getFullYear()} {orgName}</p>
        <div className="mt-2 flex items-center justify-center gap-1 opacity-70">
          <span>Realizzato da</span>
          <a href="https://smartables.it" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-600">Smartables</a>
        </div>
      </footer>
    </div>
  );
}

// ===== Promotion Card =====

function formatPromoValue(type: string, value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  switch (type) {
    case 'percentage': return `-${value}%`;
    case 'fixed_amount': return `-${value}€`;
    case 'bundle': return `${value}€`;
    case 'cover_override': return value === 0 ? 'Gratis' : `${value}€`;
    default: return null;
  }
}

function formatPromoDate(startsAt: string | null, endsAt: string | null) {
  const fmt = (d: string) => new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  if (startsAt && endsAt) return `${fmt(startsAt)} — ${fmt(endsAt)}`;
  if (endsAt) return `Fino al ${fmt(endsAt)}`;
  return null;
}

const PROMO_TYPE_CONFIG: Record<string, { label: string; emoji: string }> = {
  percentage: { label: 'Sconto %', emoji: '🏷️' },
  fixed_amount: { label: 'Sconto €', emoji: '💰' },
  bundle: { label: 'Bundle', emoji: '🎁' },
  cover_override: { label: 'Coperto', emoji: '🍽️' },
};

function PromotionCard({
  promotion,
  primaryColor,
  secondaryColor,
}: {
  promotion: PublicPromotion;
  primaryColor: string;
  secondaryColor: string;
}) {
  const typeConfig = PROMO_TYPE_CONFIG[promotion.type] || PROMO_TYPE_CONFIG.percentage;
  const valueLabel = formatPromoValue(promotion.type, promotion.value);
  const dateLabel = formatPromoDate(promotion.starts_at, promotion.ends_at);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md">
      {/* Gradient accent bar */}
      <div
        className="h-1"
        style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
      />

      <div className="p-5">
        <div className="flex gap-4">
          {/* Image or icon */}
          {promotion.image_url ? (
            <div className="shrink-0 relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100">
              <Image src={promotion.image_url} alt={promotion.name} fill sizes="64px" className="object-cover" />
            </div>
          ) : (
            <div
              className="shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              {typeConfig.emoji}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-slate-800 text-base leading-snug">{promotion.name}</h3>
              {valueLabel && (
                <span
                  className="shrink-0 text-lg font-extrabold tracking-tight"
                  style={{ color: primaryColor }}
                >
                  {valueLabel}
                </span>
              )}
            </div>

            {promotion.description && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {promotion.description}
              </p>
            )}

            {/* Tags row */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge
                variant="secondary"
                className="text-[10px] px-2 h-5 border"
                style={{
                  backgroundColor: `${primaryColor}12`,
                  color: primaryColor,
                  borderColor: `${primaryColor}25`,
                }}
              >
                {typeConfig.label}
              </Badge>

              {dateLabel && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {dateLabel}
                </span>
              )}

              {promotion.visit_threshold && promotion.visit_threshold > 0 && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  ⭐ Ogni {promotion.visit_threshold} visite
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Menu Card =====

function MenuCard({ menu, locationSlug, primaryColor, promoCount = 0 }: { menu: Menu; locationSlug: string; primaryColor: string; promoCount?: number }) {
  const isPdf = !!menu.pdf_url;
  const href = isPdf && menu.pdf_url ? menu.pdf_url : `/m/${locationSlug}/${menu.id}`;
  const target = isPdf ? "_blank" : "_self";
  const isSpecial = !!(menu.starts_at || menu.ends_at);
  const endDateLabel = menu.ends_at
    ? `Fino al ${new Date(menu.ends_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`
    : null;

  return (
    <Link
      href={href}
      target={target}
      className="group block bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-slate-100"
    >
      <div className="flex p-5 gap-4">
        {/* Icon/Image Placeholder */}
        <div
          className={`shrink-0 w-16 h-16 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105`}
          style={{
            backgroundColor: isPdf ? '#fef2f2' : `${primaryColor}10`,
            color: isPdf ? '#ef4444' : primaryColor
          }}
        >
          {isPdf ? <FileText className="w-8 h-8" /> : <Utensils className="w-8 h-8" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3
              className="font-bold text-lg text-slate-800 truncate pr-2 transition-colors group-hover:text-[--hover-color]"
              style={{ '--hover-color': primaryColor } as React.CSSProperties}
            >
              {menu.name}
            </h3>
            {isPdf ? (
              <ExternalLink className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
            ) : (
              <ChevronRight
                className="w-5 h-5 text-slate-300 shrink-0 mt-1 transition-colors group-hover:text-[--hover-color]"
                style={{ '--hover-color': primaryColor } as React.CSSProperties}
              />
            )}
          </div>

          <p className="text-sm text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            Scopri i deliziosi piatti di questo menu.
          </p>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {isPdf ? (
              <Badge variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-100 border-red-100 text-[10px] px-2 h-5">PDF</Badge>
            ) : (
              <Badge
                variant="secondary"
                className="text-[10px] px-2 h-5 border opacity-90"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                  borderColor: `${primaryColor}30`
                }}
              >
                DIGITALE
              </Badge>
            )}
            {isSpecial && (
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-2 h-5">
                ✨ Speciale{endDateLabel ? ` · ${endDateLabel}` : ''}
              </Badge>
            )}
            {promoCount > 0 && (
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 h-5">
                🏷️ {promoCount} {promoCount === 1 ? 'promo' : 'promo'}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
