-- ==============================================================================
-- SMARTABLES DB (Consolidated V3 - Agency Model)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'no_show', 'arrived');
    CREATE TYPE booking_source AS ENUM ('whatsapp_auto', 'manual', 'web', 'phone');
    CREATE TYPE compliance_status AS ENUM ('pending', 'approved', 'rejected', 'more_info_required', 'unapproved');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. TABLES (User Provided Schema)

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
  telnyx_managed_account_id text,
  created_at timestamp with time zone DEFAULT now(),
  billing_tier text DEFAULT 'starter'::text,
  plan_msg_limit integer DEFAULT 150,
  current_billing_cycle_start timestamp with time zone,
  usage_cap_whatsapp integer DEFAULT 150,
  CONSTRAINT organizations_pkey PRIMARY KEY (id),
  CONSTRAINT organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  organization_id uuid,
  full_name text,
  role text DEFAULT 'admin'::text CHECK (role = ANY (ARRAY['admin'::text, 'staff'::text])),
  created_at timestamp with time zone DEFAULT now(),
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
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT menus_pkey PRIMARY KEY (id),
  CONSTRAINT menus_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

CREATE TABLE public.telnyx_regulatory_requirements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  area_code text NOT NULL,
  country_code text NOT NULL DEFAULT 'IT'::text,
  telnyx_requirement_group_id text,
  telnyx_bundle_request_id text,
  status compliance_status DEFAULT 'pending',
  rejection_reason text,
  documents_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  location_id uuid UNIQUE,
  CONSTRAINT telnyx_regulatory_requirements_pkey PRIMARY KEY (id),
  -- Reference to locations added later or circular dependency handled by constraint creation order? 
  -- Note: The provided schema has a circular reference: locations->req_id and req->location_id.
  -- Safe to create constraint if table exists, so order matters. location table comes next.
  CONSTRAINT telnyx_regulatory_requirements_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
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
  regulatory_requirement_id uuid,
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
  CONSTRAINT locations_pkey PRIMARY KEY (id),
  CONSTRAINT locations_active_menu_id_fkey FOREIGN KEY (active_menu_id) REFERENCES public.menus(id),
  CONSTRAINT locations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT locations_regulatory_requirement_id_fkey FOREIGN KEY (regulatory_requirement_id) REFERENCES public.telnyx_regulatory_requirements(id)
);

-- Add the circular FK for regulatory reqs back to locations
ALTER TABLE public.telnyx_regulatory_requirements 
ADD CONSTRAINT telnyx_regulatory_requirements_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


CREATE TABLE public.menu_locations (
  menu_id uuid NOT NULL,
  location_id uuid NOT NULL,
  is_active boolean DEFAULT true,
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
  created_at timestamp with time zone DEFAULT now(),
  location_id uuid,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT customers_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);

CREATE TABLE public.message_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid,
  location_id uuid,
  customer_id uuid,
  cost_implication boolean DEFAULT true,
  sent_at timestamp with time zone DEFAULT now(),
  payload jsonb,
  CONSTRAINT message_logs_pkey PRIMARY KEY (id),
  CONSTRAINT message_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT message_logs_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id),
  CONSTRAINT message_logs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);

CREATE TYPE transaction_type AS ENUM ('subscription', 'usage', 'topup', 'bonus', 'refund', 'adjustment');

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

-- 4. INDEXES (Consolidated from DB and Migrations)
CREATE UNIQUE INDEX IF NOT EXISTS locations_organization_id_slug_key ON public.locations (organization_id, slug);
CREATE INDEX IF NOT EXISTS idx_locations_telnyx_phone_hash ON public.locations USING HASH (telnyx_phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_bookings_location ON public.bookings(location_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_customer_sent_at ON public.message_logs (customer_id, sent_at DESC);

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
  -- 1. Get the organization_id from the user's profile
  SELECT organization_id INTO v_org_id
  FROM public.profiles
  WHERE id = OLD.id;

  -- If no profile found, nothing else to clean — just allow the delete
  IF v_org_id IS NULL THEN
    DELETE FROM public.profiles WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  -- 2. Get all location IDs for this organization (never NULL, empty array instead)
  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[]) INTO v_location_ids
  FROM public.locations
  WHERE organization_id = v_org_id;

  -- NOTE: Storage files cannot be deleted via SQL (Supabase blocks it).
  -- Use deleteUserAction() server action to clean storage via API before deletion.

  -- 3. Delete relational data in correct order (respecting FK constraints)

  DELETE FROM public.feedbacks WHERE organization_id = v_org_id;
  DELETE FROM public.message_logs WHERE organization_id = v_org_id;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    EXECUTE 'DELETE FROM public.bookings WHERE organization_id = $1' USING v_org_id;
  END IF;

  DELETE FROM public.customers WHERE organization_id = v_org_id;

  IF array_length(v_location_ids, 1) > 0 THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'restaurant_tables') THEN
      DELETE FROM public.restaurant_tables
      WHERE zone_id IN (
        SELECT rz.id FROM public.restaurant_zones rz
        WHERE rz.location_id = ANY(v_location_ids)
      );
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'restaurant_zones') THEN
      DELETE FROM public.restaurant_zones
      WHERE location_id = ANY(v_location_ids);
    END IF;

    DELETE FROM public.menu_locations
    WHERE location_id = ANY(v_location_ids);
  END IF;

  -- Break circular FK: locations <-> telnyx_regulatory_requirements
  UPDATE public.locations SET regulatory_requirement_id = NULL, active_menu_id = NULL
  WHERE organization_id = v_org_id;

  UPDATE public.telnyx_regulatory_requirements SET location_id = NULL
  WHERE organization_id = v_org_id;

  DELETE FROM public.telnyx_regulatory_requirements WHERE organization_id = v_org_id;
  DELETE FROM public.locations WHERE organization_id = v_org_id;
  DELETE FROM public.menus WHERE organization_id = v_org_id;
  DELETE FROM public.transactions WHERE organization_id = v_org_id;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    EXECUTE 'DELETE FROM public.payments WHERE organization_id = $1' USING v_org_id;
  END IF;

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
ALTER TABLE public.telnyx_regulatory_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

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

-- Bookings & Customers
CREATE POLICY "Org Access Bookings" ON public.bookings USING (organization_id = public.get_auth_organization_id());
CREATE POLICY "Org Access Customers" ON public.customers USING (organization_id = public.get_auth_organization_id());
CREATE POLICY "Org Access Message Logs" ON public.message_logs USING (organization_id = public.get_auth_organization_id());

-- Regulatory (Consolidated Policies)
CREATE POLICY "Org Access Regulatory" ON public.telnyx_regulatory_requirements USING (organization_id = public.get_auth_organization_id());
-- Admin Override Policy (from admin_rls.sql)
CREATE POLICY "Admins can view all compliance requests" ON telnyx_regulatory_requirements
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  OR auth.uid() = '0a82970f-1fc5-4a52-97a1-a8613de0e3f7'
);
CREATE POLICY "Users can create compliance requests" ON telnyx_regulatory_requirements FOR INSERT TO authenticated WITH CHECK (true);

-- Plans
CREATE POLICY "Everyone can view plans" ON public.subscription_plans FOR SELECT USING (auth.role() = 'authenticated');

-- Payments & Transactions
-- (Missing from original db.sql, adding standard org access)

CREATE POLICY "Org Access Transactions" ON public.transactions USING (organization_id = public.get_auth_organization_id());

-- Feedbacks
CREATE POLICY "Org users can view feedbacks" ON public.feedbacks
  FOR SELECT USING (organization_id = public.get_auth_organization_id());
CREATE POLICY "Authenticated users can insert feedbacks" ON public.feedbacks
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());


-- 7. SEED DATA (Updated for Agency Model)
INSERT INTO public.subscription_plans (stripe_price_id, name, key, limits) VALUES 
('price_1SuvWrDmWHgnXPDyqZ2gQbls', 'Starter', 'starter', '{
  "max_locations": 1, 
  "max_staff": 2, 
  "monthly_reservations": 300,
  "whatsapp_conversation_limit": 150,
  "mobile_access": false, 
  "features": ["whatsapp_bot", "table_management", "reservations_management", "digital_menu", "ai_basic"]
}'),
('price_1SusAEDmWHgnXPDyUUzEik6c', 'Growth', 'pro', '{
  "max_locations": 3, 
  "max_staff": 5, 
  "monthly_reservations": 1000,
  "whatsapp_conversation_limit": 400,
  "mobile_access": true, 
  "features": ["whatsapp_bot", "table_management", "reservations_management", "digital_menu", "ai_basic", "mobile_app"]
}'),
('price_1SusB3DmWHgnXPDyggftPbfV', 'Business', 'business', '{
  "max_locations": 5, 
  "max_staff": 9999, 
  "monthly_reservations": 3000,
  "whatsapp_conversation_limit": 1000,
  "mobile_access": true, 
  "features": ["whatsapp_bot", "table_management", "reservations_management", "digital_menu", "ai_advanced", "analytics_advanced", "mobile_app"]
}')
ON CONFLICT (stripe_price_id) DO UPDATE 
SET limits = excluded.limits, name = excluded.name, key = excluded.key;

-- 8. STORAGE (Consolidated)
INSERT INTO storage.buckets (id, name, public) VALUES ('compliance-docs', 'compliance-docs', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('location-logo', 'location-logo', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-files', 'menu-files', true) ON CONFLICT (id) DO NOTHING;

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

-- Menu Files Policies (org-based access via org_id in path)
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
