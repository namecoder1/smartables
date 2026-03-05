-- ============================================================
-- PROMOTIONS FEATURE — SQL MIGRATION
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Create promotion_type enum
CREATE TYPE promotion_type AS ENUM (
  'percentage',
  'fixed_amount',
  'bundle',
  'cover_override'
);

-- 2. Create promotion_item_target_type enum
CREATE TYPE promotion_item_target_type AS ENUM (
  'menu_item',
  'category',
  'full_menu',
  'cover'
);

-- 3. Create promotion_item_role enum
CREATE TYPE promotion_item_role AS ENUM (
  'target',
  'condition'
);

-- ============================================================
-- TABLES
-- ============================================================

-- 4. Main promotions table
CREATE TABLE public.promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,

  -- Info
  name text NOT NULL,
  description text,
  image_url text,

  -- Type & Value
  type promotion_type NOT NULL DEFAULT 'percentage',
  value numeric,

  -- Scope
  all_locations boolean DEFAULT false,
  all_menus boolean DEFAULT false,

  -- Validity
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  recurring_schedule jsonb,  -- e.g. {"days":["mon","tue"],"from":"12:00","to":"15:00"}

  -- Loyalty / Visit threshold
  visit_threshold integer,

  -- Control
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  stackable boolean DEFAULT false,

  -- Notification
  notify_via_whatsapp boolean DEFAULT false,

  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  CONSTRAINT promotions_pkey PRIMARY KEY (id),
  CONSTRAINT promotions_organization_id_fkey FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- 5. Promotion ↔ Locations junction
CREATE TABLE public.promotion_locations (
  promotion_id uuid NOT NULL,
  location_id uuid NOT NULL,

  CONSTRAINT promotion_locations_pkey PRIMARY KEY (promotion_id, location_id),
  CONSTRAINT promotion_locations_promotion_id_fkey FOREIGN KEY (promotion_id)
    REFERENCES public.promotions(id) ON DELETE CASCADE,
  CONSTRAINT promotion_locations_location_id_fkey FOREIGN KEY (location_id)
    REFERENCES public.locations(id) ON DELETE CASCADE
);

-- 6. Promotion ↔ Menus junction
CREATE TABLE public.promotion_menus (
  promotion_id uuid NOT NULL,
  menu_id uuid NOT NULL,

  CONSTRAINT promotion_menus_pkey PRIMARY KEY (promotion_id, menu_id),
  CONSTRAINT promotion_menus_promotion_id_fkey FOREIGN KEY (promotion_id)
    REFERENCES public.promotions(id) ON DELETE CASCADE,
  CONSTRAINT promotion_menus_menu_id_fkey FOREIGN KEY (menu_id)
    REFERENCES public.menus(id) ON DELETE CASCADE
);

-- 7. Promotion Items (what gets promoted / bundle conditions)
CREATE TABLE public.promotion_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  promotion_id uuid NOT NULL,

  target_type promotion_item_target_type NOT NULL DEFAULT 'menu_item',
  target_ref text,           -- item ID within menu JSONB content, or category name
                              -- NULL when target_type = 'full_menu' or 'cover'

  role promotion_item_role DEFAULT 'target',

  -- Override discount for this specific item (if different from parent promotion)
  override_value numeric,
  override_type text,        -- 'percentage', 'fixed_amount', 'free'

  CONSTRAINT promotion_items_pkey PRIMARY KEY (id),
  CONSTRAINT promotion_items_promotion_id_fkey FOREIGN KEY (promotion_id)
    REFERENCES public.promotions(id) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_promotions_organization_id ON public.promotions(organization_id);
CREATE INDEX idx_promotions_is_active ON public.promotions(is_active);
CREATE INDEX idx_promotion_locations_location_id ON public.promotion_locations(location_id);
CREATE INDEX idx_promotion_menus_menu_id ON public.promotion_menus(menu_id);
CREATE INDEX idx_promotion_items_promotion_id ON public.promotion_items(promotion_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_items ENABLE ROW LEVEL SECURITY;

-- Promotions: users can manage promotions belonging to their organization
CREATE POLICY "Users can view own organization promotions"
  ON public.promotions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own organization promotions"
  ON public.promotions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own organization promotions"
  ON public.promotions FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own organization promotions"
  ON public.promotions FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Promotion Locations: access via promotion's organization
CREATE POLICY "Users can manage promotion_locations"
  ON public.promotion_locations FOR ALL
  USING (
    promotion_id IN (
      SELECT id FROM public.promotions WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Promotion Menus: access via promotion's organization
CREATE POLICY "Users can manage promotion_menus"
  ON public.promotion_menus FOR ALL
  USING (
    promotion_id IN (
      SELECT id FROM public.promotions WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Promotion Items: access via promotion's organization
CREATE POLICY "Users can manage promotion_items"
  ON public.promotion_items FOR ALL
  USING (
    promotion_id IN (
      SELECT id FROM public.promotions WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('promotion-images', 'promotion-images', true)
ON CONFLICT (id) DO NOTHING;

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
