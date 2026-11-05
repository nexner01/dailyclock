# SDD: 009 - 모바일/PWA 최적화, 바로가기 아이콘 및 미작동 기능 제거 명세서

상태: Approved
작성일: 2026-11-05
승인: 위승 2026-11-05

<!-- 승인은 사람만 한다. 검토가 끝나면 위 줄들을 이렇게 고친다: "상태: Approved", "승인: 이름 날짜(YYYY-MM-DD)" — 예) 위승 2026-11-05 -->

**연관 요구사항**: 모바일 최적화, PWA 바로가기 아이콘, UI 미니멀화, ARCHITECTURE.md

---

## 1. 개요 및 배경

1. **미작동/불필요 기능 제거**:
   - 모바일 및 미지원 브라우저 환경에서 `documentPictureInPicture` API가 미지원되어 비활성화(클릭 불가) 상태로 방치된 `[최상단 플로팅 뷰]` 버튼과 `PiP Ready` 배지 완전 제거
   - 상단 헤더의 `[환경설정 F1]` 버튼 완전 제거 (데스크톱에서는 키보드 F1 핫키로만 열리도록 화면 정리)
2. **크롬 바로가기/PWA 아이콘 추가**:
   - 데스크톱/모바일 크롬에서 "바로가기 만들기" 또는 "홈 화면에 추가" 시 적용될 고화질 원형 다이얼 브랜드 앱 아이콘 및 `manifest.webmanifest` 탑재
3. **모바일 반응형 & 터치 최적화**:
   - 고정 380px 크기를 화면 너비(`min(90vw, 420px)`)에 맞춘 유연한 반응형 다이얼로 전환
   - 마우스 호버 대신 일과 호(Arc)를 **터치(탭)하면 +10px 돌출 및 상세 카드 표시**, 재터치 시 닫히는 모바일 터치 토글 지원

---

## 2. 웹 앱 매니페스트 및 전용 아이콘 규격 (PWA & Shortcut Icons)

1. **아이콘 디자인**:
   - 짙은 네이비(`slate-950`) 배경 위에 골든 네온 링과 컬러풀 루틴 아크, 그리고 중앙 '24' 로고 및 골드 쉐브론 바늘이 배치된 프리미엄 시계 심볼
2. **파일 구성**:
   - `public/icon.svg`: 벡터 고해상도 SVG 아이콘
   - `public/icon-192.png`: 192x192 모바일 홈 화면 아이콘
   - `public/icon-512.png`: 512x512 고해상도 앱 설치 아이콘
   - `public/manifest.webmanifest`: PWA 바로가기 및 설치 메타데이터 정의
3. **`index.html` 메타 태그**:
   - `<link rel="icon" type="image/svg+xml" href="/icon.svg" />`
   - `<link rel="apple-touch-icon" href="/icon-192.png" />`
   - `<link rel="manifest" href="/manifest.webmanifest" />`
   - `<meta name="theme-color" content="#020617" />`
   - `<meta name="mobile-web-app-capable" content="yes" />`

---

## 3. 화면 UI 정리 및 반응형 터치 인터랙션

1. **상단 헤더 단순화**:
   - 좌측: `DailyClock` 브랜드 로고 + 24 아이콘
   - 우측: `☀️ 12H / 🌙 24H` 모드 전환 버튼
   - _(제거됨)_: `[최상단 플로팅 뷰]`, `PiP Ready` 배지, `[환경설정 F1]` 버튼
2. **다이얼 반응형 컨테이너**:
   - `w-full max-w-[min(90vw,420px)] aspect-square`로 화면 폭에 맞게 자동 확대/축소
3. **터치 토글 인터랙션**:
   - 모바일 터치 시 해당 호 선택/해제 토글 및 중앙 상세 카드 노출
4. **하단 푸터 정리**:
   - `DailyClock · 원형 루틴 트래커`로 군더더기 없이 심플하게 마무리

---

## 4. 검증 계획

1. **Vitest 테스트**: 터치 토글 및 반응형 렌더링 검증
2. **빌드 검증**: `npm run build` 및 정적 자산 로딩 무결성 검증
