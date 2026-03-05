import { createClient } from "@supabase/supabase-js";
import {
  addMinutes,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parse,
  parseISO,
} from "date-fns";

// We need a service role client to bypass RLS in the webhook
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Generate the next N days of dates (skipping past dates)
export async function getAvailableDates(locationId: string, daysAhead = 14) {
  const supabase = getSupabaseAdmin();

  // 1. Get Location Opening Hours & Settings
  const { data: location } = await supabase
    .from("locations")
    .select("opening_hours")
    .eq("id", locationId)
    .single();

  if (!location || !location.opening_hours) {
    return [];
  }

  // 2. Get active special closures
  const { data: closures } = await supabase
    .from("special_closures")
    .select("start_date, end_date")
    .eq("location_id", locationId);

  const availableDates: { id: string; title: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysAhead; i++) {
    const candidateDate = new Date(today);
    candidateDate.setDate(today.getDate() + i);

    const dayMap = [
      "domenica",
      "lunedì",
      "martedì",
      "mercoledì",
      "giovedì",
      "venerdì",
      "sabato",
    ];
    const dayString = dayMap[candidateDate.getDay()];

    // Check if the restaurant is normally open on this day of the week
    const hoursForDay = location.opening_hours[dayString];
    if (!hoursForDay || hoursForDay.length === 0) continue;

    // Check special closures
    let isClosed = false;
    if (closures) {
      for (const closure of closures) {
        const start = parseISO(closure.start_date);
        const end = parseISO(closure.end_date);
        if (candidateDate >= start && candidateDate <= end) {
          isClosed = true;
          break;
        }
      }
    }

    if (!isClosed) {
      const isoDate = format(candidateDate, "yyyy-MM-dd");
      const title = candidateDate.toLocaleDateString("it-IT", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
      availableDates.push({
        id: isoDate,
        title: title.charAt(0).toUpperCase() + title.slice(1),
      });
    }
  }

  return availableDates;
}

export async function getAvailableTimes(
  locationId: string,
  dateIsoStr: string, // YYYY-MM-DD
  zoneId: string,
  guestsCount: number,
) {
  const supabase = getSupabaseAdmin();

  // 1. Fetch location rules (duration & seats)
  const { data: location } = await supabase
    .from("locations")
    .select("opening_hours, standard_reservation_duration")
    .eq("id", locationId)
    .single();

  if (!location) return [];

  const targetDate = new Date(dateIsoStr);
  const dayMap = [
    "domenica",
    "lunedì",
    "martedì",
    "mercoledì",
    "giovedì",
    "venerdì",
    "sabato",
  ];
  const dayString = dayMap[targetDate.getDay()];
  const timeSlots = location.opening_hours[dayString];

  if (!timeSlots || timeSlots.length === 0) return [];

  // Default to 120 minutes if not set
  const durationMinutes = location.standard_reservation_duration || 120;

  // 2. Fetch all tables in the specified zone to get total zone capacity
  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("id, seats")
    .eq("zone_id", zoneId)
    .eq("is_active", true);

  if (!tables || tables.length === 0) {
    return []; // Zone is closed or has no tables
  }
  const totalZoneCapacity = tables.reduce((acc, t) => acc + t.seats, 0);

  // 3. Fetch all bookings for this location on the target day
  const { data: bookings } = await supabase
    .from("bookings")
    .select("booking_time, guests_count, status")
    .eq("location_id", locationId)
    .gte("booking_time", `${dateIsoStr}T00:00:00Z`)
    .lte("booking_time", `${dateIsoStr}T23:59:59Z`)
    .in("status", ["pending", "confirmed", "arrived"]); // Active bookings only

  // 4. Generate candidate 30-minute slots based on opening hours
  const candidateSlots: { id: string; title: string; enabled: boolean }[] = [];
  const now = new Date(); // To filter out past times today

  for (const slot of timeSlots) {
    // Generate valid times between slot.open and slot.close
    // We assume open/close are "HH:mm" (e.g. "12:00")
    if (!slot.open || !slot.close) continue;

    // Extremely simplistic slot generation: every 30 mins
    let currentSlotTime = parse(
      `${dateIsoStr}T${slot.open}`,
      "yyyy-MM-dd'T'HH:mm",
      new Date(),
    );
    const closeTime = parse(
      `${dateIsoStr}T${slot.close}`,
      "yyyy-MM-dd'T'HH:mm",
      new Date(),
    );

    while (currentSlotTime < closeTime) {
      // Calculate occupied capacity AT THIS EXACT TIME
      // A booking overlaps if (booking_time <= currentSlotTime) AND (booking_time + duration > currentSlotTime)
      let occupiedSeatsAtThisTime = 0;

      if (bookings) {
        for (const booking of bookings) {
          const bookingStart = new Date(booking.booking_time);
          const bookingEnd = addMinutes(bookingStart, durationMinutes);

          if (currentSlotTime >= bookingStart && currentSlotTime < bookingEnd) {
            occupiedSeatsAtThisTime += booking.guests_count || 0;
          }
        }
      }

      // Check if we can fit the new guests
      const remainingCapacity = totalZoneCapacity - occupiedSeatsAtThisTime;
      const canFit = remainingCapacity >= guestsCount;

      // Make sure we don't offer times in the past if it's today
      const isPastTime =
        isSameDay(targetDate, now) && isBefore(currentSlotTime, now);

      const timeStr = format(currentSlotTime, "HH:mm");

      // We only insert if we are reasonably far from closing time (at least 1h before close)
      if (addMinutes(currentSlotTime, 60) <= closeTime && !isPastTime) {
        candidateSlots.push({
          id: timeStr,
          title: timeStr,
          enabled: canFit,
        });
      }

      // Advance by 30 mins
      currentSlotTime = addMinutes(currentSlotTime, 30);
    }
  }

  return candidateSlots;
}
