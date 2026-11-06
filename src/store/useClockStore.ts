import { create } from 'zustand';
import { db, DEFAULT_PRESETS, type RoutinePreset, type UserSettings } from '../db';
import { sortRoutineBlocks, type RoutineBlock } from '../core/dial';
import {
  fetchGoogleCalendarEvents,
  fetchGoogleTasks,
  GOOGLE_SCOPES,
} from '../services/googleSync';

interface ClockState {
  currentTime: Date;
  presets: RoutinePreset[];
  activePresetId: string;
  settings: UserSettings;
  isSettingsOpen: boolean;
  googleBlocks: RoutineBlock[];
  isPiPActive: boolean;
  isGoogleSyncing: boolean;
  googleSyncError: string | null;

  // 액션
  setCurrentTime: (date: Date) => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
  setIsPiPActive: (isActive: boolean) => void;
  initData: () => Promise<void>;
  
  // 템플릿/프리셋 관리
  setActivePreset: (id: string) => Promise<void>;
  createPreset: (name: string) => Promise<RoutinePreset>;
  updatePreset: (id: string, updates: Partial<RoutinePreset>) => Promise<void>;
  duplicatePreset: (id: string) => Promise<RoutinePreset>;
  deletePreset: (id: string) => Promise<void>;
  resetToDefaultPresets: () => Promise<void>;
  
  // 블록 관리
  addBlock: (presetId: string, block: Omit<RoutineBlock, 'id'>) => Promise<void>;
  updateBlock: (presetId: string, blockId: string, updates: Partial<RoutineBlock>) => Promise<void>;
  deleteBlock: (presetId: string, blockId: string) => Promise<void>;

  // 설정 및 구글 동기화
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  setGoogleBlocks: (blocks: RoutineBlock[]) => void;
  syncGoogleData: () => Promise<void>;
}

const DEFAULT_SETTINGS: UserSettings = {
  id: 'current',
  activePresetId: 'preset-weekday',
  calendarSource: 'local',
  theme: 'dark',
  colorPalette: 'default',
  dialMode: '12h', // 실제 아날로그 시계 일치 기본 모드
  twelveHourStart: 8,
};

export const useClockStore = create<ClockState>((set, get) => ({
  currentTime: new Date(),
  presets: [],
  activePresetId: 'preset-weekday',
  settings: DEFAULT_SETTINGS,
  isSettingsOpen: false,
  googleBlocks: [],
  isPiPActive: false,
  isGoogleSyncing: false,
  googleSyncError: null,

  setCurrentTime: (currentTime) => set({ currentTime }),
  setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  setIsPiPActive: (isPiPActive) => set({ isPiPActive }),

  initData: async () => {
    // 1. 프리셋 로드
    let storedPresets = await db.presets.toArray();
    if (storedPresets.length === 0) {
      await db.presets.bulkAdd(DEFAULT_PRESETS);
      storedPresets = DEFAULT_PRESETS;
    }

    // 2. 설정 로드
    let storedSettings = await db.settings.get('current');
    if (!storedSettings) {
      await db.settings.put(DEFAULT_SETTINGS);
      storedSettings = DEFAULT_SETTINGS;
    }

    set({
      presets: storedPresets,
      settings: storedSettings,
      activePresetId: storedSettings.activePresetId || storedPresets[0].id,
    });
  },

  setActivePreset: async (id) => {
    set({ activePresetId: id });
    const { settings } = get();
    const newSettings = { ...settings, activePresetId: id };
    await db.settings.put(newSettings);
    set({ settings: newSettings });
  },

  createPreset: async (name) => {
    const newPreset: RoutinePreset = {
      id: `preset-${Date.now()}`,
      name,
      createdAt: Date.now(),
      blocks: [],
    };
    await db.presets.add(newPreset);
    set((state) => ({
      presets: [...state.presets, newPreset],
      activePresetId: newPreset.id,
    }));
    return newPreset;
  },

  updatePreset: async (id, updates) => {
    await db.presets.update(id, updates);
    set((state) => ({
      presets: state.presets.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  duplicatePreset: async (id) => {
    const target = get().presets.find((p) => p.id === id);
    if (!target) throw new Error('Preset not found');

    const duplicated: RoutinePreset = {
      ...target,
      id: `preset-${Date.now()}`,
      name: `${target.name} (복사본)`,
      createdAt: Date.now(),
      isDefault: false,
      blocks: target.blocks.map((b) => ({ ...b, id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` })),
    };

    await db.presets.add(duplicated);
    set((state) => ({
      presets: [...state.presets, duplicated],
      activePresetId: duplicated.id,
    }));
    return duplicated;
  },

  deletePreset: async (id) => {
    const { presets, activePresetId } = get();
    if (presets.length <= 1) {
      alert('최소 1개의 일과표는 유지되어야 합니다.');
      return;
    }

    await db.presets.delete(id);
    const remaining = presets.filter((p) => p.id !== id);
    const nextActiveId = activePresetId === id ? remaining[0].id : activePresetId;

    set({
      presets: remaining,
      activePresetId: nextActiveId,
    });
  },

  resetToDefaultPresets: async () => {
    await db.presets.clear();
    await db.presets.bulkAdd(DEFAULT_PRESETS);
    set({
      presets: DEFAULT_PRESETS,
      activePresetId: DEFAULT_PRESETS[0].id,
    });
  },

  addBlock: async (presetId, blockData) => {
    const preset = get().presets.find((p) => p.id === presetId);
    if (!preset) return;

    const newBlock: RoutineBlock = {
      ...blockData,
      id: `block-${Date.now()}`,
    };

    const updatedBlocks = sortRoutineBlocks([...preset.blocks, newBlock]);
    await db.presets.update(presetId, { blocks: updatedBlocks });
    set((state) => ({
      presets: state.presets.map((p) => (p.id === presetId ? { ...p, blocks: updatedBlocks } : p)),
    }));
  },

  updateBlock: async (presetId, blockId, updates) => {
    const preset = get().presets.find((p) => p.id === presetId);
    if (!preset) return;

    const updatedBlocks = sortRoutineBlocks(
      preset.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b))
    );
    await db.presets.update(presetId, { blocks: updatedBlocks });
    set((state) => ({
      presets: state.presets.map((p) => (p.id === presetId ? { ...p, blocks: updatedBlocks } : p)),
    }));
  },

  deleteBlock: async (presetId, blockId) => {
    const preset = get().presets.find((p) => p.id === presetId);
    if (!preset) return;

    const updatedBlocks = preset.blocks.filter((b) => b.id !== blockId);
    await db.presets.update(presetId, { blocks: updatedBlocks });
    set((state) => ({
      presets: state.presets.map((p) => (p.id === presetId ? { ...p, blocks: updatedBlocks } : p)),
    }));
  },

  updateSettings: async (updates) => {
    const newSettings = { ...get().settings, ...updates };
    await db.settings.put(newSettings);
    set({ settings: newSettings });
  },

  setGoogleBlocks: (googleBlocks) => set({ googleBlocks }),

  syncGoogleData: async () => {
    const { settings } = get();
    const clientId = settings.googleClientId?.trim();

    if (!clientId) {
      set({ googleSyncError: 'Google OAuth Client ID가 설정되지 않았습니다. 환경설정에서 입력해주세요.' });
      return;
    }

    // Google Identity Services (GIS) 라이브러리 검사
    // @ts-expect-error - google GIS global
    if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
      set({ googleSyncError: 'Google Identity Services 스크립트가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.' });
      return;
    }

    set({ isGoogleSyncing: true, googleSyncError: null });

    try {
      // @ts-expect-error - google GIS global
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_SCOPES.join(' '),
        callback: async (tokenResponse: { access_token?: string; error?: string }) => {
          if (tokenResponse.error || !tokenResponse.access_token) {
            set({
              isGoogleSyncing: false,
              googleSyncError: `Google 인증 실패: ${tokenResponse.error || '토큰 없음'}`,
            });
            return;
          }

          try {
            // Calendar Events 및 Tasks 병렬 조회 (Strict Read-Only)
            const [calendarBlocks, taskBlocks] = await Promise.all([
              fetchGoogleCalendarEvents(tokenResponse.access_token),
              fetchGoogleTasks(tokenResponse.access_token),
            ]);

            const merged = [...calendarBlocks, ...taskBlocks];
            set({
              googleBlocks: merged,
              isGoogleSyncing: false,
              googleSyncError: null,
            });
          } catch (fetchErr: any) {
            set({
              isGoogleSyncing: false,
              googleSyncError: `데이터 조회 실패: ${fetchErr.message}`,
            });
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err: any) {
      set({
        isGoogleSyncing: false,
        googleSyncError: `인증 클라이언트 초기화 실패: ${err.message}`,
      });
    }
  },
}));

