/**
 * 24시간 및 12시간 원형 다이얼 & 시침 각도 계산 코어 모듈
 * SDD: docs/design-docs/001-clock-dial-spec.md & 002-dial-labels-and-center-clock.md & 004-12h-mode-spec.md
 */

export interface TimeInput {
  hours: number;   // 0 ~ 23
  minutes: number; // 0 ~ 59
  seconds?: number;// 0 ~ 59
}

export interface RoutineBlock {
  id: string;
  title: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  color: string;
  category?: string;
}

export interface ArcSegment {
  startAngle: number; // 0 ~ 360
  endAngle: number;   // 0 ~ 360
  color: string;
  title: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

/**
 * 일과 블록 목록을 시작 시각 오름차순으로 정렬 (SDD 011)
 * 시작 시각이 같으면 종료 시각 오름차순으로 정렬
 */
export function sortRoutineBlocks(blocks: RoutineBlock[]): RoutineBlock[] {
  return [...blocks].sort((a, b) => {
    const aStart = a.startHour * 60 + a.startMinute;
    const bStart = b.startHour * 60 + b.startMinute;
    if (aStart !== bStart) {
      return aStart - bStart;
    }
    const aEnd = a.endHour * 60 + a.endMinute;
    const bEnd = b.endHour * 60 + b.endMinute;
    return aEnd - bEnd;
  });
}

/**
 * 24시간 시침 각도 계산
 * 24시간 = 360도 (1시간 = 15도, 1분 = 0.25도, 1초 = 0.004166...도)
 */
export function calculateNeedleAngle(time: TimeInput): number {
  const { hours, minutes, seconds = 0 } = time;

  if (hours < 0 || hours > 23) {
    throw new RangeError(`Invalid hours: ${hours}. Must be between 0 and 23.`);
  }
  if (minutes < 0 || minutes > 59) {
    throw new RangeError(`Invalid minutes: ${minutes}. Must be between 0 and 59.`);
  }
  if (seconds < 0 || seconds > 59) {
    throw new RangeError(`Invalid seconds: ${seconds}. Must be between 0 and 59.`);
  }

  return (hours * 15) + (minutes * 0.25) + (seconds * (15 / 3600));
}

/**
 * 12시간 아날로그 시계 시침 각도 계산 (SDD 004)
 * 실제 아날로그 시계판과 100% 동일 (1시간 = 30도, 1분 = 0.5도)
 * 12시 = 0도, 3시 = 90도, 6시 = 180도, 7시 = 210도, 8시 = 240도
 */
export function calculate12hNeedleAngle(time: TimeInput): number {
  const { hours, minutes, seconds = 0 } = time;

  if (hours < 0 || hours > 23) {
    throw new RangeError(`Invalid hours: ${hours}. Must be between 0 and 23.`);
  }
  if (minutes < 0 || minutes > 59) {
    throw new RangeError(`Invalid minutes: ${minutes}. Must be between 0 and 59.`);
  }
  if (seconds < 0 || seconds > 59) {
    throw new RangeError(`Invalid seconds: ${seconds}. Must be between 0 and 59.`);
  }

  const h12 = hours % 12;
  return (h12 * 30) + (minutes * 0.5) + (seconds * (30 / 3600));
}

export interface TransitionCountdownInfo {
  nextBlockTitle: string;
  nextBlockColor: string;
  remainingSeconds: number; // 1 ~ 5
}

export type DayNightMode = 'day' | 'night';

export interface Active12hWindow {
  mode: DayNightMode;
  windowStartHour: number; // 주간: dayStartHour (기본 8), 야간: (dayStartHour + 12) % 24 (기본 20)
  windowEndHour: number;   // 주간: (dayStartHour + 12) % 24 (기본 20), 야간: dayStartHour (기본 8)
}

/**
 * 현재 시각을 기준으로 자동 계산되는 기본 낮/밤 모드 반환 (SDD 010)
 */
export function getAutoDayNightMode(currentTime: Date, dayStartHour = 8): DayNightMode {
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const dayStartMin = dayStartHour * 60;
  const dayEndMin = (dayStartHour + 12) * 60; // 예: 20 * 60 = 1200분

  if (dayEndMin <= 24 * 60) {
    return currentMinutes >= dayStartMin && currentMinutes < dayEndMin ? 'day' : 'night';
  } else {
    const normalizedEndMin = dayEndMin % (24 * 60);
    return currentMinutes >= dayStartMin || currentMinutes < normalizedEndMin ? 'day' : 'night';
  }
}

/**
 * 선택된 낮/밤 모드(수동 선택 또는 자동)에 따른 12시간 윈도우 반환 (SDD 010)
 */
export function getActive12hWindow(
  mode: DayNightMode,
  dayStartHour = 8
): Active12hWindow {
  if (mode === 'day') {
    return {
      mode: 'day',
      windowStartHour: dayStartHour,
      windowEndHour: (dayStartHour + 12) % 24,
    };
  } else {
    return {
      mode: 'night',
      windowStartHour: (dayStartHour + 12) % 24,
      windowEndHour: dayStartHour,
    };
  }
}

/**
 * 일과 전환 5초 전 카운트다운 감지 (SDD 007)
 */
export function checkUpcomingTransition(
  currentTime: Date,
  blocks: RoutineBlock[]
): TransitionCountdownInfo | null {
  const currentTotalSeconds =
    currentTime.getHours() * 3600 +
    currentTime.getMinutes() * 60 +
    currentTime.getSeconds();

  for (const block of blocks) {
    const blockStartSeconds = block.startHour * 3600 + block.startMinute * 60;
    let diff = blockStartSeconds - currentTotalSeconds;

    // 자정 통과 일정 대비 (예: 현재 23:59:57, 다음 블록 00:00:00)
    if (diff < 0 && diff > -24 * 3600 + 10) {
      diff += 24 * 3600;
    }

    if (diff >= 1 && diff <= 5) {
      return {
        nextBlockTitle: block.title,
        nextBlockColor: block.color,
        remainingSeconds: diff,
      };
    }
  }

  return null;
}

/**
 * 24시간 일과 블록을 호(ArcSegment) 배열로 변환
 */
export function convertBlockToArcs(block: RoutineBlock): ArcSegment[] {
  const startAngle = calculateNeedleAngle({
    hours: block.startHour,
    minutes: block.startMinute,
  });

  const endAngle = calculateNeedleAngle({
    hours: block.endHour,
    minutes: block.endMinute,
  });

  if (startAngle === endAngle) {
    return [];
  }

  if (startAngle < endAngle) {
    return [
      {
        startAngle,
        endAngle,
        color: block.color,
        title: block.title,
        startHour: block.startHour,
        startMinute: block.startMinute,
        endHour: block.endHour,
        endMinute: block.endMinute,
      },
    ];
  } else {
    // 자정 통과 일정 (예: 23:00 -> 02:00)
    const span1 = 360 - startAngle;
    const span2 = endAngle;

    return [
      {
        startAngle,
        endAngle: 360,
        color: block.color,
        title: span1 >= span2 ? block.title : '',
        startHour: block.startHour,
        startMinute: block.startMinute,
        endHour: block.endHour,
        endMinute: block.endMinute,
      },
      {
        startAngle: 0,
        endAngle,
        color: block.color,
        title: span2 > span1 ? block.title : '',
        startHour: block.startHour,
        startMinute: block.startMinute,
        endHour: block.endHour,
        endMinute: block.endMinute,
      },
    ];
  }
}

/**
 * 12시간 아날로그 시계 호(ArcSegment) 변환 (SDD 004 & SDD 010)
 * 지정된 12시간 윈도우 [windowStartHour ~ windowStartHour + 12]와 겹치는 구간만
 * 실제 아날로그 시계 각도(1시간=30도, 1분=0.5도)로 매핑.
 * 겹치는 일정이 없으면 빈 배열 [] 반환 (야간 일정 없을 시 빈값 보장).
 */
export function convertBlockTo12hArcs(
  block: RoutineBlock,
  windowStartHour = 8
): ArcSegment[] {
  const windowStartMin = windowStartHour * 60;
  const windowEndMin = (windowStartHour + 12) * 60;

  // 블록의 시작/종료 분 계산
  let blockStartMin = block.startHour * 60 + block.startMinute;
  let blockEndMin = block.endHour * 60 + block.endMinute;

  // 자정 통과 일정 처리 (예: 23:00 -> 07:00 => 1380 -> 1860)
  if (blockStartMin > blockEndMin) {
    blockEndMin += 24 * 60;
  }

  // 12시간 윈도우(예: 20:00~32:00)와의 교차 구간 계산
  // 자정 전후(0시~8시) 일정도 야간 윈도우에 걸치도록 24시간 오프셋 순회 검사
  let overlapStart = -1;
  let overlapEnd = -1;

  for (const offset of [0, 24 * 60]) {
    const curBStart = blockStartMin + offset;
    const curBEnd = blockEndMin + offset;

    const oStart = Math.max(curBStart, windowStartMin);
    const oEnd = Math.min(curBEnd, windowEndMin);

    if (oStart < oEnd) {
      overlapStart = oStart;
      overlapEnd = oEnd;
      break;
    }
  }

  if (overlapStart >= overlapEnd || overlapStart === -1) {
    return []; // 12시간 윈도우 밖의 일정 (빈값)
  }

  // 각도로 변환: (시 % 12) * 30 + 분 * 0.5
  const startH = Math.floor(overlapStart / 60) % 24;
  const startM = overlapStart % 60;
  const endH = Math.floor(overlapEnd / 60) % 24;
  const endM = overlapEnd % 60;

  const startAngle = calculate12hNeedleAngle({ hours: startH, minutes: startM });
  const endAngle = calculate12hNeedleAngle({ hours: endH, minutes: endM });

  if (startAngle === endAngle) {
    return [];
  }

  if (startAngle < endAngle) {
    return [
      {
        startAngle,
        endAngle,
        color: block.color,
        title: block.title,
        startHour: block.startHour,
        startMinute: block.startMinute,
        endHour: block.endHour,
        endMinute: block.endMinute,
      },
    ];
  } else {
    // 12시(0도)를 통과하는 경우 (예: 11:30 -> 13:00 또는 23:00 -> 01:00)
    return [
      {
        startAngle,
        endAngle: 360,
        color: block.color,
        title: block.title,
        startHour: block.startHour,
        startMinute: block.startMinute,
        endHour: block.endHour,
        endMinute: block.endMinute,
      },
      {
        startAngle: 0,
        endAngle,
        color: block.color,
        title: '',
        startHour: block.startHour,
        startMinute: block.startMinute,
        endHour: block.endHour,
        endMinute: block.endMinute,
      },
    ];
  }
}
