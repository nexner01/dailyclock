import { describe, it, expect } from 'vitest';
import {
  calculateNeedleAngle,
  calculate12hNeedleAngle,
  convertBlockToArcs,
  convertBlockTo12hArcs,
  checkUpcomingTransition,
  getAutoDayNightMode,
  getActive12hWindow,
  sortRoutineBlocks,
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

  describe('12시간 주간/야간 모드 및 빈값 처리 (SDD 010)', () => {
    describe('getAutoDayNightMode & getActive12hWindow', () => {
      it('주간 시간(08:00 ~ 19:59)에는 day 모드를 반환해야 한다', () => {
        const morning = new Date(2026, 10, 6, 8, 0, 0);
        const noon = new Date(2026, 10, 6, 12, 30, 0);
        const evening = new Date(2026, 10, 6, 19, 59, 59);

        expect(getAutoDayNightMode(morning, 8)).toBe('day');
        expect(getAutoDayNightMode(noon, 8)).toBe('day');
        expect(getAutoDayNightMode(evening, 8)).toBe('day');
      });

      it('야간 시간(20:00 ~ 07:59)에는 night 모드를 반환해야 한다', () => {
        const nightStart = new Date(2026, 10, 6, 20, 0, 0);
        const midnight = new Date(2026, 10, 6, 23, 59, 59);
        const dawn = new Date(2026, 10, 6, 3, 0, 0);
        const preMorning = new Date(2026, 10, 6, 7, 59, 59);

        expect(getAutoDayNightMode(nightStart, 8)).toBe('night');
        expect(getAutoDayNightMode(midnight, 8)).toBe('night');
        expect(getAutoDayNightMode(dawn, 8)).toBe('night');
        expect(getAutoDayNightMode(preMorning, 8)).toBe('night');
      });

      it('getActive12hWindow는 day 모드일 때 8시~20시 윈도우를 반환해야 한다', () => {
        const win = getActive12hWindow('day', 8);
        expect(win).toEqual({
          mode: 'day',
          windowStartHour: 8,
          windowEndHour: 20,
        });
      });

      it('getActive12hWindow는 night 모드일 때 20시~8시 윈도우를 반환해야 한다', () => {
        const win = getActive12hWindow('night', 8);
        expect(win).toEqual({
          mode: 'night',
          windowStartHour: 20,
          windowEndHour: 8,
        });
      });
    });

    describe('convertBlockTo12hArcs 야간 윈도우 및 빈값 검증', () => {
      const dayBlock: RoutineBlock = {
        id: 'day-1',
        title: '오전 딥워크',
        startHour: 9,
        startMinute: 0,
        endHour: 12,
        endMinute: 0,
        color: '#3b82f6',
      };

      const nightSleepBlock: RoutineBlock = {
        id: 'night-1',
        title: '수면 및 휴식',
        startHour: 23,
        startMinute: 0,
        endHour: 7,
        endMinute: 0,
        color: '#475569',
      };

      const eveningReadingBlock: RoutineBlock = {
        id: 'night-2',
        title: '독서 및 정리',
        startHour: 21,
        startMinute: 0,
        endHour: 22,
        endMinute: 30,
        color: '#8b5cf6',
      };

      it('야간 윈도우(20시~8시)에 주간 일정만 주어지면 빈 배열 []을 반환해야 한다 (빈값 보장)', () => {
        const arcs = convertBlockTo12hArcs(dayBlock, 20);
        expect(arcs).toEqual([]);
      });

      it('야간 윈도우(20시~8시)에 야간 일정(21:00~22:30)은 9시 위치(270도) ~ 10시 반 위치(315도)로 매핑되어야 한다', () => {
        const arcs = convertBlockTo12hArcs(eveningReadingBlock, 20);
        expect(arcs).toHaveLength(1);
        expect(arcs[0]).toMatchObject({
          startAngle: 270,
          endAngle: 315,
          color: '#8b5cf6',
          title: '독서 및 정리',
        });
      });

      it('야간 윈도우(20시~8시)에 자정을 넘나드는 수면 일정(23:00~07:00)은 12시를 가로지르므로 올바르게 분할 또는 매핑되어야 한다', () => {
        const arcs = convertBlockTo12hArcs(nightSleepBlock, 20);
        // 23:00는 11시 위치(330도), 07:00는 7시 위치(210도) -> 12시(0도)를 통과
        expect(arcs.length).toBeGreaterThanOrEqual(1);
        const totalDegree = arcs.reduce((acc, a) => acc + (a.endAngle - a.startAngle), 0);
        // 23시부터 7시까지는 8시간 = 8 * 30도 = 240도
        expect(totalDegree).toBe(240);
      });
      it('DEFAULT_PRESETS의 평일 블록들을 주간(8시) 윈도우에 넣었을 때 오전 일과가 반환되어야 한다', () => {
        const weekdayBlocks: RoutineBlock[] = [
          { id: 'b1', title: '수면 및 휴식', startHour: 23, startMinute: 0, endHour: 7, endMinute: 0, color: '#475569' },
          { id: 'b2', title: '기상 및 아침 루틴', startHour: 7, startMinute: 0, endHour: 8, endMinute: 30, color: '#f59e0b' },
          { id: 'b3', title: '오전 딥워크', startHour: 9, startMinute: 0, endHour: 12, endMinute: 0, color: '#3b82f6' },
          { id: 'b4', title: '점심 식사 및 산책', startHour: 12, startMinute: 0, endHour: 13, endMinute: 0, color: '#10b981' },
          { id: 'b5', title: '오후 협업 및 실행', startHour: 13, startMinute: 0, endHour: 18, endMinute: 0, color: '#6366f1' },
          { id: 'b6', title: '저녁 식사 및 운동', startHour: 18, startMinute: 30, endHour: 20, endMinute: 30, color: '#ec4899' },
          { id: 'b7', title: '독서 및 정리', startHour: 21, startMinute: 0, endHour: 22, endMinute: 30, color: '#8b5cf6' },
        ];

        const arcs = weekdayBlocks.flatMap((b) => convertBlockTo12hArcs(b, 8));
        expect(arcs.length).toBeGreaterThan(0);
      });
    });
  });

  describe('일과 블록 시간순 자동 정렬 sortRoutineBlocks (SDD 011)', () => {
    it('무작위 순서의 일과 블록들을 시작 시각 오름차순으로 정렬해야 한다', () => {
      const unsortedBlocks: RoutineBlock[] = [
        { id: '1', title: '점심', startHour: 12, startMinute: 30, endHour: 13, endMinute: 30, color: '#1' },
        { id: '2', title: '기상', startHour: 7, startMinute: 0, endHour: 8, endMinute: 0, color: '#2' },
        { id: '3', title: '야간 독서', startHour: 21, startMinute: 0, endHour: 22, endMinute: 0, color: '#3' },
        { id: '4', title: '오전 업무', startHour: 9, startMinute: 0, endHour: 11, endMinute: 0, color: '#4' },
        { id: '5', title: '아침 식사', startHour: 8, startMinute: 0, endHour: 8, endMinute: 30, color: '#5' },
      ];

      const sorted = sortRoutineBlocks(unsortedBlocks);

      expect(sorted.map((b) => b.title)).toEqual([
        '기상',        // 07:00
        '아침 식사',   // 08:00
        '오전 업무',   // 09:00
        '점심',        // 12:30
        '야간 독서',   // 21:00
      ]);
    });

    it('시작 시각이 같으면 종료 시각 오름차순으로 정렬해야 한다', () => {
      const blocks: RoutineBlock[] = [
        { id: '1', title: '긴 회의', startHour: 10, startMinute: 0, endHour: 12, endMinute: 0, color: '#1' },
        { id: '2', title: '짧은 스탠드업', startHour: 10, startMinute: 0, endHour: 10, endMinute: 30, color: '#2' },
      ];

      const sorted = sortRoutineBlocks(blocks);
      expect(sorted[0].title).toBe('짧은 스탠드업');
      expect(sorted[1].title).toBe('긴 회의');
    });
  });
});
