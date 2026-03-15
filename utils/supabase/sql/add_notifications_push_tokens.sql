-- Migration: Add notifications and push_tokens tables

-- ── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  location_id uuid,
  type text NOT NULL CHECK (type = ANY (ARRAY[
    'new_booking'::text,
    'new_customer'::text,
    'new_order'::text,
    'whatsapp_limit_warning'::text
  ])),
  title text NOT NULL,
  body text,
  link text,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT notifications_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE
);

CREATE INDEX notifications_org_unread_idx ON public.notifications (organization_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can read notifications for their own organization
CREATE POLICY "notifications_select_own_org"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (organization_id = (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Users can mark notifications as read (UPDATE is_read only) for their own org
CREATE POLICY "notifications_update_own_org"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (organization_id = (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ))
  WITH CHECK (organization_id = (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Only service_role can insert notifications (server-side only, via admin client)
-- No INSERT policy for authenticated users → inserts are blocked for regular users


-- ── Push Tokens ───────────────────────────────────────────────────────────────
CREATE TABLE public.push_tokens (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  profile_id uuid,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform = ANY (ARRAY['ios'::text, 'android'::text, 'web'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT push_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT push_tokens_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT push_tokens_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX push_tokens_token_idx ON public.push_tokens (token);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can read only their own tokens
CREATE POLICY "push_tokens_select_own"
  ON public.push_tokens FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Users can register their own token
CREATE POLICY "push_tokens_insert_own"
  ON public.push_tokens FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Users can update (refresh) their own token
CREATE POLICY "push_tokens_update_own"
  ON public.push_tokens FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Users can delete (unregister) their own token
CREATE POLICY "push_tokens_delete_own"
  ON public.push_tokens FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());
