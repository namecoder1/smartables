-- ==============================================================================
-- SMARTABLES DB (Consolidated V4 - synced with live Supabase schema)
-- WARNING: This file is the canonical reference. Always keep in sync with
--          migrations and types/general.ts.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'no_show', 'arrived');
  CREATE TYPE booking_source AS ENUM ('whatsapp_auto', 'manual', 'web', 'phone');
  CREATE TYPE compliance_status AS ENUM ('pending', 'approved', 'rejected', 'more_info_required', 'unapproved');
  CREATE TYPE promotion_type AS ENUM ('percentage', 'fixed_amount', 'bundle', 'cover_override');
  CREATE TYPE promotion_item_target_type AS ENUM ('menu_item', 'category', 'full_menu', 'cover');
  CREATE TYPE promotion_item_role AS ENUM ('target', 'condition');
  CREATE TYPE message_direction AS ENUM ('inbound', 'outbound_bot', 'outbound_human');
  CREATE TYPE message_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');
  CREATE TYPE transaction_type AS ENUM ('subscription', 'usage', 'topup', 'bonus', 'refund', 'adjustment');
  CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled');
  CREATE TYPE order_item_status AS ENUM ('pending', 'preparing', 'served', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. TABLES

CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE,
  billing_email text,
  activation_status text DEFAULT 'pending'::text CHECK (activation_status = ANY (ARRAY['pending'::text, 'active'::text])),
  created_by uuid,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  stripe_status text,
  stripe_current_period_end timestamp with time zone,
  stripe_cancel_at_period_end boolean DEFAULT false,
  whatsapp_usage_count integer DEFAULT 0,
  /** Effective WA cap = base plan wa_contacts + addons_config.extra_contacts_wa */
  /** Extra capacities purchased via add-on subscription items */
  /** Total storage used across all buckets, in bytes */
  telnyx_managed_account_id text,
  created_at timestamp with time zone DEFAULT now(),
  billing_tier text DEFAULT 'starter'::text,
  current_billing_cycle_start timestamp with time zone,
  usage_cap_whatsapp integer DEFAULT 400,
  addons_config jsonb NOT NULL DEFAULT '{"extra_staff": 0, "extra_contacts_wa": 0, "extra_storage_mb": 0, "extra_locations": 0, "extra_kb_chars": 0}'::jsonb,
  total_storage_used bigint NOT NULL DEFAULT 0,
  ux_settings jsonb NOT NULL DEFAULT '{"localization": {"timezone": "Europe/Rome", "language": "it", "currency": "eur"}, "notifications": {"personal_phone": "", "personal_email": "", "preferences": {"push_new_booking": true, "push_new_order": true, "email_plan_ending": true, "email_limit_reached": true, "email_monthly_recap": true}}}'::jsonb,
  CONSTRAINT organizations_pkey PRIMARY KEY (id),
  CONSTRAINT organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  organization_id uuid,
  full_name text,
  role text DEFAULT 'admin'::text CHECK (role = ANY (ARRAY['admin'::text, 'staff'::text])),
  created_at timestamp with time zone DEFAULT now(),
  email text,
  accessible_locations text[],
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  stripe_price_id text NOT NULL UNIQUE,
  name text NOT NULL,
  key text NOT NULL UNIQUE,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
);

CREATE TABLE public.menus (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  name text NOT NULL,
  description text,
  pdf_url text,
  content jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT menus_pkey PRIMARY KEY (id),
  CONSTRAINT menus_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

CREATE TABLE public.locations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  name text NOT NULL,
  slug text,
  address text,
  phone_number text,
  opening_hours jsonb,
  seats smallint,
  telnyx_phone_number text UNIQUE,
  telnyx_connection_id text,
  telnyx_voice_app_id text,
  telnyx_requirement_group_id text,
  telnyx_bundle_request_id text,
  regulatory_status compliance_status DEFAULT 'pending',
  regulatory_rejection_reason text,
  regulatory_documents_data jsonb DEFAULT '{}'::jsonb,
  activation_status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  branding jsonb,
  active_menu_id uuid,
  meta_phone_id text,
  display_name_status text DEFAULT 'pending'::text,
  voice_forwarding_number text,
  max_covers_per_shift integer,
  standard_reservation_duration integer DEFAULT 90,
  cover_price smallint,
  meta_verification_otp text,
  is_branding_completed boolean DEFAULT false,
  is_test_completed boolean DEFAULT false,
  business_connectors jsonb,  -- Encrypted BusinessConnectors JSON (AES-256-GCM), stored as text inside jsonb
  CONSTRAINT locations_pkey PRIMARY KEY (id),
  CONSTRAINT locations_active_menu_id_fkey FOREIGN KEY (active_menu_id) REFERENCES public.menus(id),
  CONSTRAINT locations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

CREATE TABLE public.restaurant_zones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  location_id uuid,
  name text NOT NULL,
  width integer DEFAULT 800,
  height integer DEFAULT 600,
  created_at timestamp with time zone DEFAULT now(),
  blocked_from timestamp with time zone,   -- Block start (zone unavailable for reservations)
  blocked_until timestamp with time zone,  -- Block end
  blocked_reason text,
  CONSTRAINT restaurant_zones_pkey PRIMARY KEY (id),
  CONSTRAINT restaurant_zones_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);

CREATE TABLE public.restaurant_tables (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  zone_id uuid,
  table_number text NOT NULL,
  seats smallint DEFAULT 2,
  shape text DEFAULT 'rect'::text,
  position_x numeric DEFAULT 0,
  position_y numeric DEFAULT 0,
  rotation numeric DEFAULT 0,
  width numeric DEFAULT 100,
  height numeric DEFAULT 100,
  is_active boolean DEFAULT true,
  min_capacity integer DEFAULT 1,
  max_capacity integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT restaurant_tables_pkey PRIMARY KEY (id),
  CONSTRAINT restaurant_tables_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.restaurant_zones(id)
);

CREATE TABLE public.menu_locations (
  menu_id uuid NOT NULL,
  location_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  daily_from text,       -- HH:mm — show menu only from this time (e.g. "12:00")
  daily_until text,      -- HH:mm — show menu only until this time (e.g. "15:00")
  CONSTRAINT menu_locations_pkey PRIMARY KEY (menu_id, location_id),
  CONSTRAINT menu_locations_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id),
  CONSTRAINT menu_locations_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);

CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  phone_number text NOT NULL,
  name text,
  total_visits integer DEFAULT 0,
  last_visit timestamp with time zone,
  openai_thread_id text,
  bot_paused_until timestamp with time zone,
  tags text[] DEFAULT '{}'::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  location_id uuid,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT customers_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);

CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  location_id uuid,
  customer_id uuid,
  table_id uuid,
  guest_name text NOT NULL,
  guest_phone text NOT NULL,
  guests_count integer NOT NULL CHECK (guests_count > 0),
  booking_time timestamp with time zone NOT NULL,
  status booking_status DEFAULT 'pending'::booking_status,
  source booking_source DEFAULT 'manual'::booking_source,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  children_count text,
  allergies text,
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT bookings_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id),
  CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT bookings_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.restaurant_tables(id)
);

CREATE TABLE public.callback_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL,
  phone_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'archived'::text])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT callback_requests_pkey PRIMARY KEY (id),
  CONSTRAINT callback_requests_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);

CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  location_id uuid NOT NULL,
  table_id uuid,
  booking_id uuid,
  status order_status DEFAULT 'pending'::order_status,
  total_amount numeric DEFAULT 0.00,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_table_id_fkey FOREIGN KEY (table_id) REFERENCES public.restaurant_tables(id),
  CONSTRAINT orders_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);

CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  menu_item_id text NOT NULL,
  name text NOT NULL,
  price numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  notes text,
  status order_item_status DEFAULT 'pending'::order_item_status,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);

CREATE TABLE public.special_closures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT special_closures_pkey PRIMARY KEY (id),
  CONSTRAINT special_closures_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);

CREATE TABLE public.starred_pages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL,
  url text NOT NULL,
  title text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT starred_pages_pkey PRIMARY KEY (id),
  CONSTRAINT starred_pages_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.knowledge_base (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  location_id uuid,
  title text NOT NULL,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT knowledge_base_pkey PRIMARY KEY (id),
  CONSTRAINT knowledge_base_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT knowledge_base_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE SET NULL
);

CREATE TABLE public.whatsapp_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  location_id uuid,
  customer_id uuid NOT NULL,
  meta_message_id text UNIQUE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  direction message_direction NOT NULL,
  status message_status DEFAULT 'sent',
  error_message text,
  cost_implication boolean DEFAULT true,
  template_name text,
  payload jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT whatsapp_messages_pkey PRIMARY KEY (id),
  CONSTRAINT whatsapp_messages_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT whatsapp_messages_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE,
  CONSTRAINT whatsapp_messages_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE
);

CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  amount numeric NOT NULL,
  type transaction_type NOT NULL DEFAULT 'subscription',
  description text,
  reference_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  currency text DEFAULT 'eur',
  status text DEFAULT 'succeeded',
  invoice_pdf text,
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

CREATE TABLE public.feedbacks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'general',
  reason text,
  message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feedbacks_pkey PRIMARY KEY (id),
  CONSTRAINT feedbacks_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT feedbacks_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  image_url text,
  type promotion_type NOT NULL DEFAULT 'percentage',
  value numeric,
  all_locations boolean DEFAULT false,
  all_menus boolean DEFAULT false,
  target_location_ids uuid[] DEFAULT '{}'::uuid[],
  target_menu_ids uuid[] DEFAULT '{}'::uuid[],
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  recurring_schedule jsonb,
  visit_threshold integer,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  stackable boolean DEFAULT false,
  notify_via_whatsapp boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT promotions_pkey PRIMARY KEY (id),
  CONSTRAINT promotions_organization_id_fkey FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id) ON DELETE CASCADE
);

CREATE TABLE public.telnyx_webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  event_type text,
  payload jsonb,
  location_id uuid,
  organization_id uuid,
  CONSTRAINT telnyx_webhook_logs_pkey PRIMARY KEY (id),
  CONSTRAINT telnyx_webhook_logs_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id),
  CONSTRAINT telnyx_webhook_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  location_id uuid,
  type text NOT NULL CHECK (type = ANY (ARRAY[
    'new_booking'::text,
    'new_customer'::text,
    'new_order'::text,
    'whatsapp_limit_warning'::text
  ])),
  title text NOT NULL,
  body text,
  link text,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT notifications_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_own_org" ON public.notifications FOR SELECT TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "notifications_update_own_org" ON public.notifications FOR UPDATE TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE TABLE public.push_tokens (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  profile_id uuid,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform = ANY (ARRAY['ios'::text, 'android'::text, 'web'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT push_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT push_tokens_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT push_tokens_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_tokens_select_own" ON public.push_tokens FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "push_tokens_insert_own" ON public.push_tokens FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "push_tokens_update_own" ON public.push_tokens FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());
CREATE POLICY "push_tokens_delete_own" ON public.push_tokens FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- 4. INDEXES
CREATE UNIQUE INDEX IF NOT EXISTS locations_organization_id_slug_key ON public.locations (organization_id, slug);
CREATE INDEX IF NOT EXISTS idx_locations_telnyx_phone_hash ON public.locations USING HASH (telnyx_phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_openai_thread_id ON public.customers(openai_thread_id);
CREATE INDEX IF NOT EXISTS idx_bookings_location ON public.bookings(location_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_time ON public.bookings(booking_time);
CREATE INDEX IF NOT EXISTS idx_promotions_organization_id ON public.promotions(organization_id);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON public.promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_customer_id ON public.whatsapp_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_location_id ON public.orders(location_id);
CREATE INDEX IF NOT EXISTS idx_special_closures_location_id ON public.special_closures(location_id);
CREATE INDEX IF NOT EXISTS notifications_org_unread_idx ON public.notifications (organization_id, is_read, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS push_tokens_token_idx ON public.push_tokens (token);

-- 5. LOGIC (Functions & Triggers)

-- Helper: Get Org ID
CREATE OR REPLACE FUNCTION public.get_auth_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Trigger: Handle New User
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'admin');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Helper: Update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_knowledge_base_updated_at
BEFORE UPDATE ON public.knowledge_base
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_whatsapp_messages_updated_at
BEFORE UPDATE ON public.whatsapp_messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Handle User Deletion (Cascade cleanup of all data + storage files)
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
  -- Use deleteUserAction() server action to clean storage via API before deletion.

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

-- 6. ROW LEVEL SECURITY (RLS) & POLICIES

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starred_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telnyx_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policies

-- Organizations
CREATE POLICY "Users can view own organization" ON public.organizations
  FOR SELECT USING (id = public.get_auth_organization_id() OR created_by = auth.uid());
CREATE POLICY "Users can update own organization" ON public.organizations
  FOR UPDATE USING (id = public.get_auth_organization_id() OR created_by = auth.uid());
CREATE POLICY "Users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Profiles
CREATE POLICY "Access own profile" ON public.profiles
  USING (id = auth.uid());

-- Starred Pages
CREATE POLICY "Org Access Starred Pages" ON public.starred_pages
  USING (profile_id = auth.uid());

-- Locations
CREATE POLICY "Org Access Locations" ON public.locations USING (organization_id = public.get_auth_organization_id());

-- Menus
CREATE POLICY "Org Access Menus" ON public.menus USING (organization_id = public.get_auth_organization_id());

-- Menu Locations
CREATE POLICY "Menu locations are viewable by everyone" ON public.menu_locations FOR SELECT USING (true);
CREATE POLICY "Users can manage org menu locations" ON public.menu_locations FOR ALL USING (
  location_id IN (SELECT id FROM public.locations WHERE organization_id = public.get_auth_organization_id())
);

-- Zones & Tables
CREATE POLICY "Org Access Zones" ON public.restaurant_zones USING (
  EXISTS (SELECT 1 FROM public.locations WHERE locations.id = restaurant_zones.location_id AND locations.organization_id = public.get_auth_organization_id())
);
CREATE POLICY "Org Access Tables" ON public.restaurant_tables USING (
  EXISTS (SELECT 1 FROM public.restaurant_zones JOIN public.locations ON locations.id = restaurant_zones.location_id WHERE restaurant_zones.id = restaurant_tables.zone_id AND locations.organization_id = public.get_auth_organization_id())
);

-- Bookings & Customers & Messages
CREATE POLICY "Org Access Bookings" ON public.bookings USING (organization_id = public.get_auth_organization_id());
CREATE POLICY "Org Access Customers" ON public.customers USING (organization_id = public.get_auth_organization_id());
CREATE POLICY "Org Access WhatsApp Messages" ON public.whatsapp_messages USING (organization_id = public.get_auth_organization_id());
CREATE POLICY "Org Access Knowledge Base" ON public.knowledge_base USING (organization_id = public.get_auth_organization_id());

-- Orders
CREATE POLICY "Org Access Orders" ON public.orders USING (organization_id = public.get_auth_organization_id());
CREATE POLICY "Org Access Order Items" ON public.order_items USING (
  order_id IN (SELECT id FROM public.orders WHERE organization_id = public.get_auth_organization_id())
);

-- Callback Requests
CREATE POLICY "Org Access Callback Requests" ON public.callback_requests USING (
  location_id IN (SELECT id FROM public.locations WHERE organization_id = public.get_auth_organization_id())
);

-- Special Closures
CREATE POLICY "Org Access Special Closures" ON public.special_closures USING (
  location_id IN (SELECT id FROM public.locations WHERE organization_id = public.get_auth_organization_id())
);

-- Plans
CREATE POLICY "Everyone can view plans" ON public.subscription_plans FOR SELECT USING (auth.role() = 'authenticated');

-- Transactions
CREATE POLICY "Org Access Transactions" ON public.transactions USING (organization_id = public.get_auth_organization_id());

-- Feedbacks
CREATE POLICY "Org users can view feedbacks" ON public.feedbacks
  FOR SELECT USING (organization_id = public.get_auth_organization_id());
CREATE POLICY "Authenticated users can insert feedbacks" ON public.feedbacks
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

-- Promotions
CREATE POLICY "Org Access Promotions" ON public.promotions USING (organization_id = public.get_auth_organization_id());
CREATE POLICY "Org Insert Promotions" ON public.promotions FOR INSERT WITH CHECK (organization_id = public.get_auth_organization_id());

-- Telnyx Webhook Logs
CREATE POLICY "Org Access Telnyx Logs" ON public.telnyx_webhook_logs USING (organization_id = public.get_auth_organization_id());


-- 7. SEED DATA
INSERT INTO public.subscription_plans (stripe_price_id, name, key, limits) VALUES
('price_1SuvWrDmWHgnXPDyqZ2gQbls', 'Starter', 'starter', '{
  "max_locations": 1,
  "max_staff": 5,
  "max_bookings": 300,
  "wa_contacts": 400,
  "max_menus": 5,
  "max_zones": 3,
  "storage_mb": 300,
  "ai_tier": "basic",
  "analytics": "basic"
}'),
('price_1SusAEDmWHgnXPDyUUzEik6c', 'Growth', 'growth', '{
  "max_locations": 3,
  "max_staff": 15,
  "max_bookings": 1000,
  "wa_contacts": 1200,
  "max_menus": 15,
  "max_zones": 12,
  "storage_mb": 1024,
  "ai_tier": "medium",
  "analytics": "advanced"
}'),
('price_1SusB3DmWHgnXPDyggftPbfV', 'Business', 'business', '{
  "max_locations": 10,
  "max_staff": 9999,
  "max_bookings": 3000,
  "wa_contacts": 3500,
  "max_menus": 50,
  "max_zones": 35,
  "storage_mb": 5120,
  "ai_tier": "pro",
  "analytics": "advanced"
}')
ON CONFLICT (stripe_price_id) DO UPDATE
SET limits = excluded.limits, name = excluded.name, key = excluded.key;

-- 8. STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('compliance-docs', 'compliance-docs', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('location-logo', 'location-logo', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-files', 'menu-files', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('promotion-images', 'promotion-images', true) ON CONFLICT (id) DO NOTHING;

-- Compliance Docs Policies
CREATE POLICY "Authenticated users can upload compliance docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'compliance-docs' );
CREATE POLICY "Authenticated users can read compliance docs" ON storage.objects FOR SELECT TO authenticated USING ( bucket_id = 'compliance-docs' );
CREATE POLICY "Authenticated users can update compliance docs" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'compliance-docs' );
CREATE POLICY "Authenticated users can delete compliance docs" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'compliance-docs' );

-- Location Logo Policies (org-based access via location_id in first 36 chars of filename)
CREATE POLICY "Org users can upload location logos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'location-logo' AND
  left(name, 36) IN (
    SELECT id::text FROM public.locations
    WHERE organization_id = public.get_auth_organization_id()
  )
);

CREATE POLICY "Anyone can view location logos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'location-logo');

CREATE POLICY "Org users can update location logos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'location-logo' AND
  left(name, 36) IN (
    SELECT id::text FROM public.locations
    WHERE organization_id = public.get_auth_organization_id()
  )
);

CREATE POLICY "Org users can delete location logos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'location-logo' AND
  left(name, 36) IN (
    SELECT id::text FROM public.locations
    WHERE organization_id = public.get_auth_organization_id()
  )
);

-- Menu Images Policies (org-based access via org_id in path: {org_id}/filename)
CREATE POLICY "Org users can upload menu images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'menu-images' AND
  (storage.foldername(name))[1] = public.get_auth_organization_id()::text
);

CREATE POLICY "Anyone can view menu images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'menu-images');

CREATE POLICY "Org users can update menu images" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'menu-images' AND
  (storage.foldername(name))[1] = public.get_auth_organization_id()::text
);

CREATE POLICY "Org users can delete menu images" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'menu-images' AND
  (storage.foldername(name))[1] = public.get_auth_organization_id()::text
);

-- Menu Files Policies
CREATE POLICY "Org users can upload menu files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'menu-files' AND
  (storage.foldername(name))[1] = public.get_auth_organization_id()::text
);

CREATE POLICY "Anyone can view menu files" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'menu-files');

CREATE POLICY "Org users can update menu files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'menu-files' AND
  (storage.foldername(name))[1] = public.get_auth_organization_id()::text
);

CREATE POLICY "Org users can delete menu files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'menu-files' AND
  (storage.foldername(name))[1] = public.get_auth_organization_id()::text
);

-- Promotion Images Policies (org-based access via org_id in path: {org_id}/filename)
CREATE POLICY "Org users can upload promotion images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'promotion-images' AND
  (storage.foldername(name))[1] = public.get_auth_organization_id()::text
);

CREATE POLICY "Anyone can view promotion images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'promotion-images');

CREATE POLICY "Org users can update promotion images" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'promotion-images' AND
  (storage.foldername(name))[1] = public.get_auth_organization_id()::text
);

CREATE POLICY "Org users can delete promotion images" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'promotion-images' AND
  (storage.foldername(name))[1] = public.get_auth_organization_id()::text
);
