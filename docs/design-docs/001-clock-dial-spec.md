# SDD: 24시간 원형 다이얼 및 시침 각도 계산 명세

상태: Approved
작성일: 2026-11-05
승인: 위승 2026-11-05

<!-- 승인은 사람만 한다. 검토가 끝나면 위 줄들을 이렇게 고친다: "상태: approved", "승인: 이름 날짜(YYYY-MM-DD)" — 예) 승인: 홍길동 2026-10-25 -->

**연관 요구사항**: FR-01 (Dial View), ARCHITECTURE.md

---

## 1. 각도 계산 계약 (Angle Calculation Contract)

24시간은 360도로 매핑됩니다.

- 1시간 = `360 / 24 = 15°`
- 1분 = `15 / 60 = 0.25°`

### 1) 시침 각도 (Indicator Needle Angle)

```typescript
interface TimeInput {
  hours: number; // 0 ~ 23
  minutes: number; // 0 ~ 59
  seconds?: number; // 선택 (기본 0)
}

function calculateNeedleAngle(time: TimeInput): number {
  if (
    time.hours < 0 ||
    time.hours > 23 ||
    time.minutes < 0 ||
    time.minutes > 59
  ) {
    throw new RangeError("Invalid time range: hours (0-23), minutes (0-59)");
  }
  return time.hours * 15 + time.minutes * 0.25;
}
```

### 2) 일과 호(Arc) 분할 및 자정 래핑 (Midnight Crossing)

일과가 자정을 넘어가는 경우(예: 23:00 ~ 02:00) 2개의 연속된 호로 분할합니다.

```typescript
interface RoutineBlock {
  id: string;
  title: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  color: string;
}

interface ArcSegment {
  startAngle: number; // 0 ~ 360
  endAngle: number; // 0 ~ 360
  color: string;
}

function convertBlockToArcs(block: RoutineBlock): ArcSegment[] {
  const startAngle = calculateNeedleAngle({
    hours: block.startHour,
    minutes: block.startMinute,
  });
  const endAngle = calculateNeedleAngle({
    hours: block.endHour,
    minutes: block.endMinute,
  });

  if (startAngle === endAngle) {
    return []; // 길이가 0인 일정 무시
  }

  if (startAngle < endAngle) {
    // 당일 완료 일정
    return [{ startAngle, endAngle, color: block.color }];
  } else {
    // 자정 통과 일정: startAngle -> 360도, 0도 -> endAngle 로 2개 분할
    return [
      { startAngle, endAngle: 360, color: block.color },
      { startAngle: 0, endAngle, color: block.color },
    ];
  }
}
```

---

## 2. 불변의 렌더링 규칙 (Invariants)

1. **시침(Needle)**은 화면상에 정확히 **1개**만 존재해야 하며, 초침/분침 요소는 렌더링되지 않아야 함.
2. 각도는 0시가 원의 맨 위(Top, -90도 회전 보정) 또는 12시 방향에서 시작.
