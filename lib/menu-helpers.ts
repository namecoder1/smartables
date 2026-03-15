/**
 * Menu utility helpers.
 *
 * `isMenuActive` eliminates the repeated date-range filtering logic that
 * appeared in 4+ places inside order-actions.ts (and on public menu pages).
 *
 * @example
 * const now = new Date();
 * const activeMenus = linkedMenus
 *   .map((item) => item.menus)
 *   .filter((m) => isMenuActive(m, now));
 */

interface MenuDateRange {
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}

interface MenuLocationAvailability {
  daily_from?: string | null;
  daily_until?: string | null;
}

/**
 * Returns `true` when a menu should be shown to the user.
 *
 * A menu is considered active when:
 *   1. `is_active` is not explicitly `false`, AND
 *   2. The current time falls within `[starts_at, ends_at]` (open-ended
 *      bounds are treated as "no limit in that direction").
 *
 * @param menu  — any object with `is_active`, `starts_at`, `ends_at`
 * @param now   — optional reference time (defaults to `new Date()`)
 */
export function isMenuActive(
  menu: MenuDateRange | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!menu || menu.is_active === false) return false;

  if (menu.starts_at && menu.ends_at) {
    const start = new Date(menu.starts_at);
    const end = new Date(menu.ends_at);
    if (now < start || now > end) return false;
  } else if (menu.starts_at) {
    if (now < new Date(menu.starts_at)) return false;
  } else if (menu.ends_at) {
    if (now > new Date(menu.ends_at)) return false;
  }

  return true;
}

/**
 * Returns `true` when a menu is currently available at the given time,
 * taking into account both the menu's global date range AND the
 * location-specific daily time window (`daily_from` / `daily_until`).
 *
 * @param menu          — menu with `is_active`, `starts_at`, `ends_at`
 * @param menuLocation  — optional `{ daily_from, daily_until }` from `menu_locations`
 * @param now           — optional reference time (defaults to `new Date()`)
 */
export function isMenuAvailableAtTime(
  menu: MenuDateRange | null | undefined,
  menuLocation: MenuLocationAvailability | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!isMenuActive(menu, now)) return false;

  if (menuLocation?.daily_from && menuLocation?.daily_until) {
    const [fromH, fromM] = menuLocation.daily_from.split(':').map(Number);
    const [untilH, untilM] = menuLocation.daily_until.split(':').map(Number);
    const fromMinutes = fromH * 60 + fromM;
    const untilMinutes = untilH * 60 + untilM;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (nowMinutes < fromMinutes || nowMinutes > untilMinutes) return false;
  }

  return true;
}

/**
 * Filters an array of menus to only those currently active.
 * Convenience wrapper around `isMenuActive` for map+filter chains.
 */
export function filterActiveMenus<T extends MenuDateRange>(
  menus: (T | null | undefined)[],
  now: Date = new Date(),
): T[] {
  return menus.filter((m): m is T => isMenuActive(m, now));
}

/**
 * Returns `true` when a zone is currently blocked for reservations.
 */
export function isZoneBlocked(
  zone: { blocked_from?: string | null; blocked_until?: string | null } | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!zone?.blocked_from || !zone?.blocked_until) return false;
  const from = new Date(zone.blocked_from);
  const until = new Date(zone.blocked_until);
  return now >= from && now <= until;
}
