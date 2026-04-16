/**
 * Centralised revalidation path constants.
 *
 * Import `PATHS` (and `revalidatePath` from "next/cache") instead of writing
 * literal strings in action files. This prevents typos and makes path renames
 * a single-file change.
 *
 * @example
 * import { PATHS } from "@/lib/revalidation-paths";
 * revalidatePath(PATHS.SETTINGS);
 * revalidatePath(PATHS.RESERVATIONS_LAYOUT, "layout");
 */

export const PATHS = {
  // ── Root ─────────────────────────────────────────────────────────────────
  /** Full layout revalidation. Pass "layout" as the second arg to revalidatePath. */
  ROOT_LAYOUT: "/",

  // ── App sections ─────────────────────────────────────────────────────────
  HOME: "/home",
  SETTINGS: "/settings",
  COMPLIANCE: "/compliance",
  BOT_MEMORY: "/bot-memory",
  BOT_TEMPLATES: "/(private)/(site)/bot-templates",
  RESERVATIONS: "/reservations",
  CLIENTS: "/clients",
  WHATSAPP_MANAGEMENT: "/whatsapp-management",
  SITE_SETTINGS: "/site-settings",

  // ── Admin ────────────────────────────────────────────────────────────────
  MANAGE: "/manage",

  // ── Private (platform) ───────────────────────────────────────────────────
  /** Pass "layout" as the second arg. */
  RESERVATIONS_PLATFORM_LAYOUT: "/(private)/(platform)/reservations",
  FLOOR_PLAN: "/(private)/(platform)/settings/floor-plan",

  // ── Private (org) ────────────────────────────────────────────────────────
  RESERVATIONS_ORG: "/(private)/(org)/reservations",
  /** Pass "page" as the second arg. */
  PROMOTIONS: "/promotions",
  MANAGE_COLLABORATORS: "/(private)/(org)/manage-collaborators",

  // ── Private (organization) ───────────────────────────────────────────────
  /** Pass "page" as the second arg. */
  GENERAL_SETTINGS: "/(private)/(org)/general-settings",
  /** Pass "page" as the second arg. */
  BOT_SETTINGS: "/(private)/(site)/bot-settings",
  INBOX: "/(private)/(site)/inbox",
  ANALYTICS: "/(private)/(site)/analytics",
} as const;

/**
 * Dynamic path helpers — use these for paths that depend on runtime values.
 */
export const dynamicPath = {
  /** Public location page, e.g. /p/my-restaurant */
  publicLocation: (slug: string) => `/p/${slug}`,
  /** Public menu page, e.g. /m/location-id */
  publicMenu: (locationId: string) => `/m/${locationId}`,
} as const;
