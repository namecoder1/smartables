-- ==============================================================================
-- SMARTABLES SUPABASE SCHEMA V2 (Compliance & Managed Accounts)
-- ==============================================================================

-- 1. CONFIGURAZIONE INIZIALE
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
-- (Mantengo i tuoi enum esistenti e ne aggiungo per la compliance)
DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'no_show', 'arrived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE booking_source AS ENUM ('whatsapp_auto', 'manual', 'web');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('usage', 'topup', 'bonus', 'subscription');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('succeeded', 'pending', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_type AS ENUM ('activation', 'topup');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Nuovo Enum per lo stato dei documenti Telnyx
DO $$ BEGIN
    CREATE TYPE compliance_status AS ENUM ('pending', 'approved', 'rejected', 'more_info_required');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. TABLES

-- ORGANIZATIONS (Updated)
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  billing_email text,
  credits numeric NOT NULL DEFAULT 0.00,
  activation_status text DEFAULT 'pending'::text CHECK (activation_status = ANY (ARRAY['pending'::text, 'active'::text])),
  
  -- Telnyx Managed Account Info
  telnyx_managed_account_id text UNIQUE, -- L'ID del sotto-account (es. "f73...")
  telnyx_api_key text, -- Opzionale: se vuoi salvare la chiave del managed account (cifrala se possibile)
  
  created_by uuid DEFAULT auth.uid(),
  otp text,
  otp_validity timestamp with time zone,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  stripe_status text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  slug text UNIQUE,
  CONSTRAINT organizations_pkey PRIMARY KEY (id),
  CONSTRAINT organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- TELNYX REGULATORY REQUIREMENTS (New Table)
-- Gestisce i documenti per prefisso (es. Un ristorante può avere sedi a Roma 06 e Milano 02)
CREATE TABLE public.telnyx_regulatory_requirements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  
  area_code text NOT NULL, -- es. "02", "051", "06"
  country_code text NOT NULL DEFAULT 'IT',
  
  telnyx_requirement_group_id text, -- ID del gruppo su Telnyx
  telnyx_bundle_request_id text, -- ID della richiesta di approvazione
  
  status compliance_status DEFAULT 'pending',
  rejection_reason text,
  
  documents_data jsonb DEFAULT '{}'::jsonb, -- Contiene gli ID dei documenti caricati
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT regulatory_pkey PRIMARY KEY (id),
  CONSTRAINT regulatory_org_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  -- Vincolo: Un solo requirement group per prefisso per organizzazione
  UNIQUE(organization_id, area_code)
);

-- LOCATIONS (Updated)
CREATE TABLE public.locations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  slug text,
  address text,
  phone_number text, -- Il numero fisso reale del ristorante
  opening_hours jsonb,
  branding jsonb,
  
  -- Telnyx Configuration
  telnyx_phone_number text UNIQUE, -- Il numero virtuale acquistato (+39051...)
  telnyx_connection_id text, -- ID della connessione SIP/Call Control
  telnyx_voice_app_id text, -- ID dell'App Call Control
  
  -- Relazione con la compliance
  regulatory_requirement_id uuid, 
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  seats smallint,
  CONSTRAINT locations_pkey PRIMARY KEY (id),
  CONSTRAINT locations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT locations_regulatory_fkey FOREIGN KEY (regulatory_requirement_id) REFERENCES public.telnyx_regulatory_requirements(id),
  UNIQUE(organization_id, slug)
);

-- PROFILES
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  organization_id uuid,
  full_name text,
  role text DEFAULT 'admin'::text CHECK (role = ANY (ARRAY['admin'::text, 'staff'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- CUSTOMERS
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  phone_number text NOT NULL,
  name text,
  total_visits integer DEFAULT 0,
  last_visit timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- MENUS
CREATE TABLE public.menus (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  pdf_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  content jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT menus_pkey PRIMARY KEY (id),
  CONSTRAINT menus_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- MENU LOCATIONS
CREATE TABLE public.menu_locations (
  menu_id uuid NOT NULL,
  location_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  CONSTRAINT menu_locations_pkey PRIMARY KEY (menu_id, location_id),
  CONSTRAINT menu_locations_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus(id),
  CONSTRAINT menu_locations_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);

-- BOOKINGS
CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  location_id uuid NOT NULL,
  customer_id uuid,
  guest_name text NOT NULL,
  guest_phone text NOT NULL,
  booking_time timestamp with time zone NOT NULL,
  guests_count integer NOT NULL CHECK (guests_count > 0),
  status booking_status NOT NULL DEFAULT 'pending',
  source booking_source NOT NULL DEFAULT 'manual',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT bookings_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id),
  CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id)
);

-- PAYMENTS
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'eur'::text,
  status payment_status NOT NULL DEFAULT 'pending',
  type payment_type NOT NULL,
  stripe_payment_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  amount numeric NOT NULL,
  type transaction_type NOT NULL,
  description text,
  reference_id uuid, -- Può riferirsi a payment_id o booking_id o call_id
  metadata jsonb, -- Per salvare dettagli Telnyx (es. call_duration, message_parts)
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);

-- 4. INDEXES (Cruciale per performance Webhook)

-- Hash index per lookup O(1) del numero chiamato
CREATE INDEX idx_locations_telnyx_phone_hash ON public.locations USING HASH (telnyx_phone_number);
-- Index standard per FK
CREATE INDEX idx_bookings_location ON public.bookings(location_id);
CREATE INDEX idx_customers_phone ON public.customers(phone_number);

-- 5. RLS (ROW LEVEL SECURITY)

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telnyx_regulatory_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_locations ENABLE ROW LEVEL SECURITY;

-- Helper Function
CREATE OR REPLACE FUNCTION public.get_auth_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

-- POLICIES (Esempio base, da espandere come nel tuo script originale)

-- Organizations
CREATE POLICY "Users can view own organization" ON public.organizations 
  FOR SELECT USING (id = public.get_auth_organization_id() OR created_by = auth.uid());
CREATE POLICY "Users can update own organization" ON public.organizations 
  FOR UPDATE USING (id = public.get_auth_organization_id() OR created_by = auth.uid());

-- Regulatory Requirements
CREATE POLICY "Users can view own regulatory" ON public.telnyx_regulatory_requirements
  FOR SELECT USING (organization_id = public.get_auth_organization_id());
CREATE POLICY "Users can insert own regulatory" ON public.telnyx_regulatory_requirements
  FOR INSERT WITH CHECK (organization_id = public.get_auth_organization_id());
CREATE POLICY "Users can update own regulatory" ON public.telnyx_regulatory_requirements
  FOR UPDATE USING (organization_id = public.get_auth_organization_id());

-- Locations
CREATE POLICY "Users can view org locations" ON public.locations 
  FOR SELECT USING (organization_id = public.get_auth_organization_id());
-- Importante: Service Role (Webhooks) bypassa RLS, quindi non serve policy per il bot.

-- 6. LOGICA DI BILLING (Stored Procedure Atomica)

CREATE OR REPLACE FUNCTION public.deduct_organization_credits(
  p_organization_id uuid,
  p_amount numeric,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits numeric;
BEGIN
  -- Lock row for update to prevent race conditions
  SELECT credits INTO v_current_credits
  FROM public.organizations
  WHERE id = p_organization_id
  FOR UPDATE;

  IF v_current_credits >= p_amount THEN
    -- Deduct credits
    UPDATE public.organizations
    SET credits = credits - p_amount
    WHERE id = p_organization_id;

    -- Log transaction
    INSERT INTO public.transactions (organization_id, amount, type, description, metadata)
    VALUES (p_organization_id, -p_amount, 'usage', p_description, p_metadata);

    RETURN true;
  ELSE
    RETURN false; -- Insufficient funds
  END IF;
END;
$$;

-- 7. TRIGGERS

-- Automazione Creazione Profilo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, organization_id)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', null); 
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Bucket storage rimangono invariati dal tuo script (menu-images, menu-files)
-- Aggiungere eventualmente bucket 'compliance-docs' privato