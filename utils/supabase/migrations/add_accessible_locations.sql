-- Add accessible_locations array column to profiles table
-- This allows restricting which locations a user can access within their organization.
-- If null, the user has access to all locations (default behavior).

ALTER TABLE profiles
ADD COLUMN accessible_locations uuid[] DEFAULT NULL;
