-- Tag System Migration
-- Created: 2026-03-18
-- Description: Adds tags, post_tags, and tag_relations tables with co-occurrence triggers

-- ============================================================================
-- TABLES
-- ============================================================================

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL DEFAULT '#00FFC8',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post-Tag junction table (many-to-many)
CREATE TABLE post_tags (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, tag_id)
);

-- Tag co-occurrence relations
-- tag_a < tag_b constraint ensures each pair stored exactly once
CREATE TABLE tag_relations (
  tag_a UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  tag_b UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  strength INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tag_a, tag_b),
  CONSTRAINT tag_relations_order CHECK (tag_a < tag_b)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tag_relations_tag_a ON tag_relations(tag_a);
CREATE INDEX idx_tag_relations_tag_b ON tag_relations(tag_b);

-- ============================================================================
-- TRIGGERS (updated_at)
-- ============================================================================

CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- CO-OCCURRENCE TRIGGER FUNCTIONS
-- ============================================================================

-- When a tag is added to a post, increment co-occurrence with all other tags on that post
CREATE OR REPLACE FUNCTION update_tag_relations_on_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  other_tag_id UUID;
  a UUID;
  b UUID;
BEGIN
  FOR other_tag_id IN
    SELECT tag_id FROM post_tags
    WHERE post_id = NEW.post_id AND tag_id != NEW.tag_id
  LOOP
    a := LEAST(NEW.tag_id, other_tag_id);
    b := GREATEST(NEW.tag_id, other_tag_id);
    INSERT INTO tag_relations (tag_a, tag_b, strength)
    VALUES (a, b, 1)
    ON CONFLICT (tag_a, tag_b)
    DO UPDATE SET strength = tag_relations.strength + 1, updated_at = NOW();
  END LOOP;
  RETURN NEW;
END;
$$;

-- When a tag is removed from a post, decrement co-occurrence and clean up zeros
CREATE OR REPLACE FUNCTION update_tag_relations_on_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  other_tag_id UUID;
  a UUID;
  b UUID;
BEGIN
  FOR other_tag_id IN
    SELECT tag_id FROM post_tags
    WHERE post_id = OLD.post_id AND tag_id != OLD.tag_id
  LOOP
    a := LEAST(OLD.tag_id, other_tag_id);
    b := GREATEST(OLD.tag_id, other_tag_id);
    UPDATE tag_relations
    SET strength = strength - 1, updated_at = NOW()
    WHERE tag_a = a AND tag_b = b;
    DELETE FROM tag_relations WHERE tag_a = a AND tag_b = b AND strength <= 0;
  END LOOP;
  RETURN OLD;
END;
$$;

CREATE TRIGGER post_tags_insert_relations
  AFTER INSERT ON post_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_tag_relations_on_insert();

CREATE TRIGGER post_tags_delete_relations
  AFTER DELETE ON post_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_tag_relations_on_delete();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_relations ENABLE ROW LEVEL SECURITY;

-- Tags: public read, admin write
CREATE POLICY tags_select_public ON tags FOR SELECT USING (true);
CREATE POLICY tags_admin_all ON tags FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = public.get_admin_email())
  WITH CHECK ((auth.jwt() ->> 'email') = public.get_admin_email());

-- Post tags: public read, admin write
CREATE POLICY post_tags_select_public ON post_tags FOR SELECT USING (true);
CREATE POLICY post_tags_admin_all ON post_tags FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = public.get_admin_email())
  WITH CHECK ((auth.jwt() ->> 'email') = public.get_admin_email());

-- Tag relations: public read, admin write (trigger-managed but admin can also modify)
CREATE POLICY tag_relations_select_public ON tag_relations FOR SELECT USING (true);
CREATE POLICY tag_relations_admin_all ON tag_relations FOR ALL TO authenticated
  USING ((auth.jwt() ->> 'email') = public.get_admin_email())
  WITH CHECK ((auth.jwt() ->> 'email') = public.get_admin_email());

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON TABLE public.tags TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.post_tags TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.tag_relations TO anon, authenticated, service_role;
