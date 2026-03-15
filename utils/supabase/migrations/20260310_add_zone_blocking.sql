-- Add blocking fields to restaurant_zones
-- Allows blocking a zone's map for a specific time range (shifts, special events, etc.)

ALTER TABLE public.restaurant_zones
  ADD COLUMN IF NOT EXISTS blocked_from timestamp with time zone,
  ADD COLUMN IF NOT EXISTS blocked_until timestamp with time zone,
  ADD COLUMN IF NOT EXISTS blocked_reason text;
