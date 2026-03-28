# Phase 1: RAG 챗봇 — 일단 동작하게 만들기

> 작성일: 2026-03-22
> 목표: 블로그 콘텐츠 기반 RAG 챗봇의 완전한 E2E 파이프라인 구축

---

## 시스템 구조도

```
┌─────────────────────────────────────────────────────────────────────┐
│                     INDEXING PIPELINE (오프라인)                      │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌───────────────┐    ┌──────────┐ │
│  │  글 발행   │───▶│  청킹     │───▶│  임베딩 생성    │───▶│ DB 저장   │ │
│  │ (Markdown)│    │(Heading  │    │(text-embedding│    │(pgvector)│ │
│  │          │    │ + 문단)   │    │ -3-small)     │    │          │ │
│  └──────────┘    └──────────┘    └───────────────┘    └──────────┘ │
│       │               │                                     │      │
│       │          ┌────┴────┐                                │      │
│       │          │ 메타데이터│                                │      │
│       │          │ 부착    │                                │      │
│       │          │·제목    │                                │      │
│       │          │·카테고리 │                          ┌─────┴────┐ │
│       │          │·태그    │                          │post_chunks│ │
│       │          │·excerpt │                          │·chunk_text│ │
│       │          └─────────┘                          │·embedding │ │
│       │                                               │·heading   │ │
│       ▼                                               │·metadata  │ │
│  ┌──────────┐                                         └──────────┘ │
│  │ posts    │                                                      │
│  │ 테이블    │◀─── FK ────────────────────────────────────────────── │
│  └──────────┘                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    RETRIEVAL + GENERATION (온라인)                    │
│                                                                     │
│  ┌──────────┐    ┌───────────────┐    ┌──────────┐    ┌──────────┐ │
│  │ 사용자    │───▶│  질문 임베딩    │───▶│ 유사도    │───▶│ Top-K    │ │
│  │ 질문      │    │(text-embedding│    │ 검색     │    │ 청크 추출 │ │
│  │          │    │ -3-small)     │    │(cosine)  │    │          │ │
│  └──────────┘    └───────────────┘    └──────────┘    └────┬─────┘ │
│                                                            │       │
│                                                            ▼       │
│  ┌──────────┐    ┌───────────────┐    ┌──────────────────────────┐ │
│  │ 최종 응답  │◀───│  LLM 응답 생성  │◀───│  컨텍스트 조립             │ │
│  │ + 출처    │    │ (gpt-4o-mini) │    │  ·청크 텍스트 결합          │ │
│  │          │    │               │    │  ·메타데이터(제목,태그) 포함  │ │
│  └──────────┘    └───────────────┘    └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        DATA SCHEMA                                  │
│                                                                     │
│  posts ──────────┐                                                  │
│  ·title          │                                                  │
│  ·content (MD)   │ 1:N                                              │
│  ·excerpt        ├──────▶ post_chunks                               │
│  ·category_id    │        ·chunk_index                              │
│  ·published      │        ·chunk_text                               │
│  ·view_count     │        ·heading                                  │
│       │          │        ·embedding VECTOR(1536)                   │
│       │          │        ·metadata JSONB                           │
│       ▼          │         {category, tags[], excerpt}              │
│  post_tags ──────┘                                                  │
│  ·tag_id ──▶ tags                                                   │
│              ·name                                                  │
│              ·slug                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 현재 상태 분석

### 이미 동작하는 것

| 구성 요소 | 상태 | 비고 |
|-----------|------|------|
| Chat UI (플로팅 카드) | ✅ | `CenterCard.tsx` |
| `/api/chat` 엔드포인트 | ✅ | 임베딩 → 검색 → LLM 응답 전체 흐름 |
| `post_embeddings` 테이블 | ✅ | VECTOR(1536), IVFFlat 인덱스 |
| `search_posts()` RPC | ✅ | 코사인 유사도 검색, threshold 0.7 |
| 글 발행 시 임베딩 자동 생성 | ✅ | `posts/route.ts`의 `generateEmbedding()` |
| 글 수정 시 임베딩 재생성 | ✅ | title 또는 content 변경 시 |
| 관련 글 없을 때 안내 | ✅ | "관련된 블로그 포스트를 찾을 수 없습니다" |

### 문제점 (Phase 1에서 해결할 것)

| 문제 | 현재 | 목표 |
|------|------|------|
| **청킹 없음** | 글 전체(`title + content`)를 하나의 임베딩으로 | 헤딩 기반 청크 분할 → 청크별 임베딩 |
| **컨텍스트 절삭** | `content.slice(0, 1000)`로 하드코딩 절삭 | 청크 텍스트 그대로 사용 |
| **메타데이터 미활용** | 임베딩에 title + content만 사용 | 카테고리, 태그, excerpt도 포함 |
| **벌크 재생성 없음** | Admin 버튼 있으나 미구현 | API 엔드포인트 구현 |
| **포스트 단위 검색** | 글 1개 = 임베딩 1개 | 글 1개 = 청크 N개, 청크 단위 검색 |

---

## 구현 태스크

### Task 1: 마크다운 청킹 유틸리티

**파일**: `src/lib/rag/chunker.ts` (신규)

**설계**:
```
Input:  마크다운 문자열 + 메타데이터(title, category, tags, excerpt)
Output: ChunkWithMeta[] — 청크 텍스트 + 메타데이터 배열
```

**청킹 전략**:
1. 헤딩(`## `, `### `) 단위로 1차 분할
2. 헤딩 단위가 800토큰 초과 시 문단(`\n\n`) 단위로 2차 분할
3. 각 청크에 메타데이터 부착:
   - `heading`: 해당 청크가 속한 섹션 제목
   - `chunk_index`: 글 내 순서
   - `metadata`: `{ category, tags, excerpt }` (JSONB)
4. 임베딩 입력 텍스트 구성:
   ```
   [제목] {title}
   [카테고리] {category}
   [태그] {tag1, tag2, ...}
   [섹션] {heading}

   {chunk_text}
   ```

**왜 메타데이터를 임베딩 입력에 포함하는가?**
- 임베딩 모델은 입력 텍스트의 의미를 인코딩함
- "React 상태 관리"라는 청크에 `[카테고리] Frontend [태그] React, 상태관리`가 붙으면
  → 임베딩 벡터가 해당 도메인 방향으로 더 명확하게 인코딩됨
- 사용자가 "프론트엔드 관련 글"이라고 물었을 때 카테고리 정보가 임베딩에 있어야 매칭 가능

**완료 기준**:
- [ ] 헤딩 기반 분할 동작 확인
- [ ] 800토큰 초과 청크가 문단 단위로 재분할됨
- [ ] 메타데이터(카테고리, 태그, excerpt)가 임베딩 입력에 포함
- [ ] 빈 문서, 헤딩 없는 문서, 짧은 문서 엣지케이스 처리

---

### Task 2: DB 스키마 변경

**파일**: `supabase/migrations/005_post_chunks.sql` (신규)

**변경 내용**:
```sql
-- 기존 post_embeddings는 유지 (마이그레이션 안전)
-- 새 테이블: post_chunks
CREATE TABLE post_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  heading TEXT,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, chunk_index)
);

-- 벡터 인덱스
CREATE INDEX idx_post_chunks_embedding
  ON post_chunks USING ivfflat (embedding vector_cosine_ops);

-- search_posts_v2: 청크 기반 검색
CREATE OR REPLACE FUNCTION search_chunks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
) RETURNS TABLE (
  chunk_id UUID,
  post_id UUID,
  title TEXT,
  slug TEXT,
  chunk_text TEXT,
  heading TEXT,
  metadata JSONB,
  similarity FLOAT
);
```

**완료 기준**:
- [ ] 마이그레이션 적용 성공
- [ ] `search_chunks` RPC가 청크 단위로 검색
- [ ] RLS 정책 적용 (발행 글의 청크만 공개)
- [ ] 기존 `post_embeddings` 테이블과 공존 (안전한 전환)

---

### Task 3: 임베딩 생성 로직 교체

**파일**: `src/lib/rag/embeddings.ts` (신규), `src/app/api/posts/route.ts` (수정)

**변경 내용**:
- 기존 `generateEmbedding()` → `generateChunkEmbeddings()` 교체
- 흐름:
  ```
  1. 포스트 조회 (title, content, category, tags, excerpt)
  2. chunker로 청크 분할 + 메타데이터 부착
  3. 각 청크의 임베딩 입력 텍스트 구성
  4. OpenAI batch embedding (한 번의 API 호출로 다수 청크 처리)
  5. 기존 해당 post_id 청크 삭제 → 새 청크 + 임베딩 저장
  ```

**비용 최적화**:
- OpenAI embedding API는 `input`에 배열을 받음
- 글 1개의 청크 5개를 한 번의 API 호출로 처리 가능
- 포스트당 비용: ~$0.00004 × 5청크 = ~$0.0002

**완료 기준**:
- [ ] 글 발행 시 청크별 임베딩 자동 생성
- [ ] 글 수정 시 기존 청크 삭제 → 재생성
- [ ] batch embedding으로 API 호출 최소화
- [ ] 비발행 글은 임베딩 미생성

---

### Task 4: 벌크 재생성 API

**파일**: `src/app/api/embeddings/bulk/route.ts` (신규)

**동작**:
```
POST /api/embeddings/bulk (Admin 전용)
→ 모든 published 글 조회
→ 각 글에 대해 청크 분할 + 임베딩 생성
→ rate limit 고려하여 순차 처리 (200ms 간격)
→ 결과 요약 반환 { total, success, failed }
```

**Admin 페이지 연결**:
- `src/app/admin/rag/page.tsx`의 "Regenerate All" 버튼 → 이 API 호출

**완료 기준**:
- [ ] 모든 발행 글의 청크 임베딩 생성 완료
- [ ] Admin 페이지에서 버튼 클릭으로 실행
- [ ] 처리 결과(성공/실패 수) 반환
- [ ] OpenAI rate limit 내 안전 동작

---

### Task 5: 검색 파이프라인 전환

**파일**: `src/app/api/chat/route.ts` (수정)

**변경 내용**:
```
Before: search_posts() → 포스트 단위 → content.slice(0,1000)
After:  search_chunks() → 청크 단위 → 청크 텍스트 그대로
```

**컨텍스트 조립 전략**:
- Top-K 청크 (K=5) 검색
- 동일 포스트의 청크가 여러 개면 chunk_index 순으로 정렬하여 합침
- 최종 컨텍스트 형태:
  ```
  === 출처: {post_title} ===
  [섹션: {heading}]
  {chunk_text}

  [섹션: {heading}]
  {chunk_text}

  === 출처: {post_title_2} ===
  ...
  ```

**완료 기준**:
- [ ] 청크 기반 검색으로 전환
- [ ] 동일 포스트 청크 합산 처리
- [ ] 컨텍스트에 섹션 구조가 반영됨
- [ ] 1000자 하드코딩 절삭 제거

---

### Task 6: 프롬프트 정비

**파일**: `src/app/api/chat/route.ts` (수정)

**시스템 프롬프트 개선**:
```
당신은 "muse.log" 블로그의 AI 어시스턴트입니다.
아래 블로그 포스트 내용을 참고하여 사용자의 질문에 답변하세요.

{context}

답변 규칙:
- 참고 포스트의 내용을 바탕으로 정확하게 답변하세요
- 자연스러운 한국어로 답변하세요
- 답변은 300 토큰 이내로 간결하게 작성하세요
- 포스트에 없는 내용은 추측하지 마세요
- 어떤 포스트를 참고했는지 자연스럽게 언급하세요
```

**완료 기준**:
- [ ] 블로그 이름/맥락 반영
- [ ] 출처 인용 가이드 포함
- [ ] 답변 톤 자연스러움 확인

---

## 구현 순서 (의존성 기반)

```
Task 1 (청킹)
    │
    ▼
Task 2 (DB 스키마) ──────────────────────┐
    │                                     │
    ▼                                     ▼
Task 3 (임베딩 생성 교체)           Task 4 (벌크 재생성)
    │                                     │
    └──────────┬──────────────────────────┘
               │
               ▼
         Task 5 (검색 전환)
               │
               ▼
         Task 6 (프롬프트)
```

- Task 1은 독립적. 순수 유틸리티 함수.
- Task 2는 Task 1의 청크 구조를 알아야 테이블을 설계할 수 있음.
- Task 3, 4는 Task 1 + 2 완료 후 병렬 가능.
- Task 5는 Task 2의 `search_chunks` RPC에 의존.
- Task 6은 Task 5와 함께 또는 이후에.

---

## 평가 계획

### 정성 평가: 테스트 질문 세트

Phase 1 완료 후 아래 질문으로 답변 품질을 수동 평가한다.

| # | 질문 유형 | 예시 질문 | 기대 |
|---|----------|----------|------|
| 1 | 특정 글 내용 질문 | "(실제 발행 글 주제)에 대해 알려줘" | 해당 글 기반 정확한 답변 + 출처 |
| 2 | 카테고리 범위 질문 | "백엔드 관련 글이 있어?" | 해당 카테고리 글 검색 |
| 3 | 없는 내용 질문 | "양자 컴퓨팅에 대해 알려줘" | "관련 내용 없음" 안내 |
| 4 | 모호한 질문 | "최근에 쓴 글 뭐 있어?" | 적절한 안내 또는 최근 글 소개 |
| 5 | 여러 글 걸치는 질문 | "(공통 주제)에 대해 정리해줘" | 여러 출처 종합 답변 |

*실제 질문은 발행된 글 내용에 맞춰 구성*

### 정량 평가: 유사도 점수 분포

```
평가 항목:
1. 관련 질문의 Top-1 유사도 점수 (목표: > 0.75)
2. 관련 질문의 Top-K 평균 유사도 (목표: > 0.70)
3. 무관 질문의 최대 유사도 (목표: < 0.70 → 필터링됨)
4. 검색 결과 중 실제 관련 있는 비율 (Precision)
5. 관련 글이 검색 결과에 포함된 비율 (Recall)
```

평가 결과는 Phase 2 개선 방향을 결정하는 근거가 된다.

---

## 비용 예측

| 항목 | 단가 | Phase 1 예상 사용량 | 비용 |
|------|------|-------------------|------|
| 임베딩 생성 (벌크) | $0.02 / 1M tokens | ~50 글 × 5 청크 × 500토큰 = 125K tokens | ~$0.003 |
| 임베딩 생성 (질문) | $0.02 / 1M tokens | 질문당 ~50토큰 | ~$0.000001/질문 |
| LLM 응답 (gpt-4o-mini) | $0.15 / 1M input, $0.60 / 1M output | 질문당 ~2K input + 300 output | ~$0.0005/질문 |
| **일일 100회 질문 기준** | | | **~$0.05/일** |
| **월간 예상** | | | **~$1.50** |

무료 플랜 예산($10/월) 대비 충분한 여유.

---

## 리스크 & 완화

| 리스크 | 완화 |
|--------|------|
| IVFFlat 인덱스는 데이터 적을 때 성능 저하 가능 | 초기에는 행 수 적으므로 문제 없음. 필요시 HNSW로 전환 |
| 청킹 전략이 부적절하면 검색 품질 저하 | Phase 2에서 청크 크기/overlap 실험으로 튜닝 |
| 메타데이터 포함이 오히려 노이즈가 될 수 있음 | Phase 2에서 포함/미포함 A/B 비교 |
| 기존 `post_embeddings` → `post_chunks` 전환 중 다운타임 | 양쪽 테이블 공존 → 전환 완료 후 기존 테이블 제거 |

---

## Phase 2 예고 (다음 단계)

Phase 1 평가 결과를 기반으로 아래 중 우선순위를 정한다:

- 청크 크기 실험 (300 / 500 / 800 토큰)
- overlap 실험 (0 / 50 / 100 토큰)
- 메타데이터 포함 여부 A/B 비교
- 임베딩 모델 비교 (small vs large)
- 유사도 임계값 튜닝 (0.6 / 0.7 / 0.8)
- 프롬프트 변형 실험
