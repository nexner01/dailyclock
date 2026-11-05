import { describe, it, expect } from 'vitest';
import {
  calculateNeedleAngle,
  calculate12hNeedleAngle,
  convertBlockToArcs,
  convertBlockTo12hArcs,
  checkUpcomingTransition,
  type TimeInput,
  type RoutineBlock,
} from './dial';

describe('Dial Core - SDD 001 & 002 & 004 & 007 Specification', () => {
  describe('24시간 모드 calculateNeedleAngle', () => {
    it('0시 0분은 0도여야 한다', () => {
      const time: TimeInput = { hours: 0, minutes: 0 };
      expect(calculateNeedleAngle(time)).toBe(0);
    });

    it('12시 0분은 180도여야 한다', () => {
      const time: TimeInput = { hours: 12, minutes: 0 };
      expect(calculateNeedleAngle(time)).toBe(180);
    });

    it('9시 30분은 142.5도여야 한다 (9 * 15 + 30 * 0.25)', () => {
      const time: TimeInput = { hours: 9, minutes: 30 };
      expect(calculateNeedleAngle(time)).toBe(142.5);
    });

    it('23시 59분은 359.75도여야 한다', () => {
      const time: TimeInput = { hours: 23, minutes: 59 };
      expect(calculateNeedleAngle(time)).toBe(359.75);
    });

    it('유효하지 않은 시간 입력 시 RangeError를 던져야 한다', () => {
      expect(() => calculateNeedleAngle({ hours: -1, minutes: 0 })).toThrow(RangeError);
      expect(() => calculateNeedleAngle({ hours: 24, minutes: 0 })).toThrow(RangeError);
      expect(() => calculateNeedleAngle({ hours: 10, minutes: -5 })).toThrow(RangeError);
      expect(() => calculateNeedleAngle({ hours: 10, minutes: 60 })).toThrow(RangeError);
    });
  });

  describe('12시간 아날로그 시계 모드 calculate12hNeedleAngle (SDD 004)', () => {
    it('12시는 실제 아날로그 시계 상단(0도)이어야 한다', () => {
      expect(calculate12hNeedleAngle({ hours: 12, minutes: 0 })).toBe(0);
      expect(calculate12hNeedleAngle({ hours: 0, minutes: 0 })).toBe(0);
    });

    it('3시는 실제 아날로그 시계 우측(90도)이어야 한다', () => {
      expect(calculate12hNeedleAngle({ hours: 3, minutes: 0 })).toBe(90);
      expect(calculate12hNeedleAngle({ hours: 15, minutes: 0 })).toBe(90);
    });

    it('6시는 실제 아날로그 시계 하단(180도)이어야 한다', () => {
      expect(calculate12hNeedleAngle({ hours: 6, minutes: 0 })).toBe(180);
      expect(calculate12hNeedleAngle({ hours: 18, minutes: 0 })).toBe(180);
    });

    it('7시는 실제 아날로그 시계 7시 위치인 210도(7 * 30도)여야 한다', () => {
      expect(calculate12hNeedleAngle({ hours: 7, minutes: 0 })).toBe(210);
      expect(calculate12hNeedleAngle({ hours: 19, minutes: 0 })).toBe(210);
    });

    it('8시는 실제 아날로그 시계 8시 위치인 240도(8 * 30도)여야 한다', () => {
      expect(calculate12hNeedleAngle({ hours: 8, minutes: 0 })).toBe(240);
      expect(calculate12hNeedleAngle({ hours: 20, minutes: 0 })).toBe(240);
    });

    it('8시 30분은 255도 (240도 + 15도)여야 한다', () => {
      expect(calculate12hNeedleAngle({ hours: 8, minutes: 30 })).toBe(255);
      expect(calculate12hNeedleAngle({ hours: 20, minutes: 30 })).toBe(255);
    });
  });

  describe('24시간 convertBlockToArcs', () => {
    it('당일 완료 일정(09:00 ~ 12:00)은 단일 ArcSegment(135도 ~ 180도)로 변환되어야 한다', () => {
      const block: RoutineBlock = {
        id: '1',
        title: '오전 집중 업무',
        startHour: 9,
        startMinute: 0,
        endHour: 12,
        endMinute: 0,
        color: '#3b82f6',
      };

      const arcs = convertBlockToArcs(block);
      expect(arcs).toHaveLength(1);
      expect(arcs[0]).toMatchObject({
        startAngle: 135,
        endAngle: 180,
        color: '#3b82f6',
        title: '오전 집중 업무',
      });
    });

    it('자정을 통과하는 일정(23:00 ~ 02:00)은 2개의 ArcSegment로 분할되어야 한다', () => {
      const block: RoutineBlock = {
        id: '2',
        title: '수면',
        startHour: 23,
        startMinute: 0,
        endHour: 2,
        endMinute: 0,
        color: '#6366f1',
      };

      const arcs = convertBlockToArcs(block);
      expect(arcs).toHaveLength(2);
      expect(arcs[0]).toMatchObject({
        startAngle: 345,
        endAngle: 360,
        color: '#6366f1',
        title: '',
      });
      expect(arcs[1]).toMatchObject({
        startAngle: 0,
        endAngle: 30,
        color: '#6366f1',
        title: '수면',
      });
    });
  });

  describe('12시간 주간 convertBlockTo12hArcs (SDD 004)', () => {
    it('주간 범위(08:00~20:00) 내의 일정(09:00~11:00)은 9시 위치(270도) ~ 11시 위치(330도)로 매핑되어야 한다', () => {
      const block: RoutineBlock = {
        id: '1',
        title: '오전 기획 회의',
        startHour: 9,
        startMinute: 0,
        endHour: 11,
        endMinute: 0,
        color: '#3b82f6',
      };

      const arcs = convertBlockTo12hArcs(block, 8);
      expect(arcs).toHaveLength(1);
      expect(arcs[0]).toMatchObject({
        startAngle: 270,
        endAngle: 330,
        color: '#3b82f6',
        title: '오전 기획 회의',
      });
    });
  });

  describe('일과 전환 5초 전 카운트다운 checkUpcomingTransition (SDD 007)', () => {
    const dummyBlocks: RoutineBlock[] = [
      {
        id: 'b1',
        title: '점심 식사',
        startHour: 13,
        startMinute: 0,
        endHour: 14,
        endMinute: 0,
        color: '#10b981',
      },
    ];

    it('일과 시작 정확히 5초 전(12:59:55)에는 5초 카운트다운 정보를 반환해야 한다', () => {
      const time = new Date(2026, 10, 5, 12, 59, 55);
      const transition = checkUpcomingTransition(time, dummyBlocks);

      expect(transition).not.toBeNull();
      expect(transition?.remainingSeconds).toBe(5);
      expect(transition?.nextBlockTitle).toBe('점심 식사');
    });

    it('일과 시작 3초 전(12:59:57)에는 3초 카운트다운 정보를 반환해야 한다', () => {
      const time = new Date(2026, 10, 5, 12, 59, 57);
      const transition = checkUpcomingTransition(time, dummyBlocks);

      expect(transition).not.toBeNull();
      expect(transition?.remainingSeconds).toBe(3);
    });

    it('일과 시작 6초 전(12:59:54)에는 카운트다운이 발동하지 않고 null을 반환해야 한다', () => {
      const time = new Date(2026, 10, 5, 12, 59, 54);
      expect(checkUpcomingTransition(time, dummyBlocks)).toBeNull();
    });

    it('일과 시작 정각(13:00:00) 및 이후에는 null을 반환해야 한다', () => {
      const timeOn = new Date(2026, 10, 5, 13, 0, 0);
      const timeAfter = new Date(2026, 10, 5, 13, 0, 1);
      expect(checkUpcomingTransition(timeOn, dummyBlocks)).toBeNull();
      expect(checkUpcomingTransition(timeAfter, dummyBlocks)).toBeNull();
    });
  });
});
