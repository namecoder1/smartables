-- ==============================================================================
-- SEED SUBSCRIPTION PLANS
-- ==============================================================================
-- Run this script to populate the subscription_plans table with the 6 correct plans.
-- Ensure you have deleted conflicting old plans (specifically those with the same 'key' but different 'stripe_price_id')
-- to avoid unique constraint violations.

INSERT INTO public.subscription_plans (stripe_price_id, name, key, limits)
VALUES
  -- ----------------------------------------------------------------------------
  -- 1. STARTER
  -- ----------------------------------------------------------------------------
  (
    'price_1SuvWrDmWHgnXPDyqZ2gQbls', -- Monthly
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
    'price_1Sus34DmWHgnXPDyVEgoctUN', -- Yearly
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
    'price_1SusAEDmWHgnXPDyUUzEik6c', -- Monthly
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
    'price_1SusAiDmWHgnXPDyR4O5kF2O', -- Yearly
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
    'price_1SusB3DmWHgnXPDyggftPbfV', -- Monthly
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
    'price_1SusBKDmWHgnXPDyyetBeNzy', -- Yearly
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

ON CONFLICT (stripe_price_id) DO UPDATE
SET
  name = EXCLUDED.name,
  key = EXCLUDED.key,
  limits = EXCLUDED.limits;
