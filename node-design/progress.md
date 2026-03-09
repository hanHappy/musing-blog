# Neural Network UI 구현 진행 상황

> 목표: `desktop.md` 디자인 가이드에 따른 데스크탑 전용 신경망 UI 구현

## 📊 전체 진행률: ~95%

---

## ✅ 완료된 항목

### 1. 기본 레이아웃 & 디자인 시스템
- [x] 딥 다크 배경 (#080B10) - `globals.css:32-34`
- [x] Neural 테마 CSS 변수 설정 - `globals.css:55-65`
- [x] 타이포그래피 (Space Grotesk, Inter, IBM Plex Mono) - 변수로 적용됨
- [x] 8px 그리드 기반 스페이싱
- [x] 글로우 효과, 테두리 색상 변수

### 2. 중앙 박스 (CenterCard) - `CenterCard.tsx.backup`
- [x] 화면 중앙 60% 고정 크기 (w-60% × h-640px)
- [x] backdrop-filter blur + 반투명 배경
- [x] 형광 테두리 + 회전 glow 효과 - `globals.css:732-783`
- [x] 로고 / 자기소개 / GitHub/About/RSS 링크
- [x] 채팅 히스토리 영역
- [x] 하단 고정 입력창 + 전송 버튼
- [x] 접기/펼치기 기능 (Minimize2 아이콘)
- [x] 접힌 상태에서 회전 애니메이션 중지

### 3. 채팅 시스템 - `ChatBubble.tsx`, `CenterCard.tsx.backup`
- [x] 채팅 히스토리 영역 (스크롤)
- [x] 유저/AI 말풍선 컴포넌트 (좌/우 정렬)
- [x] AI 응답 스트리밍 타이핑 효과 (20ms interval)
- [x] 관련 글 slug 버튼 표시 (타이핑 완료 후)
- [x] 히스토리 영역 내부 스크롤
- [x] 로딩 상태 (펄스 3개 점)
- [x] /api/chat 연동

### 4. 신경망 그래프 - `neural-graph-builder.ts`, `NeuralNetwork.tsx`
- [x] 데이터 구조 (루트 → 카테고리 → 서브카테고리 → post)
- [x] `buildNeuralGraph()` - 3레벨 계층 생성
- [x] 원형 배치 (radius 450px, 카테고리별 각도 분산)
- [x] 노드 타입별 스타일
  - category: pill, #00FFC8
  - subcategory: pill, #A78BFA
  - post: 작은 원, #FFFFFF
- [x] 엣지 연결선 (SVG line)
- [x] Ambient 상태 (opacity 0.4)
- [x] Float 애니메이션 (y축 ±3px, 3초)
- [x] Vignette 효과

### 5. 인터랙션 - `NeuralHomePage.tsx`, `NetworkNode.tsx`
- [x] 카테고리 클릭 → 야경 효과 (activeCategory 상태)
- [x] AI 응답 후 노드 하이라이트 (5초 후 자동 해제)
- [x] slug 노드 클릭 → PostModal 열기
- [x] 모달 백드롭 클릭 → 닫기

### 6. 모달 - `PostModal.tsx`
- [x] 최대 800px 너비 (max-w-3xl)
- [x] 다크 + glow 테두리 (neural-center-card)
- [x] 닫기 버튼 (X 아이콘)
- [x] /api/posts?slug= 로 데이터 fetch
- [x] 로딩/에러 상태
- [x] 간단한 마크다운 렌더링 (정규식 기반)
- [x] 스크롤 가능

### 7. 애니메이션
- [x] 노드 pulse 애니메이션 (하이라이트 시)
- [x] 노드 float 애니메이션 (기본)
- [x] 회전 glow 효과 (4s linear infinite)
- [x] Framer Motion (motion.div, spring 이징)
- [x] 타이핑 효과 (ChatBubble)

### 8. 데이터 통합
- [x] 실제 카테고리/글 데이터 연동 (NeuralHomePage props)
- [x] 신경망 그래프 빌더 (`buildNeuralGraph`)
- [x] 채팅 API 연동 (`/api/chat`)

### 9. D3.js Force Simulation 통합 (2026-03-09 완료)
- [x] **D3 물리 엔진 구현** - `useD3ForceSimulation.ts` (새 파일)
  - Link force (depth별 거리: L1=120px, L2=100px, L3=80px)
  - Charge force (depth별 반발력: L1=-600, L2=-300, L3=-150)
  - Collision force (노드 크기 기반 충돌 감지)
  - Radial force (L1 카테고리를 반지름 280px로 유지)
  - Center force (가벼운 중심 잡아당김)
- [x] **노드 크기 자동 계산** - `neural-graph-builder.ts`에 `calculateNodeSize()` 추가
  - depth별 폰트 크기 (L1: 13px, L2: 11px, L3: 10px)
  - 텍스트 길이 기반 너비 계산
  - 최소/최대 크기 제약 (W: 60-260px, H: 28px 이상)
  - 충돌 감지 반지름 자동 계산
- [x] **드래그 인터랙션** - `NetworkNode.tsx` & `useD3ForceSimulation.ts`
  - 노드 드래그로 위치 고정 (fx/fy)
  - depth 3 (post) 노드는 드래그 후 고정 유지
  - depth 1, 2 (category/subcategory) 노드는 드래그 해제 후 재시뮬레이션
  - 시뮬레이션 재가열 (alphaTarget)
- [x] **줌/팬 기능** - `useD3ForceSimulation.ts` & `NeuralNetwork.tsx`
  - 마우스 휠 줌 (0.3배 ~ 2.5배)
  - 휠 위치 기준 줌 인/아웃
  - 마우스 드래그 팬 (빈 공간에서)
  - 포인터 이벤트 기반 구현
- [x] **가장자리 Hover → 노드 전개** - `NeuralNetwork.tsx`
  - 마우스 위치 추적 (120px threshold)
  - expandedEdge 상태 (top/bottom/left/right)
  - 방향별 노드 필터링 (getNodeDirection)
  - 노드 opacity/scale 애니메이션 (0.3s duration)
  - 엣지도 함께 opacity 변화 (0.05 ~ 0.8)

### 10. 성능 최적화 (2026-03-09 완료)
- [x] **React.memo 최적화** - `NetworkNode.tsx`
  - Custom comparison with 1px position threshold
  - 상태 변화가 명확할 때만 리렌더링
- [x] **RAF Throttling** - `useD3ForceSimulation.ts`
  - 60fps 제한 (16.67ms 간격)
  - requestAnimationFrame 기반 업데이트
- [x] **SVG 연결선 최적화** - `NeuralNetwork.tsx`
  - motion.line으로 부드러운 애니메이션
  - opacity 기반 시각화 (highlighted/dimmed 상태 구분)

---

## 🚧 미완성 / 이슈

### 선택적 개선 사항 (완료 후 P3)
- [ ] **루트 노드 → 중앙 박스 엣지 연결** (시각적 완성도)
  - 루트 노드를 중앙 박스 위치로 표시
  - 박스 테두리에서 L1 카테고리로 선 연결

- [ ] **AI 응답 엣지 하이라이트 타이밍** (UX 개선)
  - 현재: AI 응답 완료 후 모든 하이라이트 5초 유지
  - 목표: 엣지는 1.5초 fade, 노드는 5초 유지 (개별 타이밍)

- [ ] **폰트 로딩 최적화** (성능)
  - Space Grotesk, IBM Plex Mono의 체리 로딩 확인
  - 필요시 WOFF2 포맷으로 최적화

- [ ] **줌/팬 UI 개시** (사용자 안내)
  - 초기 로드 시 줌/팬 가능 hint 표시
  - 터치 장치에서 pinch-zoom 지원 검토

---

## 📝 Git 커밋 히스토리 (최근 관련 커밋)

```
[2026-03-09]
- feat(neural): integrate D3 force simulation for physics-based graph layout
- feat(neural): add calculateNodeSize() for dynamic node dimensions
- feat(neural): implement zoom/pan with mouse wheel and drag
- feat(neural): add drag interaction with position locking for post nodes
- feat(neural): add edge hover expansion with directional filtering
- feat(neural): optimize NetworkNode with React.memo and custom comparison
```

Neural UI 통합 완료 (D3 Force Simulation, 드래그, 줌/팬, 성능 최적화)

---

## 🎯 다음 작업 우선순위

### P1 (선택적 개선 - 필요 시)
1. **AI 응답 엣지 타이밍 개선**
   - 엣지와 노드 하이라이트 분리 (현재 5초 일괄)
   - Ref 기반 타이밍 관리

2. **중앙 박스 ↔ 노드 엣지 연결**
   - 루트 노드 시각화 (또는 중앙 박스에서 직접 선 그리기)
   - SVG 경로 자동 계산

### P2 (최적화)
3. **줌/팬 제스처 개선**
   - 터치/트랙패드 pinch-zoom 지원
   - 더블탭 줌 리셋

4. **성능 모니터링**
   - 노드 개수 증가 시 FPS 추적
   - 가시 영역 기반 렌더링 고려 (필요 시)

---

## 🔍 주요 파일 구조

```
src/
├── components/neural/
│   ├── NeuralHomePage.tsx       # 메인 컨테이너 (상태 관리)
│   ├── CenterCard.tsx.backup    # 중앙 박스 (채팅 UI)
│   ├── NeuralNetwork.tsx        # 신경망 레이어 (D3 통합, 줌/팬)
│   ├── NetworkNode.tsx          # 개별 노드 (D3 위치, 드래그)
│   ├── ChatBubble.tsx           # 말풍선 컴포넌트
│   └── PostModal.tsx            # 글 상세 모달
├── hooks/
│   └── useD3ForceSimulation.ts  # D3 물리 엔진 hook (새 파일)
├── lib/
│   └── neural-graph-builder.ts  # 그래프 + 노드 크기 계산
├── types/
│   └── chat.ts                  # 타입 정의
└── app/
    └── globals.css              # Neural 테마 CSS (708-805줄)
```

### 의존성 추가 (2026-03-09)
```json
{
  "d3-force": "^3.0.0",
  "d3-drag": "^3.0.0",
  "d3-zoom": "^3.0.0",
  "@types/d3-force": "^3.0.0",
  "@types/d3-drag": "^3.0.0",
  "@types/d3-zoom": "^3.0.0"
}
```

---

## 💡 기술 결정 사항

### D3 & Physics
- **D3 역할 분리**: D3는 위치/속도 계산만, React는 렌더링만 담당
  - `useD3ForceSimulation` hook이 매 tick마다 노드 위치 업데이트
  - NetworkNode는 D3 계산 결과만 시각화
- **물리 엔진 튜닝**:
  - Link force: depth별 거리 제약 (L1 > L2 > L3)
  - Charge force: depth별 반발력 (깊을수록 약함)
  - Collision force: 노드 크기 기반 겹침 방지
  - Radial force: 카테고리만 반지름 유지 (다른 노드는 자유)
  - Center force: 가벼운 중심잡아당김 (초과 복원력 방지)

### 성능 최적화
- **RAF Throttling**: 60fps로 tick 업데이트 제한 (requestAnimationFrame)
  - throttleInterval = 1000 / 60 (16.67ms)
  - lastUpdate 기반 실제 업데이트 간격 조절
- **React.memo**: NetworkNode에 custom comparison 적용
  - 1px 미만 위치 변화: 리렌더링 스킵
  - 상태 변화(active/dimmed/highlighted/visible): 명시적 비교
- **SVG 최적화**: motion.line으로 부드러운 opacity 변화
  - 캔버스 대신 SVG 유지 (번들 크기 & 유지보수성)

### 인터랙션
- **드래그**: PointerEvent 기반
  - depth 3 노드: 드래그 후 고정 (fx/fy 유지)
  - depth 1, 2 노드: 드래그 후 해제 (재시뮬레이션)
  - 5px 이상 드래그: 클릭으로 간주하지 않음
- **줌/팬**: 수동 구현 (d3-zoom 미사용으로 번들 크기 절감)
  - 휠 줌: 마우스 위치 기준 (0.3배 ~ 2.5배)
  - 마우스 드래그: 평행 이동 (빈 공간에서만)
  - 포인터 이벤트 기반 (터치 미지원 - 향후 개선)
- **엣지 호버 전개**: 마우스 위치 기반 방향 감지
  - 120px threshold에서 top/bottom/left/right 판별
  - 해당 방향 노드만 visible, 나머지는 dim

### 데이터 구조
- **노드 크기 자동 계산**: 텍스트 길이 기반
  - depth별 폰트 크기: L1=13px, L2=11px, L3=10px
  - depth별 문자 너비: L1=8.5px, L2=7.5px, L3=6.8px
  - 최소/최대 제약: W 60-260px, H ≥28px
  - 충돌 반지름: sqrt((w/2)² + (h/2)²) + margin

### 애니메이션
- **Framer Motion**: motion.div/line으로 부드러운 전환
  - opacity/scale: 0.3s duration (가장자리 호버)
  - pulse: 1.5s repeat infinite (하이라이트)
  - initial: 노드 초기 상태 (opacity 0, scale 0.8)

---

## 🐛 알려진 이슈 & 해결사항

### 해결된 이슈
1. ✅ **가장자리 Hover 노드 전개**: `isNodeVisible()` 로직 구현 완료
   - 마우스 위치 추적 & 방향 판별
   - opacity/scale 애니메이션 적용
2. ✅ **노드 크기 불일치**: `calculateNodeSize()` 구현
   - 텍스트 길이 기반 동적 계산
   - depth별 폰트 크기 반영
3. ✅ **물리 엔진 없는 정적 배치**: D3 force simulation 통합
   - 노드 충돌 해결
   - 유연한 레이아웃

### 미해결 이슈 (선택적)
- **루트 노드 시각화**: 중앙 박스와 카테고리 노드 사이 엣지 추가 가능
- **터치 제스처**: pinch-zoom, swipe 미지원 (PC 우선)
- **폰트 로딩**: 실제 폰트 로드 여부 확인 필요

---

_마지막 업데이트: 2026-03-09_
