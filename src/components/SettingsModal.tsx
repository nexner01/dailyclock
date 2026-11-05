import React, { useState } from 'react';
import { useClockStore } from '../store/useClockStore';
import {
  X,
  Plus,
  Copy,
  Trash2,
  Calendar,
  Palette,
  Clock,
  Check,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f97316', // orange
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#475569', // slate
];

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    presets,
    activePresetId,
    setActivePreset,
    createPreset,
    duplicatePreset,
    deletePreset,
    addBlock,
    deleteBlock,
    settings,
    updateSettings,
    syncGoogleData,
    isGoogleSyncing,
    googleSyncError,
    googleBlocks,
  } = useClockStore();

  const [activeTab, setActiveTab] = useState<'routine' | 'calendar' | 'theme'>('routine');
  const [newPresetName, setNewPresetName] = useState('');
  
  // 새 블록 입력 상태
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState('09:00');
  const [newEnd, setNewEnd] = useState('12:00');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  if (!isSettingsOpen) return null;

  const currentPreset = presets.find((p) => p.id === activePresetId) || presets[0];

  const handleCreatePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    await createPreset(newPresetName.trim());
    setNewPresetName('');
  };

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !currentPreset) return;

    const [startH, startM] = newStart.split(':').map(Number);
    const [endH, endM] = newEnd.split(':').map(Number);

    await addBlock(currentPreset.id, {
      title: newTitle.trim(),
      startHour: startH,
      startMinute: startM,
      endHour: endH,
      endMinute: endM,
      color: newColor,
    });

    setNewTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">환경설정 (Preferences)</h2>
              <p className="text-xs text-slate-400">단축키 [F1]로 언제든 다시 열 수 있습니다</p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2">
          <button
            onClick={() => setActiveTab('routine')}
            className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'routine'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" /> 자체 일과표 관리
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'calendar'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" /> 캘린더 연동 모드
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`py-3 px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'theme'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" /> 테마 & 시간표 모드
          </button>
        </div>

        {/* 탭 컨텐츠 영역 */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-slate-200">
          {/* TAB 1: 자체 일과표 관리 */}
          {activeTab === 'routine' && (
            <div className="space-y-6">
              {/* 프리셋 선택 및 신규/복제/삭제 */}
              <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                    활성 일과표 선택 (24시간 템플릿)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => duplicatePreset(currentPreset.id)}
                      className="text-xs flex items-center gap-1 px-2.5 py-1.5 bg-slate-700/70 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                      title="현재 일과표 복제"
                    >
                      <Copy className="w-3.5 h-3.5" /> 복제
                    </button>
                    {presets.length > 1 && (
                      <button
                        onClick={() => deletePreset(currentPreset.id)}
                        className="text-xs flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg transition-colors"
                        title="현재 일과표 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> 삭제
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setActivePreset(preset.id)}
                      className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                        activePresetId === preset.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-semibold shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <span className="truncate">{preset.name}</span>
                      {activePresetId === preset.id && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                    </button>
                  ))}
                </div>

                {/* 새 일과표 등록 폼 */}
                <form onSubmit={handleCreatePreset} className="flex gap-2 pt-2 border-t border-slate-700/40">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="새 일과표 이름 (예: 시험 기간 루틴)..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" /> 일과표 생성
                  </button>
                </form>
              </div>

              {/* 현재 일과표의 시간 블록 목록 */}
              {currentPreset && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-300 flex items-center justify-between">
                    <span>
                      [{currentPreset.name}] 하루 시간표 ({currentPreset.blocks.length}개 블록)
                    </span>
                  </h3>

                  {/* 블록 추가 입력 */}
                  <form onSubmit={handleAddBlock} className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">일과 제목</label>
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="예: 독서, 회의, 운동"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">시작 시각</label>
                        <input
                          type="time"
                          value={newStart}
                          onChange={(e) => setNewStart(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">종료 시각 (자정 넘김 가능)</label>
                        <input
                          type="time"
                          value={newEnd}
                          onChange={(e) => setNewEnd(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {/* 색상 선택 */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400 mr-1">색상:</span>
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-5 h-5 rounded-full transition-transform ${
                              newColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> 블록 등록
                      </button>
                    </div>
                  </form>

                  {/* 등록된 블록 리스트 */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {currentPreset.blocks.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">등록된 일과가 없습니다. 위에서 일과를 추가해보세요.</p>
                    ) : (
                      currentPreset.blocks.map((block) => (
                        <div
                          key={block.id}
                          className="flex items-center justify-between p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-lg hover:border-slate-600 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: block.color }} />
                            <span className="font-medium text-slate-200">{block.title}</span>
                            <span className="text-xs font-mono text-slate-400">
                              {block.startHour.toString().padStart(2, '0')}:{block.startMinute.toString().padStart(2, '0')} ~{' '}
                              {block.endHour.toString().padStart(2, '0')}:{block.endMinute.toString().padStart(2, '0')}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteBlock(currentPreset.id, block.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 캘린더 연동 모드 (Google Calendar & Tasks) */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl space-y-4">
                <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase block">
                  캘린더 데이터 소스 선택
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'local', title: '자체 일과표만 사용', desc: '내장된 24시간 루틴만 시계에 표시' },
                    { id: 'google', title: '구글 캘린더만 사용', desc: 'Google 일정 & Tasks 할 일만 표시' },
                    { id: 'both', title: '함께 보기 (병합 뷰)', desc: '자체 일과 위에 구글 일정 레이어 오버레이' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => updateSettings({ calendarSource: item.id as any })}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        settings.calendarSource === item.id
                          ? 'bg-indigo-600/20 border-indigo-500 shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200">{item.title}</span>
                        {settings.calendarSource === item.id && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 구글 연동 정보 입력 안내 */}
              <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="font-semibold text-slate-200">구글 캘린더 & Google Tasks 연동 설정</h3>
                </div>

                <div className="flex items-start gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>안전한 단방향(Read-Only) 연동</strong>: DailyClock은 사용자의 구글 계정에서 일정을 읽어오기만 하며, 구글 캘린더로 일정을 쓰거나 수정하지 않습니다.
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Google OAuth Client ID</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={settings.googleClientId || ''}
                        onChange={(e) => updateSettings({ googleClientId: e.target.value })}
                        placeholder="예: xxxxxxxxxxxx-xxxxxxxx.apps.googleusercontent.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 tracking-wider"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      보안을 위해 항상 마스킹(••••••) 처리되어 보관됩니다.
                    </p>
                  </div>

                  {googleSyncError && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs">
                      {googleSyncError}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      가져온 구글 일정/할 일: <strong className="text-indigo-400 font-mono">{googleBlocks.length}개</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => syncGoogleData()}
                      disabled={isGoogleSyncing || !settings.googleClientId}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGoogleSyncing ? 'animate-spin' : ''}`} />
                      {isGoogleSyncing ? '구글 동기화 중...' : 'Google 계정 동기화하기'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 테마 & 시간표 모드 설정 */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              {/* 12시간 / 24시간 시간표 모드 선택 (SDD 004) */}
              <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl space-y-4">
                <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase block">
                  시간표 다이얼 모드
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateSettings({ dialMode: '24h' })}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      settings.dialMode === '24h'
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200">24시간 시간표 (전체)</span>
                      {settings.dialMode === '24h' && <Check className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <p className="text-xs text-slate-400">하루 24시간 전체 일과와 수면을 360도로 한눈에 파악</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSettings({ dialMode: '12h' })}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      settings.dialMode === '12h'
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200">12시간 주간 시간표 (아날로그)</span>
                      {settings.dialMode === '12h' && <Check className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <p className="text-xs text-slate-400">실제 아날로그 시계판과 100% 일치하며 주간 일과를 2배 확대 표시</p>
                  </button>
                </div>

                {/* 12시간 모드일 때 시작 시각 설정 드롭다운 */}
                {settings.dialMode === '12h' && (
                  <div className="pt-3 border-t border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">12시간 주간 시작 시각</div>
                      <div className="text-[11px] text-slate-400">
                        {settings.twelveHourStart ?? 8}시부터 12시간 동안({settings.twelveHourStart ?? 8}시 ~ {((settings.twelveHourStart ?? 8) + 12) % 24}시)의 주간 일과가 시계에 표시됩니다.
                      </div>
                    </div>

                    <select
                      value={settings.twelveHourStart ?? 8}
                      onChange={(e) => updateSettings({ twelveHourStart: Number(e.target.value) })}
                      className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
                    >
                      {Array.from({ length: 24 }).map((_, h) => (
                        <option key={h} value={h}>
                          {h < 12 ? `오전 ${h.toString().padStart(2, '0')}:00` : `오후 ${(h % 12 || 12).toString().padStart(2, '0')}:00 (${h}시)`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl space-y-4">
                <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase block">
                  화면 모드 (Dark / Light / System)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['dark', 'light', 'system'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => updateSettings({ theme: mode })}
                      className={`p-3 rounded-lg border text-center font-medium capitalize transition-all ${
                        settings.theme === mode
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl space-y-4">
                <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase block">
                  다이얼 컬러 테마 팔레트
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'default', name: '모던 다크' },
                    { id: 'pastel', name: '소프트 파스텔' },
                    { id: 'neon', name: '사이버 네온' },
                    { id: 'ocean', name: '딥 오션' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => updateSettings({ colorPalette: p.id as any })}
                      className={`p-3 rounded-lg border text-center font-medium transition-all ${
                        settings.colorPalette === p.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
