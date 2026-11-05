import Dexie, { type EntityTable } from 'dexie';
import type { RoutineBlock } from '../core/dial';

export interface RoutinePreset {
  id: string;
  name: string;
  isDefault?: boolean;
  createdAt: number;
  blocks: RoutineBlock[];
}

export interface UserSettings {
  id: string; // 'current'
  activePresetId: string;
  calendarSource: 'local' | 'google' | 'both';
  theme: 'dark' | 'light' | 'system';
  colorPalette: 'default' | 'pastel' | 'neon' | 'ocean';
  googleCalendarId?: string;
  googleClientId?: string;
  dialMode: '24h' | '12h';         // SDD 004: '24h' | '12h'
  twelveHourStart: number;          // SDD 004: 기본 8 (오전 8시)
}

const db = new Dexie('DailyClockDB') as Dexie & {
  presets: EntityTable<RoutinePreset, 'id'>;
  settings: EntityTable<UserSettings, 'id'>;
};

// 스키마 버전 1
db.version(1).stores({
  presets: 'id, name, isDefault, createdAt',
  settings: 'id',
});

export { db };

// 기본 시드 데이터
export const DEFAULT_PRESETS: RoutinePreset[] = [
  {
    id: 'preset-weekday',
    name: '평일 생산성 루틴',
    isDefault: true,
    createdAt: Date.now(),
    blocks: [
      { id: 'b1', title: '수면 및 휴식', startHour: 23, startMinute: 0, endHour: 7, endMinute: 0, color: '#475569' },
      { id: 'b2', title: '기상 및 아침 루틴', startHour: 7, startMinute: 0, endHour: 8, endMinute: 30, color: '#f59e0b' },
      { id: 'b3', title: '오전 딥워크', startHour: 9, startMinute: 0, endHour: 12, endMinute: 0, color: '#3b82f6' },
      { id: 'b4', title: '점심 식사 및 산책', startHour: 12, startMinute: 0, endHour: 13, endMinute: 0, color: '#10b981' },
      { id: 'b5', title: '오후 협업 및 실행', startHour: 13, startMinute: 0, endHour: 18, endMinute: 0, color: '#6366f1' },
      { id: 'b6', title: '저녁 식사 및 운동', startHour: 18, startMinute: 30, endHour: 20, endMinute: 30, color: '#ec4899' },
      { id: 'b7', title: '독서 및 정리', startHour: 21, startMinute: 0, endHour: 22, endMinute: 30, color: '#8b5cf6' },
    ],
  },
  {
    id: 'preset-weekend',
    name: '주말 힐링 루틴',
    isDefault: false,
    createdAt: Date.now(),
    blocks: [
      { id: 'w1', title: '충분한 수면', startHour: 23, startMinute: 30, endHour: 8, endMinute: 30, color: '#475569' },
      { id: 'w2', title: '브런치 & 티타임', startHour: 9, startMinute: 0, endHour: 11, endMinute: 0, color: '#f59e0b' },
      { id: 'w3', title: '야외 활동 & 취미', startHour: 13, startMinute: 0, endHour: 17, endMinute: 0, color: '#10b981' },
      { id: 'w4', title: '자유 시간 & 영화', startHour: 19, startMinute: 0, endHour: 22, endMinute: 0, color: '#ec4899' },
    ],
  },
];

