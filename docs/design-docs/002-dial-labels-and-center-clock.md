# SDD: 002 - 다이얼 라벨 및 중앙 디지털 시계 명세

상태: Approved
작성일: 2026-11-05
승인: 위승 2026-11-05
<!-- 승인은 사람만 한다. 검토가 끝나면 위 줄들을 이렇게 고친다: "상태: Approved", "승인: 이름 날짜(YYYY-MM-DD)" — 예) 승인: 위승 2026-11-05 -->

---

## 1. 중앙 디지털 시각 표시 (Center Digital Clock)

- **배치**: 다이얼 중심 `(cx: 200, cy: 200)`
- **출력 형식**: `HH:mm ss` (예: `19:10 17`)
  - `HH:mm`: 26px font-mono, font-bold, fill `#f8fafc`
  - `ss`: 16px font-mono, fill `#94a3b8`
- **시침과의 충돌 방지**:
  - 시침 바늘의 중심 회전축은 바늘 반대편(역방향)으로 길게 뻗지 않도록 짧게 처리하여 중앙의 디지털 숫자를 가리지 않음.

---

## 2. 칸(Arc) 내부 일과 텍스트 라벨 (Arc Routine Labels)

- **배치 궤적**: 안쪽 반지름(`115px`)과 바깥쪽 반지름(`160px`)의 중간 반지름인 `radius = 137.5px`
- **각도 계산**:
  $$\text{midAngle} = \frac{\text{startAngle} + \text{endAngle}}{2}$$
- **가독성 반전 (Text Inversion)**:
  - 각도가 90° 초과 270° 미만(시계의 하단 절반 영역)일 경우, 글자가 거꾸로 뒤집히는 것을 방지하기 위해 텍스트 회전 각도를 180도 반전(`midAngle + 180`)시킴.
- **표시 임계값 (Threshold)**:
  - 각도 폭(`endAngle - startAngle`)이 12°(약 48분) 미만인 경우 글자 겹침을 방지하기 위해 텍스트 숨김 또는 단축.

---

## 3. 타이틀바 브라우저 보안 제약 안내

- Chromium의 Document Picture-in-Picture 창 상단 바의 `localhost:5173`은 브라우저의 피싱 방지 출처(Origin) 표시 규정입니다.
- 앱 내부에서 `win.document.title = 'Daily Clock'` 설정과 함께, 시계 내부/상단에 **Daily Clock 브랜드 헤더**를 렌더링하여 앱의 아이덴티티를 명확히 합니다.
