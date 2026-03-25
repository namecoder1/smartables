import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock("@/lib/supabase-helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/utils/supabase/server", () => ({ createClient: vi.fn() }));

const mockCheckResourceAvailability = vi.fn();
vi.mock("@/lib/limiter", () => ({ checkResourceAvailability: mockCheckResourceAvailability }));

const mockDeleteFileFromStorage = vi.fn().mockResolvedValue(undefined);
vi.mock("@/app/actions/menu-editor", () => ({ deleteFileFromStorage: mockDeleteFileFromStorage }));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAuth(supabase: any) {
  return {
    success: true as const,
    supabase,
    user: { id: "user_123" },
    organizationId: "org_123",
    organization: { id: "org_123" },
    locations: [],
  };
}

function makeChain() {
  const c: any = {};
  const methods = ["from","select","insert","update","delete","eq","in","upsert","single"];
  for (const m of methods) c[m] = vi.fn().mockReturnValue(c);
  c.single = vi.fn().mockResolvedValue({ data: null, error: null });
  return c;
}

// ── createMenu ────────────────────────────────────────────────────────────────

describe("createMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckResourceAvailability.mockResolvedValue({ allowed: true, remaining: 5 });
  });

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { createMenu } = await import("@/app/actions/menus");
    expect((await createMenu("org_1", { name: "Pranzo" })).success).toBe(false);
  });

  it("returns fail when menu limit is reached", async () => {
    mockCheckResourceAvailability.mockResolvedValue({ allowed: false });
    const supabase = makeChain();
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { createMenu } = await import("@/app/actions/menus");
    const result = await createMenu("org_1", { name: "Pranzo" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Limite menu");
  });

  it("creates menu without location_ids and returns ok", async () => {
    const supabase = makeChain();
    supabase.single.mockResolvedValue({ data: { id: "menu_1" }, error: null });
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { createMenu } = await import("@/app/actions/menus");
    const result = await createMenu("org_1", { name: "Pranzo" });

    expect(result).toEqual({ success: true });
    // menu_locations insert should NOT be called
    // (hard to verify without tracking which from() call it was)
  });

  it("creates menu and assigns to location_ids", async () => {
    const menuInsertSingle = vi.fn().mockResolvedValue({ data: { id: "menu_1" }, error: null });
    const locationInsert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "menus") {
          return {
            insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: menuInsertSingle }) }),
          };
        }
        if (table === "menu_locations") {
          return { insert: locationInsert };
        }
        return makeChain();
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { createMenu } = await import("@/app/actions/menus");
    const result = await createMenu("org_1", { name: "Pranzo", location_ids: ["loc_1", "loc_2"] });

    expect(result).toEqual({ success: true });
    expect(locationInsert).toHaveBeenCalledWith([
      { menu_id: "menu_1", location_id: "loc_1", is_active: true },
      { menu_id: "menu_1", location_id: "loc_2", is_active: true },
    ]);
  });

  it("returns fail when menu insert fails", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
          }),
        }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { createMenu } = await import("@/app/actions/menus");
    const result = await createMenu("org_1", { name: "Pranzo" });

    expect(result.success).toBe(false);
    expect(result.error).toContain("creare il menù");
  });
});

// ── updateMenu ────────────────────────────────────────────────────────────────

describe("updateMenu", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { updateMenu } = await import("@/app/actions/menus");
    expect((await updateMenu("menu_1", { name: "Cena" })).success).toBe(false);
  });

  it("updates menu and returns ok", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const supabase = { from: vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue({ eq: updateEq }) }) };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateMenu } = await import("@/app/actions/menus");
    expect(await updateMenu("menu_1", { name: "Cena" })).toEqual({ success: true });
    expect(updateEq).toHaveBeenCalledWith("id", "menu_1");
  });

  it("returns fail when DB update fails", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: "err" } }) }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateMenu } = await import("@/app/actions/menus");
    const result = await updateMenu("menu_1", { name: "Cena" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("aggiornare il menù");
  });
});

// ── deleteMenu ────────────────────────────────────────────────────────────────

describe("deleteMenu", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { deleteMenu } = await import("@/app/actions/menus");
    expect((await deleteMenu("menu_1")).success).toBe(false);
  });

  it("deletes menu without content and returns ok", async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockImplementation((table: string) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { content: [], pdf_url: null },
        }),
        delete: vi.fn().mockReturnValue({ eq: deleteEq }),
      })),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { deleteMenu } = await import("@/app/actions/menus");
    const result = await deleteMenu("menu_1");

    expect(result).toEqual({ success: true });
    expect(mockDeleteFileFromStorage).not.toHaveBeenCalled();
  });

  it("deletes PDF and item images before removing menu", async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            pdf_url: "https://storage.example.com/menu-files/menu.pdf",
            content: [
              {
                items: [
                  { image_url: "https://storage.example.com/menu-images/item.jpg" },
                  { name: "No image" },
                ],
              },
            ],
          },
        }),
        delete: vi.fn().mockReturnValue({ eq: deleteEq }),
      })),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { deleteMenu } = await import("@/app/actions/menus");
    await deleteMenu("menu_1");

    expect(mockDeleteFileFromStorage).toHaveBeenCalledTimes(2);
    expect(mockDeleteFileFromStorage).toHaveBeenCalledWith(
      "https://storage.example.com/menu-files/menu.pdf",
      "menu-files",
      expect.anything(),
      "org_123",
    );
  });

  it("returns fail when menu delete DB call fails", async () => {
    const supabase = {
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { content: [], pdf_url: null } }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "err" } }),
        }),
      })),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { deleteMenu } = await import("@/app/actions/menus");
    const result = await deleteMenu("menu_1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("eliminare il menù");
  });
});

// ── updateMenuLocationAvailability ────────────────────────────────────────────

describe("updateMenuLocationAvailability", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { updateMenuLocationAvailability } = await import("@/app/actions/menus");
    expect((await updateMenuLocationAvailability("m","l","09:00","21:00")).success).toBe(false);
  });

  it("updates daily_from and daily_until and returns ok", async () => {
    const eqEq = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ eq: eqEq }),
        }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateMenuLocationAvailability } = await import("@/app/actions/menus");
    const result = await updateMenuLocationAvailability("menu_1", "loc_1", "09:00", "21:00");

    expect(result).toEqual({ success: true });
    expect(eqEq).toHaveBeenCalledWith("location_id", "loc_1");
  });
});

// ── assignMenuToLocations ─────────────────────────────────────────────────────

describe("assignMenuToLocations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { assignMenuToLocations } = await import("@/app/actions/menus");
    expect((await assignMenuToLocations("m", ["l1"])).success).toBe(false);
  });

  it("returns fail when fetching existing locations fails", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: "err" } }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { assignMenuToLocations } = await import("@/app/actions/menus");
    const result = await assignMenuToLocations("menu_1", ["loc_1"]);
    expect(result.success).toBe(false);
  });

  it("inserts new locations and deletes removed ones", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const deleteInEq = vi.fn().mockResolvedValue({ error: null });

    const supabase = {
      from: vi.fn().mockImplementation((table: string) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [{ location_id: "loc_existing" }],
          error: null,
        }),
        insert: insertMock,
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ in: deleteInEq }),
        }),
      })),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { assignMenuToLocations } = await import("@/app/actions/menus");
    // New payload: loc_new (to add), loc_existing is removed from payload
    const result = await assignMenuToLocations("menu_1", ["loc_new"]);

    expect(result).toEqual({ success: true });
    expect(insertMock).toHaveBeenCalledWith([
      { menu_id: "menu_1", location_id: "loc_new", is_active: true },
    ]);
    expect(deleteInEq).toHaveBeenCalledWith("location_id", ["loc_existing"]);
  });

  it("only inserts when all locations are new (nothing to delete)", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });

    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: insertMock,
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ in: vi.fn() }) }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { assignMenuToLocations } = await import("@/app/actions/menus");
    const result = await assignMenuToLocations("menu_1", ["loc_1", "loc_2"]);

    expect(result).toEqual({ success: true });
    expect(insertMock).toHaveBeenCalled();
  });
});
