import React, { useEffect, useMemo } from 'react';
import { useClockStore } from './store/useClockStore';
import { ClockDial } from './components/ClockDial';
import { SettingsModal } from './components/SettingsModal';
import {
  Sparkles,
  CalendarDays,
  CheckCircle2,
} from 'lucide-react';

export const App: React.FC = () => {
  const {
    currentTime,
    setCurrentTime,
    presets,
    activePresetId,
    setActivePreset,
    setIsSettingsOpen,
    initData,
    settings,
    googleBlocks,
    updateSettings,
  } = useClockStore();

  // 데이터베이스 초기화
  useEffect(() => {
    initData();
  }, [initData]);

  // 1초 주기로 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [setCurrentTime]);

  // 메인 윈도우 F1 단축키 리스너
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSettingsOpen]);

  // 활성 프리셋
  const currentPreset = useMemo(() => {
    return presets.find((p) => p.id === activePresetId) || presets[0];
  }, [presets, activePresetId]);

  // 캘린더 소스(자체 / 구글 / 병합)에 따른 표시 블록 결정 (SDD 003 Display Policy)
  const blocks = useMemo(() => {
    const localBlocks = currentPreset?.blocks || [];
    if (settings.calendarSource === 'google') {
      return googleBlocks;
    }
    if (settings.calendarSource === 'both') {
      return [...localBlocks, ...googleBlocks];
    }
    return localBlocks;
  }, [currentPreset, googleBlocks, settings.calendarSource]);

  // 현재 진행 중인 일과 찾기
  const currentBlock = useMemo(() => {
    const currentH = currentTime.getHours();
    const currentM = currentTime.getMinutes();
    const currentTotalMin = currentH * 60 + currentM;

    return blocks.find((block) => {
      const startMin = block.startHour * 60 + block.startMinute;
      const endMin = block.endHour * 60 + block.endMinute;

      if (startMin <= endMin) {
        return currentTotalMin >= startMin && currentTotalMin < endMin;
      } else {
        // 자정 통과
        return currentTotalMin >= startMin || currentTotalMin < endMin;
      }
    });
  }, [blocks, currentTime]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 select-none font-sans">
      {/* 상단 네비게이션 헤더 */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            24
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wide text-slate-100">
              DailyClock
            </h1>
            <p className="text-[11px] text-slate-400">24시간 원형 일과표 &amp; 시침</p>
          </div>
        </div>

        {/* 액션 버튼: 12H / 24H 모드 빠른 토글 버튼 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateSettings({ dialMode: settings.dialMode === '12h' ? '24h' : '12h' })}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 flex items-center gap-1 transition-colors shadow-sm"
            title="12시간 주간 모드 / 24시간 모드 전환"
          >
            {settings.dialMode === '12h' ? '☀️ 12H 주간 모드' : '🌙 24H 전체 모드'}
          </button>
        </div>
      </header>

      {/* 메인 다이얼 영역 */}
      <main className="flex-1 flex flex-col items-center justify-center my-4 w-full">
        {/* 디지털 시계 및 상태 배지 */}
        <div className="text-center mb-2">
          <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-wider text-slate-100 drop-shadow-md">
            {currentTime.toLocaleTimeString('ko-KR', { hour12: false })}
          </div>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
              {currentPreset?.name}
            </span>
            {currentBlock && (
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-medium text-white flex items-center gap-1"
                style={{ backgroundColor: currentBlock.color }}
              >
                <Sparkles className="w-3 h-3" /> {currentBlock.title} 진행 중
              </span>
            )}
          </div>
        </div>

        {/* 24시간 / 12시간 원형 다이얼 차트 (반응형 규격) */}
        <div className="w-full max-w-[min(90vw,420px)] aspect-square flex items-center justify-center relative">
          <ClockDial
            currentTime={currentTime}
            blocks={blocks}
            className="w-full h-full max-w-full max-h-full"
            dialMode={settings.dialMode}
            twelveHourStart={settings.twelveHourStart}
          />
        </div>

        {/* 빠른 일과표 템플릿 전환 칩 */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-xl">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setActivePreset(preset.id)}
              className={`px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1 ${
                activePresetId === preset.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-md'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {activePresetId === preset.id && <CheckCircle2 className="w-3 h-3" />}
              {preset.name}
            </button>
          ))}
        </div>
      </main>

      {/* 하단 푸터 */}
      <footer className="text-center text-xs text-slate-500 py-2">
        DailyClock · 24H &amp; 12H Circular Routine Tracker
      </footer>

      {/* 환경설정 모달 */}
      <SettingsModal />
    </div>
  );
};
export default App;
