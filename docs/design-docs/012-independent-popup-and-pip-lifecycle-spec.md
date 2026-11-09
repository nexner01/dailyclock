# SDD: 012 - 부모 창 종료 시 유지되는 독립 팝업(Standalone Window) 및 PiP 수명주기 명세

상태: Approved
작성일: 2026-11-09
승인: 위승 2026-11-09

<!-- 승인은 사람만 한다. 검토가 끝나면 위 줄들을 이렇게 고친다: "상태: Approved", "승인: 이름 날짜(YYYY-MM-DD)" — 예) 위승 2026-11-05 -->

**연관 요구사항**: 사용자 요청 (브라우저 원래 화면을 닫아도 팝업이 닫히지 않도록 지원), SDD 001, ARCHITECTURE.md

---

## 1. 개요 및 기술적 배경

### 1) 기술적 제약 사항 (Chromium / W3C Web Standard)

- DailyClock의 기존 **`Document Picture-in-Picture (PiP)`**는 OS 최상단에 항상 고정(Always-on-Top)되는 강력한 장점이 있으나, W3C 웹 표준 스펙상 **부모 탭(Opener Window)의 생명주기에 엄격히 종속**됩니다.
- 즉, Chromium 브라우저 엔진 보안 및 프로세스 구조상 **부모 브라우저 탭이 닫히면 Document PiP 윈도우는 브라우저에 의해 강제로 함께 종료**됩니다.

### 2) 사용자 요구사항 및 솔루션

- **사용자 요구**: "원래 브라우저에 있던 화면(본체 창)을 닫아도 일과표 팝업이 안 닫히고 단독으로 계속 떠 있었으면 좋겠다."
- **해결 방안 (2가지 팝업 모드 제공)**:
  1. **독립 팝업 윈도우 (`window.open` 기반 컴팩트 모드)**:
     - 부모 창이 닫혀도 **절대 함께 닫히지 않고 단독으로 영구 유지**되는 순수 독립 브라우저 팝업 창(`/?mode=compact`).
     - 헤더, 푸터 없이 오직 **원형 일과표 다이얼만 100% 렌더링**.
     - 메인 브라우저 화면을 완전히 종료해도 일과표 팝업만 바탕화면에 남아 작동합니다.
  2. **항상 최상단 플로팅 뷰 (Document PiP 모드)**:
     - 다른 프로그램 위에 항상 고정(Always-on-Top)되지만, 브라우저 표준상 본체 탭이 열려 있어야 함.
     - PiP 활성화 상태에서 부모 탭을 실수로 닫지 않도록 안내 및 `beforeunload` 방어 제공.

---

## 2. 인터페이스 및 아키텍처 계약

### 1) URL 쿼리 파라미터 기반 컴팩트 팝업 모드 (`?mode=compact`)

- 주소창이나 `window.open` 호출 시 `?mode=compact` 쿼리가 있으면:
  - 메인 헤더, 푸터, 프리셋 버튼 등을 모두 숨기고 오직 **원형 다이얼(`ClockDial`)**만 화면에 꽉 차게 렌더링.
  - 마우스 우클릭이나 단축키 `F1`을 누르면 환경설정 창을 열 수 있음.

```typescript
// App.tsx
const isCompactMode =
  new URLSearchParams(window.location.search).get("mode") === "compact";
```

### 2) 독립 팝업 실행 함수 (`openStandalonePopup`)

```typescript
export function openStandalonePopup(width = 380, height = 420) {
  const left = window.screen.availWidth - width - 40;
  const top = 60;

  const popup = window.open(
    `${window.location.origin}${window.location.pathname}?mode=compact`,
    "DailyClockStandalonePopup",
    `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`,
  );

  if (popup) {
    popup.focus();
  }
  return popup;
}
```

### 3) 팝업 선택 팝오버 / 옵션 UI

- 상단 헤더의 팝업 버튼을 눌렀을 때 두 가지 방식 중 선택하거나, 상황에 맞게 편리하게 띄울 수 있도록 지원:
  - **`🪟 독립 팝업 (본체 닫아도 유지)`**: 메인 브라우저를 닫아도 팝업이 그대로 유지됨.
  - **`📌 항상 최상단 플로팅 (Document PiP)`**: 다른 프로그램 위 상시 고정 (본체 탭 최소화 권장).

---

## 3. 화면별 렌더링 명세

1. **컴팩트 모드 (`isCompactMode === true`)**:
   - `min-h-screen bg-slate-950 flex flex-col items-center justify-center p-2`
   - 헤더, 푸터 제거.
   - 중앙 상단: 현재 시각 및 낮/밤 선택 칩 (`☀️ / 🌙`).
   - 중앙: 반응형 `ClockDial` (100% 크기).
   - 우측 상단 또는 모서리에 작게 `[⚙️ 설정]` 버튼 제공.
   - 부모 창이 닫히든 컴퓨터를 계속 쓰든 독립된 창으로 지속 동작.

2. **메인 화면 (`isCompactMode === false`)**:
   - 헤더에 `[독립 팝업]` 및 `[최상단 PiP]` 버튼 배치 또는 드롭다운/토글 버튼 제공.

---

## 4. TDD 테스트 검증 계획

1. **컴팩트 모드 쿼리 감지 테스트**:
   - URL에 `?mode=compact`가 주어졌을 때 메인 헤더/푸터가 렌더링되지 않고 컴팩트 다이얼만 렌더링되는지 검증.
2. **독립 팝업 URL 생성 검증**:
   - `openStandalonePopup` 함수가 올바른 `?mode=compact` 파라미터와 윈도우 피처 옵션을 넘겨 호출하는지 검증.
