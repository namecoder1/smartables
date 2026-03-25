import { useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

/**
 * Valid event types for Supabase realtime subscriptions
 */
type EventType = "INSERT" | "UPDATE" | "DELETE" | "*";

interface RealtimeOptions {
  /**
   * Optional filter string (e.g., 'location_id=eq.123')
   */
  filter?: string;
  /**
   * Function to call when a change occurs.
   * If not provided, router.refresh() will be called.
   */
  onUpdate?: () => void;
  /**
   * Debounce time in milliseconds. Default: 1000
   */
  debounceMs?: number;
  /**
   * Which events to listen to. Default: '*' (all)
   */
  event?: EventType;
  /**
   * Schema to listen to. Default: 'public'
   */
  schema?: string;
  /**
   * Whether the subscription is enabled. Default: true
   */
  enabled?: boolean;
}

/**
 * Hook to subscribe to Supabase realtime changes for a specific table.
 *
 * @param tableName The table to listen to (e.g., 'bookings')
 * @param options Configuration options
 */
export function useRealtimeRefresh(
  tableName: string,
  {
    filter,
    onUpdate,
    debounceMs = 1000,
    event = "*",
    schema = "public",
    enabled = true,
  }: RealtimeOptions = {},
) {
  const router = useRouter();

  const handleUpdate = useCallback(() => {
    if (onUpdate) {
      onUpdate();
    } else {
      router.refresh();
    }
  }, [onUpdate, router]);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    let timeoutId: NodeJS.Timeout;
    let channel: ReturnType<typeof supabase.channel>;

    const setupSubscription = async () => {
      // Ensure we have a session before subscribing to ensure RLS works
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return;
      }

      channel = supabase
        .channel(`realtime_${tableName}_${filter || "all"}`)
        .on(
          "postgres_changes" as any,
          {
            event,
            schema,
            table: tableName,
            filter,
          },
          () => {
            // clear previous timeout to debounce multiple rapid changes
            if (timeoutId) clearTimeout(timeoutId);

            timeoutId = setTimeout(() => {
              handleUpdate();
            }, debounceMs);
          },
        )
        .subscribe((status) => {
          // Optional: Log status if needed for debugging
        });
    };

    setupSubscription();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (channel) supabase.removeChannel(channel);
    };
  }, [tableName, filter, event, schema, debounceMs, handleUpdate, enabled]);
}
