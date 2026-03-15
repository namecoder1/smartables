-- Add daily time-window availability to menu_locations
-- Allows showing a menu only during specific hours (e.g. lunch menu 12:00-15:00)
-- Format: HH:mm (24h, e.g. "12:00", "15:30")

ALTER TABLE public.menu_locations
  ADD COLUMN IF NOT EXISTS daily_from text,
  ADD COLUMN IF NOT EXISTS daily_until text;
