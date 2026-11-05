# DailyClock: Architecture & System Boundaries

DailyClock은 데스크톱 설치 없이 **순수 웹 브라우저**에서 동작하며, W3C 표준 **Document Picture-in-Picture API**를 통해 '항상 최상단(Always-on-Top)' 플로팅 위젯을 제공하는 24시간 일정/루틴 시각화 도구입니다.

---

## 1. 핵심 아키텍처 원칙 (Immutable Constraints)

### 1) 순수 웹 & Always-on-Top 윈도우
* 추가 프로그램 설치 없이 최신 Chromium 기반 브라우저(Chrome, Edge 등)에서 직접 실행됩니다.
* **Document Picture-in-Picture (PiP) API** (`window.documentPictureInPicture.requestWindow({ width, height })`)를 사용하여 OS 최상단에 고정되는 미니멀 위젯 윈도우를 분리 렌더링합니다.
* Document PiP 창에는 **24시간 원형 차트와 현재 시각 시침**만 렌더링되며, 불필요한 크롬(헤더, 메뉴 등)이 일절 배제됩니다.

### 2) Google Calendar / Tasks 단방향 동기화 (Strict Read-Only)
* 구글 연동은 오직 **조회(Read) 전용**입니다.
* DailyClock에서 작성/수정한 루틴은 절대 구글 캘린더나 Tasks로 역동기화(Write)되지 않습니다.
* OAuth 스코프는 최소 권한(`calendar.events.readonly`, `tasks.readonly`)만 요청하여 사용자의 데이터 변조 우려를 원천 차단합니다.

### 3) 24시간 단일 지침 시계 (Single Needle 24H Dial)
* 0시(자정)부터 24시까지 360도를 순환하는 다이얼입니다. (1시간 = 15도)
* 분침과 초침은 렌더링하지 않으며, 현재 시간을 가리키는 **단 하나의 시침(Indicator Needle)**만 렌더링합니다.

---

## 2. 계층 구조 (Layered Architecture)

```
┌────────────────────────────────────────────────────────┐
│                      Presentation                      │
│  ┌─────────────────────────┐  ┌─────────────────────┐  │
│  │ Main Window (SPA)       │  │ PiP Floating Window │  │
│  │ - Routine CRUD / Presets│  │ - 24H Dial SVG      │  │
│  │ - Settings (F1 Trigger) │  │ - Single Needle     │  │
│  │ - Google OAuth Setup    │  │ - F1 Key Handler    │  │
│  └─────────────────────────┘  └─────────────────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │ Zustand State Store
┌───────────────────────────▼────────────────────────────┐
│                    Application Core                    │
│  - ClockAngleService (각도 계산, 자정 래핑 처리)       │
│  - ScheduleMerger (구글 이벤트 + Tasks + 자체 캘린더)  │
│  - PiPManager (Document PiP 수명주기 & 스타일 복제)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                   Data & Integration                   │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │ Local DB (Dexie.js)   │   │ Google Sync Client   │  │
│  │ - Routine Presets     │   │ - Calendar API (RO)  │  │
│  │ - User Settings       │   │ - Tasks API (RO)     │  │
│  └───────────────────────┘   └──────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 3. 키보드 단축키 계약 (Key Contract)

* **`F1`**: 어느 창(메인 창 또는 PiP 플로팅 창)에서든 `F1` 키를 누르면:
  1. PiP 창이 포커스된 경우 메인 창으로 포커스를 전환합니다 (`window.focus()`).
  2. 메인 창에 **환경설정(Settings Modal)** 화면을 즉시 엽니다.
  3. 브라우저의 기본 `F1`(도움말 창) 동작을 `e.preventDefault()`로 가로챕니다.

