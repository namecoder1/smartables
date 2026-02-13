-- Create feedbacks table (generic feedback system)
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'general',
  reason text,
  message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feedbacks_pkey PRIMARY KEY (id),
  CONSTRAINT feedbacks_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT feedbacks_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Org users can view feedbacks" ON public.feedbacks
  FOR SELECT USING (organization_id = public.get_auth_organization_id());

CREATE POLICY "Authenticated users can insert feedbacks" ON public.feedbacks
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
