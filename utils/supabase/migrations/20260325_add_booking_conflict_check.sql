-- ==============================================================================
-- Migration: Add booking capacity check function
-- Date: 2026-03-25
-- Purpose: Prevent double-booking / overbooking across all booking channels
--          (manual, WhatsApp Flow, public page, TheFork, etc.)
-- ==============================================================================

-- check_booking_capacity
-- ──────────────────────
-- Returns TRUE if the requested guests_count fits within the location's
-- remaining capacity for the given time slot.
--
-- Capacity resolution order:
--   1. Sum of seats across all active tables in the location's zones
--   2. Fallback: locations.seats (legacy / unconfigured floor plan)
--   3. Fallback: 999 (treat as unlimited when nothing is configured)
--
-- Overlap window: uses locations.standard_reservation_duration (default 90 min).
-- A booking at 20:00 with 90-min duration overlaps any booking
-- whose window intersects [20:00, 21:30).
--
-- Note: this function is a READ-ONLY check. The race-condition window between
-- check and insert is accepted as negligible for restaurant booking volumes
-- (< 1s). If concurrency becomes an issue, wrap in a transaction with
-- pg_advisory_xact_lock(0, hashtext(p_location_id::text)) at the call site.

CREATE OR REPLACE FUNCTION check_booking_capacity(
  p_location_id  uuid,
  p_booking_time timestamptz,
  p_guests_count int
) RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_duration_min int;
  v_total_seats  int;
  v_occupied     int;
BEGIN
  -- 1. Reservation duration for this location
  SELECT COALESCE(standard_reservation_duration, 90)
    INTO v_duration_min
  FROM locations
  WHERE id = p_location_id;

  -- If location not found, allow the booking (fail open)
  IF NOT FOUND THEN RETURN true; END IF;

  -- 2. Total seats: sum of active tables linked through zones
  SELECT COALESCE(SUM(t.seats), 0)
    INTO v_total_seats
  FROM restaurant_tables t
  JOIN restaurant_zones  z ON t.zone_id = z.id
  WHERE z.location_id = p_location_id
    AND t.is_active   = true;

  -- 2b. Fallback to locations.seats when no floor plan is configured
  IF v_total_seats = 0 THEN
    SELECT COALESCE(seats, 0) INTO v_total_seats
    FROM locations WHERE id = p_location_id;
  END IF;

  -- 2c. If still 0, treat as unconfigured → allow booking
  IF v_total_seats = 0 THEN RETURN true; END IF;

  -- 3. Occupied seats in the overlapping window (ignoring cancelled / no-shows)
  SELECT COALESCE(SUM(b.guests_count), 0)
    INTO v_occupied
  FROM bookings b
  WHERE b.location_id = p_location_id
    AND b.status NOT IN ('cancelled', 'no_show')
    AND b.booking_time < p_booking_time + (v_duration_min || ' minutes')::interval
    AND b.booking_time + (v_duration_min || ' minutes')::interval > p_booking_time;

  RETURN (v_occupied + p_guests_count) <= v_total_seats;
END;
$$;

COMMENT ON FUNCTION check_booking_capacity IS
  'Returns true if the requested guests fit within the remaining capacity for the time slot. '
  'Capacity = sum of active table seats (or locations.seats as fallback). '
  'Overlap window = locations.standard_reservation_duration (default 90 min).';
