/**
 * Add-ons configuration and Stripe price ID mapping.
 *
 * Each add-on pack adds a fixed capacity per unit of quantity purchased.
 * e.g. 2x Staff Power Pack → extra_staff += 2 * 5 = 10
 *
 * Boolean add-ons (like extra_analytics) use unit value 1:
 * 1x Analytics Pro → extra_analytics += 1 * 1 = 1 (> 0 means active)
 *
 * For the AI Knowledge Base feature, base character limits are defined per
 * billing tier here (the plan `limits` JSON does not include a kb_chars field).
 */

export type AddonKey = keyof AddonConfig;

export type AddonConfig = {
  extra_staff: number;
  extra_contacts_wa: number;
  extra_storage_mb: number;
  extra_locations: number;
  extra_kb_chars: number;
  extra_analytics: number;
};

export const DEFAULT_ADDON_CONFIG: AddonConfig = {
  extra_staff: 0,
  extra_contacts_wa: 0,
  extra_storage_mb: 0,
  extra_locations: 0,
  extra_kb_chars: 0,
  extra_analytics: 0,
};

/** How much capacity each pack unit adds */
export const ADDON_UNIT_VALUE: Record<AddonKey, number> = {
  extra_staff: 5,          // Staff Power Pack: +5 staff per unit
  extra_contacts_wa: 200,  // Smart Contact Boost: +200 WA contacts per unit
  extra_storage_mb: 500,   // Media Storage Plus: +500 MB per unit
  extra_locations: 1,      // Sede Extra: +1 location per unit
  extra_kb_chars: 5000,    // AI Knowledge Base: +5000 chars per unit
  extra_analytics: 1,      // Analytics Pro: unlocks advanced analytics (boolean toggle)
};

/** Base KB characters included in each billing tier (before add-ons) */
export const BASE_KB_CHARS_BY_TIER: Record<string, number> = {
  starter: 5_000,
  growth: 20_000,
  business: 50_000,
}

export const BASE_STAFF_BY_TIER: Record<string, number> = {
  starter: 5,
  growth: 15,
  business: 10000,
}

export const DEFAULT_BASE_KB_CHARS = 5_000

/**
 * Returns a map of Stripe price ID → addon key.
 * Populated from environment variables set in Stripe dashboard.
 * Set these in .env.local / Vercel:
 *   STRIPE_PRICE_ADDON_STAFF
 *   STRIPE_PRICE_ADDON_CONTACTS_WA
 *   STRIPE_PRICE_ADDON_STORAGE
 *   STRIPE_PRICE_ADDON_LOCATION
 *   STRIPE_PRICE_ADDON_KB
 *   STRIPE_PRICE_ADDON_ANALYTICS
 */
export function getAddonPriceMap(): Record<string, AddonKey> {
  const entries: Array<[string | undefined, AddonKey]> = [
    [process.env.STRIPE_PRICE_ADDON_STAFF, "extra_staff"],
    [process.env.STRIPE_PRICE_ADDON_CONTACTS_WA, "extra_contacts_wa"],
    [process.env.STRIPE_PRICE_ADDON_STORAGE, "extra_storage_mb"],
    [process.env.STRIPE_PRICE_ADDON_LOCATION, "extra_locations"],
    [process.env.STRIPE_PRICE_ADDON_KB, "extra_kb_chars"],
    [process.env.STRIPE_PRICE_ADDON_ANALYTICS, "extra_analytics"],
  ];

  const map: Record<string, AddonKey> = {};
  for (const [priceId, key] of entries) {
    if (priceId) map[priceId] = key;
  }
  return map;
}

/**
 * Compute AddonConfig from an array of Stripe subscription items.
 * Base-plan items (not in the addon map) are silently ignored.
 */
export function computeAddonConfig(
  items: Array<{ price: { id: string }; quantity?: number | null }>,
): AddonConfig {
  const config: AddonConfig = { ...DEFAULT_ADDON_CONFIG };
  const priceMap = getAddonPriceMap();

  for (const item of items) {
    const key = priceMap[item.price.id];
    if (key) {
      config[key] += (item.quantity ?? 1) * ADDON_UNIT_VALUE[key];
    }
  }

  return config;
}
