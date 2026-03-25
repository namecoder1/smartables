-- ==============================================================================
-- Migration: Org-level customer tags + call drop logging index
-- Date: 2026-03-25
-- ==============================================================================

-- 1. Org-level tags on customers
--    tags[]     = location-scoped (table preferences, supplier flag, location notes)
--    org_tags[] = org-scoped (VIP, blacklist, allergy flags shared across all locations)
--    Propagation via bsuid is handled at application level (addOrgTag / removeOrgTag).

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS org_tags text[] DEFAULT '{}'::text[];

COMMENT ON COLUMN public.customers.org_tags IS
  'Org-level identity tags shared across all locations for the same customer (via bsuid). '
  'Examples: VIP, blacklist, allergy-critical. '
  'Managed via addOrgTag/removeOrgTag which propagate to all records sharing the same bsuid+org.';

CREATE INDEX IF NOT EXISTS idx_customers_org_tags
  ON public.customers USING gin(org_tags);

-- 2. Index on telnyx_webhook_logs for fast call-drop dashboard queries
--    Enables: WHERE event_type = 'call.dropped_rate_limited' AND location_id = ?

CREATE INDEX IF NOT EXISTS idx_telnyx_logs_event_location
  ON public.telnyx_webhook_logs(event_type, location_id, created_at DESC);
