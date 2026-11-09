import { describe, it, expect } from 'vitest';
import { buildStandalonePopupUrl, isCompactModeUrl } from './popup';

describe('Standalone Popup Helper (SDD 012)', () => {
  it('기본 URL에 ?mode=compact 파라미터를 추가하여 독립 팝업 URL을 생성해야 한다', () => {
    const url = buildStandalonePopupUrl('http://localhost:5173/');
    expect(url).toContain('mode=compact');
  });

  it('기존 쿼리 파라미터가 있는 경우에도 mode=compact를 올바르게 보존/추가해야 한다', () => {
    const url = buildStandalonePopupUrl('http://localhost:5173/?theme=dark');
    expect(url).toContain('theme=dark');
    expect(url).toContain('mode=compact');
  });

  it('isCompactModeUrl 함수는 mode=compact 파라미터 유무를 정확히 판별해야 한다', () => {
    expect(isCompactModeUrl('?mode=compact')).toBe(true);
    expect(isCompactModeUrl('?foo=bar&mode=compact')).toBe(true);
    expect(isCompactModeUrl('?mode=full')).toBe(false);
    expect(isCompactModeUrl('')).toBe(false);
  });
});

