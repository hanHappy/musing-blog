## Completed (2026-03-08)

- ✅ 게시글 우측에 목차 네비게이터 (Table of Contents with scroll spy)
- ✅ 카테고리 필터링 페이지 (`/category/[slug]`)
- ✅ 클릭 가능한 Breadcrumb 네비게이션
- ✅ 3-column 레이아웃 (Sidebar + Main Content + Right Sidebar)
- ✅ Post metadata에서 `updated_at` 제거
- ✅ ESLint 에러 수정 (11 errors → 0 errors)

## Backlog

- RAG할 때 유사도 0.7 이상인 글이 한 건도 없으면 "관련 내용이 없습니다" 답변
- 카테고리 관리 페이지 개선
- 실제 데이터 반영 (샘플 포스트 추가)
- 라이트모드 스타일 - 현재 스타일 적용(이전 스타일인 파란색이 적용되어 있음)

1. 게시글 페이지 개선
게시글 상세 페이지(/posts/[slug])를 개선하려 함.
  - 블로그이나 메인 화면을 노드식, 채팅 방식으로 개선한 상황
  - 그러나 노드식, 채팅 구성에 얽매여 생각할 필요는 없음
  - 상세 페이지 레이아웃 개선을 위한 좋은 아이디어 있는지?
  - 게시글이 짧을 경우 푸터가 위로 밀려 올라가는데, 하단 고정
  - 게시글 우측에 목차 navigator 필요

2. 태그 기반 게시글 연결
  - 