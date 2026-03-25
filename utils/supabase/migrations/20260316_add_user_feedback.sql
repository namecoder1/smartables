-- ==============================================================================
-- Migration: 20260316_add_user_feedback.sql
-- Adds user_feedback table for feature requests, bug reports, and general
-- feedback from restaurant clients. Separate from `feedbacks` (churn/billing).
-- ==============================================================================

CREATE TABLE public.user_feedback (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id          UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Type of feedback
  type                TEXT        NOT NULL CHECK (type IN ('feature_request', 'bug_report', 'general', 'praise')),
  title               TEXT        NOT NULL,
  description         TEXT,
  -- Admin-managed fields
  status              TEXT        NOT NULL DEFAULT 'open'
                                  CHECK (status IN ('open', 'reviewing', 'planned', 'in_progress', 'done', 'wont_fix')),
  priority            TEXT        NOT NULL DEFAULT 'medium'
                                  CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  admin_response      TEXT,
  admin_responded_at  TIMESTAMPTZ,
  -- Optional extras
  metadata            JSONB       NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at trigger
CREATE TRIGGER trigger_user_feedback_updated_at
BEFORE UPDATE ON public.user_feedback
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_user_feedback_org     ON public.user_feedback(organization_id);
CREATE INDEX idx_user_feedback_status  ON public.user_feedback(status);
CREATE INDEX idx_user_feedback_type    ON public.user_feedback(type);
CREATE INDEX idx_user_feedback_created ON public.user_feedback(created_at DESC);

-- RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Clients can read their org's own feedback
CREATE POLICY "user_feedback_select_own_org" ON public.user_feedback
  FOR SELECT TO authenticated
  USING (organization_id = public.get_auth_organization_id());

-- Clients can submit feedback for their own org
CREATE POLICY "user_feedback_insert_own" ON public.user_feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_auth_organization_id()
    AND profile_id = auth.uid()
  );
