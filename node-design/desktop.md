🧠 muse.log — Figma Design Prompt
🎯 프로젝트 컨텍스트
개인 블로그 muse.log의 메인 페이지 UI/UX 디자인.
개발 / 아이디어 / 주식 / 생활 / 관계 카테고리를 다루는 1인 사색 블로그.
핵심 전제: AI 글 난립으로 블로그 탐색 패러다임이 붕괴됨.
기존의 헤더-카테고리-목록 구조를 전면 폐기하고,
"질문 기반 진입 + 신경망 시각 탐색" 이라는 새로운 패러다임을 제안함.
타겟 디바이스: Desktop only (1440px 기준). 모바일 플로우는 스코프 외.

🖥️ 전체 레이아웃 구조
배경 & 무드

배경: #080B10 수준의 딥 다크
전체 화면에 신경망 노드-엣지 그래프가 흐릿하게 존재 (ambient 상태)
노드 선: 형광 청록(#00FFC8 계열) or 형광 퍼플(#A78BFA 계열), 낮은 opacity로 항상 미세하게 pulse 애니메이션
전체적인 레퍼런스 무드: Neuralink 발표 영상, Cosmos UI, 사이버펑크 2077 메뉴


📦 중앙 박스 (Center Card) — 화면의 60%
형태

화면 정중앙, 가로 60% / 세로 적절한 직사각형 (약 560–640px height)
backdrop-filter: blur + 반투명 다크 배경 (rgba(10, 14, 20, 0.85))
테두리: 형광 색상 1px border + 은은한 glow (box-shadow inset + outset)
박스 크기는 상태에 따라 절대 변하지 않음 (고정 크기 유지가 핵심 컨셉)

박스 내부 구성 (위→아래)
[ muse.log ]                          <- 로고 / 블로그명, 최소화된 타이포
[ 짧은 자기소개 1–2줄 ]               <- "개발하고 투자하고 살아가는 사람의 기록"
[ GitHub ] [ About ] [ RSS ]          <- 아이콘+텍스트 미니 링크 3개, 한 줄
────────────────────────────────────
[ 채팅 히스토리 영역 ]                <- 초기엔 비어있음, 질의 후 말풍선 형태로 채워짐
                                       assistant 응답은 스트리밍 타이핑 효과
────────────────────────────────────
[ 🔍 muse에게 무엇이든 물어보세요... ] <- 하단 고정 input
                                        전송 버튼 또는 Enter
채팅 인터랙션 상태

Default: 채팅 히스토리 없음. input placeholder만 표시
After query: 히스토리 영역에 유저 말풍선(우) / AI 응답 말풍선(좌) 쌓임

AI 응답 말풍선 하단에 "관련 글 보기" 링크 or 태그 형태로 slug 노출
동시에 신경망의 관련 노드들이 하이라이트됨 (박스 외부 인터랙션과 연동)


스크롤은 히스토리 영역 내부에서만 발생


🕸️ 신경망 레이어 (Neural Network Graph) — 박스 바깥
데이터 구조 (계층)
[루트: muse.log]
  ├── [IT]
  │     ├── [Backend]
  │     │     ├── (slug) 테스트-게시글-1
  │     │     └── (slug) 테스트-게시글-2
  │     └── [Frontend]
  │           └── (slug) 테스트-게시글-3
  ├── [아이디어]
  │     └── (slug) 생각을-소유하는-것
  ├── [주식]
  │     └── (slug) 손실을-기록하는-것
  ├── [생활]
  └── [관계]
노드 시각 스펙
노드 종류형태크기색상루트원형숨김 (중앙 박스가 루트)—카테고리 (depth 1)둥근 직사각형 pill큼형광 청록, opacity 40%서브카테고리 (depth 2)pill중간형광 퍼플, opacity 30%글 slug (leaf)작은 원 or 점작음흰색, opacity 20%
Ambient 상태 (기본)

모든 노드가 낮은 opacity로 화면 4방향으로 퍼져있음
중앙 박스에서 엣지(선)가 뻗어나가 카테고리 노드들과 연결된 구조
노드들은 미세한 float 애니메이션 (±3px, 느리게)
화면 가장자리에 가까울수록 더 희미해지는 vignette 처리

가장자리 Hover → 자동 확장 트리거

마우스가 화면 상/하/좌/우 가장자리 120px 이내 진입 시
해당 방향에 위치한 카테고리 노드들이 opacity 상승 + scale up + 자식 노드 전개
전개 애니메이션: 중앙에서 바깥으로 펼쳐지는 spring 이징
가장자리를 벗어나면 원래 ambient 상태로 복귀 (fade out)
한 번에 하나의 방향만 활성화 (다른 방향은 더 어두워짐)

카테고리 노드 클릭

항공사진 야경 효과: 클릭한 카테고리와 그 하위 노드만 밝게 유지
나머지 전체 노드 + 배경: opacity 급감, 어두운 오버레이 처리
활성 카테고리의 slug 노드들이 더 밝게, 더 크게 표시
다시 클릭하거나 배경 클릭 시 ambient 상태로 복귀

AI 응답 후 하이라이트

채팅 응답에 언급된 글과 관련된 노드들이 펄스 glow 효과로 하이라이트
중앙 박스 → 해당 노드까지 연결선이 일시적으로 더 밝아짐 (1.5초 후 fade)
복수 글 언급 시 관련 노드 전부 동시 하이라이트

글 slug 노드 클릭 → 글 상세 팝업

중앙 박스 위에 레이어로 뜨는 모달 (중앙 박스는 dimmed)
모달 스펙: 최대 800px width, 스크롤 가능, 다크 + glow 테두리
닫기 버튼 or 배경 클릭 시 닫힘


🎨 디자인 시스템
Colors:
  --bg:           #080B10
  --card:         rgba(10, 14, 22, 0.85)
  --border-glow:  #00FFC8
  --node-cat:     #00FFC8
  --node-sub:     #A78BFA
  --node-leaf:    #FFFFFF
  --text-primary: #F0F0F0
  --text-muted:   #6B7280
  --accent:       #00FFC8

Typography:
  - 로고/헤딩: Space Grotesk or Syne (영문), Noto Sans KR (한글)
  - 본문/채팅: Inter or DM Sans, 14px
  - 노드 라벨: IBM Plex Mono, 11–13px

Spacing: 8px base grid
Border radius: card 16px, pill node 999px, slug node 8px

📐 Figma 작업 요청사항

Frame 구성

Desktop / Default — ambient 상태 (아무 인터랙션 없음)
Desktop / Edge Hover — Left — 좌측 가장자리 hover, IT 계층 전개
Desktop / Category Active — IT — IT 카테고리 클릭, 야경 효과
Desktop / Chat Active — 질의 후 채팅 히스토리 + 노드 하이라이트
Desktop / Post Modal — 글 상세 팝업 오버레이


컴포넌트화 필수

Center Card (상태별: default / chat-active)
Node / Category (상태별: ambient / hover / active / dimmed)
Node / Subcategory (상동)
Node / Leaf (상동)
Edge Line (상태별: ambient / highlighted)
Chat Bubble (user / assistant)
Post Modal


프로토타입 플로우

가장자리 hover trigger → 노드 전개 전환
카테고리 클릭 → 야경 효과 전환
slug 클릭 → 모달 오픈
모달 닫기 → 이전 상태 복귀
