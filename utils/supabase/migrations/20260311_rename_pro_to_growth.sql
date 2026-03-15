-- Rename plan key 'pro' → 'growth' in subscription_plans
UPDATE public.subscription_plans SET key = 'growth' WHERE key = 'pro';
UPDATE public.subscription_plans SET key = 'growth_year' WHERE key = 'pro_year';

-- Update billing_tier in organizations
UPDATE public.organizations SET billing_tier = 'growth' WHERE billing_tier = 'pro';
