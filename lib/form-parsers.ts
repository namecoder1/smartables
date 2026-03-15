/**
 * Type-safe FormData extraction helpers.
 *
 * Replace raw `formData.get("key") as string` casts with these helpers to
 * get consistent coercion behaviour and avoid silent `null` → `"null"` bugs.
 *
 * @example
 * import { getStr, getInt, getBool, getFile, getJson } from "@/lib/form-parsers";
 *
 * const name    = getStr(formData, "name");
 * const guests  = getInt(formData, "guests");
 * const isKnown = getBool(formData, "isKnownCustomer");
 * const avatar  = getFile(formData, "profileImage");
 * const hours   = getJson(formData, "openingHours", {});
 */

/** Extracts a string value; returns `""` when the key is absent. */
export function getStr(formData: FormData, key: string): string {
  return (formData.get(key) as string) ?? "";
}

/**
 * Extracts a string value and trims it.
 * Returns `null` when the key is absent or the value is blank.
 */
export function getNullableStr(formData: FormData, key: string): string | null {
  const val = (formData.get(key) as string | null)?.trim();
  return val || null;
}

/**
 * Extracts an integer; returns `fallback` (default `0`) when absent or
 * when the value cannot be parsed.
 */
export function getInt(
  formData: FormData,
  key: string,
  fallback = 0,
): number {
  const val = formData.get(key);
  if (val === null) return fallback;
  const parsed = parseInt(val as string, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/** Extracts a boolean — `"true"` maps to `true`, anything else to `false`. */
export function getBool(formData: FormData, key: string): boolean {
  return formData.get(key) === "true";
}

/**
 * Extracts a `File` from FormData.
 * Returns `null` when the key is absent or the value is not a File instance.
 */
export function getFile(formData: FormData, key: string): File | null {
  const val = formData.get(key);
  return val instanceof File ? val : null;
}

/**
 * Parses a JSON-encoded string field from FormData.
 * Returns `fallback` when the key is absent or parsing fails.
 */
export function getJson<T>(
  formData: FormData,
  key: string,
  fallback: T,
): T {
  const raw = formData.get(key) as string | null;
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
