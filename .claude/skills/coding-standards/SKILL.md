---
name: coding-standards
description: TypeScript, React 컴포넌트, import 순서, 파일 명명, 에러 핸들링 코딩 표준 예시.
---

## 코딩 표준

### 1. TypeScript 규칙

```typescript
// ✅ Good
interface User {
  id: string
  name: string
  email: string | null
}

function getUser(id: string): Promise<User | null> {
  // ...
}

// ❌ Bad
function getUser(id: any): any {
  // ...
}
```

### 2. React 컴포넌트 규칙

```typescript
// ✅ Good - Server Component
interface PostListProps {
  posts: Post[]
}

export function PostList({ posts }: PostListProps) {
  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}

// ❌ Bad
export default function PostList(props) {
  return <div>{props.posts.map(p => <div key={p.id}>{p.title}</div>)}</div>
}
```

### 3. Import 순서

```typescript
// ✅ Good
import { Suspense } from 'react'
import Link from 'next/link'
import { formatDate } from 'date-fns'

import { supabase } from '@/lib/supabase/client'
import { PostCard } from '@/components/blog/PostCard'
import { Post } from '@/types/post'

import styles from './PostList.module.css'

// ❌ Bad - 순서 없음
import { Post } from '@/types/post'
import { formatDate } from 'date-fns'
import { Suspense } from 'react'
```

### 4. 파일 명명 규칙

```
✅ Good
components/blog/PostList.tsx
lib/supabase/client.ts
types/post.ts
utils/format-date.ts

❌ Bad
components/blog/postList.tsx
lib/supabase/Client.ts
types/Post.ts
utils/formatDate.ts
```

### 5. 에러 핸들링

```typescript
// ✅ Good
try {
  const data = await fetchData()
  return { success: true, data }
} catch (error) {
  if (error instanceof APIError) {
    return { success: false, error: error.message }
  }
  return { success: false, error: 'Unknown error' }
}

// ❌ Bad
try {
  const data = await fetchData()
  return data
} catch (e) {
  console.log(e)
  return null
}
```
