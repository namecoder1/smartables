/**
 * Shared mock utilities for core flow tests.
 *
 * makeChain(result) — creates a chainable Supabase query builder that resolves
 * to `result` on terminal calls (.single() / .maybySingle()). Insert/update
 * return a thenable so they can be awaited directly *or* chained further
 * (e.g. .update({}).eq("id", …)).
 *
 * makeSupabase(tableMap) — returns a minimal Supabase client stub where each
 * table key maps to a pre-configured chain.
 */

import { vi } from "vitest";

type DbResult = { data?: any; error?: any };

/** An object that can be both awaited directly (thenable) and chained. */
function makeThenableChain(resolved: any = { data: null, error: null }) {
  const obj: any = {};
  ["select", "eq", "neq", "gt", "gte", "lte", "in", "limit", "order", "not"].forEach((m) => {
    obj[m] = vi.fn(() => obj);
  });
  obj.single = vi.fn().mockResolvedValue(resolved);
  obj.maybySingle = vi.fn().mockResolvedValue(resolved);
  // Thenable — allows `await supabase.from(t).update({}).eq("id", …)`
  obj.then = (onfulfilled: any, onrejected: any) =>
    Promise.resolve(resolved).then(onfulfilled, onrejected);
  return obj;
}

/**
 * Creates a chainable query builder.
 *
 * - All filter methods (select, eq, gte, …) return `obj` (chainable).
 * - `.single()` / `.maybySingle()` resolve with `result`.
 * - `.insert()` / `.update()` return a separate thenable chain.
 */
export function makeChain(result: DbResult = {}) {
  const resolved = { data: result.data ?? null, error: result.error ?? null };
  const obj: any = {};

  ["select", "eq", "neq", "gt", "gte", "lte", "in", "limit", "order", "not"].forEach((m) => {
    obj[m] = vi.fn(() => obj);
  });

  obj.single = vi.fn().mockResolvedValue(resolved);
  obj.maybySingle = vi.fn().mockResolvedValue(resolved);
  obj.maybeSingle = vi.fn().mockResolvedValue(resolved);

  obj.insert = vi.fn(() => makeThenableChain({ data: null, error: null }));
  obj.update = vi.fn(() => makeThenableChain({ data: null, error: null }));

  // Thenable: allows `await chain` directly (e.g. queries that end with .limit() without .single())
  obj.then = (onfulfilled: any, onrejected: any) =>
    Promise.resolve(resolved).then(onfulfilled, onrejected);

  return obj;
}

/**
 * Creates a minimal Supabase client stub.
 * Tables not in `tableMap` return an empty chain.
 */
export function makeSupabase(tableMap: Record<string, ReturnType<typeof makeChain>> = {}) {
  return {
    from: vi.fn((table: string) => tableMap[table] ?? makeChain()),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}
