# 📦 스택

## 🖥 Frontend

- Next.js (App Router)
- 배포: Vercel (무료 플랜)

### 역할
- 블로그 렌더링
- 챗봇 UI
- API Route로 서버 역할 수행

---

## 🗄 Database

- Supabase
  - PostgreSQL
  - pgvector 확장 사용

### 역할
- 블로그 글 저장
- 임베딩 벡터 저장
- 유사도 검색

---

## 🤖 AI

- OpenAI API

### 역할
- 임베딩 생성
- 답변 생성 (RAG 방식)

---

# 🧠 구조 개요 (RAG)

## 1️⃣ 글 작성 시

1. 글 저장
2. 텍스트 분할
3. 임베딩 생성
4. pgvector에 저장

## 2️⃣ 질문 시

1. 질문 임베딩 생성
2. 유사 문서 검색
3. 검색 결과를 컨텍스트로 LLM 호출
4. 답변 반환

---

# 🏗 전체 구조

```
Next.js (UI + API Route)
        ↓
Supabase (Postgres + pgvector)
        ↓
OpenAI API
```