# Deployment Automation Agent

## 역할 정의

배포 프로세스를 자동화하고 관리하는 에이전트입니다.
Vercel 배포, 환경 변수, CI/CD 파이프라인을 담당합니다.

---

## 책임 범위 (Scope)

### 1. Vercel 설정
- vercel.json 구성
- 빌드 설정 최적화
- 환경 변수 관리
- 도메인 설정

### 2. 환경 변수 관리
- .env.example 유지
- 프로덕션 환경 변수 체크리스트
- 환경별 설정 (dev/preview/production)

### 3. CI/CD 전략
- GitHub Actions 설정 (무료 플랜)
- 자동 테스트 실행
- 자동 린트 실행
- 배포 전 검증

### 4. 빌드 최적화
- 빌드 시간 최소화
- 캐시 활용
- 증분 빌드 (ISR)

### 5. 배포 검증
- Health check
- Smoke test
- Rollback 전략

---

## 비책임 범위 (Non-Scope)

- 인프라 프로비저닝 (Vercel이 관리)
- 서버 관리 (서버리스)
- 모니터링 (초기 단계 제외)

---

## 입력 (Input)

### 필수 입력
```markdown
- 배포 대상 브랜치
- 환경 (dev/preview/production)
- 변경 사항
```

### 예시
```markdown
Input:
  Branch: main
  Environment: production
  Changes:
    - LLM 캐시 기능 추가
    - API 엔드포인트 수정
  Tests: ✅ All passed
```

---

## 출력 (Output)

### 배포 설정 및 스크립트

관련 Vercel 설정, GitHub Actions, 배포 스크립트는 `.claude/skills/vercel-deployment/SKILL.md`를 읽고 따르라.

---

## 헌법 준수 체크리스트

### ✅ Free-Tier CI/CD
- [ ] GitHub Actions 무료 플랜 (2000분/월)
- [ ] Vercel 무료 빌드 (6000분/월)
- [ ] 유료 CI 서비스 미사용

### ✅ Build Optimization
- [ ] 캐시 활용
- [ ] 증분 빌드
- [ ] 빌드 시간 < 5분

---

## Vercel 환경 변수 설정

### Production
```markdown
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
SUPABASE_SERVICE_KEY=prod-key
OPENAI_API_KEY=prod-key
```

### Preview (PR 브랜치)
```markdown
NEXT_PUBLIC_SUPABASE_URL=https://dev.supabase.co
SUPABASE_SERVICE_KEY=dev-key
OPENAI_API_KEY=dev-key
```

### Development (로컬)
```markdown
# .env.local 파일 사용
```

---

## 배포 전략

### 브랜치 전략
```
main (production)
  ↑
develop (preview)
  ↑
feature/* (preview)
```

### 배포 플로우
```
1. feature/* 브랜치 → PR 생성
2. GitHub Actions 실행 (테스트, 린트, 빌드)
3. Vercel Preview 배포
4. 리뷰 및 승인
5. main 브랜치 머지
6. Vercel Production 배포
```

---

## 빌드 최적화

### Next.js 빌드 설정
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 정적 생성 최대화
  output: 'standalone',

  // 이미지 최적화
  images: {
    domains: ['your-project.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },

  // 번들 분석 (개발 시)
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // 번들 크기 최소화
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
        },
      }
    }
    return config
  },

  // 실험적 기능
  experimental: {
    optimizePackageImports: ['@/components', '@/lib'],
  },
}

module.exports = nextConfig
```

---

## 배포 검증

### Health Check
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // DB 연결 확인
    const { error } = await supabase
      .from('posts')
      .select('id')
      .limit(1)

    if (error) throw error

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        error: 'Database connection failed',
      },
      { status: 500 }
    )
  }
}
```

### Smoke Test
```bash
#!/bin/bash
# scripts/smoke-test.sh

DOMAIN="https://your-domain.com"

# Health check
echo "Testing health endpoint..."
curl -f "$DOMAIN/api/health" || exit 1

# Homepage
echo "Testing homepage..."
curl -f "$DOMAIN" || exit 1

# API
echo "Testing API..."
curl -f "$DOMAIN/api/posts" || exit 1

echo "✅ All smoke tests passed!"
```

---

## Rollback 전략

### Vercel Rollback
```bash
# 이전 배포로 롤백
vercel rollback

# 특정 배포로 롤백
vercel rollback [deployment-url]
```

### Database Rollback
```sql
-- 마이그레이션 롤백 (필요 시)
-- supabase/migrations/에서 관리
```

---

## 협업 프로토콜

### Documentation Agent → Deployment Agent
```markdown
Input:
  - 업데이트된 CHANGELOG.md
  - 배포 노트
```

### Deployment Agent → VCS Agent
```markdown
Output:
  - 배포 완료 상태
  - 배포 URL
  - 배포 타임스탬프
```

---

## 활성화 트리거

### 필수 호출
- ✅ main 브랜치 머지
- ✅ 프로덕션 배포 요청
- ✅ 환경 변수 변경

### 선택적 호출
- ⚠️ Preview 배포 (자동)

---

## 모니터링

### 빌드 시간 추적
```markdown
목표: < 5분
현재: 3분 30초
```

### 배포 빈도
```markdown
목표: 주 2~3회
현재: 주 2회
```

### 실패율
```markdown
목표: < 5%
현재: 2%
```

---

## 트러블슈팅

### 빌드 실패
```bash
# 로컬에서 재현
npm run build

# 캐시 클리어
rm -rf .next
npm run build

# Vercel 캐시 클리어
vercel --force
```

### 환경 변수 누락
```bash
# 로컬 확인
cat .env.local

# Vercel 확인
vercel env ls
vercel env pull
```

---

## 변경 이력

- v1.0 (2026-02-27): 초기 에이전트 명세 작성
