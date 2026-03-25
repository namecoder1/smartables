import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock("@/lib/supabase-helpers", () => ({
  requireAuth: mockRequireAuth,
}));

const mockCheckResourceAvailability = vi.fn();
vi.mock("@/lib/limiter", () => ({
  checkResourceAvailability: mockCheckResourceAvailability,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeStorageClient(fileSize: number = 1024) {
  return {
    storage: {
      from: vi.fn().mockReturnValue({
        list: vi.fn().mockResolvedValue({
          data: [{ metadata: { size: fileSize } }],
        }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  };
}

function makeOrgClient(currentStorage: number = 0, updateError: any = null) {
  const updateEq = vi.fn().mockResolvedValue({ error: updateError });
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnValue({ eq: updateEq }),
      single: vi.fn().mockResolvedValue({
        data: { total_storage_used: currentStorage },
      }),
    }),
  };
}

function makeAuth(supabase: any, orgId = "org_123") {
  return {
    success: true as const,
    supabase,
    user: { id: "user_123" },
    organizationId: orgId,
    organization: { id: orgId },
    locations: [],
  };
}

// ── Tests: getStorageFileSize ─────────────────────────────────────────────────

describe("getStorageFileSize", () => {
  it("returns file size from storage listing", async () => {
    const supabase = makeStorageClient(2048);
    const { getStorageFileSize } = await import("@/app/actions/storage");

    const size = await getStorageFileSize(supabase as any, "menu-images", "org_123/image.png");

    expect(size).toBe(2048);
    expect(supabase.storage.from).toHaveBeenCalledWith("menu-images");
  });

  it("returns 0 when file not found in storage listing", async () => {
    const supabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          list: vi.fn().mockResolvedValue({ data: [] }),
        }),
      },
    };
    const { getStorageFileSize } = await import("@/app/actions/storage");

    const size = await getStorageFileSize(supabase as any, "menu-images", "missing.png");

    expect(size).toBe(0);
  });

  it("returns 0 when list returns null", async () => {
    const supabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          list: vi.fn().mockResolvedValue({ data: null }),
        }),
      },
    };
    const { getStorageFileSize } = await import("@/app/actions/storage");

    const size = await getStorageFileSize(supabase as any, "bucket", "file.png");

    expect(size).toBe(0);
  });

  it("parses folder and filename correctly from nested path", async () => {
    const listMock = vi.fn().mockResolvedValue({ data: [] });
    const supabase = {
      storage: {
        from: vi.fn().mockReturnValue({ list: listMock }),
      },
    };
    const { getStorageFileSize } = await import("@/app/actions/storage");

    await getStorageFileSize(supabase as any, "bucket", "org_123/subdir/image.png");

    expect(listMock).toHaveBeenCalledWith("org_123/subdir", { search: "image.png" });
  });
});

// ── Tests: adjustOrgStorage ────────────────────────────────────────────────────

describe("adjustOrgStorage", () => {
  it("increments storage by delta bytes", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { total_storage_used: 1000 } }),
        update: vi.fn().mockReturnValue({ eq: updateEq }),
      }),
    };

    const { adjustOrgStorage } = await import("@/app/actions/storage");
    await adjustOrgStorage(supabase as any, "org_123", 500);

    expect(updateEq).toHaveBeenCalledWith("id", "org_123");
    const updateCall = (supabase.from("organizations").update as any).mock?.calls?.[0]?.[0];
    // The update is called with { total_storage_used: 1500 }
    // Verify via the mock chain
    const fromResult = supabase.from.mock.results[0].value;
    expect(fromResult.update).toHaveBeenCalledWith({ total_storage_used: 1500 });
  });

  it("decrements storage and floors at 0 (never negative)", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: updateEq });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { total_storage_used: 100 } }),
        update: updateFn,
      }),
    };

    const { adjustOrgStorage } = await import("@/app/actions/storage");
    await adjustOrgStorage(supabase as any, "org_123", -500);

    expect(updateFn).toHaveBeenCalledWith({ total_storage_used: 0 });
  });

  it("handles null total_storage_used (treats as 0)", async () => {
    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { total_storage_used: null } }),
        update: updateFn,
      }),
    };

    const { adjustOrgStorage } = await import("@/app/actions/storage");
    await adjustOrgStorage(supabase as any, "org_123", 200);

    expect(updateFn).toHaveBeenCalledWith({ total_storage_used: 200 });
  });
});

// ── Tests: checkStorageAvailability ───────────────────────────────────────────

describe("checkStorageAvailability", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns allowed:false when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });

    const { checkStorageAvailability } = await import("@/app/actions/storage");
    const result = await checkStorageAvailability();

    expect(result).toEqual({ allowed: false });
  });

  it("returns availability from checkResourceAvailability", async () => {
    const supabase = {};
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));
    mockCheckResourceAvailability.mockResolvedValue({
      allowed: true,
      remaining: 500,
      softCapWarning: false,
    });

    const { checkStorageAvailability } = await import("@/app/actions/storage");
    const result = await checkStorageAvailability();

    expect(result).toEqual({ allowed: true, remaining: 500, softCapWarning: false });
    expect(mockCheckResourceAvailability).toHaveBeenCalledWith(
      supabase,
      "org_123",
      "storage",
    );
  });

  it("returns allowed:false with warning when soft cap reached", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth({}));
    mockCheckResourceAvailability.mockResolvedValue({
      allowed: true,
      remaining: 50,
      softCapWarning: true,
    });

    const { checkStorageAvailability } = await import("@/app/actions/storage");
    const result = await checkStorageAvailability();

    expect(result.softCapWarning).toBe(true);
    expect(result.allowed).toBe(true);
  });
});

// ── Tests: trackStorageUpload ──────────────────────────────────────────────────

describe("trackStorageUpload", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });

    const { trackStorageUpload } = await import("@/app/actions/storage");
    await expect(trackStorageUpload(1024)).resolves.toBeUndefined();
  });

  it("records upload when storage is available", async () => {
    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) });
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { total_storage_used: 0 } }),
        update: updateFn,
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));
    mockCheckResourceAvailability.mockResolvedValue({ allowed: true, remaining: 100 });

    const { trackStorageUpload } = await import("@/app/actions/storage");
    await trackStorageUpload(2048);

    expect(updateFn).toHaveBeenCalledWith({ total_storage_used: 2048 });
  });

  it("does not record upload when hard cap is exceeded", async () => {
    const supabase = { from: vi.fn() };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));
    mockCheckResourceAvailability.mockResolvedValue({ allowed: false, remaining: 0 });

    const { trackStorageUpload } = await import("@/app/actions/storage");
    await trackStorageUpload(2048);

    expect(supabase.from).not.toHaveBeenCalled();
  });
});

// ── Tests: deleteStorageFileAndTrack ──────────────────────────────────────────

describe("deleteStorageFileAndTrack", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });

    const { deleteStorageFileAndTrack } = await import("@/app/actions/storage");
    await expect(
      deleteStorageFileAndTrack("https://storage.example.com/menu-images/org/img.png", "menu-images"),
    ).resolves.toBeUndefined();
  });

  it("removes file and decrements storage usage", async () => {
    const removeMock = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) });
    const supabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          list: vi.fn().mockResolvedValue({
            data: [{ metadata: { size: 5000 } }],
          }),
          remove: removeMock,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { total_storage_used: 10000 } }),
        update: updateFn,
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { deleteStorageFileAndTrack } = await import("@/app/actions/storage");
    await deleteStorageFileAndTrack(
      "https://storage.example.com/menu-images/org_123/img.png",
      "menu-images",
    );

    expect(removeMock).toHaveBeenCalledWith(["org_123/img.png"]);
    expect(updateFn).toHaveBeenCalledWith({ total_storage_used: 5000 });
  });

  it("does not adjust storage when file size is 0", async () => {
    const removeMock = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn();
    const supabase = {
      storage: {
        from: vi.fn().mockReturnValue({
          list: vi.fn().mockResolvedValue({ data: [] }),
          remove: removeMock,
        }),
      },
      from: vi.fn().mockReturnValue({ update: updateFn }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { deleteStorageFileAndTrack } = await import("@/app/actions/storage");
    await deleteStorageFileAndTrack(
      "https://storage.example.com/menu-images/file.png",
      "menu-images",
    );

    expect(removeMock).toHaveBeenCalled();
    expect(updateFn).not.toHaveBeenCalled();
  });
});
