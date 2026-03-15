-- ==============================================================================
-- MIGRATION: Fix handle_user_deleted trigger
-- Problem: Old trigger referenced public.message_logs which no longer exists
-- Solution: Recreate function matching current schema (db.sql)
-- Run this in the Supabase SQL Editor.
-- ==============================================================================

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
DROP FUNCTION IF EXISTS public.handle_user_deleted();

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
  SELECT organization_id INTO v_org_id
  FROM public.profiles
  WHERE id = OLD.id;

  IF v_org_id IS NULL THEN
    DELETE FROM public.profiles WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO v_location_ids
  FROM public.locations
  WHERE organization_id = v_org_id;

  -- NOTE: Storage files cannot be deleted via SQL (Supabase blocks it).
  -- Use deleteAccountAction() server action to clean storage via API before deletion.

  DELETE FROM public.feedbacks WHERE organization_id = v_org_id;
  DELETE FROM public.promotions WHERE organization_id = v_org_id;
  DELETE FROM public.whatsapp_messages WHERE organization_id = v_org_id;
  DELETE FROM public.knowledge_base WHERE organization_id = v_org_id;
  DELETE FROM public.telnyx_webhook_logs WHERE organization_id = v_org_id;

  DELETE FROM public.bookings WHERE organization_id = v_org_id;
  DELETE FROM public.customers WHERE organization_id = v_org_id;

  IF array_length(v_location_ids, 1) > 0 THEN
    DELETE FROM public.special_closures WHERE location_id = ANY(v_location_ids);
    DELETE FROM public.callback_requests WHERE location_id = ANY(v_location_ids);

    DELETE FROM public.order_items WHERE order_id IN (
      SELECT id FROM public.orders WHERE location_id = ANY(v_location_ids)
    );
    DELETE FROM public.orders WHERE location_id = ANY(v_location_ids);

    DELETE FROM public.restaurant_tables
    WHERE zone_id IN (
      SELECT rz.id FROM public.restaurant_zones rz
      WHERE rz.location_id = ANY(v_location_ids)
    );
    DELETE FROM public.restaurant_zones WHERE location_id = ANY(v_location_ids);
    DELETE FROM public.menu_locations WHERE location_id = ANY(v_location_ids);
  END IF;

  UPDATE public.locations SET active_menu_id = NULL
  WHERE organization_id = v_org_id;

  DELETE FROM public.locations WHERE organization_id = v_org_id;
  DELETE FROM public.menus WHERE organization_id = v_org_id;
  DELETE FROM public.transactions WHERE organization_id = v_org_id;

  -- notifications and push_tokens have ON DELETE CASCADE from organizations — auto-cleaned
  UPDATE public.organizations SET created_by = NULL WHERE id = v_org_id;
  DELETE FROM public.organizations WHERE id = v_org_id;

  -- profiles (starred_pages has ON DELETE CASCADE from profiles — auto-cleaned)
  DELETE FROM public.profiles WHERE id = OLD.id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_deleted();
