---
name: doc-templates
description: README, CHANGELOG, API 문서 템플릿. 문서 작성 시 사용.
---

## README.md 템플릿

```markdown
# musing-blog

블로그 + RAG 질의응답 시스템

## 기술 스택

- Next.js 14 (App Router)
- Supabase (PostgreSQL + pgvector)
- OpenAI API
- Vercel (Deployment)

## 시작하기

### 사전 요구사항
- Node.js 18+
- npm or pnpm

### 설치

\`\`\`bash
git clone https://github.com/username/musing-blog.git
cd musing-blog
npm install
\`\`\`

### 환경 변수 설정

\`\`\`bash
cp .env.example .env.local
# .env.local 파일에 API 키 입력
\`\`\`

### 개발 서버 실행

\`\`\`bash
npm run dev
\`\`\`

## 프로젝트 구조

\`\`\`
src/
├── app/              # Next.js App Router
├── components/       # React 컴포넌트
├── lib/              # 유틸리티 함수
└── types/            # TypeScript 타입 정의
\`\`\`

## 배포

Vercel에 자동 배포됩니다.

\`\`\`bash
git push origin main
\`\`\`

## 라이선스

MIT
```

## CHANGELOG.md 형식

```markdown
# Changelog

모든 주요 변경사항은 이 파일에 기록됩니다.

형식: [Keep a Changelog](https://keepachangelog.com/)
버전: [Semantic Versioning](https://semver.org/)

## [Unreleased]

### Added
- 추가된 기능

### Changed
- 변경된 기능

### Deprecated
- 곧 제거될 기능

### Removed
- 제거된 기능

### Fixed
- 버그 수정

### Security
- 보안 패치

## [0.2.0] - 2026-02-28

### Added
- LLM 응답 캐시 시스템
- 캐시 적중률 모니터링

### Performance
- OpenAI API 호출 60% 절감

## [0.1.0] - 2026-02-15

### Added
- 초기 프로젝트 설정
- 기본 블로그 CRUD
- RAG 질의응답 시스템
```

## API 문서 템플릿

```markdown
# API Documentation

## Endpoints

### POST /api/posts

글 작성

**Authentication**: Required (Admin)

**Request**
\`\`\`json
{
  "title": "글 제목",
  "content": "마크다운 내용",
  "categoryId": "uuid",
  "published": false
}
\`\`\`

**Response** (201)
\`\`\`json
{
  "id": "uuid",
  "title": "글 제목",
  "createdAt": "2026-02-28T00:00:00Z"
}
\`\`\`

**Errors**
- 401: Unauthorized
- 403: Forbidden (not admin)
- 400: Invalid input
- 500: Internal server error
```
