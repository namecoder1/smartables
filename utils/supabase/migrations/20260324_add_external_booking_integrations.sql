-- ==============================================================================
-- Migration: Add external booking platform integrations
-- Date: 2026-03-24
-- Platforms: TheFork, Quandoo, OpenTable
-- ==============================================================================

-- 1. Extend booking_source ENUM with new platform values
--    NOTE: PostgreSQL does not support IF NOT EXISTS for enum values before v14.
--          These are safe to run once. If re-running, comment them out.
ALTER TYPE booking_source ADD VALUE IF NOT EXISTS 'thefork';
ALTER TYPE booking_source ADD VALUE IF NOT EXISTS 'quandoo';
ALTER TYPE booking_source ADD VALUE IF NOT EXISTS 'opentable';

-- 2. Add email to customers (for cross-platform guest matching)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS email text;

COMMENT ON COLUMN public.customers.email IS
  'Guest email — used to match/enrich customer profiles from TheFork, Quandoo, and OpenTable, where email is the primary guest identifier.';

-- 3. Add external integration fields to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS sync_status text
    CHECK (sync_status IS NULL OR sync_status = ANY (ARRAY['synced'::text, 'pending_push'::text, 'conflict'::text]));

COMMENT ON COLUMN public.bookings.external_id IS
  'Reservation ID on the originating external platform (TheFork, Quandoo, OpenTable). Used for deduplication and status push-back.';

COMMENT ON COLUMN public.bookings.sync_status IS
  'Sync state with the external platform: synced (confirmed both sides), pending_push (awaiting status update to provider), conflict (mismatch detected). NULL for non-synced bookings.';

-- 4. Add thefork_restaurant_id to locations (plain column, needed for O(1) webhook routing)
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS thefork_restaurant_id text;

COMMENT ON COLUMN public.locations.thefork_restaurant_id IS
  'TheFork CustomerId — non-sensitive restaurant identifier. Stored plain (not encrypted) for fast webhook routing by CustomerId header.';

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_customers_email
  ON public.customers(email);

CREATE INDEX IF NOT EXISTS idx_bookings_external_id
  ON public.bookings(external_id);

-- Composite index: find all external bookings for a location efficiently
CREATE INDEX IF NOT EXISTS idx_bookings_source
  ON public.bookings(source);

CREATE INDEX IF NOT EXISTS idx_bookings_location_source
  ON public.bookings(location_id, source)
  WHERE source IN ('thefork', 'quandoo', 'opentable');

CREATE INDEX IF NOT EXISTS idx_locations_thefork_restaurant_id
  ON public.locations(thefork_restaurant_id);
