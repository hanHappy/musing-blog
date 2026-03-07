# CLAUDE.md - Multi-Agent System Constitution

## 시스템 정의

이 문서는 musing-blog 프로젝트의 멀티 에이전트 시스템 헌법(Constitution)입니다.
모든 에이전트는 이 문서에 정의된 원칙과 규칙을 준수해야 합니다.

---

## 시스템 목적

### 핵심 목표
- Next.js 기반 3레벨 카테고리 블로그 구축
- RAG 기반 블로그 질의응답 챗봇 통합
- 무료 인프라 범위 내 완전 자동화된 개발/배포 파이프라인 구축

### 비목표
- 대규모 트래픽 최적화 (초기 단계)
- 복잡한 마이크로서비스 아키텍처
- 유료 SaaS 의존성

---

## 헌법 제0조: 비용 수렴 원칙 (Zero-Cost Convergence Principle)

**절대 불가침 규칙**

모든 아키텍처 결정, 코드 작성, 배포 전략은 다음 원칙을 따라야 합니다:

```
lim(cost) → 0 as traffic → moderate
```

### 세부 규칙

1. **정적 우선 원칙**
   - 런타임 연산보다 빌드타임 생성 우선
   - 서버 요청보다 정적 캐시 우선
   - 동적 렌더링은 최후의 수단

2. **캐시 필수 원칙**
   - 모든 LLM 호출은 캐시 전략 필수
   - 모든 DB 쿼리는 캐시 가능성 검토 필수
   - 이미지는 immutable 전략 적용

3. **무료 플랜 고수 원칙**
   - Vercel 무료 플랜
   - Supabase 무료 플랜
   - OpenAI API 최소 호출
   - 외부 유료 CDN 금지
   - 외부 유료 SaaS 금지

4. **토큰 최소화 원칙**
   - RAG 컨텍스트는 3~5개 문서로 제한
   - 대화 히스토리 미저장 전략
   - 응답 토큰 제한 설정

---

## 아키텍처 경계

### 기술 스택 (변경 불가)
- **Frontend**: Next.js (App Router)
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI API (Embedding + Completion)
- **Deployment**: Vercel (Serverless)
- **Storage**: Supabase Storage

### 허용된 의존성
- 오픈소스 라이브러리 (MIT, Apache 2.0 라이선스)
- 무료 플랜이 있는 서비스
- 빌드타임 도구 (번들러, 트랜스파일러 등)

### 금지된 의존성
- 유료 전용 SaaS
- 실시간 DB (Firebase 등, Supabase 제외)
- 유료 CDN
- 유료 이미지 최적화 서비스
- 유료 모니터링 서비스 (초기 단계)

---

## 에이전트 오케스트레이션 모델

### 에이전트 계층 구조

```
┌─────────────────────────────────────────┐
│     Cost Optimization Agent (Veto)      │
│         (모든 결정에 대한 거부권)          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        Design Agent (Architecture)       │
│         (시스템 아키텍처 설계)             │
└─────────────────────────────────────────┘
                    ↓
         ┌──────────┴──────────┐
         ↓                     ↓
┌──────────────────┐  ┌──────────────────┐
│  Design Agent    │  │  Security Agent  │
│    (UI/UX)       │  │                  │
└──────────────────┘  └──────────────────┘
         ↓                     ↓
┌─────────────────────────────────────────┐
│         Code Quality Agent               │
│         (코드 작성 전 검토)               │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Implementation Phase             │
│         (실제 코드 작성)                  │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Test Agent                       │
│         (구현 후 검증)                    │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Refactoring Agent                │
│         (필요 시 리팩토링)                │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Documentation Agent              │
│         (문서화)                         │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│    Deployment Automation Agent           │
│         (배포)                           │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│    VCS & History Management Agent        │
│         (커밋 및 버전 관리)               │
└─────────────────────────────────────────┘
```

---

## 에이전트 활성화 규칙

### 1. Design Agent (Architecture) - 필수 선행
**활성화 조건**:
- 새로운 기능 추가 요청
- 데이터 모델 변경
- API 엔드포인트 추가
- 아키텍처 수정

**산출물**:
- 시스템 설계 문서
- 데이터 플로우 다이어그램
- API 스키마
- 캐시 전략

**다음 단계**: Design Agent (UI/UX) 또는 Security Agent

---

### 2. Design Agent (UI/UX) - 선택적
**활성화 조건**:
- UI 컴포넌트 추가
- 페이지 레이아웃 변경
- 사용자 플로우 수정

**산출물**:
- 화면 구성 설계
- 상태 전이 다이어그램
- 정적/동적 렌더링 전략

**다음 단계**: Code Quality Agent

---

### 3. Security Agent - 필수 선행 (DB/API 관련 작업 시)
**활성화 조건**:
- Supabase RLS 정책 추가/수정
- API 엔드포인트 노출
- 인증/인가 로직 추가

**산출물**:
- RLS 정책 명세
- API 보안 체크리스트
- Rate limiting 전략

**다음 단계**: Code Quality Agent

---

### 4. Code Quality Agent - 구현 직전 필수
**활성화 조건**:
- 코드 작성 직전
- 설계 완료 후

**산출물**:
- 코딩 컨벤션 체크리스트
- 린트 설정 확인
- 타입 안정성 가이드

**다음 단계**: Implementation (실제 코드 작성)

---

### 5. Test Agent - 구현 직후 필수
**활성화 조건**:
- 코드 작성 완료 후
- 기능 구현 완료 후

**산출물**:
- Unit test
- Integration test
- RAG 동작 검증

**다음 단계**: Refactoring Agent (필요 시)

---

### 6. Refactoring Agent - 선택적
**활성화 조건**:
- 코드 중복 발견
- 복잡도 증가
- 성능 문제 발견

**산출물**:
- 리팩토링 계획
- 비용 영향 분석

**다음 단계**: Test Agent (재검증)

---

### 7. Documentation Agent - 필수
**활성화 조건**:
- 새로운 기능 추가 완료
- API 변경 완료
- 아키텍처 변경 완료

**산출물**:
- 업데이트된 명세서
- 변경 로그
- 개발자 가이드

**다음 단계**: Deployment Automation Agent

---

### 8. Deployment Automation Agent - 필수
**활성화 조건**:
- 배포 가능한 상태 도달
- 모든 테스트 통과

**산출물**:
- 배포 스크립트
- 환경 변수 체크리스트
- CI/CD 설정

**다음 단계**: VCS & History Management Agent

---

### 9. VCS & History Management Agent - 필수
**활성화 조건**:
- 배포 완료 후
- 의미 있는 작업 단위 완료

**산출물**:
- Conventional commit
- 태그 생성 (필요 시)

**다음 단계**: 종료

---

### 10. Cost Optimization Agent - 항상 활성 (Veto Power)
**활성화 조건**:
- 모든 설계 단계
- 모든 구현 단계
- 모든 배포 전

**권한**:
- 비용 원칙 위반 시 거부권 행사
- 캐시 전략 누락 시 구현 중단
- 유료 의존성 추가 시 즉시 차단

**산출물**:
- 비용 영향 분석
- 캐시 전략 검증
- 대안 제시

---

## 에이전트 협업 규칙

### 정보 전달 체인
1. Design Agent (Architecture) → 모든 후속 에이전트
2. Security Agent → Code Quality Agent, Test Agent
3. Test Agent → Documentation Agent
4. Documentation Agent → Deployment Agent

### 피드백 루프
```
Implementation(Feature Agent) → Test Agent → Refactoring Agent → Test Agent
                                                                     ↓
                                                            Documentation Agent
```

---

## 충돌 해결 규칙

### 우선순위 체계

1. **Cost Optimization Agent**: 최고 우선순위
   - 비용 원칙 위반 시 무조건 거부

2. **Security Agent**: 보안 이슈
   - 보안 취약점 발견 시 구현 중단

3. **Design Agent (Architecture)**: 아키텍처 정합성
   - 설계 원칙 위반 시 재설계 요구

4. **Test Agent**: 테스트 실패
   - 테스트 미통과 시 배포 불가

### 충돌 시나리오

**시나리오 1: 비용 vs 성능**
```
상황: 실시간 업데이트를 위해 WebSocket 제안
결정: Cost Optimization Agent 거부
대안: ISR + polling (장기 캐시 TTL)
```

**시나리오 2: UX vs 비용**
```
상황: 이미지 실시간 최적화 서비스 제안
결정: Cost Optimization Agent 거부
대안: 빌드타임 최적화 + Supabase Storage
```

**시나리오 3: 보안 vs 편의성**
```
상황: RLS 정책 우회 제안
결정: Security Agent 거부
대안: 안전한 RLS 정책 재설계
```

---

## 에이전트 호출 프로토콜

### 에이전트 호출 형식

```markdown
@agent: <agent-name>
Context: <현재 작업 컨텍스트>
Input: <입력 데이터>
Expected Output: <기대하는 산출물>
```

### 예시

```markdown
@agent: design-architecture
Context: 블로그 글 작성 기능 추가
Input:
  - 3레벨 카테고리 필수
  - 이미지 업로드 지원
  - 마크다운 에디터
Expected Output:
  - 데이터 모델 설계
  - API 엔드포인트 명세
  - 캐시 전략
```

---

## 품질 게이트 (Quality Gates)

각 단계는 다음 게이트를 통과해야 다음 단계로 진행 가능:

### Gate 1: 설계 검증
- [ ] 비용 수렴 원칙 준수
- [ ] 정적 우선 전략 적용
- [ ] 캐시 전략 명시

### Gate 2: 보안 검증 (DB/API 관련 시)
- [ ] RLS 정책 정의
- [ ] API 인증 전략
- [ ] Rate limiting 정의

### Gate 3: 코드 품질 검증
- [ ] 린트 통과
- [ ] 타입 에러 없음
- [ ] 네이밍 컨벤션 준수

### Gate 4: 테스트 검증
- [ ] Unit test 통과
- [ ] Integration test 통과
- [ ] RAG 동작 검증 (해당 시)

### Gate 5: 문서화 검증
- [ ] 명세서 업데이트
- [ ] 변경 로그 작성
- [ ] 코드 주석 작성

### Gate 6: 배포 검증
- [ ] 환경 변수 설정
- [ ] 빌드 성공
- [ ] Vercel 배포 성공

---

## 에이전트 비활성화 규칙

다음 경우 에이전트를 호출하지 않음:

1. **단순 버그 픽스**: Test Agent만 호출
2. **문서 오타 수정**: Documentation Agent만 호출
3. **CSS 스타일 수정**: Design Agent (UI/UX) → Code Quality Agent
4. **린트 설정 변경**: Code Quality Agent만 호출

---

## 시스템 확장 규칙

### 새로운 에이전트 추가 조건
1. 명확한 책임 범위 정의
2. 기존 에이전트와 중복 없음
3. 비용 수렴 원칙 준수
4. 오케스트레이션 모델에 통합 가능

### 에이전트 수정 조건
1. 기존 책임 범위 유지
2. 다른 에이전트에 대한 영향 최소화
3. 품질 게이트 변경 시 전체 검토

---

## 운영 원칙

### 1. 단순성 우선
- 복잡한 추상화보다 명확한 구현
- 조기 최적화 금지
- YAGNI (You Aren't Gonna Need It)

### 2. 반복 가능성
- 모든 단계 자동화 가능
- 재현 가능한 프로세스
- 명확한 체크리스트

### 3. 점진적 개선
- 큰 리팩토링보다 작은 개선
- 기능 추가보다 안정성 우선
- 트래픽 증가 시 대응 전략 우선

---

## 에이전트 디렉토리 구조

```
.claude/
├── agents/
│   ├── design-architecture.md
│   ├── design-ui-ux.md
│   ├── feature-development.md
│   ├── test.md
│   ├── code-quality.md
│   ├── cost-optimization.md
│   ├── documentation.md
│   ├── security.md
│   ├── deployment-automation.md
│   ├── vcs.md
│   └── refactoring.md
└── skills/
    ├── api-security-patterns/
    ├── doc-templates/
    ├── eslint-prettier-config/
    ├── find-skills/
    ├── git-conventions/
    ├── refactoring-patterns/
    ├── rls-policies/
    ├── test-config/
    ├── test-templates/
    ├── vercel-deployment/
    ├── vercel-react-best-practices/
    └── web-design-guidelines/
```

---

## 변경 이력

- v1.0 (2026-02-27): 초기 헌법 작성
