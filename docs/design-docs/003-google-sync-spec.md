# SDD: 003 - Google Calendar & Tasks 단방향(Read-Only) 연동 명세

상태: Approved
작성일: 2026-11-05
승인: 위승 2026-11-05

<!-- 승인은 사람만 한다. 검토가 끝나면 위 줄들을 이렇게 고친다: "상태: Approved", "승인: 이름 날짜(YYYY-MM-DD)" — 예) 위승 2026-11-05 -->

**연관 요구사항**: FR-03 (일정 연동 모드), ARCHITECTURE.md

---

## 1. 연동 원칙 및 보안 경계 (Security Invariants)

1. **Strict Read-Only**: DailyClock은 사용자의 구글 계정에서 일정을 읽어오기만 하며, 일정을 생성/수정/삭제하는 API 호출은 일절 포함하지 않습니다.
2. **최소 권한 OAuth 스코프**:
   - Google Calendar: `https://www.googleapis.com/auth/calendar.events.readonly`
   - Google Tasks: `https://www.googleapis.com/auth/tasks.readonly`
3. **클라이언트 사이드 전용**: 토큰과 일정 데이터는 브라우저 메모리에만 상주하며, 외부 백엔드 서버로 전송되지 않습니다.

---

## 2. 데이터 변환 계약 (Parser Contract)

### 1) Google Calendar Events 파서

당일(오늘 00:00 ~ 23:59)에 걸치는 이벤트를 `RoutineBlock`으로 변환합니다.

```typescript
interface GoogleEventItem {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  colorId?: string;
}

export function parseGoogleEventToBlock(
  event: GoogleEventItem,
  defaultColor = "#3b82f6",
): RoutineBlock | null {
  // 종일(All-day) 일정은 시계 호로 변환하지 않거나 00:00~24:00 배경 링으로 처리
  if (!event.start.dateTime || !event.end.dateTime) return null;

  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);

  return {
    id: `gcal-${event.id}`,
    title: event.summary || "(제목 없음)",
    startHour: start.getHours(),
    startMinute: start.getMinutes(),
    endHour: end.getHours(),
    endMinute: end.getMinutes(),
    color: defaultColor,
    category: "google-calendar",
  };
}
```

### 2) Google Tasks 파서

마감 시각(`due`)이 설정된 당일 할 일을 `RoutineBlock`으로 변환합니다.

```typescript
interface GoogleTaskItem {
  id: string;
  title: string;
  due?: string; // RFC 3339 timestamp
  status: "needsAction" | "completed";
}

export function parseGoogleTaskToBlock(
  task: GoogleTaskItem,
  defaultColor = "#10b981",
): RoutineBlock | null {
  if (!task.due || task.status === "completed") return null;

  const dueDate = new Date(task.due);
  const hour = dueDate.getHours();
  const minute = dueDate.getMinutes();

  // Tasks는 마감 시각만 있으므로 마감 시각 기준 30분 전~마감 시각 블록으로 시각화
  const startMin = Math.max(0, minute - 30);

  return {
    id: `gtask-${task.id}`,
    title: `[할일] ${task.title}`,
    startHour: hour,
    startMinute: startMin,
    endHour: hour,
    endMinute: minute,
    color: defaultColor,
    category: "google-task",
  };
}
```

---

## 3. 표시 모드 및 레이어 규칙 (Display Policy)

- **`settings.calendarSource === 'local'`**:
  - 자체 일과표 블록(`currentPreset.blocks`)만 다이얼에 렌더링.
- **`settings.calendarSource === 'google'`**:
  - 구글 캘린더 및 Tasks 블록(`googleBlocks`)만 다이얼에 렌더링.
- **`settings.calendarSource === 'both'`**:
  - 자체 일과표 블록을 베이스로 렌더링하고, 구글 일정은 바깥쪽 얇은 보조 링(Secondary Ring, outerRadius 162~172)에 오버레이 렌더링.
