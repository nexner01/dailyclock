# Execution Plan: 마일스톤 1 - 기반 하네스 & 코어 시계 구현

* **상태**: In Progress
* **책임 에이전트**: Orchestrator

---

## 단계별 실행 체크리스트

### Phase 1: 기반 세팅 & 하네스 가드
- [x] 지식 맵 구축 (`AGENTS.md`, `ARCHITECTURE.md`, `docs/PRD.md`)
- [x] 코어 각도 계산 및 다이얼 명세 작성 (`docs/design-docs/001-clock-dial-spec.md`)
- [x] TDD 전략 수립 (`docs/tests/strategy.md`)
- [x] Vite + React + TypeScript + Tailwind CSS 프로젝트 스캐폴딩
- [x] Vitest 및 테스트 환경 구성

### Phase 2: TDD 코어 구현 (Dial & Needle)
- [x] TDD Red: `src/core/dial.test.ts` 각도 및 자정 래핑 테스트 작성
- [x] TDD Green: `src/core/dial.ts` 함수 구현 및 테스트 통과
- [x] 24시간 원형 SVG 시계 컴포넌트 (`<ClockDial />`) 구현
- [x] Taste as Code 테스트: 단일 시침 1개 강제 및 초/분침 배제 테스트 통과
- [x] 단일 시침 1초/1분 간격 틱 엔진 구현

### Phase 3: Document PiP 플로팅 뷰 & F1 단축키
- [x] Document Picture-in-Picture 창 생성 훅/매니저 작성 (`useDocumentPiP.ts`)
- [x] F1 키 글로벌 단축키 리스너 구현 (도움말 팝업 차단 및 모달 오픈)
- [x] 플로팅 창 전용 미니멀 렌더링 (React Portal 기반 독립 윈도우 동기화)

### Phase 4: 자체 캘린더 CRUD & 로컬 스토리지
- [x] Dexie.js (IndexedDB) 스키마 정의 (`RoutinePreset`, `RoutineBlock`, `UserSettings`)
- [x] 템플릿 선택, 신규 생성, 복제, 삭제 기능 완성
- [x] 24시간 일과 블록 등록 및 삭제 UI 연동
- [x] 테마(Dark/Light/System) 및 컬러 팔레트 설정 UI 연동

### Phase 5: Google Calendar & Tasks 단방향 연동
- [x] SDD 003 명세서 작성 및 인간 엔지니어 승인 완료
- [x] Google Identity Services (GIS) 라이브러리 및 스코프 설정
- [x] TDD Red/Green: Calendar Events & Tasks Read-Only 파서 및 보안 단언(Taste as Code) 테스트 통과
- [x] 원형 시계에 구글 일정 Arc 오버레이 표시 및 캘린더 소스(자체/구글/병합) 연동 완성

### Phase 6: 12시간 아날로그 시계 모드 및 주간 일과 (SDD 004)
- [x] SDD 004 명세서 작성 및 인간 엔지니어 승인 완료 (아날로그 시계 일치 원칙)
- [x] TDD: 실제 아날로그 시계 각도 계산(12시=0°, 3시=90°, 6시=180°, 7시=210°, 8시=240°) 테스트 통과
- [x] TDD: 주간 12시간 일과 클리핑 및 12개 눈금(Hour Markers) 렌더링 검증
- [x] 환경설정: 12시간/24시간 모드 선택 및 12시간 주간 시작 시각(기본 오전 8시) 드롭다운 연동
- [x] 메인 헤더 빠른 모드 토글 버튼 및 플로팅(Document PiP) 창 실시간 동기화 완성

### Phase 7: 시간표 호버 확대 및 중앙 상세 팝업 (SDD 005)
- [x] SDD 005 명세서 작성 및 인간 엔지니어 승인 완료
- [x] 호버 시 해당 호(Arc) 바깥쪽 +10px 돌출 확대 & 흰색 테두리 하이라이트 구현
- [x] 호버 시 비선택 다른 일정들 0.45 디밍(Dimming) 시선 집중 구현
- [x] 호버 시 원 중심부에 큼직한 일과 제목, 시간대(HH:mm~HH:mm), 소요시간 카드 팝업 구현
- [x] TDD 컴포넌트 인터랙션 테스트 통과 (총 30개 테스트 완료)

### Phase 8: 일과 전환 5초 전 전체 레이아웃 카운트다운 (SDD 007)
- [x] SDD 007 명세서 작성 및 인간 엔지니어 승인 완료
- [x] 5초 전 정확한 전환 감지 알고리즘 (`checkUpcomingTransition`) TDD 통과
- [x] 다이얼 외곽 링 네온 펄스 글로우 및 레이아웃 확대 스케일 연출 구현
- [x] 중앙 영역 대형 카운트다운 숫자(5, 4, 3, 2, 1) 및 다음 일과 안내 배너 구현
- [x] 33개 단위/통합 테스트 전원 통과 및 프로덕션 빌드 성공

