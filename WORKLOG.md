# DailyClock 작업 내역 보고서 (Worklog & Implementation History)

**최종 업데이트**: 2026-11-06  
**버전**: v0.1.1  
**GitHub 저장소**: [nexner01/dailyclock (Private)](https://github.com/nexner01/dailyclock)  
**기술 스택**: React 19, TypeScript, Vite, Tailwind CSS v4, Dexie.js (IndexedDB), Vitest, Lucide-react, Document Picture-in-Picture API  

---

## 📋 1. 프로젝트 개요

**DailyClock**은 하루 루틴 및 일정을 360도 원형 아날로그 다이얼 위에 시각화하는 데스크톱 웹 애플리케이션입니다.
- **초침/분침 없는 단일 지시 바늘(Needle)**로 시간의 흐름과 현재 일과를 차분하게 인지
- 브라우저 W3C 표준 **`Document Picture-in-Picture API`**를 활용하여 OS 바탕화면 위 **항상 최상단(Always-on-Top) 플로팅 시계** 제공
- 자체 24시간 생활계획표 CRUD + Google Calendar & Tasks의 안전한 **단방향(Read-Only)** 연동 지원
- **OpenAI Harness Engineering** 및 **SDD(Spec-Driven) & TDD(Test-Driven)** 방법론에 기반하여 설계·구현

---

## 🛠️ 2. 주요 작업 및 기능 구현 내역

### 1) 프로젝트 기반 아키텍처 & 하네스 수립
- **지식 맵 구축**: [`AGENTS.md`](./AGENTS.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`docs/PRD.md`](./docs/PRD.md)
- **TDD 전략 수립**: Vitest 기반 Red-Green-Refactor 테스트 파이프라인 구축 (`docs/tests/strategy.md`)
- **보안 및 설계 원칙**: Human-Approved SDD 규칙 강제, 단일 바늘 기계적 검증, 구글 단방향 Read-Only 강제

### 2) 24시간 & 12시간 아날로그 원형 다이얼 (Core Engine)
- **24시간 모드**: 하루 24시간(상단 00:00, 하단 12:00) 360도 전체 조망
- **12시간 모드 (물리 아날로그 시계 일치)**:
  - 12시는 상단(0°), 3시는 우측(90°), 6시는 하단(180°), 9시는 좌측(270°)으로 실제 아날로그 시계 다이얼과 100% 동일하게 동작
  - 주간 활동 시간대(기본 오전 8시 ~ 오후 8시) 일정 클리핑 및 12개 눈금 시각화
- **텍스트 시독성 보정**: 하단 영역(90°~270°)의 텍스트가 거꾸로 뒤집히지 않도록 180° 자동 반전 계산식 적용
- **슬릭 궤도 화살표(Orbit Needle)**:
  - 중심부 디지털 숫자를 가리지 않도록 중앙 원 반경을 최적화(`r=90px`)
  - 안쪽 코어와 일과 호 사이의 24px 트랙(`r=90~114px`)에 30px 황금빛 다트 화살표 배치

### 3) Document Picture-in-Picture 항상 최상단 플로팅 뷰
- 순수 웹 브라우저의 `window.documentPictureInPicture` API를 연동하여 별도 OS 네이티브 설치 없이 플로팅 창 구현
- 본체 창의 스타일시트(Tailwind CSS)를 팝업 창에 완벽 복제
- 플로팅 창 내부에서도 단축키 **`[F1]`** 입력 시 환경설정 창이 정상 연동되도록 이벤트 전파 처리

### 4) 로컬 일과표 관리 시스템 (IndexedDB + Dexie.js)
- 다중 템플릿 프리셋 관리 (기본 템플릿, 주말 템플릿 등)
- 템플릿 신규 생성, 복제(Duplicate), 삭제 기능
- 24시간 루틴 블록 추가/삭제 및 색상 지정 (10가지 프리셋 컬러)

### 5) Google Calendar & Google Tasks 안전한 연동
- **Strict Read-Only 보안**:
  - `https://www.googleapis.com/auth/calendar.events.readonly`
  - `https://www.googleapis.com/auth/tasks.readonly`
  - 생성/수정/삭제 등 뮤테이션 API를 원천 차단하는 단위 테스트 강제
- **데이터 소스 3단계 전환**:
  - 자체 일과표만 보기 (`local`)
  - 구글 일정만 보기 (`google`)
  - 함께 보기 병합 뷰 (`both`: 자체 일과 + 구글 일정 외곽 링 오버레이)
- **클라이언트 ID 보안**: 환경설정의 Google OAuth Client ID를 상시 비밀번호 필드(`type="password"`)로 마스킹 유지

### 6) 시간표 호버 인터랙션 (Hover Expansion & Details)
- 일과 호(Arc)에 마우스 오버 시:
  - 해당 호가 바깥쪽으로 **+10px 돌출 확대** 및 글로우 테두리 하이라이트
  - 다른 비선택 일정들은 투명도 0.45로 자동 디밍(Dimming)되어 시선 집중
  - 다이얼 정중앙에 대형 상세 카드(일정 제목, 시작/종료 시각, 소요 시간) 오버레이 노출

### 7) 일과 전환 5초 전 전체 레이아웃 카운트다운 (Transition Pulse)
- 다음 일과 시작 5초 전이 되면 전체 시계 다이얼이 감지 모드로 전환
- 외곽 링 네온 앰버 펄스 글로우 및 다이얼 전체 미세 진동 스케일 연출
- 중심부에 **대형 카운트다운 숫자(5 → 4 → 3 → 2 → 1)** 및 다음 일과 안내 배너 표시
- 전환 완료(0초 도달) 시 자연스럽게 정상 다이얼로 복귀

### 8) 모바일 최적화, PWA 바로가기 전용 아이콘 및 미작동 기능 정리 (SDD 009)
- **크롬 바로가기 & PWA 전용 아이콘**: 고해상도 벡터 SVG 브랜드 아이콘(`public/icon.svg`) 및 `manifest.webmanifest` 탑재로 바탕화면/홈 화면 바로가기 생성 시 선명한 원형 다이얼 아이콘 노출
- **미작동/불필요 기능 완전 제거**:
  - 모바일 및 미지원 브라우저에서 클릭 불가 상태였던 `[최상단 플로팅 뷰]` 버튼 및 `PiP Ready` 배지 완전 삭제
  - 헤더의 `[환경설정 F1]` 버튼 삭제 (데스크톱 `F1` 핫키만 백그라운드 유지)
  - 상단 헤더를 브랜드 로고 + `☀️ 12H / 🌙 24H` 토글 버튼만 남겨 극도로 심플하게 정돈
- **유연한 반응형 다이얼**: 고정 px 대신 `min(90vw, 420px)` 반응형으로 360px 모바일 화면에서도 가로 스크롤/짤림 없이 1:1 정비율 렌더링
- **터치 친화 인터랙션**: 마우스 호버 대신 일과 호(Arc)를 터치(탭)하면 +10px 돌출 및 상세 카드 표시, 재터치 시 닫히는 토글 로직 구현

### 9) 12시간 주간/야간 일과표 선택 및 야간 일과 입력 (SDD 010)
- **주간/야간 자동 전환 & 빈값 보장**:
  - 주간(08:00~20:00)에는 주간 일과표, 야간(20:00~08:00)에는 야간 일과표로 자동 전환
  - 야간 시간대에 등록된 일정이 없는 경우, 다이얼에 일과 호를 일절 그리지 않고 깨끗한 빈 다이얼(`[]`)로 보장
- **일과표 메인 화면 낮(☀️)/밤(🌙) 아이콘 선택**:
  - 12시간 모드 시계 화면 상단에 `[☀️ 낮 (08~20시)]` 및 `[🌙 밤 (20~08시)]` 캡슐형 아이콘 버튼 배치
  - 현재 시각 기준 자동 전환 외에도 언제든 원하는 시간표를 즉시 교체하여 열람 가능
- **환경설정(SettingsModal) 야간 시간표 분리 입력**:
  - `자체 일과표 관리` 탭 내에 `[전체 (24H)]`, `[☀️ 주간]`, `[🌙 야간]` 필터 및 입력 세그먼트 신설
  - `[🌙 야간]` 선택 시 시작/종료 시각 기본값(`20:00` ~ `23:00`) 추천 및 야간 블록 필터링
  - 등록된 야간 블록이 없을 시 빈 일과표 안내 문구 제공

---

## 💾 3. 데이터 저장 및 보안 아키텍처 (Storage & Security)

DailyClock은 서버리스 기반의 **오프라인 우선(Local-First)** 아키텍처를 따르며, 사용자의 모든 데이터는 브라우저 내부 로컬 데이터베이스에만 영구 저장됩니다.

### 1) 저장소 구조 (`src/db/index.ts`)
* **엔진**: 브라우저 표준 로컬 데이터베이스 **`IndexedDB`** ([`Dexie.js`](file:///d:/Workspace/3.%20실습/BIz/dailyclock/src/db/index.ts) 라이브러리 사용)
* **데이터베이스 이름**: `DailyClockDB` (버전 1)
* **테이블 구성**:
  1. **`settings` 테이블** (단일 레코드, Key: `'current'`): 환경설정 및 사용자 옵션 저장
  2. **`presets` 테이블** (다중 레코드, Key: `id`): 생활계획표 템플릿 및 블록 목록 저장

### 2) 환경설정(`settings`) 저장 항목 상세
| 필드명 | 타입 | 설명 | 기본값 |
| :--- | :--- | :--- | :--- |
| **`googleClientId`** | `string` | Google OAuth Client ID (항상 마스킹 처리되어 보관) | `""` |
| **`dialMode`** | `'12h' \| '24h'` | 시계 다이얼 모드 (물리 아날로그 12시간 / 전체 24시간) | `'12h'` |
| **`calendarSource`** | `'local' \| 'google' \| 'both'` | 캘린더 소스 (자체 일과 / 구글 캘린더 / 병합 뷰) | `'local'` |
| **`twelveHourStart`** | `number` | 12시간 모드 주간 시작 시각 (클리핑 기준) | `8` (오전 8시) |
| **`activePresetId`** | `string` | 현재 활성화된 생활계획표 템플릿 ID | `'preset-weekday'` |
| **`theme`** | `'dark' \| 'light' \| 'system'` | UI 테마 모드 | `'dark'` |
| **`colorPalette`** | `'default' \| 'pastel' \| 'neon' \| 'ocean'` | 일과표 컬러 팔레트 | `'default'` |

### 3) 보안 및 영구성
* **외부 서버 전송 전무**: 사용자의 Client ID, 일정, 루틴 정보는 일체 외부 백엔드로 전송되지 않고 로컬 PC 브라우저에만 남습니다.
* **영구 보존**: 브라우저를 닫거나 컴퓨터를 재부팅해도 IndexedDB에 데이터가 안전하게 유지됩니다.
* **직접 확인 방법**: 브라우저 `F12` 개발자 도구 → `애플리케이션(Application)` 탭 → `스토리지(Storage)` → `IndexedDB` → `DailyClockDB`에서 실시간 열람 가능합니다.

---

## 📑 4. 기능 설계 명세서 (SDD) 현황

| 문서 번호 | 명세서 명칭 | 상태 | 승인자 |
| :--- | :--- | :---: | :---: |
| [`001`](./docs/design-docs/001-clock-dial-spec.md) | 코어 시계 다이얼 및 바늘 명세서 | **Approved** | 위승 (2026-11-05) |
| [`002`](./docs/design-docs/002-dial-labels-and-center-clock.md) | 다이얼 시간 라벨 및 중심 디지털 시계 명세 | **Approved** | 위승 (2026-11-05) |
| [`003`](./docs/design-docs/003-google-sync-spec.md) | Google Calendar & Tasks 단방향 연동 명세 | **Approved** | 위승 (2026-11-05) |
| [`004`](./docs/design-docs/004-12h-mode-spec.md) | 12시간 아날로그 다이얼 모드 명세서 | **Approved** | 위승 (2026-11-05) |
| [`005`](./docs/design-docs/005-hover-expansion-spec.md) | 시간표 호버 확대 및 중앙 상세 정보 팝업 명세 | **Approved** | 위승 (2026-11-05) |
| [`006`](./docs/design-docs/006-block-edit-and-themes.md) | 일과 블록 인라인 수정 및 실시간 테마 명세 | Proposed | - |
| [`007`](./docs/design-docs/007-transition-countdown-spec.md) | 일과 전환 5초 전 전체 레이아웃 카운트다운 명세 | **Approved** | 위승 (2026-11-05) |
| [`008`](./docs/design-docs/008-google-auto-sync-spec.md) | 구글 캘린더 화면 활성화 기반 30분 자동 동기화 명세 | Proposed | - |
| [`009`](./docs/design-docs/009-mobile-optimization-spec.md) | 모바일/PWA 최적화, 바로가기 아이콘 및 미작동 기능 제거 명세 | **Approved** | 위승 (2026-11-05) |
| [`010`](./docs/design-docs/010-day-night-12h-cycle-spec.md) | 12시간 모드 주간/야간 일과표 선택 및 환경설정 입력 명세 | **Approved** | 위승 (2026-11-06) |

---

## 🧪 5. 테스트 및 품질 지표 (TDD & Taste as Code)

- **테스트 러너**: Vitest v3.2.7 (React Testing Library + JSDOM)
- **전체 단위/통합 테스트**: **45개 전체 통과 (0건 실패)**
  - `src/core/dial.test.ts` (26개 테스트): 각도 계산, 12H/24H 좌표 변환, 주간/야간 자동 판별, 야간 윈도우 교차 및 빈값 보장, 자정 래핑, 5초 전환 감지 등
  - `src/services/googleSync.test.ts` (7개 테스트): Strict Read-Only API 단언, Calendar/Tasks 파서 정확성
  - `src/components/ClockDial.test.tsx` (12개 테스트): 단일 바늘 불변식(초/분침 배제), 중앙 시계, 12H/24H 눈금, 야간 빈값 다이얼 보장, 낮/밤 모드 지정 렌더링, 호버 인터랙션, 터치 탭 토글, 5초 카운트다운 UI
- **프로덕션 빌드**: `tsc && vite build` 정상 완료 (TypeScript 0 오류)

---

## 🚀 6. Git & GitHub 형상 관리

- **로컬 저장소 초기화**: `.gitignore` 설정 (빌드 산출물, 의존성 제외) 및 첫 커밋 완료
- **원격 저장소**: GitHub Private Repository 푸시 완료
  - 주소: `https://github.com/nexner01/dailyclock.git`
  - 브랜치: `main`
