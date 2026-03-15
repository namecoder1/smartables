import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2, Info, ChevronLeft, Search, UtensilsCrossed, CalendarDays, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  labels: string[] | null;
  allergens: string[] | null;
  is_available: boolean;
  sort_order: number;
};

type MenuCategory = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  items: MenuItem[];
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
};

// Helper to determine text color based on background color
function getContrastColor(hexColor: string) {
  // Convert hex to RGB
  const r = parseInt(hexColor.substring(1, 3), 16);
  const g = parseInt(hexColor.substring(3, 5), 16);
  const b = parseInt(hexColor.substring(5, 7), 16);

  // Calculate brightness (YIQ formula)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

  return yiq >= 128 ? '#000000' : '#ffffff';
}

export default async function DigitalMenuPage({
  params,
}: {
  params: Promise<{ locationSlug: string; menuId: string }>;
}) {
  const { locationSlug, menuId } = await params;
  const supabase = await createClient();

  const { data: location, error: locationError } = await supabase
    .from("locations")
    .select("*, organizations(name)")
    .eq("slug", locationSlug)
    .single();

  if (locationError || !location) {
    console.error("Location not found:", locationError);
    return notFound();
  }

  // Fetch Menu with Content (JSONB)
  const { data: menu, error } = await supabase
    .from("menus")
    .select("id, name, description, content, pdf_url")
    .eq("id", menuId)
    .single();

  if (error || !menu) {
    console.error("Menu not found:", error);
    return notFound();
  }

  // Fetch ACTIVE PROMOTIONS for this specific menu
  const now = new Date().toISOString();

  const { data: allPromotions } = await supabase
    .from("promotions")
    .select(`
      id, name, description, image_url, type, value, starts_at, ends_at, visit_threshold,
      all_locations, all_menus, target_location_ids, target_menu_ids
    `)
    .eq("organization_id", location.organization_id)
    .eq("is_active", true);

  const menuPromotions: PublicPromotion[] = (allPromotions || []).filter((promo) => {
    // Check location scope
    const locationMatch = promo.all_locations ||
      (promo.target_location_ids || []).includes(location.id);
    if (!locationMatch) return false;

    // Check menu scope — must apply to THIS menu
    const menuMatch = promo.all_menus ||
      (promo.target_menu_ids || []).includes(menuId);
    if (!menuMatch) return false;

    // Check date range
    if (promo.starts_at && new Date(promo.starts_at) > new Date(now)) return false;
    if (promo.ends_at && new Date(promo.ends_at) < new Date(now)) return false;

    // Skip visit-threshold-only promotions from public view
    if (promo.visit_threshold && promo.visit_threshold > 0 && !promo.description) return false;

    return true;
  });

  const branding = location.branding;
  const primaryColor = branding?.colors?.primary || "#3b82f6"; // Default Blue-500
  const secondaryColor = branding?.colors?.secondary || "#a855f7"; // Default Purple-500
  const logoUrl = branding?.logo_url;

  const primaryForeground = getContrastColor(primaryColor);


  // Handle PDF Menu
  if (menu.pdf_url) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
        <div className="w-full max-w-4xl flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-4 py-4">
            <Link href={`/m/${locationSlug}`} className="bg-white p-2 rounded-full shadow-sm hover:shadow-md transition-shadow text-slate-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-xl text-slate-900 truncate flex-1">{menu.name}</h1>
          </div>

          <div className="flex-1 border-0 shadow-xl rounded-2xl overflow-hidden bg-slate-200 min-h-[80vh] relative">
            <iframe
              src={menu.pdf_url}
              className="w-full h-full absolute inset-0"
              title="Menu PDF"
            />
          </div>
          <div className="text-center pb-8 pt-4">
            <Button asChild variant="default" className="rounded-full shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90">
              <a href={menu.pdf_url} target="_blank" rel="noopener noreferrer">
                Scarica / Apri PDF
              </a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Parse categories
  const rawCategories = (menu.content as unknown as MenuCategory[]) || [];
  // Filter out empty categories if desired, or keep them to show "Empty" state
  const categories = rawCategories.filter(c => c.items && c.items.length > 0);

  // Gradient based on name length for variety (same as main page)
  const gradientClass = "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900";

  return (
    <div
      className="min-h-screen bg-slate-50 font-sans selection:bg-primary/20 pb-20"
      style={{
        '--primary': primaryColor,
        '--primary-foreground': primaryForeground,
        '--ring': primaryColor,
      } as React.CSSProperties}
    >
      {/* Hero Header */}
      <div
        className={`relative text-white pt-8 pb-32 px-6 overflow-hidden z-10`}
        style={{
          background: `linear-gradient(5deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
        }}
      >
        {/* Abstract background shapes */}
        <div className="opacity-40">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-md mx-auto">
          {/* Navbar */}
          <div className="flex items-center justify-between mb-8">
            <Link href={`/m/${locationSlug}`} className="bg-white/10 backdrop-blur-md p-2 rounded-full hover:bg-white/20 transition-colors text-white border border-white/10">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex gap-2">
              {/* Future controls */}
            </div>
          </div>

          <div className="text-center space-y-3 px-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight drop-shadow-sm">{menu.name}</h1>
            <p className="text-white text-sm max-w-xs mx-auto leading-relaxed font-medium">Scopri i deliziosi piatti di questo menu.</p>
          </div>
        </div>
      </div>

      {/* Main Content - Overlapping Card */}
      <div className="relative z-20 -mt-20 px-4">
        <div className="max-w-md mx-auto space-y-6">

          {/* Promotions for this menu */}
          {menuPromotions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Promozioni attive su questo menù</h2>
              </div>
              <div className="grid gap-3">
                {menuPromotions.map((promo) => (
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

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 ring-1 ring-slate-900/5">
            {/* Sticky Category Navigation */}
            {categories.length > 0 && (
              <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 py-3 px-4 overflow-x-auto no-scrollbar scroll-smooth">
                <div className="flex gap-2 min-w-max">
                  {categories.map((cat) => (
                    <a
                      key={cat.id}
                      href={`#cat-${cat.id}`}
                      className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all active:scale-95 active:bg-primary active:text-primary-foreground"
                    >
                      {cat.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Menu Content */}
            <div className="p-5 md:p-6 min-h-[50vh]">
              {categories.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                    <UtensilsCrossed className="w-8 h-8 opacity-40" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-600">Menu in lavorazione</h3>
                  <p className="text-sm">Torna presto per scoprire i nostri piatti.</p>
                </div>
              ) : (
                categories.map((cat, index) => (
                  <section key={cat.id} id={`cat-${cat.id}`} className={`scroll-mt-28 ${index !== 0 ? 'mt-10' : ''}`}>
                    <div className="flex items-baseline justify-between mb-4 border-l-4 border-primary pl-3">
                      <h2 className="text-xl font-bold text-slate-800">{cat.name}</h2>
                    </div>

                    {cat.description && (
                      <p className="text-sm text-slate-500 mb-6 pl-1 leading-relaxed italic">{cat.description}</p>
                    )}

                    <div className="space-y-6">
                      {cat.items.map((item) => (
                        <div key={item.id} className="group flex gap-4 items-start pb-6 border-b border-slate-50 last:border-0 last:pb-0">

                          {/* Text Content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-bold text-slate-800 text-[17px] leading-tight group-hover:text-primary transition-colors">
                                {item.name}
                              </h3>
                            </div>

                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>

                            <div className="pt-2 flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-[15px]">
                                € {item.price.toFixed(2)}
                              </span>
                              {!item.is_available && (
                                <Badge variant="secondary" className="bg-red-50 text-red-600 border-red-100 h-5 px-1.5 text-[10px] font-bold">ESAURITO</Badge>
                              )}
                              {item.image_url && (
                                <span className="md:hidden text-xs text-primary flex items-center gap-0.5">
                                  <Info className="w-3 h-3" /> Foto
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Image - Right aligned */}
                          {item.image_url && (
                            <div className="shrink-0 relative w-24 h-24 rounded-lg overflow-hidden bg-slate-100 shadow-sm border border-slate-100">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${!item.is_available ? 'grayscale opacity-70' : ''}`}
                                loading="lazy"
                              />
                            </div>
                          )}

                        </div>
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
          </div>

          {/* Bottom Branding */}
          <div className="text-center pb-8 opacity-50 space-y-1">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">Powered by Smartables</p>
          </div>
        </div>
      </div>

    </div>
  );
}

// ===== Promotion Helpers & Card =====

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
      <div
        className="h-1"
        style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
      />
      <div className="p-4">
        <div className="flex gap-3">
          {promotion.image_url ? (
            <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={promotion.image_url} alt={promotion.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div
              className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              {typeConfig.emoji}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-slate-800 text-sm leading-snug">{promotion.name}</h3>
              {valueLabel && (
                <span className="shrink-0 text-base font-extrabold tracking-tight" style={{ color: primaryColor }}>
                  {valueLabel}
                </span>
              )}
            </div>
            {promotion.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{promotion.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge
                variant="secondary"
                className="text-[10px] px-2 h-5 border"
                style={{ backgroundColor: `${primaryColor}12`, color: primaryColor, borderColor: `${primaryColor}25` }}
              >
                {typeConfig.label}
              </Badge>
              {dateLabel && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {dateLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
