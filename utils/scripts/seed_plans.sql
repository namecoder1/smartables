-- ==============================================================================
-- SEED PLANS (Agency Model V3)
-- Run this in your Supabase SQL Editor
-- ==============================================================================

-- 1. STARTER PLANS
INSERT INTO public.subscription_plans (stripe_price_id, name, key, limits) VALUES 
('price_1SuvWrDmWHgnXPDyqZ2gQbls', 'Starter', 'starter', '{
  "max_locations": 1, 
  "max_staff": 2, 
  "monthly_reservations": 300,
  "whatsapp_conversation_limit": 150,
  "mobile_access": false, 
  "features": ["whatsapp_bot", "table_management", "reservations_management", "digital_menu", "ai_basic"]
}'),
('price_1Sus34DmWHgnXPDyVEgoctUN', 'Starter (Yearly)', 'starter_year', '{
  "max_locations": 1, 
  "max_staff": 2, 
  "monthly_reservations": 300,
  "whatsapp_conversation_limit": 150,
  "mobile_access": false, 
  "features": ["whatsapp_bot", "table_management", "reservations_management", "digital_menu", "ai_basic"]
}')
ON CONFLICT (stripe_price_id) DO UPDATE 
SET limits = excluded.limits, name = excluded.name, key = excluded.key;

-- 2. GROWTH PLANS
INSERT INTO public.subscription_plans (stripe_price_id, name, key, limits) VALUES 
('price_1SusAEDmWHgnXPDyUUzEik6c', 'Growth', 'pro', '{
  "max_locations": 3, 
  "max_staff": 5, 
  "monthly_reservations": 1000,
  "whatsapp_conversation_limit": 400,
  "mobile_access": true, 
  "features": ["whatsapp_bot", "table_management", "reservations_management", "digital_menu", "ai_basic", "mobile_app"]
}'),
('price_1SusAiDmWHgnXPDyR4O5kF2O', 'Growth (Yearly)', 'pro_year', '{
  "max_locations": 3, 
  "max_staff": 5, 
  "monthly_reservations": 1000,
  "whatsapp_conversation_limit": 400,
  "mobile_access": true, 
  "features": ["whatsapp_bot", "table_management", "reservations_management", "digital_menu", "ai_basic", "mobile_app"]
}')
ON CONFLICT (stripe_price_id) DO UPDATE 
SET limits = excluded.limits, name = excluded.name, key = excluded.key;

-- 3. BUSINESS PLANS
INSERT INTO public.subscription_plans (stripe_price_id, name, key, limits) VALUES 
('price_1SusB3DmWHgnXPDyggftPbfV', 'Business', 'business', '{
  "max_locations": 5, 
  "max_staff": 9999, 
  "monthly_reservations": 3000,
  "whatsapp_conversation_limit": 1000,
  "mobile_access": true, 
  "features": ["whatsapp_bot", "table_management", "reservations_management", "digital_menu", "ai_advanced", "analytics_advanced", "mobile_app"]
}'),
('price_1SusBKDmWHgnXPDyyetBeNzy', 'Business (Yearly)', 'business_year', '{
  "max_locations": 5, 
  "max_staff": 9999, 
  "monthly_reservations": 3000,
  "whatsapp_conversation_limit": 1000,
  "mobile_access": true, 
  "features": ["whatsapp_bot", "table_management", "reservations_management", "digital_menu", "ai_advanced", "analytics_advanced", "mobile_app"]
}')
ON CONFLICT (stripe_price_id) DO UPDATE 
SET limits = excluded.limits, name = excluded.name, key = excluded.key;

-- 4. SETUP FEE (Optional - Replace 'price_XXX' with actual ID)
-- Uncomment and replace if you have the ID ready
/*
INSERT INTO public.subscription_plans (stripe_price_id, name, key, limits) VALUES 
('price_SETUP_FEE_PLACEHOLDER', 'Setup Fee', 'setup_fee', '{}')
ON CONFLICT (stripe_price_id) DO UPDATE 
SET name = excluded.name, key = excluded.key;
*/
