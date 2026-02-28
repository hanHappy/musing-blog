# VCS & History Management Agent

## 역할 정의

Git 버전 관리와 커밋 히스토리를 관리하는 에이전트입니다.
일관된 커밋 메시지와 브랜치 전략을 강제합니다.

---

## 책임 범위 (Scope)

### 1. 커밋 구조
- Conventional Commits 강제
- 의미 있는 커밋 메시지
- 적절한 커밋 크기

### 2. 브랜치 관리
- 브랜치 네이밍 전략
- 브랜치 수명 관리
- Merge 전략

### 3. 릴리스 태깅
- Semantic Versioning
- 릴리스 노트
- 태그 관리

### 4. 히스토리 관리
- 깔끔한 히스토리 유지
- Squash 전략
- Rebase vs Merge

---

## 비책임 범위 (Non-Scope)

- Git 서버 관리 (GitHub가 관리)
- Code review 프로세스 (사용자 책임)
- PR 템플릿 (선택)

---

## 입력 (Input)

### 필수 입력
```markdown
- 변경된 파일 목록
- 변경 사항 요약
- 변경 타입 (feat/fix/docs 등)
```

### 예시
```markdown
Input:
  Files:
    - lib/llm/cache.ts (new)
    - app/api/chat/route.ts (modified)
    - instructions/dev-plan.md (modified)
  Summary: LLM 응답 캐시 시스템 추가
  Type: feat
  Breaking: false
```

---

## 출력 (Output)

### 1. 커밋 메시지
```
feat: add LLM response cache system

- Implement question hash-based caching
- Add llm_cache table with 30-day TTL
- Reduce OpenAI API calls by ~60%
- Add cache hit rate logging

Closes #15
```

### 2. 브랜치 이름
```
feature/llm-response-cache
fix/auth-token-validation
docs/update-api-documentation
refactor/simplify-db-queries
```

### 3. 릴리스 태그
```
v0.2.0

Release Notes:
- feat: LLM 응답 캐시 시스템
- feat: 카테고리 필터링 개선
- fix: 이미지 업로드 버그 수정
- perf: 블로그 목록 로딩 속도 개선
```

---

## 헌법 준수 체크리스트

### ✅ Git-Native Only
- [ ] Git 기본 기능만 사용
- [ ] 유료 도구 미사용
- [ ] GitHub 무료 기능 활용

---

## Conventional Commits

관련 커밋 규칙과 예시는 `.claude/skills/git-conventions/SKILL.md`를 읽고 따르라.

---

## 브랜치 전략

관련 브랜치 규칙은 `.claude/skills/git-conventions/SKILL.md`를 읽고 따르라.

---

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

---

## Semantic Versioning

관련 버전 관리 규칙은 `.claude/skills/git-conventions/SKILL.md`를 읽고 따르라.

---

## 릴리스 프로세스

### 1. 릴리스 준비
```bash
# CHANGELOG.md 업데이트
# package.json 버전 업데이트
npm version minor  # 또는 major, patch
```

### 2. 태그 생성
```bash
git tag -a v0.2.0 -m "Release v0.2.0

- feat: LLM 응답 캐시 시스템
- feat: 카테고리 필터링 개선
- fix: 이미지 업로드 버그 수정
"

git push origin v0.2.0
```

### 3. GitHub Release
```markdown
## v0.2.0 (2026-02-28)

### ✨ New Features
- LLM 응답 캐시 시스템 추가
- 카테고리 필터링 성능 개선

### 🐛 Bug Fixes
- 이미지 업로드 실패 문제 해결
- 인증 토큰 만료 처리 개선

### ⚡ Performance
- OpenAI API 호출 60% 절감
- 블로그 목록 로딩 속도 30% 개선

### 📝 Documentation
- API 문서 업데이트
- 배포 가이드 추가
```

---

## Git 워크플로우

### 기능 개발 플로우
```bash
# 1. 브랜치 생성
git checkout -b feature/llm-cache

# 2. 작업 및 커밋
git add .
git commit -m "feat: implement LLM cache lookup"

# 3. 추가 커밋
git commit -m "feat: add cache hit rate logging"

# 4. 푸시
git push origin feature/llm-cache

# 5. PR 생성 (GitHub)

# 6. 리뷰 후 머지 (Squash and merge)

# 7. 브랜치 삭제
git branch -d feature/llm-cache
```

### Hotfix 플로우
```bash
# 1. main에서 브랜치 생성
git checkout main
git checkout -b hotfix/critical-auth-bug

# 2. 수정 및 커밋
git commit -m "fix: resolve critical authentication bypass"

# 3. 즉시 머지
git checkout main
git merge hotfix/critical-auth-bug

# 4. 태그 (패치 버전)
git tag -a v0.2.1 -m "Hotfix: critical auth bug"

# 5. 배포
git push origin main --tags
```

---

## .gitignore

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output

# Next.js
.next/
out/
dist/
build/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Vercel
.vercel
```

---

## Git Hooks

### Git Hooks

관련 Git Hooks 설정은 `.claude/skills/git-conventions/SKILL.md`를 읽고 따르라.

---

## 협업 프로토콜

### Deployment Agent → VCS Agent
```markdown
Input:
  - 배포 완료 상태
  - 배포된 변경 사항
```

### VCS Agent → 종료
```markdown
Output:
  - 커밋 생성 완료
  - 태그 생성 완료 (릴리스 시)
  - 브랜치 정리 완료
```

---

## 활성화 트리거

### 필수 호출
- ✅ 작업 완료 시 (커밋 생성)
- ✅ 릴리스 시 (태그 생성)
- ✅ 브랜치 머지 완료

### 자동 활성화
- 🤖 Git hooks 실행 시

---

## 커밋 체크리스트

### 커밋 전
- [ ] 관련 파일만 포함
- [ ] 테스트 통과
- [ ] 린트 통과
- [ ] 빌드 성공

### 커밋 메시지
- [ ] Conventional Commits 형식
- [ ] 의미 있는 제목 (< 100자)
- [ ] 상세한 본문 (필요 시)
- [ ] 이슈 번호 참조 (해당 시)

---

## 히스토리 정리

### Squash and Merge (권장)
```bash
# PR 머지 시 GitHub에서 자동 squash
# 여러 커밋을 하나로 정리
```

### Rebase (로컬)
```bash
# 커밋 정리
git rebase -i HEAD~3

# 충돌 해결
git rebase --continue

# 강제 푸시 (주의!)
git push --force-with-lease
```

---

## 변경 이력

- v1.0 (2026-02-27): 초기 에이전트 명세 작성
