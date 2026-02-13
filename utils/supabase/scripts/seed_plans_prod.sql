-- ==============================================================================
-- SEED SUBSCRIPTION PLANS (PRODUCTION)
-- ==============================================================================
-- Run this script to populate the subscription_plans table with the 6 correct plans FOR PRODUCTION.
-- Replace the placeholders with your actual Production Stripe Price IDs.

INSERT INTO public.subscription_plans (stripe_price_id, name, key, limits)
VALUES
  -- ----------------------------------------------------------------------------
  -- 1. STARTER
  -- ----------------------------------------------------------------------------
  (
    'price_1SxV4sDjUndjjG7SxQfP7Ukh', -- Starter Monthly
    'Starter Monthly',
    'starter',
    '{
      "max_locations": 1,
      "max_staff": 2,
      "monthly_reservations": 300,
      "whatsapp_conversation_limit": 150,
      "mobile_access": false,
      "features": ["whatsapp_bot", "table_management", "reservations_management", "digital_menu", "ai_basic"]
    }'::jsonb
  ),
  (
    'price_1SxV58DjUndjjG7SHbZmOzI2', -- Starter Yearly
    'Starter Yearly',
    'starter_year',
    '{
      "max_locations": 1,
      "max_staff": 2,
      "monthly_reservations": 300,
      "whatsapp_conversation_limit": 150,
      "mobile_access": false,
      "features": ["whatsapp_bot", "table_management", "reservations_management", "digital_menu", "ai_basic"]
    }'::jsonb
  ),

  -- ----------------------------------------------------------------------------
  -- 2. GROWTH (PRO)
  -- ----------------------------------------------------------------------------
  (
    'price_1SxV5ZDjUndjjG7SszQI0CFL', -- Growth Monthly
    'Growth Monthly',
    'pro',
    '{
      "max_locations": 3,
      "max_staff": 5,
      "monthly_reservations": 1000,
      "whatsapp_conversation_limit": 400,
      "mobile_access": true,
      "features": ["whatsapp_bot", "table_management", "reservations_management", "digital_menu", "ai_basic", "mobile_app"]
    }'::jsonb
  ),
  (
    'price_1SxV5kDjUndjjG7SOxGtl5BD', -- Growth Yearly
    'Growth Yearly',
    'pro_year',
    '{
      "max_locations": 3,
      "max_staff": 5,
      "monthly_reservations": 1000,
      "whatsapp_conversation_limit": 400,
      "mobile_access": true,
      "features": ["whatsapp_bot", "table_management", "reservations_management", "digital_menu", "ai_basic", "mobile_app"]
    }'::jsonb
  ),

  -- ----------------------------------------------------------------------------
  -- 3. BUSINESS
  -- ----------------------------------------------------------------------------
  (
    'price_1SxV65DjUndjjG7S8R5OOe4B', -- Business Monthly
    'Business Monthly',
    'business',
    '{
      "max_locations": 5,
      "max_staff": 9999,
      "monthly_reservations": 3000,
      "whatsapp_conversation_limit": 1000,
      "mobile_access": true,
      "features": ["whatsapp_bot", "table_management", "reservations_management", "digital_menu", "ai_advanced", "analytics_advanced", "mobile_app"]
    }'::jsonb
  ),
  (
    'price_1SxV6EDjUndjjG7SKRl1w9vc', -- Business Yearly
    'Business Yearly',
    'business_year',
    '{
      "max_locations": 5,
      "max_staff": 9999,
      "monthly_reservations": 3000,
      "whatsapp_conversation_limit": 1000,
      "mobile_access": true,
      "features": ["whatsapp_bot", "table_management", "reservations_management", "digital_menu", "ai_advanced", "analytics_advanced", "mobile_app"]
    }'::jsonb
  )

ON CONFLICT (key) DO UPDATE
SET
  stripe_price_id = EXCLUDED.stripe_price_id, -- Update the ID if it changes
  name = EXCLUDED.name,
  limits = EXCLUDED.limits;
