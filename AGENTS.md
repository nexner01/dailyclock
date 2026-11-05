# DailyClock: Agent Entrypoint & Knowledge Map

이 저장소는 **OpenAI Harness Engineering** 및 **SDD(Spec-Driven) & TDD(Test-Driven)** 방법론에 따라 관리됩니다.
에이전트는 독자적으로 코드를 추측하지 않으며, 작업 전에 반드시 아래 지식 맵의 문서를 확인해야 합니다.

---

## 🗺️ 지식 맵 (Knowledge Map)

| 작업 영역 | 참조 문서 | 목적 |
| :--- | :--- | :--- |
| **시스템 원칙 & 경계** | [`ARCHITECTURE.md`](./ARCHITECTURE.md) | 레이어 분리, Document PiP 규칙, 단방향 데이터 흐름 |
| **제품 요구사항 명세** | [`docs/PRD.md`](./docs/PRD.md) | 최종 제품 요구사항 정의서 및 사용자 시나리오 |
| **기능 설계 명세서 (SDD)** | [`docs/design-docs/`](./docs/design-docs/) | 기능별 인터페이스 계약, 각도 계산, 동기화 스펙 |
| **실행 계획 & 마일스톤** | [`docs/exec-plans/`](./docs/exec-plans/) | 현재 진행 중인 태스크 및 기술 부채 트래커 |
| **테스트 전략 (TDD)** | [`docs/tests/strategy.md`](./docs/tests/strategy.md) | Vitest, TDD Red-Green 규칙, 기계적 검증 기준 |

---

## 🚦 에이전트 행동 지침 (Agent Operating Rules)

1. **Humans steer, agents execute**: 인간의 요구사항을 임의로 확장하지 말고, 명세와 테스트에 집중합니다.
2. **Spec First & Human Approval (SDD)**:
   - 새 기능을 개발하거나 수정하기 전 반드시 `docs/design-docs/`에 명세 초안(`상태: Proposed`)을 작성합니다.
   - **⚠️ [절대 규칙] SDD 명세에 대한 승인(`상태: Approved`)은 오직 사람(인간 엔지니어)만이 할 수 있습니다. 에이전트는 절대로 스스로 문서를 Approved 상태로 변경하지 않으며, 사람에게 검토 및 승인을 요청해야 합니다.**
3. **Test First (TDD)**: 코드를 작성하기 전에 실패하는 테스트(`*.test.ts`)를 먼저 작성하여 Red 상태를 확인합니다.
4. **Taste as Code (기계적 검증)**:
   - 시침 외에 초침/분침을 추가하지 마십시오 (테스트로 강제됨).
   - 구글 캘린더/Tasks에 데이터를 생성/수정/삭제하는 API를 절대 호출하지 마십시오 (Read-only 강제).
   - 순수 웹 브라우저의 `Document Picture-in-Picture API`로 항상 최상단 플로팅을 구현합니다.
5. **Doc-Gardening**: 코드 변경 시 관련 `docs/design-docs/` 및 타입 정의가 일치하도록 동기화하십시오.

