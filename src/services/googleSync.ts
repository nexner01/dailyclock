/**
 * Google Calendar & Tasks 단방향 (Read-Only) 연동 서비스
 * SDD: docs/design-docs/003-google-sync-spec.md
 */

import type { RoutineBlock } from '../core/dial';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/tasks.readonly',
];

export interface GoogleEventItem {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  colorId?: string;
}

export interface GoogleTaskItem {
  id: string;
  title?: string;
  due?: string; // RFC 3339 timestamp
  status: 'needsAction' | 'completed';
}

/**
 * Google Calendar Event -> RoutineBlock 변환
 * 종일(All-day) 일정은 시계 호에 매핑하지 않음
 */
export function parseGoogleEventToBlock(
  event: GoogleEventItem,
  defaultColor = '#3b82f6'
): RoutineBlock | null {
  if (!event.start.dateTime || !event.end.dateTime) {
    return null;
  }

  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);

  return {
    id: `gcal-${event.id}`,
    title: event.summary || '(제목 없는 일정)',
    startHour: start.getHours(),
    startMinute: start.getMinutes(),
    endHour: end.getHours(),
    endMinute: end.getMinutes(),
    color: defaultColor,
    category: 'google-calendar',
  };
}

/**
 * Google Tasks -> RoutineBlock 변환
 * 완료되었거나 마감일시가 없는 할 일은 제외
 * 마감 시각 기준 30분 전~마감 시각 블록으로 시각화
 */
export function parseGoogleTaskToBlock(
  task: GoogleTaskItem,
  defaultColor = '#10b981'
): RoutineBlock | null {
  if (!task.due || task.status === 'completed') {
    return null;
  }

  const dueDate = new Date(task.due);
  const hour = dueDate.getHours();
  const minute = dueDate.getMinutes();

  // 마감 30분 전부터 마감 시각까지
  let startHour = hour;
  let startMinute = minute - 30;
  if (startMinute < 0) {
    startHour = (hour - 1 + 24) % 24;
    startMinute += 60;
  }

  return {
    id: `gtask-${task.id}`,
    title: `[할일] ${task.title || '(할 일)'}`,
    startHour,
    startMinute,
    endHour: hour,
    endMinute: minute,
    color: defaultColor,
    category: 'google-task',
  };
}

/**
 * 당일(오늘 00:00:00 ~ 23:59:59) 구글 캘린더 이벤트 목록 읽기 (Read-Only)
 */
export async function fetchGoogleCalendarEvents(accessToken: string): Promise<RoutineBlock[]> {
  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
  const timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    let detail = '';
    try {
      const errJson = await res.json();
      detail = errJson.error?.message || '';
    } catch {
      // ignore
    }
    throw new Error(`Google Calendar API error (${res.status}): ${detail || res.statusText}`);
  }

  const data = await res.json();
  const items: GoogleEventItem[] = data.items || [];
  return items.map((item) => parseGoogleEventToBlock(item)).filter((b): b is RoutineBlock => b !== null);
}

/**
 * 당일 구글 Tasks 목록 읽기 (Read-Only)
 */
export async function fetchGoogleTasks(accessToken: string): Promise<RoutineBlock[]> {
  const url = new URL('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks');
  url.searchParams.set('showCompleted', 'false');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Google Tasks API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const items: GoogleTaskItem[] = data.items || [];
  return items.map((item) => parseGoogleTaskToBlock(item)).filter((b): b is RoutineBlock => b !== null);
}

