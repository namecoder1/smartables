import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock("@/lib/supabase-helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("uuid", () => ({ v4: vi.fn().mockReturnValue("test-uuid-1234") }));

const mockGetStorageFileSize = vi.fn().mockResolvedValue(0);
const mockAdjustOrgStorage = vi.fn().mockResolvedValue(undefined);
vi.mock("@/app/actions/storage", () => ({
  getStorageFileSize: mockGetStorageFileSize,
  adjustOrgStorage: mockAdjustOrgStorage,
}));

let mockClientSupabase: any;
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => mockClientSupabase),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAuth(supabase: any = {}) {
  return {
    success: true as const,
    supabase,
    user: { id: "user_123" },
    organizationId: "org_123",
    organization: { id: "org_123" },
    locations: [],
  };
}

/** Build a client mock where select().eq().single() returns content, update().eq() resolves ok */
function makeMenuClient(content: any[] = [], saveError: any = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { content }, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: saveError }),
      }),
      storage: undefined,
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  };
}

// ── createCategory ─────────────────────────────────────────────────────────────

describe("createCategory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Unauthorized" });
    const { createCategory } = await import("@/app/actions/menu-editor");
    const result = await createCategory("m1", "org_123", { name: "Antipasti" });
    expect(result.error).toBeDefined();
  });

  it("creates a new category and saves content", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    mockClientSupabase = makeMenuClient([]);

    const { createCategory } = await import("@/app/actions/menu-editor");
    const result = await createCategory("m1", "org_123", { name: "Antipasti", is_visible: true });

    expect(result.success).toBe(true);
    // saveMenuContent calls update({ content: [...] })
    expect(mockClientSupabase.from().update).toHaveBeenCalledWith({
      content: expect.arrayContaining([
        expect.objectContaining({ name: "Antipasti", id: "test-uuid-1234" }),
      ]),
    });
  });

  it("returns error when save fails", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    mockClientSupabase = makeMenuClient([], { message: "save failed" });

    const { createCategory } = await import("@/app/actions/menu-editor");
    const result = await createCategory("m1", "org_123", { name: "Antipasti" });

    expect(result.error).toBeDefined();
  });
});

// ── updateCategory ─────────────────────────────────────────────────────────────

describe("updateCategory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Unauthorized" });
    const { updateCategory } = await import("@/app/actions/menu-editor");
    const result = await updateCategory("cat_1", "m1", { name: "New Name" });
    expect(result.error).toBeDefined();
  });

  it("updates an existing category", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    const existingContent = [{ id: "cat_1", name: "Antipasti", items: [] }];
    mockClientSupabase = makeMenuClient(existingContent);

    const { updateCategory } = await import("@/app/actions/menu-editor");
    const result = await updateCategory("cat_1", "m1", { name: "Primi Piatti", is_visible: false });

    expect(result.success).toBe(true);
    expect(mockClientSupabase.from().update).toHaveBeenCalledWith({
      content: expect.arrayContaining([
        expect.objectContaining({ id: "cat_1", name: "Primi Piatti", is_visible: false }),
      ]),
    });
  });

  it("returns error when category not found", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    mockClientSupabase = makeMenuClient([]); // empty content, category not found

    const { updateCategory } = await import("@/app/actions/menu-editor");
    const result = await updateCategory("missing_cat", "m1", { name: "X" });

    expect(result.error).toBeDefined();
  });
});

// ── deleteCategory ─────────────────────────────────────────────────────────────

describe("deleteCategory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Unauthorized" });
    const { deleteCategory } = await import("@/app/actions/menu-editor");
    const result = await deleteCategory("m1", "cat_1");
    expect(result.error).toBeDefined();
  });

  it("deletes category with no items", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    const content = [
      { id: "cat_1", name: "Antipasti", items: [] },
      { id: "cat_2", name: "Secondi", items: [] },
    ];
    mockClientSupabase = makeMenuClient(content);

    const { deleteCategory } = await import("@/app/actions/menu-editor");
    const result = await deleteCategory("m1", "cat_1");

    expect(result.success).toBe(true);
    // Should save content without cat_1
    const savedArg = mockClientSupabase.from().update.mock.calls[0][0];
    const savedContent = savedArg.content;
    expect(savedContent.find((c: any) => c.id === "cat_1")).toBeUndefined();
    expect(savedContent.find((c: any) => c.id === "cat_2")).toBeDefined();
  });

  it("deletes images of items in the category before deleting", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth({ storage: { from: vi.fn() } }));
    const content = [
      {
        id: "cat_1",
        name: "Antipasti",
        items: [
          { id: "item_1", name: "Bruschetta", image_url: "https://cdn.example.com/menu-images/photo.jpg" },
        ],
      },
    ];
    mockClientSupabase = makeMenuClient(content);

    const { deleteCategory } = await import("@/app/actions/menu-editor");
    await deleteCategory("m1", "cat_1");

    expect(mockGetStorageFileSize).toHaveBeenCalled();
  });
});

// ── createMenuItem ─────────────────────────────────────────────────────────────

describe("createMenuItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Unauthorized" });
    const { createMenuItem } = await import("@/app/actions/menu-editor");
    const result = await createMenuItem("m1", "cat_1", { name: "Pizza", price: 10 });
    expect(result.error).toBeDefined();
  });

  it("creates item in the specified category", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    const content = [{ id: "cat_1", name: "Pizze", items: [] }];
    mockClientSupabase = makeMenuClient(content);

    const { createMenuItem } = await import("@/app/actions/menu-editor");
    const result = await createMenuItem("m1", "cat_1", {
      name: "Margherita",
      price: 9.5,
      allergens: ["gluten"],
    });

    expect(result.success).toBe(true);
    const savedContent = mockClientSupabase.from().update.mock.calls[0][0].content;
    expect(savedContent[0].items).toHaveLength(1);
    expect(savedContent[0].items[0]).toMatchObject({
      name: "Margherita",
      price: 9.5,
      id: "test-uuid-1234",
      allergens: ["gluten"],
    });
  });

  it("returns error when category not found", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    mockClientSupabase = makeMenuClient([]); // no categories

    const { createMenuItem } = await import("@/app/actions/menu-editor");
    const result = await createMenuItem("m1", "missing_cat", { name: "X", price: 5 });

    expect(result.error).toBeDefined();
  });
});

// ── updateMenuItem ─────────────────────────────────────────────────────────────

describe("updateMenuItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Unauthorized" });
    const { updateMenuItem } = await import("@/app/actions/menu-editor");
    const result = await updateMenuItem("m1", "item_1", { name: "New" });
    expect(result.error).toBeDefined();
  });

  it("updates item fields across categories", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    const content = [
      {
        id: "cat_1",
        name: "Pizze",
        items: [{ id: "item_1", name: "Margherita", price: 9.5, is_available: true }],
      },
    ];
    mockClientSupabase = makeMenuClient(content);

    const { updateMenuItem } = await import("@/app/actions/menu-editor");
    const result = await updateMenuItem("m1", "item_1", { price: 11, is_available: false });

    expect(result.success).toBe(true);
    const saved = mockClientSupabase.from().update.mock.calls[0][0].content;
    expect(saved[0].items[0]).toMatchObject({ price: 11, is_available: false });
  });

  it("returns error when item not found", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    mockClientSupabase = makeMenuClient([{ id: "cat_1", items: [] }]);

    const { updateMenuItem } = await import("@/app/actions/menu-editor");
    const result = await updateMenuItem("m1", "missing_item", { price: 5 });

    expect(result.error).toBeDefined();
  });
});

// ── deleteMenuItem ─────────────────────────────────────────────────────────────

describe("deleteMenuItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Unauthorized" });
    const { deleteMenuItem } = await import("@/app/actions/menu-editor");
    const result = await deleteMenuItem("m1", "item_1");
    expect(result.error).toBeDefined();
  });

  it("removes item from category", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth());
    const content = [
      {
        id: "cat_1",
        name: "Pizze",
        items: [
          { id: "item_1", name: "Margherita", price: 9.5 },
          { id: "item_2", name: "Diavola", price: 11 },
        ],
      },
    ];
    mockClientSupabase = makeMenuClient(content);

    const { deleteMenuItem } = await import("@/app/actions/menu-editor");
    const result = await deleteMenuItem("m1", "item_1");

    expect(result.success).toBe(true);
    const saved = mockClientSupabase.from().update.mock.calls[0][0].content;
    expect(saved[0].items).toHaveLength(1);
    expect(saved[0].items[0].id).toBe("item_2");
  });

  it("deletes item image from storage if present", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth({ storage: { from: vi.fn() } }));
    const content = [
      {
        id: "cat_1",
        items: [
          {
            id: "item_1",
            name: "Bruschetta",
            image_url: "https://cdn.example.com/menu-images/bruschetta.jpg",
          },
        ],
      },
    ];
    mockClientSupabase = makeMenuClient(content);

    const { deleteMenuItem } = await import("@/app/actions/menu-editor");
    await deleteMenuItem("m1", "item_1");

    expect(mockGetStorageFileSize).toHaveBeenCalled();
  });
});
