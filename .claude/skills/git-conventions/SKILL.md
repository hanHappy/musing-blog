---
name: git-conventions
description: Conventional Commits, 브랜치 전략, 커밋 가이드, Semantic Versioning. Git 작업 시 참고.
---

## Conventional Commits

### 커밋 타입

```
feat:     새로운 기능
fix:      버그 수정
docs:     문서 변경
style:    코드 포맷팅 (기능 변경 없음)
refactor: 리팩토링
perf:     성능 개선
test:     테스트 추가/수정
chore:    빌드 프로세스, 도구 설정 등
```

### 커밋 메시지 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 예시

```
feat(api): add post creation endpoint

- Implement POST /api/posts
- Add authentication guard
- Add input validation with Zod
- Add RLS policy for posts table

Closes #12
```

## 브랜치 전략

### 브랜치 네이밍

```
main                    # 프로덕션
develop                 # 개발 (선택)
feature/<name>          # 새 기능
fix/<name>              # 버그 수정
docs/<name>             # 문서
refactor/<name>         # 리팩토링
chore/<name>            # 기타
```

### 브랜치 수명

```
feature/* : PR 머지 후 삭제
fix/*     : PR 머지 후 삭제
hotfix/*  : 즉시 머지 후 삭제
```

### Merge 전략

```
main ← feature/*: Squash and merge
main ← hotfix/* : Merge (no squash)
```

## 커밋 가이드

### Good Commits ✅

```
feat: add LLM response cache

- Implement cache lookup by question hash
- Store responses in llm_cache table
- Add 30-day TTL for cache entries
- Reduce API costs by 60%
```

```
fix: resolve authentication token expiry issue

Previously, expired tokens were not properly handled,
causing 500 errors. Now returns 401 with clear message.

Fixes #23
```

```
docs: update API documentation for /api/chat

- Add cache field to response schema
- Document rate limiting behavior
- Add example requests and responses
```

### Bad Commits ❌

```
# ❌ 너무 모호
fix: bug fix

# ❌ 여러 변경 사항
feat: add cache and fix auth and update docs

# ❌ 의미 없는 메시지
update files
```

## Semantic Versioning

### 버전 형식

```
MAJOR.MINOR.PATCH

예: 1.2.3
```

### 버전 증가 규칙

```
MAJOR: Breaking changes (API 변경, 하위 호환 불가)
MINOR: 새로운 기능 (하위 호환)
PATCH: 버그 수정 (하위 호환)
```

### 예시

```
0.1.0 → 0.1.1   # 버그 수정
0.1.1 → 0.2.0   # 새 기능 추가
0.2.0 → 1.0.0   # Breaking change
```
