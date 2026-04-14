-- ==============================================================================
-- MIGRATION: Mailing list support
-- Date: 2026-04-14
-- Changes:
--   1. Add mailing_consent + mailing_consent_updated_at to profiles
--   2. Create mailing_campaigns table
-- ==============================================================================

-- 1. Aggiungi consenso mailing ai profili utente
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mailing_consent boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS mailing_consent_updated_at timestamptz;

-- 2. Crea la tabella per le campagne email
CREATE TABLE IF NOT EXISTS public.mailing_campaigns (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subject          text        NOT NULL,
  content_markdown text        NOT NULL,
  status           text        DEFAULT 'draft'
                               CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  sent_at          timestamptz,
  sent_by          uuid        REFERENCES public.profiles(id),
  recipients_count int         DEFAULT 0,
  resend_batch_ids text[],
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- RLS: la tabella è accessibile solo tramite service role (admin client)
ALTER TABLE public.mailing_campaigns ENABLE ROW LEVEL SECURITY;
