import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRequireAuth = vi.fn();
vi.mock("@/lib/supabase-helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockUpdateBusinessProfile = vi.fn().mockResolvedValue(undefined);
const mockUpdateProfilePicture = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/whatsapp", () => ({
  updateBusinessProfile: mockUpdateBusinessProfile,
  updateProfilePicture: mockUpdateProfilePicture,
}));

const mockAdjustOrgStorage = vi.fn().mockResolvedValue(undefined);
vi.mock("@/app/actions/storage", () => ({
  adjustOrgStorage: mockAdjustOrgStorage,
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

function makeFormData(data: Record<string, string | File>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) fd.append(k, v);
  return fd;
}

const LOCATION = {
  id: "loc_1",
  meta_phone_id: "phone_id_999",
  branding: {
    colors: { primary: "#000000", secondary: "#ffffff", accent: "#3b82f6" },
    logo_url: "https://cdn.example.com/old-logo.png",
    social_links: { instagram: "", facebook: "", tiktok: "" },
  },
};

function makeSupabaseWithStorage(
  location: any = LOCATION,
  uploadError: any = null,
  signedUrlData: any = { signedUrl: "https://signed.url/photo.jpg" },
) {
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: location, error: location ? null : { message: "not found" } }),
      update: vi.fn().mockReturnValue({ eq: updateEq }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: uploadError }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: signedUrlData }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://cdn.example.com/new-logo.jpg" },
        }),
      }),
    },
    _updateEq: updateEq,
  };
}

// ── updateWhatsappProfile ──────────────────────────────────────────────────────

describe("updateWhatsappProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns fail when not authenticated", async () => {
    mockRequireAuth.mockResolvedValue({ success: false, error: "Non autorizzato" });
    const { updateWhatsappProfile } = await import("@/app/actions/branding");
    const result = await updateWhatsappProfile(makeFormData({ locationId: "loc_1" }));
    expect(result.success).toBe(false);
  });

  it("returns fail when locationId is missing", async () => {
    mockRequireAuth.mockResolvedValue(makeAuth({}));
    const { updateWhatsappProfile } = await import("@/app/actions/branding");
    const result = await updateWhatsappProfile(makeFormData({})); // no locationId
    expect(result.success).toBe(false);
    expect(result.error).toContain("Location ID");
  });

  it("returns fail when location not found or not connected", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateWhatsappProfile } = await import("@/app/actions/branding");
    const result = await updateWhatsappProfile(makeFormData({ locationId: "loc_1" }));

    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });

  it("returns fail when location has no meta_phone_id", async () => {
    const locationNoPhone = { ...LOCATION, meta_phone_id: null };
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: locationNoPhone, error: null }),
      }),
    };
    mockRequireAuth.mockResolvedValue(makeAuth(supabase));

    const { updateWhatsappProfile } = await import("@/app/actions/branding");
    const result = await updateWhatsappProfile(makeFormData({ locationId: "loc_1" }));

    expect(result.success).toBe(false);
    expect(result.error).toContain("not connected");
  });

  it("updates text profile fields without image upload", async () => {
    const mock = makeSupabaseWithStorage();
    mockRequireAuth.mockResolvedValue(makeAuth(mock));

    const { updateWhatsappProfile } = await import("@/app/actions/branding");
    const result = await updateWhatsappProfile(
      makeFormData({
        locationId: "loc_1",
        description: "Un ristorante fantastico",
        about: "Cucina italiana tradizionale",
        email: "info@ristorante.it",
      }),
    );

    expect(result.success).toBe(true);
    expect(mockUpdateBusinessProfile).toHaveBeenCalledWith(
      "phone_id_999",
      expect.objectContaining({
        description: "Un ristorante fantastico",
        about: "Cucina italiana tradizionale",
        email: "info@ristorante.it",
      }),
    );
    expect(mockUpdateProfilePicture).not.toHaveBeenCalled();
  });

  it("skips updateBusinessProfile when no text fields provided", async () => {
    const mock = makeSupabaseWithStorage();
    mockRequireAuth.mockResolvedValue(makeAuth(mock));

    const { updateWhatsappProfile } = await import("@/app/actions/branding");
    const result = await updateWhatsappProfile(makeFormData({ locationId: "loc_1" }));

    expect(result.success).toBe(true);
    expect(mockUpdateBusinessProfile).not.toHaveBeenCalled();
  });

  it("uploads profile picture and calls updateProfilePicture", async () => {
    const mock = makeSupabaseWithStorage();
    mockRequireAuth.mockResolvedValue(makeAuth(mock));

    const imageFile = new File(["image data"], "logo.jpg", { type: "image/jpeg" });
    const fd = makeFormData({ locationId: "loc_1" });
    fd.append("profileImage", imageFile);

    const { updateWhatsappProfile } = await import("@/app/actions/branding");
    const result = await updateWhatsappProfile(fd);

    expect(result.success).toBe(true);
    expect(mock.storage.from).toHaveBeenCalledWith("compliance-docs");
    expect(mockUpdateProfilePicture).toHaveBeenCalledWith(
      "phone_id_999",
      "https://signed.url/photo.jpg",
    );
    expect(mockAdjustOrgStorage).toHaveBeenCalled();
  });

  it("returns fail when image upload fails", async () => {
    const mock = makeSupabaseWithStorage(LOCATION, { message: "upload failed" });
    mockRequireAuth.mockResolvedValue(makeAuth(mock));

    const imageFile = new File(["image data"], "logo.jpg", { type: "image/jpeg" });
    const fd = makeFormData({ locationId: "loc_1" });
    fd.append("profileImage", imageFile);

    const { updateWhatsappProfile } = await import("@/app/actions/branding");
    const result = await updateWhatsappProfile(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain("upload");
  });

  it("returns fail when signed URL generation fails", async () => {
    const mock = makeSupabaseWithStorage(LOCATION, null, null); // no signedUrl data
    mockRequireAuth.mockResolvedValue(makeAuth(mock));

    const imageFile = new File(["image data"], "logo.jpg", { type: "image/jpeg" });
    const fd = makeFormData({ locationId: "loc_1" });
    fd.append("profileImage", imageFile);

    const { updateWhatsappProfile } = await import("@/app/actions/branding");
    const result = await updateWhatsappProfile(fd);

    expect(result.success).toBe(false);
    expect(result.error).toContain("signed URL");
  });

  it("marks branding as completed and updates logo_url in DB", async () => {
    const mock = makeSupabaseWithStorage();
    mockRequireAuth.mockResolvedValue(makeAuth(mock));

    const imageFile = new File(["image data"], "logo.jpg", { type: "image/jpeg" });
    const fd = makeFormData({ locationId: "loc_1" });
    fd.append("profileImage", imageFile);

    const { updateWhatsappProfile } = await import("@/app/actions/branding");
    await updateWhatsappProfile(fd);

    expect(mock._updateEq).toHaveBeenCalledWith("id", "loc_1");
    const updateCall = mock.from().update.mock.calls[0][0];
    expect(updateCall.is_branding_completed).toBe(true);
    expect(updateCall.branding.logo_url).toBe("https://cdn.example.com/new-logo.jpg");
  });
});
