"use server";

import { createClient } from "@/utils/supabase/server";
import {
  subMonths,
  format,
  subDays,
  startOfDay,
  endOfDay,
  parseISO,
} from "date-fns";

export async function getAnalyticsData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) return null;
  const organizationId = profile.organization_id;

  // 1. Booking Sources (All Time)
  const { data: sourcesData, error: sourcesError } = await supabase
    .from("bookings")
    .select("source")
    .eq("organization_id", organizationId);

  if (sourcesError) console.error("Error fetching sources:", sourcesError);

  const sources = sourcesData ? transformToSourceCounts(sourcesData) : [];

  // 2. Hottest Days & Hours (Based on booking_time for accuracy of "when ppl come")
  const { data: hottestData, error: hottestError } = await supabase
    .from("bookings")
    .select("booking_time")
    .eq("organization_id", organizationId)
    .eq("status", "arrived"); // Only count arrived or confirmed? Let's use all valid bookings for planning.
  // actually, let's use all bookings that are not cancelled or no_show for planning purposes?
  // User asked for "afflusso", "coperti medi". usually implies actual visits.
  // Let's filter by status valid for analytics: arrived, confirmed.
  // .in("status", ["confirmed", "arrived"])

  if (hottestError) console.error("Error fetching hottest data:", hottestError);

  const { hottestDays, hottestHours } = hottestData
    ? transformToHottest(hottestData)
    : { hottestDays: [], hottestHours: [] };

  // 3. Weekly Trends (Last 7 days creation trend - good for sales activity)
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);
  const { data: weeklyData, error: weeklyError } = await supabase
    .from("bookings")
    .select("created_at")
    .eq("organization_id", organizationId)
    .gte("created_at", sevenDaysAgo.toISOString());

  if (weeklyError) console.error("Error fetching weekly trends:", weeklyError);
  const weeklyTrends = weeklyData ? transformToWeeklyTrends(weeklyData) : [];

  // 4. Long Term Trends (Visits/Bookings trend over last 3 months)
  const threeMonthsAgo = subMonths(today, 3);
  const { data: longTermData, error: longTermError } = await supabase
    .from("bookings")
    .select("booking_time")
    .eq("organization_id", organizationId)
    .gte("booking_time", threeMonthsAgo.toISOString());
  // .neq('status', 'cancelled'); // Exclude cancelled

  if (longTermError)
    console.error("Error fetching long term trends:", longTermError);
  const longTermTrends = longTermData
    ? transformToLongTermTrends(longTermData)
    : [];

  // 5. Total Bookings (All time)
  const { count: totalBookings, error: totalError } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  // 6. Average Covers (Based on guests_count of arrived/confirmed bookings)
  const { data: coversData, error: coversError } = await supabase
    .from("bookings")
    .select("guests_count")
    .eq("organization_id", organizationId)
    .neq("status", "cancelled")
    .neq("status", "no_show");

  let averageCovers = 0;
  if (coversData && coversData.length > 0) {
    const totalGuests = coversData.reduce(
      (acc, curr) => acc + (curr.guests_count || 0),
      0,
    );
    averageCovers = Math.round((totalGuests / coversData.length) * 10) / 10;
  }

  return {
    sources,
    hottestDays,
    hottestHours,
    weeklyTrends,
    longTermTrends,
    totalBookings: totalBookings || 0,
    averageCovers,
  };
}

function transformToSourceCounts(data: any[]) {
  const counts = data.reduce(
    (acc: Record<string, number>, curr) => {
      const source = curr.source || "Sconosciuto";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(counts).map(([source, count]) => ({
    source: formatSourceName(source),
    value: count,
  }));
}

function formatSourceName(source: string) {
  const map: Record<string, string> = {
    whatsapp_auto: "WhatsApp Auto",
    manual: "Manuale",
    web: "Sito Web",
    phone: "Telefono",
  };
  return map[source] || source;
}

function transformToHottest(data: any[]) {
  const days = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
  const dayCounts = new Array(7).fill(0);
  const hourCounts = new Array(24).fill(0);

  data.forEach((booking) => {
    // using booking_time
    const date = new Date(booking.booking_time);
    dayCounts[date.getDay()]++;
    hourCounts[date.getHours()]++;
  });

  const hottestDays = days.map((day, index) => ({
    day,
    bookings: dayCounts[index],
  }));

  const hottestHours = hourCounts.map((count, hour) => ({
    hour: `${hour}:00`,
    bookings: count,
  }));

  // Filter out hours with 0 bookings to keep chart clean?
  // Maybe just keep range 10-24 usually restaurants aren't open at 3AM.
  // But let's keep it generic.

  return { hottestDays, hottestHours };
}

function transformToWeeklyTrends(data: any[]) {
  // Group by date (DD-MM)
  const trends: Record<string, number> = {};

  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    // Format as Short Day Name (e.g., Mon, Tue)
    const key = format(d, "EEE");
    trends[key] = 0;
  }

  data.forEach((booking) => {
    const date = new Date(booking.created_at);
    const key = format(date, "EEE");
    if (trends[key] !== undefined) {
      trends[key]++;
    }
  });

  return Object.entries(trends).map(([date, count]) => ({
    date,
    visitors: count,
  }));
}

function transformToLongTermTrends(data: any[]) {
  // Daily aggregation for the area chart
  const daily: Record<string, number> = {};

  // Sort data by date first to ensure order
  data.sort(
    (a, b) =>
      new Date(a.booking_time).getTime() - new Date(b.booking_time).getTime(),
  );

  data.forEach((booking) => {
    const date = new Date(booking.booking_time);
    const key = format(date, "MMM dd");
    daily[key] = (daily[key] || 0) + 1;
  });

  return Object.entries(daily).map(([date, count]) => ({
    date,
    visitors: count,
  }));
}
