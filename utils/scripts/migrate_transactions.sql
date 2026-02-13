-- ==============================================================================
-- MIGRATION: REFACTOR TRANSACTIONS FOR STRIPE & REMOVE PAYMENTS
-- ==============================================================================

-- 1. Drop unused 'payments' table
DROP TABLE IF EXISTS public.payments;
DROP TYPE IF EXISTS payment_type;
DROP TYPE IF EXISTS payment_status;

-- 2. Modify 'transactions' table to support Stripe history
-- We need to check if existing columns need to be dropped or types changed.
-- Existing 'type' enum might need updates. Let's recreate the type.

-- First, drop the dependency on 'type' column to update the enum
ALTER TABLE public.transactions DROP COLUMN IF EXISTS type;
DROP TYPE IF EXISTS transaction_type;

-- Create new transaction_type enum
CREATE TYPE transaction_type AS ENUM ('subscription', 'usage', 'topup', 'bonus', 'refund', 'adjustment');

-- Re-add columns and new Stripe logic
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS type transaction_type DEFAULT 'subscription',
  ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'eur',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'succeeded', -- succeeded, pending, failed
  ADD COLUMN IF NOT EXISTS invoice_pdf text,
  ADD COLUMN IF NOT EXISTS period_start timestamp with time zone,
  ADD COLUMN IF NOT EXISTS period_end timestamp with time zone;

-- Optional: If you had data in 'transactions', you lost the 'type' column data. 
-- Assuming 'transactions' was empty or data was disposable as per user instruction.

-- 3. Cleanup OTP logic in codebase (This script only handles DB)
