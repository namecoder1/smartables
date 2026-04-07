import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { captureWarning } from "@/lib/monitoring";

type StatusObject = {
  id: string;
  status: string;
  errors?: unknown;
};

export async function handleStatusUpdates(
  supabase: SupabaseClient,
  statuses: StatusObject[],
) {
  for (const statusObj of statuses) {
    const { error } = await supabase
      .from("whatsapp_messages")
      .update({
        status: statusObj.status,
        error_message: statusObj.errors
          ? JSON.stringify(statusObj.errors)
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("meta_message_id", statusObj.id);

    if (error) {
      captureWarning("Failed to update whatsapp_message status", { service: "supabase", flow: "message_status_sync", metaMessageId: statusObj.id, status: statusObj.status });
    }
  }

  return new NextResponse("EVENT_RECEIVED", { status: 200 });
}
