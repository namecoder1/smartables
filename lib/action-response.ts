/**
 * Standard response type for all server actions.
 *
 * Use `ok()`, `okWith()`, and `fail()` factory functions to build consistent
 * responses across the entire codebase. Consumers check `result.success` to
 * narrow the type at the call site.
 *
 * @example
 * export async function deleteItem(id: string): Promise<ActionResult> {
 *   const { error } = await supabase.from("items").delete().eq("id", id);
 *   if (error) return fail("Failed to delete item");
 *   revalidatePath(PATHS.SETTINGS);
 *   return ok();
 * }
 */

export type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

/** Successful result — no data payload. */
export function ok(message?: string): { success: true; message?: string } {
  return message ? { success: true, message } : { success: true };
}

/** Successful result — with a typed data payload. */
export function okWith<T>(
  data: T,
  message?: string,
): { success: true; data: T; message?: string } {
  return message ? { success: true, data, message } : { success: true, data };
}

/** Failed result — carries the error message shown to the caller. */
export function fail(error: string): { success: false; error: string } {
  return { success: false, error };
}
