# SDD: 006 - 일과 블록 인라인 수정(Edit) 및 테마/컬러 팔레트 시스템 완성 명세

상태: Approved
작성일: 2026-11-05
승인: 위승 2026-11-05

<!-- 승인은 사람만 한다. 검토가 끝나면 위 줄들을 이렇게 고친다: "상태: Approved", "승인: 이름 날짜(YYYY-MM-DD)" — 예) 위승 2026-11-05 -->

**연관 요구사항**: 요구사항 9 (환경설정 - 하루 일과 등록/수정/보기, 라이트/다크/시스템/컬러 테마), ARCHITECTURE.md

---

## 1. 개요 및 요구사항 정의

1. **일과 블록 인라인 수정 (Edit Mode)**:
   - 환경설정(`F1`)의 일과표 관리에서 등록된 일과 블록을 클릭하거나 [수정(연필)] 버튼을 누르면 인라인 수정 폼으로 전환.
   - 일과 제목, 시작 시각, 종료 시각, 색상을 수정하고 즉시 저장 및 취소 가능.
2. **테마 & 4종 컬러 팔레트 실제 렌더링 반영**:
   - **화면 모드**: 다크(Dark), 라이트(Light), 시스템(System - OS 설정 감지)
   - **다이얼 컬러 팔레트**:
     - `default` (모던 딥 네온): 인디고, 로즈, 에메랄드, 앰버
     - `pastel` (소프트 파스텔): 밀크티, 소프트민트, 베이비핑크, 라벤더
     - `neon` (사이버 네온): 형광 그린, 네온 핑크, 일렉트릭 블루
     - `ocean` (딥 오션): 딥 블루, 아쿠아, 마린 시안

---

## 2. 블록 수정 계약 (Block Edit Contract)

```typescript
export interface BlockUpdatePayload {
  title?: string;
  startHour?: number;
  startMinute?: number;
  endHour?: number;
  endMinute?: number;
  color?: string;
}

// useClockStore.updateBlock(presetId, blockId, payload)
```

- 수정 폼에서 입력값 변경 후 [저장] 클릭 시:
  - IndexedDB 영구 저장 및 활성 다이얼에 즉시 렌더링 반영.
- [취소] 클릭 시 수정 모드 해제.

---

## 3. 테마 및 팔레트 CSS 변수 계약

`document.documentElement`에 `dark` 또는 `light` 클래스를 토글하고, 선택된 팔레트에 따라 다이얼 배경 및 기본 블록 색상 세트를 동적으로 매핑합니다.

```typescript
export const COLOR_PALETTES = {
  default: [
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f43f5e",
    "#f97316",
    "#f59e0b",
    "#10b981",
  ],
  pastel: [
    "#93c5fd",
    "#a5b4fc",
    "#c4b5fd",
    "#f472b6",
    "#fda4af",
    "#fdba74",
    "#fde047",
    "#86efac",
  ],
  neon: [
    "#00f5d4",
    "#7b2cbf",
    "#ff007f",
    "#fee440",
    "#00bbf9",
    "#ff5400",
    "#39ff14",
    "#f72585",
  ],
  ocean: [
    "#03045e",
    "#023e8a",
    "#0077b6",
    "#0096c7",
    "#00b4d8",
    "#48cae4",
    "#90e0ef",
    "#ade8f4",
  ],
};
```
