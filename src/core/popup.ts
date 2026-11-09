/**
 * 독립 팝업 윈도우 및 컴팩트 모드 헬퍼 모듈 (SDD 012)
 */

/**
 * 주어진 기본 URL에 mode=compact 쿼리 파라미터를 추가하여 독립 팝업 URL 생성
 */
export function buildStandalonePopupUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl, 'http://localhost');
    url.searchParams.set('mode', 'compact');
    // 상대 경로 처리를 위해 origin 유지 또는 pathname + search 반환
    return rawUrl.startsWith('http')
      ? url.toString()
      : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    const separator = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${separator}mode=compact`;
  }
}

/**
 * 현재 URL 쿼리 스트링에 mode=compact가 포함되어 있는지 판별
 */
export function isCompactModeUrl(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.get('mode') === 'compact';
}

/**
 * 부모 브라우저 탭을 닫아도 절대 닫히지 않는 독립 팝업 창을 화면 우측 상단에 띄우기
 */
export function openStandalonePopup(width = 380, height = 440): Window | null {
  if (typeof window === 'undefined') return null;

  const left = Math.max(0, (window.screen?.availWidth || 1920) - width - 40);
  const top = 60;

  const popupUrl = buildStandalonePopupUrl(window.location.href);

  const popup = window.open(
    popupUrl,
    'DailyClockStandalonePopup',
    `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
  );

  if (popup) {
    popup.focus();
  }
  return popup;
}

