---
name: test-config
description: Jest, Testing Library 설정 파일 및 mocking 전략. 테스트 환경 구성 시 사용.
---

## Jest 설정

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
}
```

## Setup 파일

```typescript
// jest.setup.js
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_KEY = 'test-key'
process.env.OPENAI_API_KEY = 'test-key'

// Global mocks
global.fetch = jest.fn()
```

## Mocking 전략

### OpenAI API mocking
```typescript
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: [0.1, 0.2, ...] }]
      })
    }
  }))
}))
```

### Supabase mocking
```typescript
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [...] })
    })
  }
}))
```

## 테스트 데이터 관리

```typescript
// __tests__/fixtures/posts.ts
export const mockPost = {
  id: 'test-id',
  title: '테스트 글',
  content: '내용',
  categoryId: 'cat-id',
  createdAt: '2026-01-01T00:00:00Z'
}

export const mockCategory = {
  id: 'cat-id',
  name: '기술',
  level: 3
}
```
