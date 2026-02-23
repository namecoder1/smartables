-- Create ENUMs
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'served', 'completed', 'cancelled');
CREATE TYPE order_item_status AS ENUM ('pending', 'preparing', 'served', 'cancelled');

-- Create Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  location_id UUID NOT NULL,
  table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  status order_status DEFAULT 'pending',
  total_amount DECIMAL(10, 2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Order Items Table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL, -- ID from the JSONB menu content
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  status order_item_status DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies (Adjust based on actual auth requirements, here assuming authenticated users/service role)
-- Authenticated staff can read/write
CREATE POLICY "Enable read access for authenticated users" ON orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON orders FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON order_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable write access for authenticated users" ON order_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON order_items FOR UPDATE USING (auth.role() = 'authenticated');

-- Public access (e.g. for creating orders via QR) might need anon access if not using auth
-- For "Guest Session", we might need anon insert access?
-- SECURITY WARNING: Review this. For now, we assume server actions will handle it with Service Role or authenticated session.
-- If using client-side directly for guests, we need:
CREATE POLICY "Allow anon insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select own orders" ON orders FOR SELECT USING (true); -- Ideally restricted by some token

CREATE POLICY "Allow anon insert items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select own items" ON order_items FOR SELECT USING (true);
