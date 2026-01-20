-- Create the 'menu-files' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('menu-files', 'menu-files', true)
on conflict (id) do nothing;

-- Set up RLS for the 'menu-files' bucket
-- Allow public access to view files
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'menu-files' );

-- Allow authenticated users to upload files
-- Ideally, we should check if the user belongs to the organization in the folder path (orgId/filename)
-- But for MVP, allowing any authenticated user to upload to this bucket is often sufficient start.
-- A stricter policy would be:
-- using ( bucket_id = 'menu-files' and auth.role() = 'authenticated' and (storage.foldername(name))[1] in (select id::text from organizations where /* user in org */) )

create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'menu-files' and auth.role() = 'authenticated' );

create policy "Authenticated Update"
  on storage.objects for update
  using ( bucket_id = 'menu-files' and auth.role() = 'authenticated' );

create policy "Authenticated Delete"
  on storage.objects for delete
  using ( bucket_id = 'menu-files' and auth.role() = 'authenticated' );
