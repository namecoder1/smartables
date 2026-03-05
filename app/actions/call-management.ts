"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
  const supabase = await createClient();
  const { error } = await supabase
    .from("callback_requests")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", requestId);

  if (error) throw error;
  revalidatePath("/whatsapp-management");
}

export async function archiveCallback(requestId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("callback_requests")
    .update({ status: "archived" })
    .eq("id", requestId);

  if (error) throw error;
  revalidatePath("/whatsapp-management");
}

// ── Contact Attributes (Suppliers) ──

export async function getTaggedContacts(locationId: string, tag?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("contact_attributes")
    .select("*")
    .eq("location_id", locationId)
    .order("updated_at", { ascending: false });

  if (tag) query = query.eq("tag", tag);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function removeContactTag(attributeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_attributes")
    .delete()
    .eq("id", attributeId);

  if (error) throw error;
  revalidatePath("/whatsapp-management");
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
  const supabase = await createClient();
  const { error } = await supabase.from("special_closures").insert({
    location_id: locationId,
    start_date: startDate,
    end_date: endDate,
    reason,
  });

  if (error) throw error;
  revalidatePath("/site-settings");
}

export async function removeSpecialClosure(closureId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("special_closures")
    .delete()
    .eq("id", closureId);

  if (error) throw error;
  revalidatePath("/site-settings");
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
