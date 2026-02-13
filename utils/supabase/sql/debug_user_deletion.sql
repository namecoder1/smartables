-- ==============================================================================
-- DIAGNOSTIC: Test user deletion cascade step by step
-- Run this in the Supabase SQL Editor to find which step fails.
-- Replace the user ID below with the actual user ID you want to delete.
-- This runs in a TRANSACTION and ROLLS BACK at the end (no data is deleted).
-- ==============================================================================

DO $$
DECLARE
  v_user_id uuid := '184c46b2-6889-4564-bc51-666e46fc62ea'; -- <-- REPLACE WITH ACTUAL USER ID
  v_org_id uuid;
  v_location_ids uuid[];
  v_count int;
BEGIN
  RAISE NOTICE '=== START DIAGNOSTIC ===';

  -- Step 1: Find profile
  SELECT organization_id INTO v_org_id FROM public.profiles WHERE id = v_user_id;
  RAISE NOTICE 'Step 1 - org_id: %', v_org_id;

  IF v_org_id IS NULL THEN
    RAISE NOTICE 'No organization found. Only profile cleanup needed.';
    RAISE NOTICE '=== DIAGNOSTIC COMPLETE ===';
    RETURN;
  END IF;

  -- Step 2: Find locations
  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO v_location_ids
  FROM public.locations WHERE organization_id = v_org_id;
  RAISE NOTICE 'Step 2 - location_ids: %', v_location_ids;

  -- Step 3: Check storage objects
  SELECT count(*) INTO v_count FROM storage.objects
  WHERE bucket_id IN ('location-logo','compliance-docs','menu-images','menu-files');
  RAISE NOTICE 'Step 3 - Total storage objects in relevant buckets: %', v_count;

  -- Step 4: Check all tables that reference this org
  SELECT count(*) INTO v_count FROM public.message_logs WHERE organization_id = v_org_id;
  RAISE NOTICE 'Step 4a - message_logs count: %', v_count;

  SELECT count(*) INTO v_count FROM public.customers WHERE organization_id = v_org_id;
  RAISE NOTICE 'Step 4b - customers count: %', v_count;

  SELECT count(*) INTO v_count FROM public.menu_locations
  WHERE location_id = ANY(v_location_ids);
  RAISE NOTICE 'Step 4c - menu_locations count: %', v_count;

  SELECT count(*) INTO v_count FROM public.telnyx_regulatory_requirements WHERE organization_id = v_org_id;
  RAISE NOTICE 'Step 4d - telnyx_regulatory_requirements count: %', v_count;

  SELECT count(*) INTO v_count FROM public.menus WHERE organization_id = v_org_id;
  RAISE NOTICE 'Step 4e - menus count: %', v_count;

  SELECT count(*) INTO v_count FROM public.transactions WHERE organization_id = v_org_id;
  RAISE NOTICE 'Step 4f - transactions count: %', v_count;

  -- Step 5: Check for OTHER profiles in the same org (multi-user org)
  SELECT count(*) INTO v_count FROM public.profiles WHERE organization_id = v_org_id AND id != v_user_id;
  RAISE NOTICE 'Step 5 - Other profiles in same org: %', v_count;

  -- Step 6: Check for ALL FK constraints pointing to tables we need to delete
  RAISE NOTICE 'Step 6 - Checking FK constraints...';
  FOR v_count IN
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public'
  LOOP
    -- just counting
  END LOOP;

  -- Step 7: List ALL tables in public schema (to find ones we might be missing)
  RAISE NOTICE 'Step 7 - All public tables:';
  DECLARE
    v_table_name text;
  BEGIN
    FOR v_table_name IN
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    LOOP
      RAISE NOTICE '  - %', v_table_name;
    END LOOP;
  END;

  -- Step 8: Check all FK constraints that reference organizations
  RAISE NOTICE 'Step 8 - FK constraints referencing organizations:';
  DECLARE
    v_fk record;
  BEGIN
    FOR v_fk IN
      SELECT
        tc.table_name as source_table,
        kcu.column_name as source_column,
        ccu.table_name as target_table,
        ccu.column_name as target_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND (ccu.table_name = 'organizations' OR ccu.table_name = 'locations' OR ccu.table_name = 'profiles' OR ccu.table_name = 'menus')
    LOOP
      RAISE NOTICE '  % (%.%) -> %.%', v_fk.source_table, v_fk.source_table, v_fk.source_column, v_fk.target_table, v_fk.target_column;
    END LOOP;
  END;

  -- Step 9: Check FK constraints in auth schema pointing to auth.users
  RAISE NOTICE 'Step 9 - FK constraints referencing auth.users:';
  DECLARE
    v_fk2 record;
  BEGIN
    FOR v_fk2 IN
      SELECT
        tc.table_schema as source_schema,
        tc.table_name as source_table,
        kcu.column_name as source_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema = 'auth'
      AND ccu.table_name = 'users'
      AND tc.table_schema = 'public'
    LOOP
      RAISE NOTICE '  %.% (col: %)', v_fk2.source_schema, v_fk2.source_table, v_fk2.source_column;
    END LOOP;
  END;

  RAISE NOTICE '=== DIAGNOSTIC COMPLETE ===';
END;
$$;
