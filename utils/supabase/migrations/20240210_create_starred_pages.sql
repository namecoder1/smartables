-- Create starred_pages table
CREATE TABLE IF NOT EXISTS public.starred_pages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL,
  url text NOT NULL,
  title text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT starred_pages_pkey PRIMARY KEY (id),
  CONSTRAINT starred_pages_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT starred_pages_profile_id_url_key UNIQUE (profile_id, url)
);

-- Enable RLS
ALTER TABLE public.starred_pages ENABLE ROW LEVEL SECURITY;

-- create policy "Users can view own starred pages"
CREATE POLICY "Users can view own starred pages" ON public.starred_pages
  FOR SELECT USING (profile_id = auth.uid());

-- create policy "Users can insert own starred pages"
CREATE POLICY "Users can insert own starred pages" ON public.starred_pages
  FOR INSERT WITH CHECK (profile_id = auth.uid());

-- create policy "Users can delete own starred pages"
CREATE POLICY "Users can delete own starred pages" ON public.starred_pages
  FOR DELETE USING (profile_id = auth.uid());
