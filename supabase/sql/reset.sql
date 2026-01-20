-- ==============================================================================
-- SMARTABLES RESET SCRIPT V2 (Include pulizia Compliance & Billing)
-- ==============================================================================
-- ⚠️ ATTENZIONE: Questo script CANCELLA TUTTO.
-- ==============================================================================

-- 1. DROP STORAGE POLICIES
-- (Questi rimangono uguali perché i bucket non sono cambiati)
drop policy if exists "Menu images are public" on storage.objects;
drop policy if exists "Users can upload menu images to own folder" on storage.objects;
drop policy if exists "Users can update own menu images" on storage.objects;
drop policy if exists "Users can delete own menu images" on storage.objects;

drop policy if exists "Menu files are public" on storage.objects;
drop policy if exists "Users can upload menu files" on storage.objects;
drop policy if exists "Users can update menu files" on storage.objects;
drop policy if exists "Users can delete menu files" on storage.objects;

-- 2. DROP TRIGGERS & FUNCTIONS
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.get_auth_organization_id() cascade;

-- [NOVITÀ] Rimuove la funzione di gestione crediti atomica
drop function if exists public.deduct_organization_credits(uuid, numeric, text, jsonb) cascade;

-- 3. DROP TABLES 
-- L'ordine è ottimizzato per evitare conflitti di Foreign Keys, 
-- ma il CASCADE risolve comunque la maggior parte dei problemi.

drop table if exists public.menu_locations cascade;
drop table if exists public.bookings cascade;
drop table if exists public.transactions cascade;
drop table if exists public.payments cascade;
drop table if exists public.menus cascade;
drop table if exists public.customers cascade;

-- [NOVITÀ] Rimuoviamo locations che ora dipende da regulatory
drop table if exists public.locations cascade;

-- [NOVITÀ] Tabella Compliance Telnyx
drop table if exists public.telnyx_regulatory_requirements cascade;

drop table if exists public.profiles cascade;
drop table if exists public.organizations cascade; 

-- Legacy cleanup (pulizia vecchie tabelle se presenti)
drop table if exists public.menu_item_variants cascade;
drop table if exists public.menu_items cascade;
drop table if exists public.menu_categories cascade;

-- 4. DROP TYPES
-- Tipi standard
drop type if exists public.booking_status cascade;
drop type if exists public.booking_source cascade;
drop type if exists public.transaction_type cascade;
drop type if exists public.payment_status cascade;
drop type if exists public.payment_type cascade;

-- [NOVITÀ] Tipo per lo stato dei documenti
drop type if exists public.compliance_status cascade;