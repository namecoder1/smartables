-- Drop redundant columns from organizations table
DROP COLUMN IF EXISTS otp,
DROP COLUMN IF EXISTS otp_validity,
DROP COLUMN IF EXISTS subscription_tier,
DROP COLUMN IF EXISTS plan_msg_limit;
