import { describe, it, expect } from 'vitest';
import * as googleSync from './googleSync';
import {
  parseGoogleEventToBlock,
  parseGoogleTaskToBlock,
  type GoogleEventItem,
  type GoogleTaskItem,
} from './googleSync';

describe('Google Sync Service - SDD 003 Specification', () => {
  describe('보안 불변성 (Security Invariants) - Taste as Code', () => {
    it('구글 캘린더/Tasks에 쓰기/수정/삭제를 수행하는 함수는 일절 노출되지 않아야 한다', () => {
      const exportedKeys = Object.keys(googleSync);

      // create, insert, update, patch, delete, write, post, put 등의 쓰기 관련 함수 배제 확인
      const forbiddenPatterns = [/create/i, /insert/i, /update/i, /patch/i, /delete/i, /write/i, /post/i, /put/i];
      
      forbiddenPatterns.forEach((pattern) => {
        const matchingExports = exportedKeys.filter((key) => pattern.test(key));
        expect(matchingExports).toEqual([]);
      });
    });

    it('OAuth 스코프는 오직 readonly 권한만 요청해야 한다', () => {
      expect(googleSync.GOOGLE_SCOPES).toContain('https://www.googleapis.com/auth/calendar.events.readonly');
      expect(googleSync.GOOGLE_SCOPES).toContain('https://www.googleapis.com/auth/tasks.readonly');
      
      // 쓰기 권한이 포함되지 않음을 단언
      expect(googleSync.GOOGLE_SCOPES).not.toContain('https://www.googleapis.com/auth/calendar');
      expect(googleSync.GOOGLE_SCOPES).not.toContain('https://www.googleapis.com/auth/calendar.events');
      expect(googleSync.GOOGLE_SCOPES).not.toContain('https://www.googleapis.com/auth/tasks');
    });
  });

  describe('parseGoogleEventToBlock', () => {
    it('시작과 종료 시각이 있는 캘린더 이벤트를 RoutineBlock으로 정상 변환해야 한다', () => {
      const dummyEvent: GoogleEventItem = {
        id: 'event123',
        summary: '팀 주간 스프린트 회의',
        start: { dateTime: '2026-11-05T10:00:00+09:00' },
        end: { dateTime: '2026-11-05T11:30:00+09:00' },
      };

      const block = parseGoogleEventToBlock(dummyEvent);
      expect(block).not.toBeNull();
      expect(block?.id).toBe('gcal-event123');
      expect(block?.title).toBe('팀 주간 스프린트 회의');
      expect(block?.startHour).toBe(10);
      expect(block?.startMinute).toBe(0);
      expect(block?.endHour).toBe(11);
      expect(block?.endMinute).toBe(30);
      expect(block?.category).toBe('google-calendar');
    });

    it('종일(All-day) 일정(dateTime이 없고 date만 있는 경우)은 호로 변환하지 않고 null을 반환해야 한다', () => {
      const allDayEvent: GoogleEventItem = {
        id: 'allday1',
        summary: '회사 창립기념일',
        start: { date: '2026-11-05' },
        end: { date: '2026-11-06' },
      };

      const block = parseGoogleEventToBlock(allDayEvent);
      expect(block).toBeNull();
    });
  });

  describe('parseGoogleTaskToBlock', () => {
    it('마감 시각이 있는 미완료 Tasks 할 일을 RoutineBlock으로 변환해야 한다', () => {
      const dummyTask: GoogleTaskItem = {
        id: 'task456',
        title: '보고서 제출',
        due: '2026-11-05T17:00:00.000Z',
        status: 'needsAction',
      };

      const block = parseGoogleTaskToBlock(dummyTask);
      expect(block).not.toBeNull();
      expect(block?.id).toBe('gtask-task456');
      expect(block?.title).toContain('보고서 제출');
      expect(block?.category).toBe('google-task');
    });

    it('이미 완료(completed)된 할 일은 차트에 표시하지 않고 null을 반환해야 한다', () => {
      const completedTask: GoogleTaskItem = {
        id: 'task789',
        title: '지난 할 일',
        due: '2026-11-05T17:00:00.000Z',
        status: 'completed',
      };

      const block = parseGoogleTaskToBlock(completedTask);
      expect(block).toBeNull();
    });

    it('마감 시각(due)이 없는 할 일은 시간표에 배치할 수 없으므로 null을 반환해야 한다', () => {
      const noDueTask: GoogleTaskItem = {
        id: 'task999',
        title: '언젠가 할 일',
        status: 'needsAction',
      };

      const block = parseGoogleTaskToBlock(noDueTask);
      expect(block).toBeNull();
    });
  });
});

