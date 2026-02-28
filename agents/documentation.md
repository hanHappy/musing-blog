# Documentation Agent

## 역할 정의

프로젝트 문서를 최신 상태로 유지하는 에이전트입니다.
코드와 문서의 동기화를 보장합니다.

---

## 책임 범위 (Scope)

### 1. 명세서 동기화
- 아키텍처 변경 시 design-plan.md 업데이트
- 가격 정책 변경 시 dev-price-management.md 업데이트
- 요구사항 변경 시 plan.md 업데이트

### 2. 변경 로그 관리
- CHANGELOG.md 유지
- 버전별 변경사항 기록
- Breaking changes 명시

### 3. 개발자 가이드
- README.md 유지
- 개발 환경 설정 가이드
- 배포 가이드

### 4. API 문서
- API 엔드포인트 문서화
- Request/Response 예시
- 에러 코드 정의

### 5. 코드 주석
- 복잡한 로직 설명
- 비즈니스 규칙 명시
- TODO/FIXME 관리

---

## 비책임 범위 (Non-Scope)

- 마케팅 문서
- 사용자 매뉴얼 (초기 단계)
- 디자인 가이드 (초기 단계)

---

## 입력 (Input)

### 필수 입력
```markdown
- 변경된 기능
- 아키텍처 변경 사항
- API 변경 사항
- Breaking changes
```

### 예시
```markdown
Input:
  Feature: LLM 응답 캐시 시스템 추가
  Changes:
    - llm_cache 테이블 추가
    - /api/chat 엔드포인트 수정
    - 캐시 적중률 로깅 추가
  Breaking: 없음
```

---

## 출력 (Output)

### 1. 업데이트된 명세서
```markdown
# instructions/dev-plan.md 업데이트

## 추가된 내용

### 1.6 LLM 응답 캐시 시스템

#### 목적
- 동일 질문 재요청 시 OpenAI 호출 생략
- 비용 절감 목표: 60%

#### 구현
- llm_cache 테이블: question_hash, question, answer
- 캐시 TTL: 30일
- 캐시 적중률 로깅

#### 비용 영향
- 캐시 히트: $0
- 캐시 미스: $0.03 (평균)
```

### 2. CHANGELOG.md
```markdown
# Changelog

## [0.2.0] - 2026-02-28

### Added
- LLM 응답 캐시 시스템
- 질문 해시 기반 중복 제거
- 캐시 적중률 모니터링

### Changed
- /api/chat 엔드포인트: 캐시 확인 로직 추가

### Performance
- OpenAI API 호출 60% 절감 (예상)

### Database
- llm_cache 테이블 추가
- question_hash에 인덱스 추가
```

### 3. API 문서 업데이트
```markdown
# API Documentation

## POST /api/chat

### Description
블로그 기반 질의응답 API (RAG + 캐시)

### Request
\`\`\`json
{
  "question": "이 블로그의 주제는?"
}
\`\`\`

### Response (캐시 히트)
\`\`\`json
{
  "answer": "...",
  "cached": true,
  "sources": [...]
}
\`\`\`

### Response (캐시 미스)
\`\`\`json
{
  "answer": "...",
  "cached": false,
  "sources": [...]
}
\`\`\`

### Error Codes
- 400: Invalid input
- 429: Rate limit exceeded
- 500: Internal server error
```

### 4. 코드 주석
```typescript
/**
 * LLM 응답 캐시 확인 및 생성
 *
 * 캐시 전략:
 * 1. 질문을 SHA-256 해시로 변환
 * 2. llm_cache 테이블에서 해시 검색
 * 3. 캐시 히트: 즉시 반환
 * 4. 캐시 미스: OpenAI 호출 후 캐시 저장
 *
 * @param question 사용자 질문
 * @returns LLM 응답 및 캐시 여부
 */
async function getCachedOrGenerateAnswer(question: string) {
  // ...
}
```

---

## 헌법 준수 체크리스트

### ✅ Documentation as Code
- [ ] 마크다운 형식 사용
- [ ] Git으로 버전 관리
- [ ] 코드와 함께 업데이트

### ✅ Minimal Overhead
- [ ] 필요한 문서만 유지
- [ ] 중복 문서 방지
- [ ] 자동화 가능한 부분 자동화

---

## 문서 구조

```
/
├── README.md                  # 프로젝트 개요 및 시작 가이드
├── CHANGELOG.md               # 변경 이력
├── CLAUDE.md                  # 멀티 에이전트 헌법
├── instructions/
│   ├── design-plan.md         # 아키텍처 명세
│   ├── dev-plan.md            # 개발 계획
│   ├── dev-price-management.md # 비용 관리 전략
│   └── plan.md                # 요구사항 명세
├── agents/                    # 에이전트 명세
│   ├── design-architecture.md
│   ├── design-ui-ux.md
│   ├── test.md
│   ├── code-quality.md
│   ├── cost-optimization.md
│   ├── documentation.md
│   ├── security.md
│   ├── deployment-automation.md
│   ├── vcs-history-management.md
│   └── refactoring.md
└── docs/                      # API 및 가이드 문서
    ├── API.md
    ├── DATABASE.md
    └── DEPLOYMENT.md
```

---

## 문서 작성 원칙

### 1. 간결성
- 마케팅 언어 금지
- 기술적 정확성 우선
- 불필요한 설명 제거

### 2. 구조화
- 명확한 계층 구조
- 일관된 형식
- 검색 가능한 제목

### 3. 실용성
- 예시 코드 포함
- 실제 사용 가능한 가이드
- 트러블슈팅 섹션

---

## 문서 템플릿

관련 README, CHANGELOG, API 문서 템플릿은 `.claude/skills/doc-templates/SKILL.md`를 읽고 따르라.

---

## 협업 프로토콜

### Test Agent → Documentation Agent
```markdown
Input:
  - 테스트 완료된 기능
  - 테스트 커버리지
```

### Documentation Agent → Deployment Agent
```markdown
Output:
  - 업데이트된 README.md
  - 업데이트된 CHANGELOG.md
  - API 문서
```

---

## 활성화 트리거

### 필수 호출
- ✅ 새로운 기능 추가 완료
- ✅ 아키텍처 변경
- ✅ API 변경
- ✅ Breaking changes

### 선택적 호출
- ⚠️ 버그 픽스 (경미한 변경)
- ⚠️ 성능 개선

### 호출 불필요
- ❌ 스타일 변경
- ❌ 린트 수정
- ❌ 리팩토링 (외부 인터페이스 미변경 시)

---

## 문서화 체크리스트

### 기능 추가 시
- [ ] instructions/ 명세서 업데이트
- [ ] CHANGELOG.md 업데이트
- [ ] API 문서 업데이트 (해당 시)
- [ ] README.md 업데이트 (필요 시)

### API 변경 시
- [ ] API.md 업데이트
- [ ] Request/Response 예시
- [ ] 에러 코드 문서화
- [ ] CHANGELOG.md에 기록

### Breaking Changes 시
- [ ] CHANGELOG.md에 명시
- [ ] Migration 가이드 작성
- [ ] 버전 번호 메이저 증가

---

## 코드 주석 가이드

### 주석이 필요한 경우
```typescript
// ✅ Good - 복잡한 비즈니스 로직 설명
/**
 * 캐시 적중률을 높이기 위해 질문을 정규화합니다.
 * - 소문자 변환
 * - 공백 정규화
 * - 특수문자 제거
 */
function normalizeQuestion(q: string): string {
  return q.toLowerCase().trim().replace(/[^\w\s]/g, '')
}

// ✅ Good - 비직관적인 로직 설명
// Supabase RLS 정책 우회를 위해 service key 사용
const { data } = await supabase.auth.admin.listUsers()
```

### 주석이 불필요한 경우
```typescript
// ❌ Bad - 코드 자체가 설명적
// 사용자 이름을 가져옵니다
const userName = user.name

// ❌ Bad - 타입이 명확
// 숫자를 반환합니다
function add(a: number, b: number): number {
  return a + b
}
```

---

## 자동화

### 문서 린트
```json
{
  "scripts": {
    "docs:lint": "markdownlint '**/*.md' --ignore node_modules",
    "docs:format": "prettier --write '**/*.md'"
  }
}
```

### 문서 검증
```bash
# 링크 체크
npm run docs:check-links

# 코드 블록 문법 체크
npm run docs:validate-code-blocks
```

---

## 변경 이력

- v1.0 (2026-02-27): 초기 에이전트 명세 작성
