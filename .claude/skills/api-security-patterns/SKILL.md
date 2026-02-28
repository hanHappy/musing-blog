---
name: api-security-patterns
description: API 인증 가드, input validation, rate limiting, 프롬프트 인젝션 방어 패턴.
---

## API 인증 가드

```typescript
// lib/auth/guards.ts

export async function requireAuth(request: Request) {
  const token = request.headers.get('authorization')?.split(' ')[1]

  if (!token) {
    return { error: 'Unauthorized', status: 401 }
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { error: 'Invalid token', status: 401 }
  }

  return { user }
}

export async function requireAdmin(request: Request) {
  const { user, error } = await requireAuth(request)

  if (error) return { error, status: 401 }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Forbidden', status: 403 }
  }

  return { user }
}
```

## Input Validation

```typescript
// lib/validation/posts.ts
import { z } from 'zod'

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  categoryId: z.string().uuid(),
  published: z.boolean().optional().default(false)
})

export function validatePostInput(data: unknown) {
  return createPostSchema.safeParse(data)
}
```

## Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// LLM 호출 제한: 사용자당 시간당 10회
export const llmRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'llm',
})

// API 호출 제한: IP당 분당 30회
export const apiRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  prefix: 'api',
})
```

## 프롬프트 인젝션 방어

```typescript
// lib/llm/sanitize.ts

const DANGEROUS_PATTERNS = [
  /ignore (previous|above) instructions/i,
  /system prompt/i,
  /you are now/i,
  /disregard/i,
]

export function sanitizePrompt(input: string): string {
  // 길이 제한
  if (input.length > 1000) {
    throw new Error('Input too long')
  }

  // 위험 패턴 감지
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      throw new Error('Invalid input detected')
    }
  }

  // HTML 태그 제거
  return input.replace(/<[^>]*>/g, '')
}
```
