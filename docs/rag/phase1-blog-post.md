# RAG 챗봇 구현기 — Phase 1: 일단 동작하게 만들기

**Excerpt**: 블로그 콘텐츠 기반 RAG 챗봇을 처음부터 끝까지 구현하고, 10개 테스트 질문으로 평가한 기록.

**태그**: RAG, pgvector, OpenAI, 임베딩, 챗봇, Supabase

---

# 배경

직접 해본 것을 믿는 편이다. 개념과 원리를 이해했다고 생각해도 실제로 만들어보면 몰랐던 부분이 드러난다. 블로그에 글을 쓰는 이유도 거기에 있다. 만들면서 이해한 것을 기록해두는 것.

앞으로 쌓여갈 글들을 어떻게 관리할까 고민하던 중 이런 생각이 든다. 내가 과거에 겪었던 문제와 해결 과정이 여기에 다 담겨 있는데, 정작 필요할 때 찾아보려면 기억에 의존해야 한다. "그때 그거 어떻게 했더라?" 싶을 때 내 글을 근거로 대답해주는 비서가 있으면 어떨까.

기술적으로도 궁금한 부분이 있었다. LLM이 자기가 학습한 지식만이 아니라 외부 텍스트(내 경우 블로그 글)를 컨텍스트로 받아서 응답을 만들어내는 것. 내가 쌓아둔 경험과 기록이 검색 가능한 지식으로 바뀌는 셈이다. 그게 실제로 어떤 느낌인지 직접 만들어보고 싶었다.

그래서 이 블로그에 RAG 챗봇을 붙이려 한다. 질문을 넣으면 블로그 글에서 관련 내용을 찾아 답변해주는 것이 목표다.

Phase 1의 범위는 이 청크 기반 파이프라인을 구현하고, 정량적으로 평가하는 것까지다.

---

# RAG란 무엇인가

RAG(Retrieval-Augmented Generation)는 LLM이 답변을 생성하기 전에, 외부 지식 저장소에서 관련 정보를 검색하여 컨텍스트로 제공하는 기법이다.

왜 필요한가? LLM은 학습 데이터에 없는 내용을 모른다. 내 블로그 글은 당연히 GPT의 학습 데이터에 없다. "ECS에서 Lambda로 전환한 이유가 뭐야?"라고 물어도 GPT는 내 상황을 모른다. RAG를 쓰면 이 질문에 대해 내 블로그에서 관련 글을 찾아서 컨텍스트로 넣어주고, LLM은 그 컨텍스트를 기반으로 답변한다.

파이프라인은 두 단계로 나뉜다:

```
[오프라인: Indexing]

  글 발행 ──> 청킹 ──> 임베딩 생성 ──> 벡터 DB 저장
              │         │                │
         마크다운을   텍스트를 1536차원   Supabase
         의미 단위로  float 배열로 변환   pgvector에
         분할        (text-embedding     저장
                      -3-small)

[온라인: Retrieval + Generation]

  사용자 질문 ──> 질문 임베딩 ──> 유사도 검색 ──> Top-K 청크 추출
                                  (cosine)
       ──> 컨텍스트 조립 ──> LLM 응답 생성 ──> 답변 + 출처 반환
                              (gpt-4o-mini)
```

오프라인 파이프라인은 글을 발행할 때 한 번 돌고 온라인 파이프라인은 사용자가 질문할 때마다 돈다.

---

# 설계

## 전체 구조

```
+----------+     +-----------+     +------------+     +---------+
|  글 발행  | --> |   청킹    | --> | 임베딩 생성 | --> | DB 저장  |
| (마크다운)|     | (헤딩기반) |     | (배치 API) |     |(pgvector)|
+----------+     +-----------+     +------------+     +---------+
                      |                                    |
                 메타데이터 부착                        post_chunks
                 ·제목, 카테고리                        ·chunk_text
                 ·태그, 섹션명                         ·embedding
                                                       ·heading
                                                       ·metadata

+----------+     +-----------+     +------------+     +---------+
| 사용자   | --> | 질문 임베딩| --> | 코사인     | --> | Top-5   |
| 질문     |     |           |     | 유사도 검색 |     | 청크    |
+----------+     +-----------+     +------------+     +---------+
                                                          |
+-----------+     +-------------+                    +----+----+
| 답변+출처 | <-- | gpt-4o-mini | <----------------- | 컨텍스트 |
|           |     |             |                    | 조립    |
+-----------+     +-------------+                    +---------+
```

## 청킹 전략

RAG에서 검색 품질을 좌우하는 건 임베딩이고, 임베딩의 품질은 입력 텍스트를 어떻게 잘라서 넣느냐에 크게 달려 있다. 글 전체를 하나의 벡터로 만들면 글이 길어질수록 의미가 희석된다. 3000자짜리 글에서 "비용 비교" 부분을 찾고 싶어도 나머지 2500자의 의미에 묻혀버린다.

블로그 글을 마크다운 문법으로 작성하고 있다. `## 배경`, `## 구현`처럼 헤딩으로 의미가 구분되어 있다. 이 구조를 살려서 헤딩 단위로 청크를 나누면, 각 청크가 하나의 주제를 담게 된다. 검색 시 "비용 비교"에 해당하는 청크만 정확히 잡힐 가능성이 높아진다. 기대한 성능이 나오지 않으면 청크 크기, 오버랩, 메타데이터 구성 등을 조정하며 실험해볼 생각이다.

```
1차 분할: 헤딩(## / ###) 단위
2차 분할: 800토큰 초과 시 문단(\n\n) 단위로 재분할
```

### 왜 헤딩 기반인가

고정 길이(500자씩)로 자르지 않은 이유가 있다. 고정 길이 분할은 문장 중간을 잘라먹을 수 있다. "비용이 $30에서" / "$0으로 줄었다"가 서로 다른 청크에 들어가면, 검색 시 둘 중 하나만 잡히면서 문맥이 깨진다. 헤딩 기반 분할은 내가 의도한 의미 경계를 반영한다.

### 메타데이터 부착

각 청크의 임베딩 입력을 구성할 때, 본문 앞에 메타데이터를 접두사로 붙였다:

```
[제목] ECS Fargate에서 AWS Lambda로
[카테고리] 한끼공식
[태그] AWS, Lambda, ECS
[섹션] 비용 비교

(청크 본문 내용)
```

임베딩 모델은 입력 텍스트 전체의 의미를 하나의 벡터로 인코딩한다. "비용 비교"라는 본문에 "Lambda", "AWS"라는 태그가 붙으면, 벡터가 해당 도메인 방향으로 더 명확하게 인코딩될 것이라는 가설이다. 사용자가 "Lambda 비용"이라고 물었을 때 매칭 확률이 올라간다.

이 가설이 실제로 맞는지는 Phase 2에서 메타데이터 포함/미포함 A/B 비교로 검증할 예정이다.

## DB 설계

기존 `post_embeddings`(포스트 1:1 임베딩)를 유지하면서, 새로운 `post_chunks` 테이블을 추가했다:

```sql
CREATE TABLE post_chunks (
  id UUID PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,     -- 글 내 순서
  chunk_text TEXT NOT NULL,          -- 청크 본문
  heading TEXT,                      -- 섹션 제목
  metadata JSONB DEFAULT '{}',       -- {category, tags, excerpt}
  embedding VECTOR(1536),            -- 임베딩 벡터
  UNIQUE(post_id, chunk_index)
);
```

---

# 임베딩과 코사인 유사도

설계에서 "임베딩"과 "코사인 유사도 검색"이 계속 등장했다. 이 두 개념이 RAG 검색의 핵심 메커니즘이다.

## 임베딩이란

텍스트를 고정 길이의 숫자 배열(벡터)로 변환하는 것이다. [`text-embedding-3-small`](https://developers.openai.com/api/docs/models/text-embedding-3-small) 모델은 어떤 길이의 텍스트든 1536차원의 float 배열로 바꿔준다.

```
"Lambda cold start 해결" → [0.023, -0.041, 0.078, ..., -0.015]  (1536개)
"서버리스 성능 최적화"    → [0.019, -0.038, 0.081, ..., -0.012]  (1536개)
"양자 컴퓨팅의 원리"      → [-0.051, 0.033, -0.029, ..., 0.044]  (1536개)
```

의미가 비슷한 텍스트는 비슷한 벡터가 된다. 위에서 첫 두 텍스트의 벡터는 서로 가깝고, 세 번째는 멀다. 이것이 임베딩 모델이 하는 일이다.

RAG에서 검색 품질을 실질적으로 결정하는 것은 임베딩 모델이다. 코사인 유사도는 두 벡터 사이의 각도를 재는 수학 연산이라 바꿀 수 없다. 벡터가 얼마나 의미를 잘 담고 있느냐가 전부다. "Lambda cold start"와 "서버리스 성능 문제"가 가까운 벡터가 되느냐, 먼 벡터가 되느냐는 임베딩 모델이 두 표현의 관계를 얼마나 잘 인코딩하느냐에 달려 있다.

## 코사인 유사도

두 벡터가 얼마나 같은 방향을 가리키는지를 측정한다.

```
cos(θ) = (A·B) / (‖A‖ × ‖B‖)
```

결과값은 -1.0(정반대) ~ 0.0(무관) ~ 1.0(동일). 벡터의 크기(길이)가 아닌 방향(각도)만 본다. 긴 글이든 짧은 글이든, 의미만 같으면 유사도가 높다.

pgvector에서는 `<=>` 연산자가 코사인 거리(1 - 유사도)를 계산한다. 검색 함수에서 `1 - (embedding <=> query_embedding)`으로 유사도를 구한다.

---

# 구현

## 청킹 유틸리티

`src/lib/rag/chunker.ts`에 청킹 로직을 구현했다.

```typescript
function splitByHeadings(content: string) {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  // #, ## 또는 ### 단위로 분할
}

function splitByParagraphs(text: string, maxChars: number) {
  // 800토큰(~2000자) 초과 시 문단 단위로 재분할
  const paragraphs = text.split(/\n\n+/);
  // 문단을 합치면서 maxChars를 넘지 않도록 조절
}

export function chunkMarkdown(input: ChunkInput): Chunk[] {
  // 1차: 헤딩 기반 분할
  let sections = splitByHeadings(content);
  // 2차: 긴 섹션 재분할
  for (const section of sections) {
    refinedSections.push(...splitByParagraphs(section.body, MAX_CHUNK_CHARS));
  }
  return chunks;
}
```

6개 글에서 81개 청크가 생성되었다. 글당 평균 13.5개.

## 임베딩 생성

`src/lib/rag/embeddings.ts`에서 OpenAI batch embedding API를 활용하여 글 1개의 여러 개 청크를 한 번의 API 호출로 처리한다.

```typescript
export async function generateChunkEmbeddings(
  postId: string, title: string, content: string, excerpt?: string
) {
  const { category, tags } = await getPostMeta(postId);
  const chunks = chunkMarkdown({ title, content, category, tags, excerpt });

  // 각 청크의 임베딩 입력 구성 (메타데이터 접두사 포함)
  const embeddingInputs = chunks.map(chunk => buildEmbeddingInput(chunk, title));

  // 한 번의 API 호출로 모든 청크 임베딩 생성
  const embeddings = await createEmbeddings(embeddingInputs);

  // 기존 청크 삭제 → 새 청크 저장
  await supabase.from('post_chunks').delete().eq('post_id', postId);
  await supabase.from('post_chunks').insert(rows);
}
```

글 저장 API(`/api/posts`)에서 `published: true`일 때 이 함수를 호출한다. 글 발행이나 수정 시 자동으로 임베딩이 갱신된다.

## 검색 파이프라인

`/api/chat`의 검색을 포스트 단위에서 청크 단위로 전환했다.

```sql
-- 청크 기반 검색 함수
CREATE FUNCTION search_chunks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
) RETURNS TABLE (...) AS $$
  SELECT c.*, p.title, p.slug,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM post_chunks c
  JOIN posts p ON p.id = c.post_id
  WHERE p.published = true
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

검색 결과를 포스트별로 그룹화하고, `chunk_index` 순으로 정렬하여 컨텍스트를 조립한다:

```typescript
function buildContext(chunks: SearchChunkResult[]) {
  // 포스트별 그룹화
  const postMap = new Map();
  for (const chunk of chunks) {
    // 같은 포스트의 청크들을 모은다
  }
  // 각 포스트 내 청크를 chunk_index 순 정렬
  // 컨텍스트 형태:
  // === 출처: {post_title} ===
  // [섹션: {heading}]
  // {chunk_text}
}
```

동일 포스트에서 여러 청크가 검색되면 순서대로 합쳐서 문맥을 보존한다.

---

# 검증

## 테스트 환경

- 발행 글 6개 (AWS 인프라 5개 + 에세이 1개)
- 생성된 청크 81개 (글당 평균 13.5개)
- 테스트 질문 10개 (구체적 5 / 크로스 1 / 추상적 1 / 무관 2 / 모호 1)

## 정량 평가: 유사도 점수 분포

| # | 질문 | 유형 | Top-1 유사도 | 매칭 |
|---|------|------|:-----------:|:----:|
| 1 | Lambda cold start 해결 방법이 뭐임? | 특정 글 | 0.663 | ✅ |
| 2 | RDS에서 Supabase로 마이그레이션하는 방법? | 특정 글 | 0.717 | ✅ |
| 3 | API Gateway에 커스텀 도메인 연결하려면? | 특정 글 | 0.725 | ✅ |
| 4 | ECS Fargate 대신 Lambda를 선택한 이유? | 특정 글 | 0.713 | ✅ |
| 5 | 블로그 왜 시작했음? | 에세이 | 0.387 | ✅ |
| 6 | AWS 인프라 구축 과정을 정리좀 | 크로스 | 0.478 | ✅ |
| 7 | 서버리스 관련 글 있음? | 추상적 | 0.298 | ❌ |
| 8 | MSA에서 데이터 정합성을 어떻게 보장할 수 있음? | 무관 | 0.366 | — |
| 9 | 양자 컴퓨팅의 원리가 뭐임? | 무관 | 0.226 | — |
| 10 | 뭐 재밌는 글 있음? | 모호 | 0.273 | — |

**관련 질문(#1~6) 평균 Top-1: 0.614** / **무관 질문(#8~9) 평균 Top-1: 0.296** / **분리 갭: 0.318**

관련 질문과 무관 질문이 유사도 점수로 명확히 구분된다. #2, #3, #4는 0.7을 넘었다. #5(에세이)는 0.387로 threshold를 간신히 넘겼고, 기술 글들에 비해 유사도가 낮다. 에세이 특성상 구체적인 키워드가 적어서 벡터 매칭이 덜 된 것으로 보인다.

## 정성 평가: LLM 답변 품질

구체적 키워드가 포함된 질문들(#1~4)은 답변 품질이 높았다:

> **Q: ECS Fargate 대신 Lambda를 선택한 이유가 뭐야?**
>
> A: 주로 비용 효율성과 인프라 관리의 용이성 때문입니다. Lambda는 요청 시에만 실행되므로 월 예상 비용이 ~$30-50에서 ~$0로 감소했습니다. (...) "ECS Fargate에서 AWS Lambda로" 포스트에서 확인할 수 있습니다.

출처를 자연스럽게 언급하고, 비용 수치까지 정확하게 인용했다.

에세이 질문(#5)도 적절한 답변을 생성했고, 무관한 질문(#8 "MSA 데이터 정합성")에는 블로그에 관련 내용이 없다고 응답했다. threshold 이하로 필터링된 것은 아니고 (유사도 0.366 > threshold 0.3), LLM이 컨텍스트를 보고 무관하다고 판단한 것이다.

## 문제점

**threshold 딜레마**  
0.7로 설정했더니 10개 질문 중 #2, #3, #4만 통과했다. 0.3으로 낮추니 관련 질문은 모두 동작하지만 무관 질문(#8)도 통과하는 문제가 생겼다. 다행히 LLM이 "관련 없다"고 판단하여 구제되었지만 이상적인 상태는 아니다.

**추상적 질문의 한계**  
#7 "서버리스 관련 글이 있어?"는 유사도 0.298로 검색 실패. Lambda 관련 글이 5개나 있지만 글 본문에 "서버리스"라는 단어 자체가 많지 않다. 임베딩 모델이 "Lambda = 서버리스"라는 상위 개념 매핑을 충분히 하지 못하는 것으로 보인다.

---

# 비용

Phase 1 전체 비용:

| 항목 | 비용 |
|------|------|
| 벌크 임베딩 (6글 × 81청크) | ~$0.005 |
| 평가 질문 임베딩 (15회) | ~$0.00002 |
| 평가 LLM 응답 (10회) | ~$0.005 |
| **합계** | **~$0.008** |

월간 운영 비용 예측 (일 100회 질문 가정): **~$1.50/월**. 예산($10/월)의 15%.

---

# 정리

여기까지 청크 기반 RAG 챗봇의 전체 파이프라인을 구축했다. 글을 발행하면 자동으로 청크 분할 → 임베딩 생성 → DB 저장이 이루어지고, 사용자가 질문하면 유사도 검색 → 컨텍스트 조립 → LLM 응답 생성이 동작한다.

구체적인 키워드가 포함된 질문에는 정확한 글을 찾아 답변한다. "ECS에서 Lambda로 전환한 이유", "RDS에서 Supabase로 마이그레이션하는 방법" 같은 질문에 관련 글을 정확히 매칭하고, 코드 블록까지 인용하는 답변을 생성한다.

다만 유사도 점수가 전반적으로 낮고(관련 질문 평균 0.643), threshold 설정이 까다롭다는 문제가 남아 있다. 추상적인 질문("서버리스 관련 글")에는 아직 대응하지 못한다.

다음 Phase에서는 하나의 파라미터를 변경하고 동일한 10개 테스트 질문으로 재평가하는 반복 루프를 돌릴 예정이다. 첫 번째 실험 후보는 threshold 값(0.3 / 0.4 / 0.5)이다.
