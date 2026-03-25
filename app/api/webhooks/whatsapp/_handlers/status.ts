import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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
    await supabase
      .from("whatsapp_messages")
      .update({
        status: statusObj.status,
        error_message: statusObj.errors
          ? JSON.stringify(statusObj.errors)
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("meta_message_id", statusObj.id);
  }

  return new NextResponse("EVENT_RECEIVED", { status: 200 });
}
