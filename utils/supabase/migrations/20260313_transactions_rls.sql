-- Migration: enable RLS and create policies for transactions table
-- All organization members (including location-scoped staff) can SELECT and INSERT
-- Service role bypasses RLS automatically (Stripe webhooks)

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view transactions"
  ON public.transactions
  FOR SELECT
  USING (organization_id = public.get_auth_organization_id());

CREATE POLICY "Org members can insert transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (organization_id = public.get_auth_organization_id());
