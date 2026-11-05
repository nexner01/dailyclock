# TDD 전략 & 기계적 검증 규칙 (Test Strategy)

이 프로젝트는 **TDD(Test-Driven Development)**를 강제하며, 테스트가 실패(Red)하기 전에는 프로덕션 코드를 작성하지 않습니다.

---

## 1. 테스트 도구 및 계층

* **단위 & 통합 테스트 (Unit & Integration)**: `Vitest`
  * 빠른 피드백 (밀리초 단위 실행)
  * 비즈니스 로직(각도 계산, 자정 래핑, 시간표 충돌 검사, 구글 Read-Only 파서) 100% 커버리지 목표.
* **컴포넌트 렌더링 테스트**: `@testing-library/react`
  * 시침 1개 렌더링 보장 (초침/분침 부재 검증)
  * F1 키 입력 시 이벤트 핸들러 동작 검증
* **E2E 테스트**: `Playwright`
  * Document Picture-in-Picture 창 생성 수명주기 검증
  * 테마 변경 시 CSS 변수 적용 검증

---

## 2. 필수 단위 테스트 체크리스트 (TDD Gate)

### [Dial Logic]
- [ ] `calculateNeedleAngle`: 0시 0분 -> 0도
- [ ] `calculateNeedleAngle`: 12시 0분 -> 180도
- [ ] `calculateNeedleAngle`: 9시 30분 -> 142.5도
- [ ] `calculateNeedleAngle`: 23시 59분 -> 359.75도
- [ ] `calculateNeedleAngle`: 유효하지 않은 시간 입력 시 RangeError 발생
- [ ] `convertBlockToArcs`: 일반 일정 (09:00 ~ 12:00) -> 1개 ArcSegment 반환
- [ ] `convertBlockToArcs`: 자정 통과 일정 (22:00 ~ 02:00) -> 2개 ArcSegment 분할 반환

### [Security & Integration]
- [ ] 구글 캘린더 / Tasks 클라이언트가 `POST/PUT/PATCH/DELETE` 메소드를 노출하지 않는지 검증 (Read-Only)
- [ ] OAuth 스코프에 write 권한이 포함되지 않는지 검증

---

## 3. 기계적 실행 규칙
* 모든 커밋 전 `pnpm test` (또는 `npm test`)가 통과해야 합니다.
* 실패한 테스트가 하나라도 있으면 빌드 파이프라인이 중단됩니다.

