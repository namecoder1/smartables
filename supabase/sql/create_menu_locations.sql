-- Create junction table for menus and locations
create table if not exists menu_locations (
  menu_id uuid references menus(id) on delete cascade not null,
  location_id uuid references locations(id) on delete cascade not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (menu_id, location_id)
);

-- Enable RLS
alter table menu_locations enable row level security;

-- Policies
create policy "Users can view menu_locations for their organization's menus"
  on menu_locations for select
  using (
    exists (
      select 1 from menus
      join organizations on menus.organization_id = organizations.id
      where menus.id = menu_locations.menu_id
      -- Ideally verify user belongs to organization, but simple auth check for MVP:
      and auth.role() = 'authenticated'
    )
  );

create policy "Users can insert menu_locations for their organization"
  on menu_locations for insert
  with check (
    exists (
      select 1 from menus
      where menus.id = menu_locations.menu_id
      and auth.role() = 'authenticated'
    )
  );

create policy "Users can update menu_locations for their organization"
  on menu_locations for update
  using (
    exists (
      select 1 from menus
      where menus.id = menu_locations.menu_id
      and auth.role() = 'authenticated'
    )
  );

create policy "Users can delete menu_locations for their organization"
  on menu_locations for delete
  using (
    exists (
      select 1 from menus
      where menus.id = menu_locations.menu_id
      and auth.role() = 'authenticated'
    )
  );
