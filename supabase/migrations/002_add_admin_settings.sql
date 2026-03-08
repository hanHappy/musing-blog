-- Admin Settings Migration
-- Description: Creates app_settings table and function for admin email management

-- ============================================================================
-- APP SETTINGS TABLE
-- ============================================================================

-- Create settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert admin email
INSERT INTO app_settings (key, value)
VALUES ('admin_email', 'hansmin95@gmail.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================================
-- HELPER FUNCTION
-- ============================================================================

-- Function to get admin email
CREATE OR REPLACE FUNCTION get_admin_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT value FROM app_settings WHERE key = 'admin_email' LIMIT 1;
$$;

-- ============================================================================
-- UPDATE RLS POLICIES TO USE FUNCTION
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "categories_admin_all" ON categories;
DROP POLICY IF EXISTS "posts_select_admin" ON posts;
DROP POLICY IF EXISTS "posts_admin_all" ON posts;
DROP POLICY IF EXISTS "media_admin_all" ON media;
DROP POLICY IF EXISTS "post_embeddings_admin_all" ON post_embeddings;
DROP POLICY IF EXISTS "blog_images_admin_all" ON storage.objects;

-- Recreate policies with function
CREATE POLICY "categories_admin_all"
  ON categories FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = get_admin_email())
  WITH CHECK (auth.jwt() ->> 'email' = get_admin_email());

CREATE POLICY "posts_select_admin"
  ON posts FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = get_admin_email());

CREATE POLICY "posts_admin_all"
  ON posts FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = get_admin_email())
  WITH CHECK (auth.jwt() ->> 'email' = get_admin_email());

CREATE POLICY "media_admin_all"
  ON media FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = get_admin_email())
  WITH CHECK (auth.jwt() ->> 'email' = get_admin_email());

CREATE POLICY "post_embeddings_admin_all"
  ON post_embeddings FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = get_admin_email())
  WITH CHECK (auth.jwt() ->> 'email' = get_admin_email());

CREATE POLICY "blog_images_admin_all"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND auth.jwt() ->> 'email' = get_admin_email()
  )
  WITH CHECK (
    bucket_id = 'blog-images'
    AND auth.jwt() ->> 'email' = get_admin_email()
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Allow authenticated users to read admin email (for RLS checks)
GRANT SELECT ON app_settings TO authenticated, anon;

-- ============================================================================
-- USAGE
-- ============================================================================

-- To change admin email in the future:
-- UPDATE app_settings SET value = 'new-admin@example.com' WHERE key = 'admin_email';

-- To verify current admin email:
-- SELECT get_admin_email();
