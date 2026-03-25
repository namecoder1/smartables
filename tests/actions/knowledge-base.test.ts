import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock("@/lib/supabase-helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockCheckResourceAvailability = vi.fn();
vi.mock("@/lib/limiter", () => ({ checkResourceAvailability: mockCheckResourceAvailability }));

let mockClientSupabase: any;
vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => mockClientSupabase),
}));

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

// ── getKnowledgeBase ───────────────────────────────────────────────────────────

describe("getKnowledgeBase", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns knowledge base entries for organization", async () => {
    const entries = [{ id: "kb_1", title: "Menu orari" }];
    mockClientSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: entries, error: null }),
      }),
    };

    const { getKnowledgeBase } = await import("@/app/(private)/(site)/bot-memory/actions");
    const result = await getKnowledgeBase("org_123");

    expect(result.success).toBe(true);
    expect(result.data).toEqual(entries);
  });

  it("returns fail on DB error", async () => {
    mockClientSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "err" } }),
      }),
    };

    const { getKnowledgeBase } = await import("@/app/(private)/(site)/bot-memory/actions");
    const result = await getKnowledgeBase("org_123");

    expect(result.success).toBe(false);
  });
});

// ── createKnowledgeBaseEntry ───────────────────────────────────────────────────

describe("createKnowledgeBaseEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckResourceAvailability.mockResolvedValue({ allowed: true, remaining: 5000 });
  });

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { createKnowledgeBaseEntry } = await import(
      "@/app/(private)/(site)/bot-memory/actions"
    );
    const result = await createKnowledgeBaseEntry("org_123", "loc_1", "Title", "Content");
    expect(result.success).toBe(false);
  });

  it("returns fail when KB char limit is reached", async () => {
    mockCheckResourceAvailability.mockResolvedValue({ allowed: false, remaining: 0 });
    const supabase = {};
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { createKnowledgeBaseEntry } = await import(
      "@/app/(private)/(site)/bot-memory/actions"
    );
    const result = await createKnowledgeBaseEntry(
      "org_123",
      "loc_1",
      "A very long title",
      "A very long content",
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Limite caratteri");
  });

  it("returns fail when new chars exceed remaining", async () => {
    mockCheckResourceAvailability.mockResolvedValue({ allowed: true, remaining: 5 });
    const supabase = {};
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { createKnowledgeBaseEntry } = await import(
      "@/app/(private)/(site)/bot-memory/actions"
    );
    // title (10) + content (50) = 60 chars > remaining 5
    const result = await createKnowledgeBaseEntry(
      "org_123",
      "loc_1",
      "Title here",
      "This is a somewhat longer content string that exceeds the limit",
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Limite caratteri");
  });

  it("creates entry and returns it", async () => {
    const entry = { id: "kb_1", title: "Menu orari", content: "8am-10pm" };
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: entry, error: null }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { createKnowledgeBaseEntry } = await import(
      "@/app/(private)/(site)/bot-memory/actions"
    );
    const result = await createKnowledgeBaseEntry("org_123", "loc_1", "Menu orari", "8am-10pm");

    expect(result.success).toBe(true);
    expect(result.data).toEqual(entry);
  });

  it("returns fail on DB insert error", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "constraint" } }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { createKnowledgeBaseEntry } = await import(
      "@/app/(private)/(site)/bot-memory/actions"
    );
    const result = await createKnowledgeBaseEntry("org_123", "loc_1", "Title", "Content");

    expect(result.success).toBe(false);
  });
});

// ── updateKnowledgeBaseEntry ───────────────────────────────────────────────────

describe("updateKnowledgeBaseEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckResourceAvailability.mockResolvedValue({ allowed: true, remaining: 5000 });
  });

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { updateKnowledgeBaseEntry } = await import(
      "@/app/(private)/(site)/bot-memory/actions"
    );
    const result = await updateKnowledgeBaseEntry("kb_1", "Title", "Content", true);
    expect(result.success).toBe(false);
  });

  it("skips limit check when content shrinks (delta <= 0)", async () => {
    const existingEntry = { title: "A very long title here", content: "A very long content here" };
    const updated = { id: "kb_1", title: "Short", content: "Tiny" };

    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({ data: existingEntry }) // existing fetch
          .mockResolvedValueOnce({ data: updated, error: null }), // update select single
        update: vi.fn().mockReturnThis(),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateKnowledgeBaseEntry } = await import(
      "@/app/(private)/(site)/bot-memory/actions"
    );
    const result = await updateKnowledgeBaseEntry("kb_1", "Short", "Tiny", true);

    expect(result.success).toBe(true);
    expect(mockCheckResourceAvailability).not.toHaveBeenCalled();
  });

  it("checks limit when content grows (delta > 0)", async () => {
    const existingEntry = { title: "Hi", content: "Lo" }; // 4 chars
    const updated = { id: "kb_1", title: "Longer title", content: "Much longer content" };

    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn()
          .mockResolvedValueOnce({ data: existingEntry })
          .mockResolvedValueOnce({ data: updated, error: null }),
        update: vi.fn().mockReturnThis(),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateKnowledgeBaseEntry } = await import(
      "@/app/(private)/(site)/bot-memory/actions"
    );
    const result = await updateKnowledgeBaseEntry(
      "kb_1",
      "Longer title",
      "Much longer content",
      true,
    );

    expect(result.success).toBe(true);
    expect(mockCheckResourceAvailability).toHaveBeenCalledWith(
      expect.anything(),
      "org_123",
      "kb_chars",
    );
  });

  it("returns fail when growth exceeds remaining chars", async () => {
    mockCheckResourceAvailability.mockResolvedValue({ allowed: true, remaining: 2 });
    const existingEntry = { title: "A", content: "B" }; // 2 chars

    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingEntry }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateKnowledgeBaseEntry } = await import(
      "@/app/(private)/(site)/bot-memory/actions"
    );
    // 100 new chars vs 2 remaining delta
    const result = await updateKnowledgeBaseEntry(
      "kb_1",
      "This is a much longer title now",
      "And this is a much longer content now that exceeds the limit",
      true,
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Limite caratteri");
  });
});

// ── toggleKnowledgeBaseStatus ──────────────────────────────────────────────────

describe("toggleKnowledgeBaseStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { toggleKnowledgeBaseStatus } = await import(
      "@/app/(private)/(site)/bot-memory/actions"
    );
    const result = await toggleKnowledgeBaseStatus("kb_1", false);
    expect(result.success).toBe(false);
  });

  it("toggles entry to inactive", async () => {
    const updateFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    const supabase = { from: vi.fn().mockReturnValue({ update: updateFn }) };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { toggleKnowledgeBaseStatus } = await import(
      "@/app/(private)/(site)/bot-memory/actions"
    );
    const result = await toggleKnowledgeBaseStatus("kb_1", false);

    expect(result.success).toBe(true);
    expect(updateFn).toHaveBeenCalledWith({ is_active: false });
  });

  it("returns fail on DB error", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "err" } }),
        }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { toggleKnowledgeBaseStatus } = await import(
      "@/app/(private)/(site)/bot-memory/actions"
    );
    const result = await toggleKnowledgeBaseStatus("kb_1", true);
    expect(result.success).toBe(false);
  });
});

// ── deleteKnowledgeBaseEntry ───────────────────────────────────────────────────

describe("deleteKnowledgeBaseEntry", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { deleteKnowledgeBaseEntry } = await import(
      "@/app/(private)/(site)/bot-memory/actions"
    );
    const result = await deleteKnowledgeBaseEntry("kb_1");
    expect(result.success).toBe(false);
  });

  it("deletes entry and returns ok", async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({ eq: deleteEq }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { deleteKnowledgeBaseEntry } = await import(
      "@/app/(private)/(site)/bot-memory/actions"
    );
    const result = await deleteKnowledgeBaseEntry("kb_1");

    expect(result.success).toBe(true);
    expect(deleteEq).toHaveBeenCalledWith("id", "kb_1");
  });

  it("returns fail on DB error", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "not found" } }),
        }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { deleteKnowledgeBaseEntry } = await import(
      "@/app/(private)/(site)/bot-memory/actions"
    );
    const result = await deleteKnowledgeBaseEntry("kb_1");
    expect(result.success).toBe(false);
  });
});
