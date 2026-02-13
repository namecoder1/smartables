"use client";

import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";

export default function AnalyticsLiveUpdater() {
  // Listen for changes in bookings and customers to refresh analytics
  useRealtimeRefresh("bookings");
  useRealtimeRefresh("customers");

  return null;
}
