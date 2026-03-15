"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/supabase-helpers";
import { revalidatePath } from "next/cache";
import { PATHS } from "@/lib/revalidation-paths";

// ── Callback Requests ──

export async function getCallbackRequests(locationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("callback_requests")
    .select("*")
    .eq("location_id", locationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function markCallbackCompleted(requestId: string) {
  const auth = await requireAuth();
  if (!auth.success) throw new Error("Unauthorized");
  const { supabase } = auth;

  const { error } = await supabase
    .from("callback_requests")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", requestId);

  if (error) throw error;
  revalidatePath(PATHS.WHATSAPP_MANAGEMENT);
}

export async function archiveCallback(requestId: string) {
  const auth = await requireAuth();
  if (!auth.success) throw new Error("Unauthorized");
  const { supabase } = auth;

  const { error } = await supabase
    .from("callback_requests")
    .update({ status: "archived" })
    .eq("id", requestId);

  if (error) throw error;
  revalidatePath(PATHS.WHATSAPP_MANAGEMENT);
}

// ── Contact Attributes (Suppliers) ──

export async function getTaggedContacts(locationId: string, tag: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, phone_number, tags")
    .eq("location_id", locationId)
    .contains("tags", [tag]);

  if (error) throw error;
  return data || [];
}

export async function removeContactTag(
  customerId: string,
  tagToRemove: string,
) {
  const auth = await requireAuth();
  if (!auth.success) throw new Error("Unauthorized");
  const { supabase } = auth;

  const { data: customer } = await supabase
    .from("customers")
    .select("tags")
    .eq("id", customerId)
    .single();

  if (customer) {
    const newTags = (customer.tags || []).filter(
      (t: string) => t !== tagToRemove,
    );
    const { error } = await supabase
      .from("customers")
      .update({ tags: newTags })
      .eq("id", customerId);
    if (error) throw error;
  }
  revalidatePath(PATHS.WHATSAPP_MANAGEMENT);
}

// ── Special Closures ──

export async function getSpecialClosures(locationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("special_closures")
    .select("*")
    .eq("location_id", locationId)
    .order("start_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addSpecialClosure(
  locationId: string,
  startDate: string,
  endDate: string,
  reason: string,
) {
  const auth = await requireAuth();
  if (!auth.success) throw new Error("Unauthorized");
  const { supabase } = auth;

  const { error } = await supabase.from("special_closures").insert({
    location_id: locationId,
    start_date: startDate,
    end_date: endDate,
    reason,
  });

  if (error) throw error;
  revalidatePath(PATHS.SITE_SETTINGS);
}

export async function removeSpecialClosure(closureId: string) {
  const auth = await requireAuth();
  if (!auth.success) throw new Error("Unauthorized");
  const { supabase } = auth;

  const { error } = await supabase
    .from("special_closures")
    .delete()
    .eq("id", closureId);

  if (error) throw error;
  revalidatePath(PATHS.SITE_SETTINGS);
}

// ── Notification Counts (for navbar bell) ──

export async function getNotificationCounts(locationId: string) {
  const supabase = await createClient();

  const { count: pendingCallbacks } = await supabase
    .from("callback_requests")
    .select("id", { count: "exact", head: true })
    .eq("location_id", locationId)
    .eq("status", "pending");

  return {
    pendingCallbacks: pendingCallbacks || 0,
  };
}
