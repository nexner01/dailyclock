# SDD: 011 - 환경설정 일과 블록 폼 연동 수정 및 시간순 자동 정렬 명세

상태: Approved
작성일: 2026-11-06
승인: 위승 2026-11-06

<!-- 승인은 사람만 한다. 검토가 끝나면 위 줄들을 이렇게 고친다: "상태: Approved", "승인: 이름 날짜(YYYY-MM-DD)" — 예) 위승 2026-11-05 -->

**연관 요구사항**: 환경설정 일과 블록 수정 UX 개선, 시간순 자동 정렬, ARCHITECTURE.md

---

## 1. 개요 및 요구사항 정의

### 1) 배경

기존 환경설정의 `자체 일과표 관리` 화면에서는 새 일과 등록과 삭제만 지원되었으며, 이미 등록된 일과의 시간이나 제목, 색상을 변경하려면 삭제 후 다시 등록해야 하는 불편함이 있었습니다. 또한 등록된 순서대로만 목록에 추가되어 시간 순서와 맞지 않게 표시되는 문제가 있었습니다.

### 2) 핵심 요구사항

1. **블록 선택 시 상단 폼 연동 (Edit Mode)**:
   - 하단 등록된 일과 블록 리스트에서 특정 일과 블록을 클릭하면, 상단 입력 폼이 **`수정 모드`**로 즉시 전환됩니다.
   - 상단 폼에 해당 블록의 **일과 제목, 시작 시각(HH:mm), 종료 시각(HH:mm)**이 자동으로 채워집니다.
   - **색상 팔레트 연동**: 해당 블록의 색상이 상단 색상 팔레트에서 선택된 상태(확대 및 흰색 링 강조)로 표시됩니다.
2. **수정 저장 및 취소 액션**:
   - 수정 모드일 때 버튼이 `[✏️ 일과 수정 저장]`으로 변경되며, 우측에 `[취소]` 버튼이 함께 제공됩니다.
   - `[✏️ 일과 수정 저장]` 클릭 시:
     - `useClockStore.updateBlock(presetId, editingBlockId, updates)`를 통해 DB에 영구 저장되고, 다이얼 및 목록에 즉시 반영됩니다.
     - 저장이 완료되면 폼이 초기화되고 일반 등록 모드로 복귀합니다.
   - `[취소]` 클릭 시:
     - 선택이 해제되고 폼이 깨끗하게 초기화됩니다.
3. **시간 순서 자동 정렬 (Chronological Ordering)**:
   - 블록이 새로 추가되거나 수정되어 저장될 때, 그리고 목록을 렌더링할 때 **시작 시각(분 환산: `startHour * 60 + startMinute`) 오름차순**으로 자동 정렬됩니다.
   - 자정을 넘나드는 일정을 포함하여 모든 블록이 하루 시간표 순서(아침 ➜ 낮 ➜ 저녁 ➜ 밤)에 맞춰 하단 목록에 정갈하게 배치됩니다.
4. **선택된 블록 시각적 피드백**:
   - 하단 목록에서 현재 수정 중으로 선택된 블록은 인디고 테두리(`ring-2 ring-indigo-500`) 및 배경 하이라이트로 시각적으로 강조 표시됩니다.

---

## 2. 인터페이스 및 데이터 정렬 계약 (Logic Contract)

### 1) 블록 시간순 정렬 유틸리티 함수: `sortRoutineBlocks`

```typescript
/**
 * 일과 블록 목록을 시작 시간 오름차순으로 정렬
 */
export function sortRoutineBlocks(blocks: RoutineBlock[]): RoutineBlock[] {
  return [...blocks].sort((a, b) => {
    const aStart = a.startHour * 60 + a.startMinute;
    const bStart = b.startHour * 60 + b.startMinute;
    if (aStart !== bStart) {
      return aStart - bStart;
    }
    const aEnd = a.endHour * 60 + a.endMinute;
    const bEnd = b.endHour * 60 + b.endMinute;
    return aEnd - bEnd;
  });
}
```

### 2) `useClockStore`의 블록 저장 시 정렬 유지

```typescript
addBlock: async (presetId, blockData) => {
  // 블록 추가 후 sortRoutineBlocks로 정렬하여 저장
},
updateBlock: async (presetId, blockId, updates) => {
  // 블록 수정 후 sortRoutineBlocks로 정렬하여 저장
}
```

---

## 3. UI 및 상태 전환 규격 (`SettingsModal.tsx`)

```tsx
// 상태 정의
const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

// 블록 클릭 시 선택 핸들러
const handleSelectBlockForEdit = (block: RoutineBlock) => {
  setEditingBlockId(block.id);
  setNewTitle(block.title);
  setNewStart(
    `${block.startHour.toString().padStart(2, "0")}:${block.startMinute.toString().padStart(2, "0")}`,
  );
  setNewEnd(
    `${block.endHour.toString().padStart(2, "0")}:${block.endMinute.toString().padStart(2, "0")}`,
  );
  setNewColor(block.color);
};

// 취소 핸들러
const handleCancelEdit = () => {
  setEditingBlockId(null);
  setNewTitle("");
  setNewStart(routineFilter === "night" ? "20:00" : "09:00");
  setNewEnd(routineFilter === "night" ? "23:00" : "12:00");
  setNewColor(PRESET_COLORS[0]);
};
```

---

## 4. TDD 테스트 검증 계획

1. **`sortRoutineBlocks` 정렬 단위 테스트 (`src/core/dial.test.ts`)**:
   - 무작위 순서로 입력된 일과 블록들(13:00, 09:00, 21:00, 07:00)이 `07:00 -> 09:00 -> 13:00 -> 21:00` 순서로 정확히 정렬되는지 검증.
2. **`useClockStore`의 addBlock / updateBlock 정렬 검증**:
   - 블록 추가 및 수정 시 자동으로 정렬된 상태로 `preset.blocks`가 갱신되는지 검증.
3. **`SettingsModal` 수정 모드 연동 검증**:
   - 블록 클릭 시 폼에 기존 제목/시작시간/종료시간/색상이 로드되는지 검증.
   - 수정 저장 후 변경된 내용이 올바른 시간 순서 위치에 나타나는지 검증.
