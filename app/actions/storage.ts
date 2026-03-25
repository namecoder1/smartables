"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/supabase-helpers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { checkResourceAvailability } from "@/lib/limiter";

// --- Internal helpers ---

export async function getStorageFileSize(
  supabase: SupabaseClient,
  bucket: string,
  filePath: string,
): Promise<number> {
  const lastSlash = filePath.lastIndexOf("/");
  const folder = lastSlash >= 0 ? filePath.substring(0, lastSlash) : "";
  const filename =
    lastSlash >= 0 ? filePath.substring(lastSlash + 1) : filePath;

  const { data } = await supabase.storage
    .from(bucket)
    .list(folder, { search: filename });

  return (data?.[0]?.metadata?.size as number) ?? 0;
}

export async function adjustOrgStorage(
  supabase: SupabaseClient,
  orgId: string,
  deltaBytes: number,
) {
  const { data: org } = await supabase
    .from("organizations")
    .select("total_storage_used")
    .eq("id", orgId)
    .single();

  const current = (org?.total_storage_used as number) ?? 0;
  const newValue = Math.max(0, current + deltaBytes);

  await supabase
    .from("organizations")
    .update({ total_storage_used: newValue })
    .eq("id", orgId);
}

// --- Server actions callable from client components ---

/**
 * Returns whether the organization can upload more files.
 * Call this before initiating a client-side upload.
 */
export async function checkStorageAvailability() {
  const auth = await requireAuth();
  if (!auth.success) return { allowed: false };
  const { supabase, organizationId } = auth;
  const avail = await checkResourceAvailability(supabase, organizationId, "storage");
  return { allowed: avail.allowed, remaining: avail.remaining, softCapWarning: avail.softCapWarning };
}

/**
 * Call this after a successful client-side storage upload to record the
 * file size in organizations.total_storage_used.
 */
export async function trackStorageUpload(bytes: number) {
  const auth = await requireAuth();
  if (!auth.success) return;
  const { supabase, organizationId } = auth;
  // Guard: don't track if the hard cap is already exceeded
  const avail = await checkResourceAvailability(supabase, organizationId, "storage");
  if (!avail.allowed) return;
  await adjustOrgStorage(supabase, organizationId, bytes);
}

/**
 * Deletes a file from storage (by its public URL) and decrements
 * organizations.total_storage_used by the exact file size.
 * Use this from client components instead of calling supabase.storage.remove() directly.
 */
export async function deleteStorageFileAndTrack(
  publicUrl: string,
  bucketName: string,
) {
  const auth = await requireAuth();
  if (!auth.success) return;
  const { supabase, organizationId } = auth;

  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split(`${bucketName}/`);
    if (pathParts.length > 1) {
      const filePath = decodeURIComponent(pathParts[1]);
      const fileSize = await getStorageFileSize(supabase, bucketName, filePath);
      await supabase.storage.from(bucketName).remove([filePath]);
      if (fileSize > 0) {
        await adjustOrgStorage(supabase, organizationId, -fileSize);
      }
    }
  } catch (e) {
    console.error(`Failed to delete file from ${bucketName}:`, e);
  }
}
