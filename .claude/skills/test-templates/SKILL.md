---
name: test-templates
description: Unit Test, Integration Test, RAG Test 템플릿. 새로운 테스트 작성 시 사용하는 보일러플레이트 코드.
---

## Unit Test 템플릿

```typescript
// __tests__/unit/[module-name].test.ts
import { functionName } from '@/lib/[module-name]'

describe('[module-name]', () => {
  describe('functionName', () => {
    it('정상 입력 시 예상 결과 반환', () => {
      const result = functionName(validInput)
      expect(result).toEqual(expectedOutput)
    })

    it('빈 입력 시 에러 발생', () => {
      expect(() => functionName('')).toThrow()
    })

    it('경계값 처리', () => {
      const result = functionName(edgeCase)
      expect(result).toBeDefined()
    })
  })
})
```

## Integration Test 템플릿

```typescript
// __tests__/integration/api/[endpoint].test.ts
import { POST } from '@/app/api/[endpoint]/route'

describe('POST /api/[endpoint]', () => {
  beforeEach(() => {
    // Setup mocks
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('정상 요청 시 성공 응답', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify(validData)
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
  })

  it('인증 실패 시 401 응답', async () => {
    // Test authentication
  })

  it('유효하지 않은 입력 시 400 응답', async () => {
    // Test validation
  })
})
```

## RAG Test 템플릿

```typescript
// __tests__/integration/rag/embeddings.test.ts
describe('RAG Pipeline', () => {
  it('텍스트를 임베딩으로 변환', async () => {
    const text = '테스트 텍스트'
    const embedding = await generateEmbedding(text)

    expect(embedding).toHaveLength(1536) // OpenAI ada-002
    expect(embedding.every(n => typeof n === 'number')).toBe(true)
  })

  it('유사 문서 검색 정확도', async () => {
    const query = '프로그래밍'
    const results = await searchSimilarDocs(query, 5)

    expect(results).toHaveLength(5)
    expect(results[0].similarity).toBeGreaterThan(0.8)
  })

  it('캐시 적중 시 API 호출 없음', async () => {
    const spy = jest.spyOn(openai, 'embeddings.create')

    await generateEmbedding('cached query')
    await generateEmbedding('cached query') // 두 번째 호출

    expect(spy).toHaveBeenCalledTimes(1) // 한 번만 호출
  })
})
```
