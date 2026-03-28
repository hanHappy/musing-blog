-- Post Chunks Migration (RAG Phase 1)
-- Created: 2026-03-22
-- Description: Adds post_chunks table for chunk-based embeddings and search_chunks RPC

-- ============================================================================
-- TABLE
-- ============================================================================

CREATE TABLE post_chunks (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  heading TEXT,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, chunk_index)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_post_chunks_post_id ON post_chunks(post_id);
CREATE INDEX idx_post_chunks_embedding ON post_chunks
  USING ivfflat (embedding vector_cosine_ops);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE post_chunks ENABLE ROW LEVEL SECURITY;

-- Public can read chunks for published posts only
CREATE POLICY post_chunks_select_public ON post_chunks
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_chunks.post_id
      AND posts.published = true
    )
  );

-- Admin has full access
CREATE POLICY post_chunks_admin_all ON post_chunks
  FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = public.get_admin_email())
  WITH CHECK ((auth.jwt() ->> 'email') = public.get_admin_email());

-- ============================================================================
-- SEARCH FUNCTION (chunk-based)
-- ============================================================================

CREATE OR REPLACE FUNCTION search_chunks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  chunk_id UUID,
  post_id UUID,
  title TEXT,
  slug TEXT,
  chunk_text TEXT,
  heading TEXT,
  chunk_index INTEGER,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    c.id AS chunk_id,
    p.id AS post_id,
    p.title,
    p.slug,
    c.chunk_text,
    c.heading,
    c.chunk_index,
    c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM post_chunks c
  JOIN posts p ON p.id = c.post_id
  WHERE p.published = true
    AND c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON TABLE public.post_chunks TO anon, authenticated, service_role;
