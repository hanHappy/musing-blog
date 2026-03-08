-- muse.log Initial Schema Migration
-- Created: 2026-03-08
-- Description: Creates tables for posts, categories, media, and embeddings with RLS policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Categories table (3-level hierarchy)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  "order" INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_categories_slug ON categories(slug);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published BOOLEAN DEFAULT false,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for faster queries
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Media table
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_media_created_at ON media(created_at DESC);

-- Post embeddings table (for RAG)
CREATE TABLE post_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id)
);

-- Create index for vector similarity search
CREATE INDEX idx_post_embeddings_post_id ON post_embeddings(post_id);
CREATE INDEX idx_post_embeddings_embedding ON post_embeddings USING ivfflat (embedding vector_cosine_ops);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_embeddings ENABLE ROW LEVEL SECURITY;

-- Categories policies
-- Public can read all categories
CREATE POLICY "categories_select_public"
  ON categories FOR SELECT
  TO public
  USING (true);

-- Only authenticated admin can insert/update/delete
CREATE POLICY "categories_admin_all"
  ON categories FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  );

-- Posts policies
-- Public can read published posts
CREATE POLICY "posts_select_published"
  ON posts FOR SELECT
  TO public
  USING (published = true);

-- Admin can read all posts
CREATE POLICY "posts_select_admin"
  ON posts FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  );

-- Only admin can insert/update/delete
CREATE POLICY "posts_admin_all"
  ON posts FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  );

-- Media policies
-- Admin only access
CREATE POLICY "media_admin_all"
  ON media FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  );

-- Post embeddings policies
-- Public can read (for RAG search)
CREATE POLICY "post_embeddings_select_public"
  ON post_embeddings FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_embeddings.post_id
      AND posts.published = true
    )
  );

-- Admin can do everything
CREATE POLICY "post_embeddings_admin_all"
  ON post_embeddings FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to search posts by vector similarity
CREATE OR REPLACE FUNCTION search_posts(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  slug TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    p.id,
    p.title,
    p.content,
    p.slug,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM posts p
  JOIN post_embeddings e ON p.id = e.post_id
  WHERE p.published = true
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- STORAGE (Supabase Storage for media files)
-- ============================================================================

-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for blog-images bucket
CREATE POLICY "blog_images_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'blog-images');

CREATE POLICY "blog_images_admin_all"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  )
  WITH CHECK (
    bucket_id = 'blog-images'
    AND auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  );

-- ============================================================================
-- SEED DATA (Optional - for development)
-- ============================================================================

-- Insert sample categories (3-level hierarchy)
-- Level 1: IT
INSERT INTO categories (id, name, slug, parent_id, level, "order")
VALUES
  ('00000000-0000-0000-0000-000000000001', 'IT', 'it', NULL, 1, 1);

-- Level 2: Backend, Frontend
INSERT INTO categories (id, name, slug, parent_id, level, "order")
VALUES
  ('00000000-0000-0000-0000-000000000002', 'Backend', 'backend', '00000000-0000-0000-0000-000000000001', 2, 1),
  ('00000000-0000-0000-0000-000000000003', 'Frontend', 'frontend', '00000000-0000-0000-0000-000000000001', 2, 2);

-- Level 3: Node.js, Python (Backend), React, Vue (Frontend)
INSERT INTO categories (id, name, slug, parent_id, level, "order")
VALUES
  ('00000000-0000-0000-0000-000000000004', 'Node.js', 'nodejs', '00000000-0000-0000-0000-000000000002', 3, 1),
  ('00000000-0000-0000-0000-000000000005', 'Python', 'python', '00000000-0000-0000-0000-000000000002', 3, 2),
  ('00000000-0000-0000-0000-000000000006', 'React', 'react', '00000000-0000-0000-0000-000000000003', 3, 1),
  ('00000000-0000-0000-0000-000000000007', 'Vue', 'vue', '00000000-0000-0000-0000-000000000003', 3, 2);

-- ============================================================================
-- NOTES
-- ============================================================================

-- Admin email should be set in Supabase Dashboard:
-- Settings > API > Custom PostgreSQL configuration
-- app.admin_email = 'your-admin@example.com'

-- To test RLS policies:
-- SET app.admin_email = 'admin@example.com';
-- SELECT * FROM posts;

-- To create vector index (after some data is inserted):
-- CREATE INDEX ON post_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
