# SDD: 008 - Google 캘린더 화면 활성화 기반 30분 자동 동기화 명세

상태: Proposed
작성일: 2026-11-05
승인:

<!-- 승인은 사람만 한다. 검토가 끝나면 위 줄들을 이렇게 고친다: "상태: Approved", "승인: 이름 날짜(YYYY-MM-DD)" — 예) 위승 2026-11-05 -->

**연관 요구사항**: FR-03 (일정 연동 모드), SDD 003 (Google Calendar & Tasks Read-Only 연동)

---

## 1. 개요 및 목적

사용자가 구글 캘린더 연동을 활성화한 상태에서, 화면이 활성화(Active/Visible)되어 있는 동안 30분 주기로 최신 일정과 할 일을 자동 갱신합니다. 또한 다른 작업을 하다가 화면으로 복귀했을 때 마지막 동기화로부터 30분이 경과했다면 즉시 최신 일정을 갱신합니다.

---

## 2. 동기화 트리거 조건 및 정책 (Sync Policy)

1. **화면 활성화 상태 (Active / Visible)**:
   - `document.visibilityState === 'visible'` 상태일 때만 자동 타이머가 작동합니다.
   - 브라우저 탭이 백그라운드로 최소화되거나 화면이 꺼진 경우 불필요한 네트워크 호출을 중지합니다.
2. **30분 주기 갱신 (30-Minute Interval)**:
   - 화면이 켜져 있는 동안 매 30분(`30 * 60 * 1000ms`)마다 자동으로 최신 일정을 fetch합니다.
3. **화면 복귀 시 스마트 갱신 (Focus / Visibility Return Throttle)**:
   - 사용자가 백그라운드에서 화면으로 복귀(`visibilitychange` -> `visible` 또는 `window.onfocus`)할 때, **마지막 동기화 시각(`lastSyncTime`)으로부터 30분 이상 경과**했으면 즉시 동기화를 실행합니다.
   - 30분 이내에 복귀한 경우에는 중복 호출을 방지(Throttle)합니다.
4. **무소음 백그라운드 동기화 (Silent Background Refresh)**:
   - 자동 갱신 시에는 사용자 인터랙션을 방해하지 않도록 에러 알림창이나 팝업을 띄우지 않고 조용히 갱신합니다.
   - 구글 OAuth `access_token`이 메모리에 유효하게 존재하고, `settings.calendarSource !== 'local'`일 때만 동작합니다.
   - 토큰이 만료되었거나 없는 경우 불필요한 요청을 중단하고 수동 재인증을 대기합니다.

---

## 3. 인터페이스 및 상태 계약 (State Contract)

```typescript
// useClockStore 상태 확장
interface GoogleSyncState {
  cachedAccessToken: string | null;     // 인메모리 Access Token
  tokenExpiresAt: number | null;        // 토큰 만료 타임스탬프 (ms)
  lastSyncTime: number | null;          // 마지막 성공 동기화 타임스탬프 (ms)
  silentSyncGoogleData: () => Promise<void>; // 사용자 방해 없는 백그라운드 갱신 함수
}
```

### 판별 로직 (순수 함수): `shouldTriggerAutoSync`
```typescript
export function shouldTriggerAutoSync(params: {
  isVisible: boolean;
  hasToken: boolean;
  isTokenExpired: boolean;
  calendarSource: 'local' | 'google' | 'both';
  lastSyncTime: number | null;
  now: number;
  intervalMs?: number; // 기본값 30분 (1,800,000ms)
}): boolean {
  if (!params.isVisible) return false;
  if (!params.hasToken || params.isTokenExpired) return false;
  if (params.calendarSource === 'local') return false;
  if (!params.lastSyncTime) return true;
  const interval = params.intervalMs ?? 30 * 60 * 1000;
  return params.now - params.lastSyncTime >= interval;
}
```

---

## 4. 검증 계획 (TDD Verification)

1. **순수 함수 단위 테스트 (`googleSync.test.ts`)**:
   - `shouldTriggerAutoSync`:
     - 화면 비활성(`isVisible: false`) 시 -> `false`
     - 토큰 없음 또는 만료 시 -> `false`
     - `calendarSource === 'local'` 시 -> `false`
     - 마지막 동기화로부터 29분 경과 시 -> `false`
     - 마지막 동기화로부터 30분 경과 시 -> `true`
     - 마지막 동기화 기록이 없는 첫 진입 시 -> `true`
2. **기계적 검증 (Taste as Code)**:
   - 읽기 전용 스코프 유지 (`.readonly`)
   - 시침 외 바늘 추가 없음

