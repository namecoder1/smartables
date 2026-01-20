-- 1. Add SLUG to Organizations and Locations
alter table public.organizations add column if not exists slug text unique;
alter table public.locations add column if not exists slug text;

-- Aggiungi vincolo di unicità composto per locations
alter table public.locations drop constraint if exists locations_organization_id_slug_key;
create unique index if not exists locations_organization_id_slug_key on public.locations (organization_id, slug);

-- 2. Update Menus Table
alter table public.menus add column if not exists pdf_url text;

-- 3. Create Menu Locations Junction Table
create table if not exists public.menu_locations (
  menu_id uuid references public.menus(id) on delete cascade not null,
  location_id uuid references public.locations(id) on delete cascade not null,
  is_active boolean default true, 
  primary key (menu_id, location_id)
);

-- 4. Enable RLS on new table
alter table public.menu_locations enable row level security;

-- 5. Add Policies for Menu Locations
create policy "Menu locations are viewable by everyone" 
  on public.menu_locations for select 
  using (true);

create policy "Users can manage org menu locations" 
  on public.menu_locations for all 
  using (
    location_id in (
      select id from public.locations 
      where organization_id = public.get_auth_organization_id()
    )
  );

-- 6. Update Menu Categories (If not already updated to link to menu_id instead of organization_id)
-- WARNING: This assumes you are okay with dropping existing menu structure if it existed.
-- If you had data, you'd need a migration. Assuming DEV mode -> RESET.
-- Se hai dati, esegui SOLO se sai cosa fai. Altrimenti Reset completo.

-- Aggiorniamo anche le vecchie tabelle se non sono allineate (opzionale se hai resettato)
-- alter table public.menu_categories add column if not exists menu_id uuid references public.menus(id) on delete cascade;
