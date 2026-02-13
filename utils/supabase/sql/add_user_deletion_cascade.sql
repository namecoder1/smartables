-- ==============================================================================
-- MIGRATION: Add cascade cleanup on user deletion
-- Description: Creates a BEFORE DELETE trigger on auth.users that removes
--              all related RELATIONAL data when a user is deleted.
--
-- NOTE: Storage files CANNOT be deleted via SQL (Supabase blocks it).
--       Use the deleteUserAction() server action to clean storage via API
--       before deleting the user.
--
-- Run this in the Supabase SQL Editor.
-- ==============================================================================

-- 1. Drop existing trigger and function first (clean slate)
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
DROP FUNCTION IF EXISTS public.handle_user_deleted();

-- 2. Create the cleanup function
CREATE OR REPLACE FUNCTION public.handle_user_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_location_ids uuid[];
BEGIN
  -- 1. Get the organization_id from the user's profile
  SELECT organization_id INTO v_org_id
  FROM public.profiles
  WHERE id = OLD.id;

  -- If no profile found, nothing else to clean
  IF v_org_id IS NULL THEN
    DELETE FROM public.profiles WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  -- 2. Get all location IDs for this organization
  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO v_location_ids
  FROM public.locations
  WHERE organization_id = v_org_id;

  -- 3. Delete relational data in correct order (respecting FK constraints)

  -- message_logs (FK to customers, locations, organizations)
  DELETE FROM public.message_logs WHERE organization_id = v_org_id;

  -- bookings (FK to customers, locations, organizations)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    EXECUTE 'DELETE FROM public.bookings WHERE organization_id = $1' USING v_org_id;
  END IF;

  -- customers (FK to locations, organizations)
  DELETE FROM public.customers WHERE organization_id = v_org_id;

  IF array_length(v_location_ids, 1) > 0 THEN
    -- restaurant_tables (FK to restaurant_zones)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'restaurant_tables') THEN
      DELETE FROM public.restaurant_tables
      WHERE zone_id IN (
        SELECT rz.id FROM public.restaurant_zones rz
        WHERE rz.location_id = ANY(v_location_ids)
      );
    END IF;

    -- restaurant_zones (FK to locations)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'restaurant_zones') THEN
      DELETE FROM public.restaurant_zones
      WHERE location_id = ANY(v_location_ids);
    END IF;

    -- menu_locations (FK to menus, locations)
    DELETE FROM public.menu_locations
    WHERE location_id = ANY(v_location_ids);
  END IF;

  -- Break circular FK: locations <-> telnyx_regulatory_requirements
  UPDATE public.locations SET regulatory_requirement_id = NULL, active_menu_id = NULL
  WHERE organization_id = v_org_id;

  UPDATE public.telnyx_regulatory_requirements SET location_id = NULL
  WHERE organization_id = v_org_id;

  -- telnyx_regulatory_requirements
  DELETE FROM public.telnyx_regulatory_requirements WHERE organization_id = v_org_id;

  -- locations
  DELETE FROM public.locations WHERE organization_id = v_org_id;

  -- menus
  DELETE FROM public.menus WHERE organization_id = v_org_id;

  -- transactions
  DELETE FROM public.transactions WHERE organization_id = v_org_id;

  -- payments (may or may not exist)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    EXECUTE 'DELETE FROM public.payments WHERE organization_id = $1' USING v_org_id;
  END IF;

  -- organization_members (may or may not exist)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_members') THEN
    EXECUTE 'DELETE FROM public.organization_members WHERE organization_id = $1' USING v_org_id;
  END IF;

  -- organizations (unset created_by FK to auth.users first)
  UPDATE public.organizations SET created_by = NULL WHERE id = v_org_id;
  DELETE FROM public.organizations WHERE id = v_org_id;

  -- profiles (last — starred_pages has ON DELETE CASCADE from profiles, so auto-cleaned)
  DELETE FROM public.profiles WHERE id = OLD.id;

  RETURN OLD;
END;
$$;

-- 3. Create the trigger
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_deleted();
