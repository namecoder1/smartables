-- Add new configuration columns for locations
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS max_covers_per_shift integer,
ADD COLUMN IF NOT EXISTS standard_reservation_duration integer DEFAULT 90;

comment on column public.locations.max_covers_per_shift is 'Maximum number of covers allowed per shift';
comment on column public.locations.standard_reservation_duration is 'Standard duration of a reservation in minutes';
