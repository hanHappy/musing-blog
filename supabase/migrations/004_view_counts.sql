-- Add view count tracking to posts
ALTER TABLE posts ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;

-- Index for sorting by popularity
CREATE INDEX idx_posts_view_count ON posts(view_count DESC);

-- Atomic increment function (bypasses RLS safely)
CREATE OR REPLACE FUNCTION increment_view_count(post_slug TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE posts
  SET view_count = view_count + 1
  WHERE slug = post_slug AND published = true
  RETURNING view_count INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$;
