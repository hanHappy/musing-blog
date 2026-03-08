# muse.log 어드민 페이지 구현 설계 문서

## 1. 데이터베이스 스키마 설계 이유

### 1.1 posts 테이블
```sql
posts (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,           -- 마크다운 원본
  excerpt TEXT,                     -- 요약문 (카드에 표시)
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published BOOLEAN DEFAULT false,  -- 공개/비공개
  author_id UUID REFERENCES auth.users(id)
)
```

**설계 이유:**
- `slug`: URL에 사용 (SEO 친화적, 한글 제목 → 영문 slug)
- `content`: 마크다운 원본 저장 (빌드타임에 HTML 변환하여 정적 생성)
- `excerpt`: 포스트 카드에 표시할 요약문 (자동 생성 또는 수동 작성)
- `published`: 초안 작성 후 나중에 공개 가능 (비공개 상태에서 미리보기)
- `author_id`: 향후 다중 작성자 지원 가능 (현재는 관리자 1명)

**비용 최적화:**
- 마크다운 → HTML 변환은 빌드타임에 수행 (런타임 연산 제거)
- `excerpt`를 별도 저장 (매번 content에서 추출하지 않음)

---

### 1.2 categories 테이블 (3레벨 계층 구조)
```sql
categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id), -- 상위 카테고리
  level INTEGER NOT NULL,                    -- 1, 2, 3 (계층 레벨)
  order INTEGER DEFAULT 0,                   -- 정렬 순서
  description TEXT
)
```

**3레벨 계층 예시:**
```
개발 (level 1)
├── Frontend (level 2)
│   ├── React (level 3)
│   └── Vue (level 3)
└── Backend (level 2)
    ├── Node.js (level 3)
    └── Python (level 3)
```

**설계 이유:**
- `parent_id`: 자기 참조 외래키로 트리 구조 구현
- `level`: 쿼리 최적화 (WHERE level = 1로 최상위만 조회)
- `order`: 같은 레벨 내 정렬 순서 지정 (드래그 앤 드롭으로 변경 가능)

**쿼리 전략:**
- 전체 카테고리 트리를 한 번에 조회 후 클라이언트에서 재구성
- 비용 절감: DB 쿼리 1회 + 클라이언트 메모리 내 처리

---

### 1.3 media 테이블
```sql
media (
  id UUID PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,               -- Supabase Storage URL
  alt_text TEXT,
  size INTEGER,                     -- 파일 크기 (bytes)
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

**설계 이유:**
- 업로드된 이미지 메타데이터 저장
- `url`: Supabase Storage에 저장 후 public URL
- `alt_text`: 접근성 + SEO
- `size`: Storage 용량 관리 (무료 플랜 1GB 제한)

**비용 최적화:**
- Supabase Storage 사용 (외부 CDN 금지)
- 이미지 최적화는 빌드타임 또는 업로드 시 처리

---

### 1.4 post_embeddings 테이블 (RAG용)
```sql
post_embeddings (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  embedding VECTOR(1536),           -- OpenAI text-embedding-3-small
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

**설계 이유:**
- OpenAI Embeddings API로 생성한 벡터 저장
- `VECTOR(1536)`: pgvector 확장 사용 (Supabase 기본 지원)
- `ON DELETE CASCADE`: 포스트 삭제 시 임베딩도 자동 삭제

**RAG 동작 방식:**
1. 포스트 작성/수정 시 자동으로 임베딩 생성
2. 사용자 질문 → OpenAI로 질문 임베딩 생성
3. pgvector로 유사도 검색 (cosine similarity)
4. 상위 3~5개 포스트 내용을 컨텍스트로 OpenAI API 호출

---

## 2. 캐시 전략 설명

### 2.1 Next.js 렌더링 전략 개요

**Static Generation (SG)** vs **Incremental Static Regeneration (ISR)** vs **Server-Side Rendering (SSR)**

| 전략 | 렌더링 시점 | 비용 | 사용 예시 |
|------|-------------|------|-----------|
| **SG** | 빌드타임 (1회) | 무료 | 완전 정적 페이지 (About) |
| **ISR** | 빌드타임 + 주기적 재생성 | 거의 무료 | 블로그 포스트 목록 |
| **SSR** | 매 요청마다 | 유료 (함수 호출 비용) | 실시간 데이터 |

**muse.log 선택: ISR 중심 전략** (비용 제로 수렴)

---

### 2.2 ISR (Incremental Static Regeneration) 상세

**원리:**
```typescript
export const revalidate = 3600; // 1시간

async function getData() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 3600 } // 또는 페이지 레벨에서 설정
  });
  return res.json();
}
```

**동작 방식:**
1. **첫 요청**: 빌드타임에 생성된 정적 HTML 제공 (초고속)
2. **revalidate 시간 경과 후 첫 요청**:
   - 기존 캐시된 HTML 즉시 반환 (사용자는 기다리지 않음)
   - 백그라운드에서 새로운 버전 생성
3. **다음 요청부터**: 새로 생성된 HTML 제공

**장점:**
- 사용자는 항상 즉시 응답 받음 (CDN 속도)
- 서버 부하 최소화 (revalidate 주기만큼만 재생성)
- Vercel 무료 플랜에서도 무제한 사용 가능

---

### 2.3 muse.log 캐시 전략 상세

#### 포스트 목록 페이지 (`/`)
```typescript
// src/app/page.tsx
export const revalidate = 3600; // 1시간

async function getPosts() {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });
  return data;
}
```

**설정 이유:**
- 새 글 작성 후 최대 1시간 후 목록에 반영
- 1시간 동안은 서버 요청 0회 (완전 정적)
- 1시간마다 1회만 DB 쿼리 (수천 명이 방문해도 쿼리 1회)

---

#### 개별 포스트 페이지 (`/posts/[slug]`)
```typescript
// src/app/posts/[slug]/page.tsx
export const revalidate = 1800; // 30분

async function getPost(slug: string) {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .single();
  return data;
}

// 빌드타임에 모든 포스트 경로 생성
export async function generateStaticParams() {
  const { data: posts } = await supabase
    .from('posts')
    .select('slug')
    .eq('published', true);

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
```

**설정 이유:**
- `generateStaticParams`: 빌드 시 모든 포스트 미리 생성
- 30분마다 재생성 (포스트 수정 후 최대 30분 후 반영)
- 새 포스트는 첫 방문 시 on-demand로 생성 (Vercel 자동 지원)

---

#### 카테고리 페이지 (`/category/[slug]`)
```typescript
export const revalidate = 86400; // 24시간
```

**설정 이유:**
- 카테고리는 자주 변경되지 않음
- 하루에 1회만 재생성

---

### 2.4 이미지 Immutable 캐시

```typescript
// Supabase Storage에서 이미지 업로드 시
const { data, error } = await supabase.storage
  .from('blog-images')
  .upload(`images/${filename}`, file, {
    cacheControl: '31536000', // 1년 (초 단위)
    upsert: false
  });

// 공개 URL 생성
const { data: publicURL } = supabase.storage
  .from('blog-images')
  .getPublicUrl(`images/${filename}`);
```

**Immutable 전략:**
- `Cache-Control: max-age=31536000, immutable`
- 의미: "이 파일은 절대 변하지 않으니 1년 동안 캐시하고 재확인도 하지 마세요"

**구현 방법:**
- 파일명에 해시 추가: `image-abc123.jpg`
- 같은 이미지를 수정하면 새로운 파일명으로 업로드
- 브라우저는 절대 서버에 재확인 요청 안 함 (네트워크 0)

**비용 절감:**
- Supabase Storage 요청 횟수 최소화
- CDN 비용 없음 (Supabase 무료 플랜)

---

### 2.5 API 라우트 캐시

```typescript
// src/app/api/posts/route.ts
export async function GET() {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true);

  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
```

**Cache-Control 헤더 설명:**
- `public`: CDN에서 캐시 가능
- `s-maxage=3600`: CDN에서 1시간 캐시
- `stale-while-revalidate=86400`: 캐시 만료 후에도 24시간 동안은 기존 캐시 제공하면서 백그라운드에서 새로고침

---

## 3. RLS (Row Level Security) 정책 설계

### 3.1 RLS란?

**정의:**
Row Level Security는 PostgreSQL의 보안 기능으로, **테이블의 각 행(row)에 대한 접근 권한을 제어**합니다.

**일반 권한 vs RLS:**
```sql
-- 일반 권한 (테이블 전체)
GRANT SELECT ON posts TO public;  -- 모든 행에 접근 가능

-- RLS (행 단위)
CREATE POLICY "공개 포스트만 조회"
ON posts FOR SELECT
USING (published = true);  -- published=true인 행만 조회 가능
```

---

### 3.2 muse.log에서 RLS가 필요한 이유

**문제 상황 (RLS 없을 때):**
```typescript
// 클라이언트에서 Supabase 직접 호출
const { data } = await supabase.from('posts').select('*');
// → 모든 포스트(공개+비공개) 조회 가능 (보안 문제!)
```

**해결 (RLS 적용):**
```sql
-- RLS 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 정책 1: 공개 포스트는 누구나 조회 가능
CREATE POLICY "공개 포스트 조회"
ON posts FOR SELECT
USING (published = true);

-- 정책 2: 관리자는 모든 포스트 조회 가능
CREATE POLICY "관리자 전체 조회"
ON posts FOR SELECT
USING (auth.jwt() ->> 'email' = 'admin@example.com');

-- 정책 3: 관리자만 포스트 생성/수정/삭제
CREATE POLICY "관리자 전체 권한"
ON posts FOR ALL
USING (auth.jwt() ->> 'email' = 'admin@example.com');
```

**결과:**
```typescript
// 일반 사용자
const { data } = await supabase.from('posts').select('*');
// → published=true인 포스트만 반환

// 관리자 (로그인 후)
const { data } = await supabase.from('posts').select('*');
// → 모든 포스트 반환
```

---

### 3.3 muse.log RLS 정책 전체 설계

#### posts 테이블
```sql
-- 1. 공개 포스트 조회 (누구나)
CREATE POLICY "select_published_posts"
ON posts FOR SELECT
USING (published = true);

-- 2. 관리자 전체 조회
CREATE POLICY "select_all_posts_admin"
ON posts FOR SELECT
USING (auth.jwt() ->> 'email' = current_setting('app.admin_email'));

-- 3. 관리자 생성/수정/삭제
CREATE POLICY "admin_full_access"
ON posts FOR ALL
USING (auth.jwt() ->> 'email' = current_setting('app.admin_email'));
```

#### categories 테이블
```sql
-- 모든 사용자 조회 가능
CREATE POLICY "select_categories"
ON categories FOR SELECT
TO public
USING (true);

-- 관리자만 수정
CREATE POLICY "admin_categories"
ON categories FOR ALL
USING (auth.jwt() ->> 'email' = current_setting('app.admin_email'));
```

#### media 테이블
```sql
-- 관리자만 접근
CREATE POLICY "admin_media"
ON media FOR ALL
USING (auth.jwt() ->> 'email' = current_setting('app.admin_email'));
```

#### post_embeddings 테이블
```sql
-- 관리자만 접근 (RAG API에서만 사용)
CREATE POLICY "admin_embeddings"
ON post_embeddings FOR ALL
USING (auth.jwt() ->> 'email' = current_setting('app.admin_email'));
```

---

### 3.4 RLS 동작 흐름

**시나리오 1: 일반 사용자가 블로그 방문**
```typescript
// 1. 클라이언트에서 요청
const { data } = await supabase.from('posts').select('*');

// 2. Supabase가 RLS 정책 확인
// - 사용자 인증 정보 없음 (JWT 없음)
// - "select_published_posts" 정책만 적용
// - WHERE published = true 자동 추가

// 3. 실제 실행되는 쿼리
SELECT * FROM posts WHERE published = true;
```

**시나리오 2: 관리자가 어드민 페이지에서 요청**
```typescript
// 1. 로그인 후 JWT 토큰 보유
// JWT payload: { email: 'admin@example.com' }

const { data } = await supabase.from('posts').select('*');

// 2. Supabase가 RLS 정책 확인
// - JWT에서 email 추출: admin@example.com
// - "select_all_posts_admin" 정책 적용
// - WHERE 조건 없음 (전체 조회)

// 3. 실제 실행되는 쿼리
SELECT * FROM posts; -- 모든 포스트 반환
```

---

### 3.5 RLS의 장점

1. **보안 자동화**: 애플리케이션 코드에서 권한 체크 불필요
2. **SQL 인젝션 방지**: DB 레벨에서 차단
3. **실수 방지**: 개발자가 권한 체크를 깜빡해도 DB가 막아줌
4. **클라이언트 직접 호출 가능**: API 서버 없이도 안전

**비용 최적화:**
- API 서버 불필요 (Vercel Functions 호출 횟수 감소)
- 클라이언트에서 Supabase 직접 호출 (엣지 네트워크 활용)

---

## 4. RAG 구현 계획

### 4.1 RAG (Retrieval-Augmented Generation)란?

**정의:**
LLM이 답변할 때 외부 지식(블로그 포스트)을 검색하여 참고하는 기술

**일반 챗봇 vs RAG 챗봇:**
```
일반 챗봇:
사용자: "Next.js ISR이 뭐야?"
→ GPT: "ISR은..." (GPT의 사전 학습 지식, 2023년 이전 정보)

RAG 챗봇:
사용자: "Next.js ISR이 뭐야?"
→ 1. 블로그에서 관련 포스트 검색 (벡터 유사도)
→ 2. 검색된 포스트 내용을 GPT에게 제공
→ GPT: "당신의 블로그 'Next.js 완벽 가이드'에 따르면..." (최신 정보)
```

---

### 4.2 RAG 구현 위치

**어디에:** `/api/chat` API 라우트

**파일 구조:**
```
src/
└── app/
    └── api/
        └── chat/
            └── route.ts
```

---

### 4.3 RAG 동작 흐름 상세

#### Step 1: 포스트 작성 시 임베딩 생성

```typescript
// src/app/api/posts/route.ts
export async function POST(request: Request) {
  const { title, content, ... } = await request.json();

  // 1. 포스트 저장
  const { data: post } = await supabase
    .from('posts')
    .insert({ title, content, ... })
    .select()
    .single();

  // 2. 임베딩 생성 (OpenAI API 호출)
  const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small', // 저렴한 모델
      input: `${title}\n\n${content}` // 제목 + 본문
    })
  });

  const { data: [{ embedding }] } = await embeddingResponse.json();

  // 3. 임베딩 저장
  await supabase
    .from('post_embeddings')
    .insert({
      post_id: post.id,
      embedding: embedding // 1536차원 벡터
    });

  return Response.json({ success: true });
}
```

**비용:**
- text-embedding-3-small: $0.00002 / 1K tokens
- 평균 블로그 포스트 (2000 토큰): $0.00004 (약 0.05원)
- 100개 포스트: $0.004 (약 5원)

---

#### Step 2: 사용자 질문 시 검색

```typescript
// src/app/api/chat/route.ts
export async function POST(request: Request) {
  const { message } = await request.json();

  // 1. 질문을 임베딩으로 변환
  const questionEmbedding = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: message
    })
  });

  const { data: [{ embedding }] } = await questionEmbedding.json();

  // 2. pgvector로 유사한 포스트 검색 (Cosine Similarity)
  const { data: similarPosts } = await supabase.rpc('search_posts', {
    query_embedding: embedding,
    match_threshold: 0.7, // 유사도 70% 이상
    match_count: 3        // 상위 3개만
  });

  // 3. 검색된 포스트 내용 결합
  const context = similarPosts
    .map(post => `### ${post.title}\n${post.content}`)
    .join('\n\n');

  // 4. GPT에게 질문 + 컨텍스트 제공
  const completion = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // 저렴한 모델
      messages: [
        {
          role: 'system',
          content: `당신은 블로그 어시스턴트입니다. 다음 블로그 포스트를 참고하여 답변하세요:\n\n${context}`
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 500, // 토큰 제한 (비용 절감)
      temperature: 0.7
    })
  });

  const { choices } = await completion.json();
  return Response.json({
    answer: choices[0].message.content,
    sources: similarPosts.map(p => ({ title: p.title, slug: p.slug }))
  });
}
```

---

#### Step 3: pgvector 검색 함수 (Supabase)

```sql
-- Supabase에서 실행할 함수
CREATE OR REPLACE FUNCTION search_posts(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  slug TEXT,
  similarity FLOAT
)
LANGUAGE SQL
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
```

**설명:**
- `<=>`: pgvector의 코사인 거리 연산자
- `1 - (거리)`: 거리를 유사도로 변환 (0~1)
- `ORDER BY ... LIMIT`: 가장 유사한 상위 N개

---

### 4.4 RAG 비용 최적화 전략

#### 1. 캐시 전략
```typescript
// 동일한 질문에 대한 캐시
const cacheKey = `chat:${hash(message)}`;
const cached = await redis.get(cacheKey); // 또는 Vercel KV

if (cached) {
  return Response.json(cached); // OpenAI API 호출 안 함
}

// ... OpenAI 호출 ...

await redis.set(cacheKey, result, { ex: 3600 }); // 1시간 캐시
```

**문제:** Vercel KV는 무료 플랜이 제한적 (10MB)

**대안:** 클라이언트 사이드 캐시 (LocalStorage) + 세션 내에서만 재사용

---

#### 2. 토큰 제한
```typescript
// 시스템 프롬프트 최소화
const systemPrompt = `블로그 어시스턴트. 참고:\n${context.slice(0, 2000)}`; // 2000자 제한

// 응답 토큰 제한
max_tokens: 300, // 짧은 답변 유도
```

**비용 계산:**
- gpt-4o-mini: Input $0.15 / 1M tokens, Output $0.6 / 1M tokens
- 평균 질문: 3000 tokens (컨텍스트 포함)
- 평균 답변: 200 tokens
- 1회 대화: $0.00045 + $0.00012 = $0.00057 (약 0.7원)
- 100회 대화: $0.057 (약 70원)

---

#### 3. 대화 히스토리 미저장
```typescript
// ❌ 비용 증가
messages: [
  ...conversationHistory, // 이전 대화 전부 포함 (토큰 폭증)
  { role: 'user', content: message }
]

// ✅ 비용 절감
messages: [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: message } // 현재 질문만
]
```

**트레이드오프:**
- 장점: 비용 최소화
- 단점: 대화 맥락 유지 안 됨
- **선택:** 비용 우선 (CLAUDE.md 제0조 준수)

---

#### 4. 검색 결과 제한
```typescript
match_count: 3,        // 최대 3개 포스트만
match_threshold: 0.7   // 유사도 70% 미만은 무시
```

**이유:**
- 3개 포스트면 충분한 컨텍스트
- 유사도 낮은 결과는 오히려 혼란 초래

---

### 4.5 RAG 구현 위치 정리

#### 어드민 페이지에서:
```
/admin/rag (설정 페이지)
├── 임베딩 모델 선택 (text-embedding-3-small 고정)
├── match_threshold 조정 (0.5 ~ 0.9)
├── match_count 조정 (1 ~ 5)
└── 전체 포스트 재임베딩 버튼
```

#### API 엔드포인트:
```
/api/chat         ← 사용자 질문 처리
/api/embeddings   ← 임베딩 생성/재생성 (어드민 전용)
```

#### 프론트엔드:
```
메인 페이지 (/)
└── ChatSession 컴포넌트 (이미 존재)
    ├── ChatInput
    └── /api/chat 호출
```

---

## 5. Admin Posts Edit 기능 설계

### 5.1 Edit 페이지 구조

**URL 라우팅:**
```
/admin/posts/[slug]/edit
```

**파일 구조:**
```
src/app/admin/posts/[slug]/edit/
├── page.tsx            # Server Component (인증, 데이터 페칭)
└── EditPostForm.tsx    # Client Component (폼 처리)
```

**Server Component (page.tsx) 책임:**
1. 관리자 인증 확인 (`isAdmin()`)
2. Slug를 통해 포스트 조회
3. 카테고리 목록 조회
4. EditPostForm에 props 전달

**Client Component (EditPostForm.tsx) 책임:**
1. 폼 상태 관리 (title, content, excerpt, category_id, published)
2. React MD Editor (마크다운 에디터) 통합
3. PATCH 요청 처리

### 5.2 API 엔드포인트 변경

#### PATCH /api/posts - 포스트 수정 (관리자 전용)

**Request:**
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "content": "Updated markdown content",
  "excerpt": "Updated excerpt",
  "category_id": "uuid or null",
  "published": true
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Updated Title",
  "slug": "original-slug",
  "content": "Updated markdown content",
  "excerpt": "Updated excerpt",
  "category_id": "uuid",
  "published": true,
  "created_at": "2026-03-08T...",
  "updated_at": "2026-03-08T...",
  "author_id": "uuid"
}
```

**보안 기능:**
1. Slug 불변성: PATCH 요청에 slug가 포함되면 400 에러 반환
2. 관리자만 접근: `isAdmin()` 체크로 401 에러 반환

**임베딩 자동 재생성:**
- content 또는 title이 변경되고 published=true인 경우
- OpenAI Embedding API로 새 임베딩 생성
- Upsert로 기존 임베딩 덮어쓰기

#### DELETE /api/posts - 포스트 삭제 (관리자 전용)

**URL 파라미터:**
```
DELETE /api/posts?slug=post-slug
또는
DELETE /api/posts?id=uuid
```

**보안 기능:**
1. 관리자만 접근: `isAdmin()` 체크
2. Slug 또는 ID 중 하나 필수 (둘 다 없으면 400 에러)
3. ON DELETE CASCADE로 post_embeddings 자동 삭제

### 5.3 주요 설계 결정

**1. Slug 기반 라우팅**
- SEO 친화적 URL: `/admin/posts/how-to-use-rag/edit`
- ID 기반보다 사람이 읽기 쉬움
- URL 변경 불가로 링크 무결성 보장

**2. Server Component에서 데이터 페칭**
```typescript
// page.tsx (Server)
const { data: post } = await supabase
  .from('posts')
  .select('*')
  .eq('slug', slug)
  .single();
```

**장점:**
- 데이터베이스에 직접 접근 (API 레이어 불필요)
- 보안: 클라이언트에 API 키 노출 안 됨
- 성능: 서버에서 필터링

**3. 마크다운 에디터**
- `react-md-editor` (오픈소스)
- Dynamic import로 SSR 문제 회피
- 포스트 생성/수정에 동일하게 사용

**4. Slug 불변 정책**
```typescript
// PATCH /api/posts에서
if (_slug !== undefined) {
  return error('Slug cannot be modified');
}
```

**이유:**
- URL이 변경되면 기존 링크 깨짐
- SEO 신호 손실
- 포스트 조회 불가능

---

## 6. 전체 데이터 흐름도

```
[사용자 포스트 작성]
     ↓
[어드민: 포스트 작성 폼]
     ↓
[POST /api/posts]
     ↓
[Supabase: posts 테이블 INSERT]
     ↓
[OpenAI: 임베딩 생성]
     ↓
[Supabase: post_embeddings INSERT]
     ↓
[ISR 캐시 무효화]
     ↓
[최대 1시간 후 메인 페이지에 반영]

---

[사용자 포스트 수정]
     ↓
[어드민: Edit 페이지]
     ↓
[PATCH /api/posts]
     ↓
[Supabase: posts 테이블 UPDATE]
     ↓
[Content/Title 변경 시 OpenAI: 임베딩 재생성]
     ↓
[Supabase: post_embeddings UPSERT]
     ↓
[ISR 캐시 무효화]
     ↓
[최대 30분 후 포스트 페이지 반영]

---

[사용자 포스트 삭제]
     ↓
[DELETE /api/posts?slug=xxx]
     ↓
[Supabase: posts 테이블 DELETE]
     ↓
[Cascade: post_embeddings 자동 삭제]
     ↓
[ISR 캐시 무효화]

---

[사용자 질문]
     ↓
[ChatInput 컴포넌트]
     ↓
[POST /api/chat]
     ↓
[OpenAI: 질문 임베딩 생성]
     ↓
[Supabase: pgvector 검색]
     ↓
[상위 3개 포스트 추출]
     ↓
[OpenAI: 답변 생성 (포스트 내용 참고)]
     ↓
[ChatSession에 답변 표시]
```

---

## 7. 비용 수렴 원칙 검증

### 트래픽 시나리오: 일 방문자 1000명

#### 정적 페이지 (ISR)
- 메인 페이지: 1000 요청 → **DB 쿼리 1회** (1시간 캐시)
- 포스트 페이지: 평균 500 요청 → **DB 쿼리 1회** (30분 캐시)
- **비용: $0** (Vercel 무료 플랜)

#### 이미지
- 1000개 이미지 요청 → **Supabase Storage 요청 0회** (브라우저 캐시)
- **비용: $0**

#### RAG 챗봇
- 일 100회 대화 → OpenAI API: $0.057 (약 70원)
- **월 비용: $1.71 (약 2100원)**

#### 총 비용
- **월 2100원** (트래픽이 늘어도 거의 증가하지 않음)

**비용 수렴 원칙 달성 ✅**

```
lim(cost) → $2/month as traffic → ∞
```

---

이 문서를 참고하여 구현을 진행하겠습니다!
