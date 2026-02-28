---
name: rls-policies
description: Supabase RLS 정책 패턴 (posts, comments 테이블). 새로운 RLS 정책 작성 시 사용.
---

## RLS 정책 예시

### posts 테이블

```sql
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: 공개 글은 누구나 조회
CREATE POLICY "Anyone can view published posts"
ON posts FOR SELECT
USING (published = true);

-- 2. SELECT: 관리자는 모든 글 조회
CREATE POLICY "Admins can view all posts"
ON posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 3. INSERT: 관리자만 글 작성
CREATE POLICY "Only admins can insert posts"
ON posts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 4. UPDATE: 관리자만 글 수정
CREATE POLICY "Only admins can update posts"
ON posts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 5. DELETE: 관리자만 글 삭제
CREATE POLICY "Only admins can delete posts"
ON posts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

### comments 테이블

```sql
-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: 승인된 댓글은 누구나 조회
CREATE POLICY "Anyone can view approved comments"
ON comments FOR SELECT
USING (approved = true);

-- 2. INSERT: 인증된 사용자는 댓글 작성 가능
CREATE POLICY "Authenticated users can insert comments"
ON comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. UPDATE: 작성자 또는 관리자만 수정
CREATE POLICY "Authors and admins can update comments"
ON comments FOR UPDATE
USING (
  auth.uid() = author_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 4. DELETE: 작성자 또는 관리자만 삭제
CREATE POLICY "Authors and admins can delete comments"
ON comments FOR DELETE
USING (
  auth.uid() = author_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```
