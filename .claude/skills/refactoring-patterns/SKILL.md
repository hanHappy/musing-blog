---
name: refactoring-patterns
description: Extract Function, Remove Duplication, 복잡도 측정 기준 등 리팩토링 패턴.
---

## 리팩토링 패턴

### 1. Extract Function

```typescript
// Before
function processUser(user: User) {
  // 검증
  if (!user.email) throw new Error('Email required')
  if (!user.email.includes('@')) throw new Error('Invalid email')

  // 정규화
  const normalized = {
    email: user.email.toLowerCase().trim(),
    name: user.name.trim(),
  }

  // 저장
  return db.save(normalized)
}

// After
function processUser(user: User) {
  validateUser(user)
  const normalized = normalizeUser(user)
  return saveUser(normalized)
}

function validateUser(user: User) {
  if (!user.email) throw new Error('Email required')
  if (!user.email.includes('@')) throw new Error('Invalid email')
}

function normalizeUser(user: User) {
  return {
    email: user.email.toLowerCase().trim(),
    name: user.name.trim(),
  }
}
```

### 2. Replace Conditional with Polymorphism

```typescript
// Before
function getPrice(type: string, basePrice: number) {
  if (type === 'premium') {
    return basePrice * 1.5
  } else if (type === 'standard') {
    return basePrice
  } else if (type === 'budget') {
    return basePrice * 0.8
  }
  return basePrice
}

// After
interface PricingStrategy {
  calculate(basePrice: number): number
}

class PremiumPricing implements PricingStrategy {
  calculate(basePrice: number) {
    return basePrice * 1.5
  }
}

class StandardPricing implements PricingStrategy {
  calculate(basePrice: number) {
    return basePrice
  }
}

const strategies = {
  premium: new PremiumPricing(),
  standard: new StandardPricing(),
  // ...
}

function getPrice(type: string, basePrice: number) {
  return strategies[type].calculate(basePrice)
}
```

### 3. Remove Duplication

```typescript
// Before
async function getPublishedPosts() {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  return data
}

async function getDraftPosts() {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('published', false)
    .order('created_at', { ascending: false })

  return data
}

// After
async function getPostsByStatus(published: boolean) {
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('published', published)
    .order('created_at', { ascending: false })

  return data
}

const getPublishedPosts = () => getPostsByStatus(true)
const getDraftPosts = () => getPostsByStatus(false)
```

## 복잡도 측정

### Cyclomatic Complexity

```markdown
1-5:   단순 (Good)
6-10:  적당 (Acceptable)
11-20: 복잡 (Needs refactoring)
21+:   매우 복잡 (Must refactor)
```

### 함수 크기

```markdown
< 20 lines:  이상적
20-50 lines: 적당
50-100 lines: 검토 필요
> 100 lines:  리팩토링 필수
```
