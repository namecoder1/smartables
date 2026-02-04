"use server";

import { createClient } from "@/supabase/server";
import { startOfWeek, endOfWeek, subMonths, format, subDays } from "date-fns";

export async function getAnalyticsData() {
  const supabase = await createClient();

  // 1. Booking Sources
  const { data: sourcesData, error: sourcesError } = await supabase
    .from("bookings")
    .select("source");

  if (sourcesError) console.error("Error fetching sources:", sourcesError);

  const sources = sourcesData ? transformToSourceCounts(sourcesData) : [];

  // 2. Hottest Days & Hours (Based on created_at)
  const { data: hottestData, error: hottestError } = await supabase
    .from("bookings")
    .select("created_at");

  if (hottestError) console.error("Error fetching hottest data:", hottestError);

  const { hottestDays, hottestHours } = hottestData
    ? transformToHottest(hottestData)
    : { hottestDays: [], hottestHours: [] };

  // 3. Weekly Trends
  // Showing bookings created in the last 7 days
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);
  const { data: weeklyData, error: weeklyError } = await supabase
    .from("bookings")
    .select("created_at")
    .gte("created_at", sevenDaysAgo.toISOString());

  if (weeklyError) console.error("Error fetching weekly trends:", weeklyError);
  const weeklyTrends = weeklyData ? transformToWeeklyTrends(weeklyData) : [];

  // 4. 3 Month Average/Trend
  const threeMonthsAgo = subMonths(today, 3);
  const { data: longTermData, error: longTermError } = await supabase
    .from("bookings")
    .select("created_at")
    .gte("created_at", threeMonthsAgo.toISOString());

  if (longTermError)
    console.error("Error fetching long term trends:", longTermError);
  const longTermTrends = longTermData
    ? transformToLongTermTrends(longTermData)
    : [];

  return {
    sources,
    hottestDays,
    hottestHours,
    weeklyTrends,
    longTermTrends,
  };
}

function transformToSourceCounts(data: any[]) {
  const counts = data.reduce(
    (acc: Record<string, number>, curr) => {
      acc[curr.source] = (acc[curr.source] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(counts).map(([source, count]) => ({
    source,
    value: count,
  }));
}

function transformToHottest(data: any[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayCounts = new Array(7).fill(0);
  const hourCounts = new Array(24).fill(0);

  data.forEach((booking) => {
    const date = new Date(booking.created_at);
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
  // Group by month
  // const trends = {}

  // Initialize last 3 months
  // Ideally we want week granularity or month granularity. User said "Average bookings in 3 months".
  // Let's do weekly granularity over the last 3 months.

  // Actually simplicity first: Monthly counts? Or maybe just days for the "Area Chart" which usually shows a trend.
  // Let's do daily aggregation for the area chart over 3 months might be too much points.
  // Let's do Weekly aggregation.

  const weeks: Record<string, number> = {};

  data.forEach((booking) => {
    const date = new Date(booking.created_at);
    const key = format(date, "wo"); // iso week number
    weeks[key] = (weeks[key] || 0) + 1;
  });

  // This needs to be better formatted for the chart (date on X axis).
  // Let's just do daily for now, it's fine for AreaChart.
  const daily: Record<string, number> = {};
  data.forEach((booking) => {
    const date = new Date(booking.created_at);
    const key = format(date, "MMM dd");
    daily[key] = (daily[key] || 0) + 1;
  });

  return Object.entries(daily).map(([date, count]) => ({
    date,
    visitors: count,
  }));
}
