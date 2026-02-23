-- Add 'ready' to order_status enum
-- This needs to be run in Supabase SQL editor or via migration
ALTER TYPE order_status ADD VALUE 'ready' BEFORE 'served';
