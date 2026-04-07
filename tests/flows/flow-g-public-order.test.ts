/**
 * Flusso G — Ordine Pubblico da QR (createOrder)
 *
 * Testa la server action per la pagina ordine al tavolo /order/[slug]/[tableId].
 * Copre edge case non presenti in tests/actions/order-actions.test.ts.
 *
 * Scenari coperti:
 *  1. Validazione Zod fallita (campo mancante) → fail con messaggio Zod
 *  2. Rate limit superato → fail
 *  3. Ordine con active booking → booking_id collegato all'ordine
 *  4. Errore inserimento order_items → fail
 *  5. Array items vuoto → Zod lo blocca (min 1)
 *  6. Importo totale calcolato correttamente da più articoli
 *  7. Notifiche fire-and-forget chiamate su successo
 *  8. orderId UUID restituito su successo
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/utils/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("10.0.0.1"),
  }),
}));

vi.mock("@/lib/ratelimit", () => ({
  checkOrderRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("uuid", () => ({
  v4: () => "order-uuid-mock",
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
}));

vi.mock("@/lib/push-notifications", () => ({
  sendPushToOrganization: vi.fn(),
}));

import { createOrder } from "@/app/actions/order-actions";
import { createClient } from "@/utils/supabase/server";
import { checkOrderRateLimit } from "@/lib/ratelimit";
import { createNotification } from "@/lib/notifications";
import { sendPushToOrganization } from "@/lib/push-notifications";
import { makeChain } from "./helpers";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VALID_ORDER = {
  organization_id: "org-1",
  location_id: "loc-1",
  table_id: "table-1",
  guest_name: "Mario Rossi",
  items: [
    { menu_item_id: "item-1", name: "Pizza Margherita", price: 900, quantity: 2 },
    { menu_item_id: "item-2", name: "Acqua",            price: 200, quantity: 1 },
  ],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Flusso G — Ordine Pubblico (createOrder)", () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === "bookings") return makeChain({ data: null });   // no active booking
        if (table === "orders") return { insert: vi.fn().mockResolvedValue({ error: null }) };
        if (table === "order_items") return { insert: vi.fn().mockResolvedValue({ error: null }) };
        return makeChain({ data: null });
      }),
    };
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  // ── Validazione ───────────────────────────────────────────────────────────────

  it("fallisce quando organization_id è vuoto (Zod)", async () => {
    const result = await createOrder({ ...VALID_ORDER, organization_id: "" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeTruthy();
    expect(checkOrderRateLimit).not.toHaveBeenCalled();
  });

  it("fallisce quando location_id è vuoto (Zod)", async () => {
    const result = await createOrder({ ...VALID_ORDER, location_id: "" });

    expect(result.success).toBe(false);
  });

  it("fallisce quando items è un array vuoto (Zod: min 1)", async () => {
    const result = await createOrder({ ...VALID_ORDER, items: [] });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("almeno un articolo");
  });

  it("fallisce quando items supera 50 elementi (Zod: max 50)", async () => {
    const tooManyItems = Array.from({ length: 51 }, (_, i) => ({
      menu_item_id: `item-${i}`,
      name: `Piatto ${i}`,
      price: 100,
      quantity: 1,
    }));
    const result = await createOrder({ ...VALID_ORDER, items: tooManyItems });

    expect(result.success).toBe(false);
  });

  // ── Rate limit ────────────────────────────────────────────────────────────────

  it("fallisce quando il rate limit ordini è superato", async () => {
    (checkOrderRateLimit as any).mockResolvedValueOnce({ success: false });

    const result = await createOrder(VALID_ORDER);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Troppe richieste");
  });

  // ── DB errors ────────────────────────────────────────────────────────────────

  it("fallisce quando l'insert dell'ordine fallisce", async () => {
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "bookings") return makeChain({ data: null });
      if (table === "orders") return { insert: vi.fn().mockResolvedValue({ error: { message: "DB error" } }) };
      return makeChain({ data: null });
    });

    const result = await createOrder(VALID_ORDER);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("creare l'ordine");
  });

  it("fallisce quando l'insert degli order_items fallisce", async () => {
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "bookings") return makeChain({ data: null });
      if (table === "orders") return { insert: vi.fn().mockResolvedValue({ error: null }) };
      if (table === "order_items") return { insert: vi.fn().mockResolvedValue({ error: { message: "Items error" } }) };
      return makeChain({ data: null });
    });

    const result = await createOrder(VALID_ORDER);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("articoli");
  });

  // ── Successo senza booking ─────────────────────────────────────────────────────

  it("crea l'ordine e restituisce l'orderId su successo", async () => {
    const result = await createOrder(VALID_ORDER);

    expect(result.success).toBe(true);
    if (result.success) expect(result.orderId).toBe("order-uuid-mock");
  });

  it("calcola il totale correttamente (2x900 + 1x200 = 2000)", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "bookings") return makeChain({ data: null });
      if (table === "orders") return { insert: mockInsert };
      if (table === "order_items") return { insert: vi.fn().mockResolvedValue({ error: null }) };
      return makeChain({ data: null });
    });

    await createOrder(VALID_ORDER);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ total_amount: 2000 }),
    );
  });

  it("chiama createNotification e sendPushToOrganization dopo la creazione", async () => {
    await createOrder(VALID_ORDER);

    expect(createNotification).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "new_order", organizationId: "org-1" }),
    );
    expect(sendPushToOrganization).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({ title: "Nuovo ordine" }),
    );
  });

  // ── Successo con booking attivo ───────────────────────────────────────────────

  it("collega l'ordine al booking attivo quando trovato", async () => {
    const mockOrderInsert = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "bookings") {
        // Simulate active booking on this table
        return makeChain({ data: { id: "booking-active-1" } });
      }
      if (table === "orders") return { insert: mockOrderInsert };
      if (table === "order_items") return { insert: vi.fn().mockResolvedValue({ error: null }) };
      return makeChain({ data: null });
    });

    await createOrder(VALID_ORDER);

    expect(mockOrderInsert).toHaveBeenCalledWith(
      expect.objectContaining({ booking_id: "booking-active-1" }),
    );
  });

  it("usa booking_id null quando non c'è un booking attivo", async () => {
    const mockOrderInsert = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "bookings") return makeChain({ data: null });
      if (table === "orders") return { insert: mockOrderInsert };
      if (table === "order_items") return { insert: vi.fn().mockResolvedValue({ error: null }) };
      return makeChain({ data: null });
    });

    await createOrder(VALID_ORDER);

    expect(mockOrderInsert).toHaveBeenCalledWith(
      expect.objectContaining({ booking_id: null }),
    );
  });

  // ── Items: formato corretto ───────────────────────────────────────────────────

  it("inserisce gli order_items con il formato corretto", async () => {
    const mockItemsInsert = vi.fn().mockResolvedValue({ error: null });

    mockSupabase.from = vi.fn((table: string) => {
      if (table === "bookings") return makeChain({ data: null });
      if (table === "orders") return { insert: vi.fn().mockResolvedValue({ error: null }) };
      if (table === "order_items") return { insert: mockItemsInsert };
      return makeChain({ data: null });
    });

    await createOrder(VALID_ORDER);

    expect(mockItemsInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          order_id: "order-uuid-mock",
          menu_item_id: "item-1",
          name: "Pizza Margherita",
          price: 900,
          quantity: 2,
          status: "pending",
        }),
      ]),
    );
  });
});
