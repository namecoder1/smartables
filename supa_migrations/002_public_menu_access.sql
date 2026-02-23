-- Enable RLS on tables (ensure it's on)
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- 1. MENUS: Allow public read access (SELECT) for everyone
-- Drop existing policy if any to avoid conflicts (optional, safe to create new one with unique name)
DROP POLICY IF EXISTS "Public can view menus" ON menus;
CREATE POLICY "Public can view menus" 
ON menus FOR SELECT 
TO public 
USING (true); -- Or (is_active = true) if you want to restrict to active menus only

-- 2. MENU_LOCATIONS: Allow public read access (if needed for lookups)
ALTER TABLE menu_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view menu_locations" ON menu_locations;
CREATE POLICY "Public can view menu_locations" 
ON menu_locations FOR SELECT 
TO public 
USING (true);
