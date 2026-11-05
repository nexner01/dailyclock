# SDD: 005 - 시간표 호버 확대 및 상세 정보 팝업 명세

상태: Approved
작성일: 2026-11-05
승인: 위승 2026-11-05

<!-- 승인은 사람만 한다. 검토가 끝나면 위 줄들을 이렇게 고친다: "상태: Approved", "승인: 이름 날짜(YYYY-MM-DD)" — 예) 위승 2026-11-05 -->

**연관 요구사항**: FR-01 (Dial View), ARCHITECTURE.md

---

## 1. 개요 및 사용자 경험 (UX)

사용자가 시간표의 특정 일과 칸(호, Arc)에 마우스를 올렸을 때(Hover):

1. **호(Arc) 자체의 시각적 확장**: 해당 칸이 바깥쪽으로 부드럽게 돌출(`Pop-out`)되어 크고 두껍게 확대됨.
2. **중앙 상세 카드 (Center Detail Pop-in)**: 원 중심부의 빈 공간에 해당 일과의 **제목, 정확한 시작/종료 시각, 소요 시간**이 큼직하고 선명하게 표시됨.
3. **마우스 이탈 (Mouse Leave)**: 마우스가 벗어나면 원래의 다이얼 두께와 실시간 디지털 시계(`HH:mm ss`)로 즉시 복귀.

---

## 2. 인터랙션 및 렌더링 규격 (Interaction Contract)

### 1) 호(Arc) 치수 동적 변화 (Dynamic Arc Geometry)

- **기본 상태**:
  - 안쪽 반지름 `rIn = 112px`, 바깥쪽 반지름 `rOut = 162px` (두께: 50px)
- **호버된 호 (Hovered Arc)**:
  - 바깥쪽 반지름을 **`rOut = 172px`** (10px 돌출 확대, 두께: 60px)로 렌더링.
  - 테두리(`stroke`): `#ffffff` 2.5px 및 강력한 외곽 그림자(`drop-shadow`) 적용.
  - 텍스트 라벨: 폰트 크기 `11px -> 13px` 확대 및 선명한 굵은 글씨.
- **비호버된 다른 호들 (Unhovered Arcs)**:
  - `opacity: 0.45`로 디밍(Dimming) 처리하여 사용자가 선택한 일과에 시선 집중.

### 2) 중앙 상세 정보 오버레이 (Center Detail View)

호버된 일과가 있을 때(`hoveredBlock !== null`), 원 중심에 다음 정보를 큼직하게 렌더링:

- **색상 도트 & 일과 제목**: `text-base sm:text-lg font-bold text-white` (최대 2줄 자동 줄바꿈)
- **시간대 구간**: `HH:mm ~ HH:mm` (예: `09:00 ~ 12:00`, 13px font-mono text-indigo-300)
- **총 소요 시간**: `(3시간 0분)` 또는 `(45분)` (11px text-slate-400)

---

## 3. 컴포넌트 인터페이스 확장

```typescript
export interface HoveredArcInfo {
  title: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  color: string;
  durationMinutes: number;
}
```

- `<ClockDial />` 내부에 `hoveredBlock: HoveredArcInfo | null` 상태 관리.
- 각 `<path>` 요소에 `onMouseEnter` 및 `onMouseLeave` 이벤트 바인딩.
