-- ==============================================================================
-- RESET SCRIPT (Agency Model V3)
-- Description: Drops everything to clean the DB for a fresh start.
-- ==============================================================================

-- 1. DROP POLICIES
DROP POLICY IF EXISTS "Authenticated users can upload compliance docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read compliance docs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update compliance docs" ON storage.objects;

-- 2. DROP TABLES (Reverse Dependency Order)
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.message_logs CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.restaurant_tables CASCADE;
DROP TABLE IF EXISTS public.restaurant_zones CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.menu_locations CASCADE;
-- Circular dependency between locations and regulatory reqs handling
-- Use CASCADE to handle constraint drops automatically
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.telnyx_regulatory_requirements CASCADE;
DROP TABLE IF EXISTS public.menus CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- 3. DROP FUNCTIONS & TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_auth_organization_id();

-- 4. DROP TYPES
DROP TYPE IF EXISTS compliance_status;
DROP TYPE IF EXISTS transaction_type;
DROP TYPE IF EXISTS booking_source;
DROP TYPE IF EXISTS booking_status;

-- 5. STORAGE BUCKET (Optional: Cleaning bucket if you want to wipe files too)
-- DELETE FROM storage.objects WHERE bucket_id = 'compliance-docs';
-- DELETE FROM storage.buckets WHERE id = 'compliance-docs';