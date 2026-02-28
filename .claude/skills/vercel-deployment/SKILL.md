---
name: vercel-deployment
description: vercel.json, GitHub Actions workflow, 배포 스크립트, 배포 체크리스트. Vercel 배포 설정 시 사용.
---

## vercel.json

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["icn1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

## .env.example

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# OpenAI
OPENAI_API_KEY=sk-your-key

# Rate Limiting (Optional)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

## GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## 배포 체크리스트

```markdown
## 배포 전 체크리스트

### 코드 품질
- [x] 모든 테스트 통과
- [x] 린트 에러 없음
- [x] 타입 에러 없음
- [x] 빌드 성공

### 환경 변수
- [ ] NEXT_PUBLIC_SUPABASE_URL 설정
- [ ] SUPABASE_SERVICE_KEY 설정
- [ ] OPENAI_API_KEY 설정

### 데이터베이스
- [ ] 마이그레이션 실행
- [ ] RLS 정책 확인
- [ ] 인덱스 추가 확인

### 성능
- [ ] 빌드 크기 < 이전 대비 10% 증가
- [ ] Lighthouse 점수 > 90

### 보안
- [ ] 환경 변수 노출 확인
- [ ] API 인증 확인
- [ ] RLS 정책 테스트

### 문서
- [x] CHANGELOG.md 업데이트
- [x] README.md 확인
```

## 배포 스크립트

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 Starting deployment..."

# 1. 테스트 실행
echo "Running tests..."
npm test

# 2. 빌드
echo "Building..."
npm run build

# 3. Vercel 배포
echo "Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
```
