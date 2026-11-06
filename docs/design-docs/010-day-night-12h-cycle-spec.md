# SDD: 010 - 12시간 모드 주간/야간 일과표 선택 및 환경설정 입력 명세

상태: Approved
작성일: 2026-11-06
승인: 위승 2026-11-06

<!-- 승인은 사람만 한다. 검토가 끝나면 위 줄들을 이렇게 고친다: "상태: Approved", "승인: 이름 날짜(YYYY-MM-DD)" — 예) 위승 2026-11-05 -->

**연관 요구사항**:

1. 주간 8~20시 경과 후 야간 일과표 전환 및 야간 일정 부재 시 빈값 처리
2. 일과표 화면에서 낮(☀️)/밤(🌙) 아이콘으로 주간/야간 일과표 직접 선택 기능
3. 환경설정에서 야간 시간표 입력 및 주/야간 분리 관리 지원
4. SDD 004 (12h Mode Spec), ARCHITECTURE.md

---

## 1. 개요 및 요구사항 정의

### 1) 배경

- 기존 DailyClock의 12시간 모드는 주간 8시~20시 일과만 고정 표시되었으며, 저녁 20시 이후의 야간 일과표를 보거나 입력하기 어려웠습니다.
- 사용자는 **낮 시간대(08:00~20:00)**와 **밤 시간대(20:00~08:00)**의 일과표를 명확히 구분하여 확인하고 입력할 수 있기를 원합니다.
- 특히 **야간 일과표는 일정이 없을 수도 있으므로, 일정이 없으면 깨끗한 빈 상태(빈값)로 표시**되어야 하며, 메인 일과표 화면에서 **낮(☀️)과 밤(🌙) 아이콘**을 눌러 원하는 시간표를 즉시 선택할 수 있어야 합니다.

### 2) 핵심 요구사항

1. **일과표 메인 화면 낮/밤 아이콘 선택 (☀️ / 🌙)**:
   - 12시간 모드 시계 화면 상단(또는 다이얼 상단 컨트롤 바)에 `[☀️ 낮 일과표 (08~20시)]` 및 `[🌙 밤 일과표 (20~08시)]` 선택 아이콘 버튼을 제공합니다.
   - 기본 동작: 현재 시각에 맞추어 주간(08~20시)에는 낮(☀️), 야간(20~08시)에는 밤(🌙)이 기본 선택(Auto)되지만, 사용자가 언제든 반대편 아이콘을 탭/클릭하여 낮/밤 일과표를 즉시 교체하여 볼 수 있습니다.
2. **야간 일과 부재 시 빈값(Empty) 보장**:
   - 밤(🌙) 일과표를 보거나 야간 시간대가 되었을 때, 야간 시간대(`20:00 ~ 익일 08:00`)에 등록된 일정이 없는 경우 다이얼에 일과 호(Arc)를 일절 렌더링하지 않고 **깨끗한 빈 다이얼(`arcSegments = []`)**로 표시합니다.
   - 야간 일정이 있는 경우(예: 수면, 독서, 휴식 등) 해당 야간 시간대에 위치한 블록만 12시간 아날로그 각도로 렌더링합니다.
3. **환경설정(SettingsModal) 야간 시간표 입력 및 관리**:
   - 환경설정의 `자체 일과표 관리` 탭 내에 **[☀️ 주간 일과 (08~20시)]** 및 **[🌙 야간 일과 (20~08시)]** 필터/입력 탭(세그먼트)을 신설합니다.
   - **야간 탭(🌙)** 선택 시:
     - 시작/종료 시각 기본값이 야간 시간대(예: 시작 `20:00`, 종료 `23:00` 또는 `23:00 ~ 07:00`)로 추천 설정됩니다.
     - 야간 시간대(`20:00 ~ 08:00`)에 걸쳐 있는 블록들만 필터링하여 일목요연하게 표시합니다.
     - 야간 일과를 등록하지 않으면 "등록된 야간 일과가 없습니다. (시계에 빈 일과표로 표시됩니다)" 안내 문구를 노출합니다.
4. **시침(Needle) 및 윈도우 무결성**:
   - 12시간 모드에서 낮/밤 윈도우 선택에 관계없이 실제 아날로그 시계 시침 위치(`calculate12hNeedleAngle`)는 100% 실시간 위치를 유지합니다.
   - 낮 윈도우(08~20시)를 보고 있을 때 현재 시각이 낮이면 시침 100% 불투명, 현재 시각이 밤인데 낮 윈도우를 보고 있다면 시침은 다른 12시간 구간임을 알 수 있도록 약간 흐려지거나 정상 표시됩니다. (현재 시각이 속한 윈도우를 보고 있을 때는 100% 선명)

---

## 2. 인터페이스 및 수학적 계약 (Mathematical Contract)

### 1) 12시간 윈도우 판별 및 선택 로직 (`getActive12hWindow`)

```typescript
export type DayNightMode = "day" | "night";

export interface Active12hWindow {
  mode: DayNightMode;
  windowStartHour: number; // 주간: dayStartHour (기본 8), 야간: (dayStartHour + 12) % 24 (기본 20)
  windowEndHour: number; // 주간: (dayStartHour + 12) % 24 (기본 20), 야간: dayStartHour (기본 8)
}

/**
 * 현재 시각을 기준으로 자동 계산되는 기본 낮/밤 모드 반환
 */
export function getAutoDayNightMode(
  currentTime: Date,
  dayStartHour = 8,
): DayNightMode {
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const dayStartMin = dayStartHour * 60;
  const dayEndMin = (dayStartHour + 12) * 60; // 1200분 (20:00)

  if (dayEndMin <= 24 * 60) {
    return currentMinutes >= dayStartMin && currentMinutes < dayEndMin
      ? "day"
      : "night";
  } else {
    const normalizedEndMin = dayEndMin % (24 * 60);
    return currentMinutes >= dayStartMin || currentMinutes < normalizedEndMin
      ? "day"
      : "night";
  }
}

/**
 * 선택된 낮/밤 모드(수동 선택 또는 자동)에 따른 12시간 윈도우 반환
 */
export function getActive12hWindow(
  mode: DayNightMode,
  dayStartHour = 8,
): Active12hWindow {
  if (mode === "day") {
    return {
      mode: "day",
      windowStartHour: dayStartHour,
      windowEndHour: (dayStartHour + 12) % 24,
    };
  } else {
    return {
      mode: "night",
      windowStartHour: (dayStartHour + 12) % 24,
      windowEndHour: dayStartHour,
    };
  }
}
```

### 2) 주간/야간 12시간 일과 블록 호 변환 (`convertBlockTo12hArcs`)

```typescript
/**
 * 12시간 아날로그 시계 호(ArcSegment) 변환
 * 지정된 12시간 윈도우 [windowStartHour ~ windowStartHour + 12]와 교차하는 구간만
 * 실제 아날로그 시계 각도(1시간=30도, 1분=0.5도)로 매핑.
 * 교차 구간이 없으면 빈 배열 [] 반환 (야간 일과가 없으면 빈값 처리).
 */
export function convertBlockTo12hArcs(
  block: RoutineBlock,
  windowStartHour = 8,
): ArcSegment[] {
  const windowStartMin = windowStartHour * 60;
  const windowEndMin = (windowStartHour + 12) * 60;

  let blockStartMin = block.startHour * 60 + block.startMinute;
  let blockEndMin = block.endHour * 60 + block.endMinute;

  // 자정 통과 일정 처리
  if (blockStartMin > blockEndMin) {
    blockEndMin += 24 * 60;
  }

  // 윈도우가 자정을 넘어가는 경우 (예: 20:00 ~ 익일 08:00, 즉 1200분 ~ 1920분)
  // 블록 시간대가 윈도우 범위와 교차하도록 24시간 오프셋 복제 검사
  let overlapStart = -1;
  let overlapEnd = -1;

  for (const offset of [0, 24 * 60]) {
    const curBStart = blockStartMin + offset;
    const curBEnd = blockEndMin + offset;

    const oStart = Math.max(curBStart, windowStartMin);
    const oEnd = Math.min(curBEnd, windowEndMin);

    if (oStart < oEnd) {
      overlapStart = oStart;
      overlapEnd = oEnd;
      break;
    }
  }

  if (overlapStart >= overlapEnd || overlapStart === -1) {
    return []; // 해당 12시간 윈도우에 겹치지 않음 (빈값)
  }

  // 교차 구간의 각도 계산 (실제 아날로그 12시간 시계 위치 매핑)
  const startH = Math.floor(overlapStart / 60) % 24;
  const startM = overlapStart % 60;
  const endH = Math.floor(overlapEnd / 60) % 24;
  const endM = overlapEnd % 60;

  const startAngle = calculate12hNeedleAngle({
    hours: startH,
    minutes: startM,
  });
  const endAngle = calculate12hNeedleAngle({ hours: endH, minutes: endM });

  if (startAngle === endAngle) return [];

  if (startAngle < endAngle) {
    return [
      {
        startAngle,
        endAngle,
        color: block.color,
        title: block.title,
        startHour: block.startHour,
        startMinute: block.startMinute,
        endHour: block.endHour,
        endMinute: block.endMinute,
      },
    ];
  } else {
    // 12시(0도)를 가로지르는 경우 분할
    return [
      {
        startAngle,
        endAngle: 360,
        color: block.color,
        title: block.title,
        startHour: block.startHour,
        startMinute: block.startMinute,
        endHour: block.endHour,
        endMinute: block.endMinute,
      },
      {
        startAngle: 0,
        endAngle,
        color: block.color,
        title: "",
        startHour: block.startHour,
        startMinute: block.startMinute,
        endHour: block.endHour,
        endMinute: block.endMinute,
      },
    ];
  }
}
```

---

## 3. UI 및 사용자 인터랙션 변경 명세

### 1) 일과표 화면 (메인 뷰 `App.tsx`)

- 12시간 모드일 때 메인 시계 상단(또는 일과표 전환 칩 위)에 **낮/밤 선택 컨트롤러** 배치:
  ```tsx
  <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 p-1 rounded-full shadow-lg">
    <button
      onClick={() => setSelectedDayNight("day")}
      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
        selectedDayNight === "day"
          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
          : "text-slate-400 hover:text-slate-200"
      }`}
    >
      ☀️ 낮 (08~20시)
    </button>
    <button
      onClick={() => setSelectedDayNight("night")}
      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
        selectedDayNight === "night"
          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
          : "text-slate-400 hover:text-slate-200"
      }`}
    >
      🌙 밤 (20~08시)
    </button>
  </div>
  ```
- 기본 선택값: 현재 시각에 따라 `getAutoDayNightMode(currentTime, twelveHourStart)`로 초기화되며, 사용자가 버튼을 누르면 해당 시간표(낮/밤)로 고정 전환됩니다.
- 밤(🌙) 선택 시 야간 일과가 없으면 시계판 내 일과 아크가 전혀 나타나지 않고 깔끔한 빈 원형 다이얼로 렌더링됩니다.

### 2) 환경설정 화면 (`SettingsModal.tsx`)

- `자체 일과표 관리` 탭 내의 블록 추가/조회 영역에 **[☀️ 주간 일과] / [🌙 야간 일과] / [24시간 전체]** 선택 탭을 신설합니다.
- **[🌙 야간 일과] 탭 선택 시**:
  - 기본 입력 시작/종료 시각이 `20:00` ~ `23:00`으로 자동 설정.
  - 야간 구간(`20:00 ~ 08:00`)과 겹치는 블록 목록만 필터링하여 표시.
  - 등록된 야간 블록이 없으면:
    > "등록된 야간 일과가 없습니다. (야간 시간표 선택 시 빈 시계판으로 표시됩니다)"
    > 라는 안내 문구 노출.
- **[☀️ 주간 일과] 탭 선택 시**:
  - 기본 입력 시작/종료 시각이 `09:00` ~ `12:00`으로 자동 설정.
  - 주간 구간(`08:00 ~ 20:00`)과 겹치는 블록 목록만 필터링하여 표시.

---

## 4. TDD 테스트 검증 계획

1. **`getAutoDayNightMode` 및 `getActive12hWindow` 단위 테스트**:
   - 08:00:00 ~ 19:59:59 사이는 `'day'` 반환.
   - 20:00:00 ~ 07:59:59 사이는 `'night'` 반환.
   - mode가 `'day'`일 때 startHour 8, endHour 20 반환.
   - mode가 `'night'`일 때 startHour 20, endHour 8 반환.
2. **`convertBlockTo12hArcs` 야간 윈도우 및 빈값 검증**:
   - 주간 블록만 있는 프리셋에서 야간 윈도우(`windowStartHour: 20`) 적용 시 반환값이 `[]`(빈 배열)임을 검증.
   - 야간 블록(21:00~23:00, 23:00~07:00 등)이 야간 윈도우(20시~8시)에서 올바른 12시간 아날로그 각도로 변환되는지 검증.
3. **컴포넌트 렌더링 검증**:
   - 일과표 화면에서 🌙 밤 아이콘 클릭 시 야간 일과표(또는 빈값)로 전환 검증.
   - 환경설정 화면에서 🌙 야간 일과 탭 선택 시 야간 블록 필터링 및 입력 기본값 검증.
