"use server";

import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/supabase-helpers";
import { revalidatePath } from "next/cache";
import { PATHS } from "@/lib/revalidation-paths";
import { ok, fail } from "@/lib/action-response";

// ── Callback Requests ──

export async function getCallbackRequests(locationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("callback_requests")
    .select("*")
    .eq("location_id", locationId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function markCallbackCompleted(requestId: string) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { error } = await supabase
    .from("callback_requests")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", requestId);

  if (error) return fail(error.message);
  revalidatePath(PATHS.WHATSAPP_MANAGEMENT);
  return ok();
}

export async function archiveCallback(requestId: string) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { error } = await supabase
    .from("callback_requests")
    .update({ status: "archived" })
    .eq("id", requestId);

  if (error) return fail(error.message);
  revalidatePath(PATHS.WHATSAPP_MANAGEMENT);
  return ok();
}

// ── Contact Attributes (Suppliers) ──

export async function getTaggedContacts(locationId: string, tag: string) {
  const supabase = await createClient();

  // Search both location-scoped tags and org-scoped tags
  const { data, error } = await supabase
    .from("customers")
    .select("id, phone_number, tags, org_tags")
    .eq("location_id", locationId)
    .or(`tags.cs.{"${tag}"},org_tags.cs.{"${tag}"}`);

  if (error) return [];
  return data || [];
}

export async function removeContactTag(
  customerId: string,
  tagToRemove: string,
) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
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
    if (error) return fail(error.message);
  }
  revalidatePath(PATHS.WHATSAPP_MANAGEMENT);
  return ok();
}

// ── Org-level Tags (shared across locations via bsuid) ──

export async function addOrgTag(customerId: string, tag: string) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { data: customer } = await supabase
    .from("customers")
    .select("bsuid, organization_id, org_tags")
    .eq("id", customerId)
    .single();

  if (!customer) return fail("Customer not found");

  if (customer.bsuid && customer.organization_id) {
    // Propagate to all records sharing the same identity
    const { data: siblings } = await supabase
      .from("customers")
      .select("id, org_tags")
      .eq("organization_id", customer.organization_id)
      .eq("bsuid", customer.bsuid);

    if (siblings) {
      for (const sibling of siblings) {
        const current: string[] = sibling.org_tags || [];
        if (!current.includes(tag)) {
          await supabase
            .from("customers")
            .update({ org_tags: [...current, tag] })
            .eq("id", sibling.id);
        }
      }
    }
  } else {
    const current: string[] = customer.org_tags || [];
    if (!current.includes(tag)) {
      const { error } = await supabase
        .from("customers")
        .update({ org_tags: [...current, tag] })
        .eq("id", customerId);
      if (error) return fail(error.message);
    }
  }

  revalidatePath(PATHS.WHATSAPP_MANAGEMENT);
  return ok();
}

export async function removeOrgTag(customerId: string, tagToRemove: string) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { data: customer } = await supabase
    .from("customers")
    .select("bsuid, organization_id, org_tags")
    .eq("id", customerId)
    .single();

  if (!customer) return fail("Customer not found");

  if (customer.bsuid && customer.organization_id) {
    // Propagate removal to all records sharing the same identity
    const { data: siblings } = await supabase
      .from("customers")
      .select("id, org_tags")
      .eq("organization_id", customer.organization_id)
      .eq("bsuid", customer.bsuid);

    if (siblings) {
      for (const sibling of siblings) {
        const newTags = (sibling.org_tags || []).filter(
          (t: string) => t !== tagToRemove,
        );
        await supabase
          .from("customers")
          .update({ org_tags: newTags })
          .eq("id", sibling.id);
      }
    }
  } else {
    const newTags = (customer.org_tags || []).filter(
      (t: string) => t !== tagToRemove,
    );
    const { error } = await supabase
      .from("customers")
      .update({ org_tags: newTags })
      .eq("id", customerId);
    if (error) return fail(error.message);
  }

  revalidatePath(PATHS.WHATSAPP_MANAGEMENT);
  return ok();
}

// ── Special Closures ──

export async function getSpecialClosures(locationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("special_closures")
    .select("*")
    .eq("location_id", locationId)
    .order("start_date", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function addSpecialClosure(
  locationId: string,
  startDate: string,
  endDate: string,
  reason: string,
) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { error } = await supabase.from("special_closures").insert({
    location_id: locationId,
    start_date: startDate,
    end_date: endDate,
    reason,
  });

  if (error) return fail(error.message);
  revalidatePath(PATHS.SITE_SETTINGS);
  return ok();
}

export async function removeSpecialClosure(closureId: string) {
  const auth = await requireAuth();
  if (!auth.success) return fail(auth.error);
  const { supabase } = auth;

  const { error } = await supabase
    .from("special_closures")
    .delete()
    .eq("id", closureId);

  if (error) return fail(error.message);
  revalidatePath(PATHS.SITE_SETTINGS);
  return ok();
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
