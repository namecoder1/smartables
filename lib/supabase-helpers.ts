/**
 * Supabase / auth helper utilities shared across server actions and RSC pages.
 *
 * - `requireAuth()` — per Server Actions: wrappa getAuthContext() con fallback tipato.
 * - `getUser()`     — per RSC pages / layouts: restituisce { supabase, user } senza
 *                     il boilerplate `createClient() + auth.getUser()`.
 *
 * @example — Server Action
 * const auth = await requireAuth();
 * if (!auth.success) return auth;
 * const { supabase, organizationId } = auth;
 *
 * @example — RSC Page / Layout
 * const { supabase, user } = await getUser();
 * if (!user) redirect('/login');
 */

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { getAuthContext } from "@/lib/auth";
import { fail } from "@/lib/action-response";

type AuthContext = Awaited<ReturnType<typeof getAuthContext>>;

export type AuthResult =
  | ({ success: true } & AuthContext)
  | { success: false; error: string };

export type GetUserResult = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User | null;
};

/**
 * Per RSC pages e layouts.
 *
 * Esegue `createClient()` + `auth.getUser()` in un'unica chiamata e restituisce
 * `{ supabase, user }`. Elimina il pattern ripetuto:
 *
 * ```ts
 * // Prima:
 * const supabase = await createClient()
 * const { data: user } = await supabase.auth.getUser()
 * if (!user || !user.user) redirect('/login')
 *
 * // Dopo:
 * const { supabase, user } = await getUser()
 * if (!user) redirect('/login')
 * ```
 */
export async function getUser(): Promise<GetUserResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Per Server Actions.
 *
 * Wrappa `getAuthContext()` in un try-catch e restituisce il contesto completo
 * (supabase, user, organizationId, locations, organization) su successo,
 * oppure `{ success: false, error: "Unauthorized" }` per un return diretto.
 */
export async function requireAuth(): Promise<AuthResult> {
  try {
    const ctx = await getAuthContext();
    return { success: true, ...ctx };
  } catch {
    return fail("Unauthorized");
  }
}
