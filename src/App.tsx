import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useClockStore } from './store/useClockStore';
import { ClockDial } from './components/ClockDial';
import { SettingsModal } from './components/SettingsModal';
import { useDocumentPiP } from './hooks/useDocumentPiP';
import {
  Sparkles,
  CalendarDays,
  CheckCircle2,
  Sun,
  Moon,
  Settings,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { getAutoDayNightMode, type DayNightMode } from './core/dial';

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
    resetToDefaultPresets,
  } = useClockStore();

  // F1 단축키 콜백 등록을 포함한 Document PiP(최상단 플로팅 팝업) 훅
  const { isSupported, isPiPActive, pipWindow, requestPiP, closePiP } = useDocumentPiP({
    width: 360,
    height: 360,
    onF1Press: () => {
      setIsSettingsOpen(true);
    },
  });

  // 12시간 모드 주간/야간 수동 선택 상태 (기본값 null: 시간대 기반 자동)
  const [manualDayNight, setManualDayNight] = useState<DayNightMode | null>(null);

  const autoDayNight = useMemo(() => {
    return getAutoDayNightMode(currentTime, settings.twelveHourStart);
  }, [currentTime, settings.twelveHourStart]);

  const activeDayNight: DayNightMode = manualDayNight ?? autoDayNight;

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

        {/* 액션 버튼: 12H / 24H 모드, 일과표 팝업(PiP), 환경설정 */}
        <div className="flex items-center gap-2">
          {/* Always on Top 일과표 플로팅 팝업 버튼 */}
          {isSupported && (
            <button
              onClick={isPiPActive ? closePiP : requestPiP}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                isPiPActive
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
              title="화면 어디서든 항상 위에 뜨는 일과표 전용 팝업 열기"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isPiPActive ? '팝업 닫기' : '일과표 팝업'}</span>
            </button>
          )}

          <button
            onClick={() => updateSettings({ dialMode: settings.dialMode === '12h' ? '24h' : '12h' })}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 flex items-center gap-1.5 transition-colors shadow-sm"
            title="12시간 주간/야간 모드 / 24시간 모드 전환"
          >
            {settings.dialMode === '12h'
              ? activeDayNight === 'day'
                ? '☀️ 12H 주간 모드'
                : '🌙 12H 야간 모드'
              : '🌌 24H 전체 모드'}
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-slate-100 flex items-center gap-1 transition-colors shadow-sm"
            title="환경설정 열기 (단축키 F1)"
          >
            <Settings className="w-4 h-4" />
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
            {settings.calendarSource === 'google' && (
              <button
                onClick={() => updateSettings({ calendarSource: 'local' })}
                className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
                title="클릭 시 자체 일과표 보기로 전환"
              >
                구글 캘린더 모드 (자체 일과 보기 전환)
              </button>
            )}
            {blocks.length === 0 && (
              <button
                onClick={() => resetToDefaultPresets()}
                className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 flex items-center gap-1 transition-colors"
                title="기본 일과표(수면, 딥워크, 식사 등)를 복원합니다"
              >
                <RotateCcw className="w-3 h-3" /> 기본 일과 복원
              </button>
            )}
          </div>
        </div>

        {/* 12시간 모드일 때 낮/밤 선택 아이콘 컨트롤러 (SDD 010) */}
        {settings.dialMode === '12h' && (
          <div className="flex items-center gap-1.5 mb-2 bg-slate-900/80 border border-slate-700/80 p-1 rounded-full shadow-lg">
            <button
              onClick={() => setManualDayNight('day')}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeDayNight === 'day'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="낮 일과표 보기"
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>낮 ({settings.twelveHourStart ?? 8}~{((settings.twelveHourStart ?? 8) + 12) % 24}시)</span>
            </button>
            <button
              onClick={() => setManualDayNight('night')}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeDayNight === 'night'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="밤 일과표 보기 (없을 시 빈값)"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>밤 ({((settings.twelveHourStart ?? 8) + 12) % 24}~{settings.twelveHourStart ?? 8}시)</span>
            </button>
            {manualDayNight !== null && (
              <button
                onClick={() => setManualDayNight(null)}
                className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-slate-200 transition-colors ml-0.5"
                title="현재 시각 기준 자동 전환으로 복귀"
              >
                자동
              </button>
            )}
          </div>
        )}

        {/* 24시간 / 12시간 원형 다이얼 차트 (반응형 규격) */}
        <div className="w-full max-w-[min(90vw,420px)] aspect-square flex items-center justify-center relative">
          <ClockDial
            currentTime={currentTime}
            blocks={blocks}
            className="w-full h-full max-w-full max-h-full"
            dialMode={settings.dialMode}
            twelveHourStart={settings.twelveHourStart}
            dayNightMode={activeDayNight}
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

      {/* Document PiP 플로팅 창 렌더링 (헤더/버튼 없이 일과표만 100% 렌더링) */}
      {isPiPActive &&
        pipWindow &&
        createPortal(
          <div className="w-full h-full flex items-center justify-center bg-slate-950 p-2 m-0 overflow-hidden select-none">
            <ClockDial
              currentTime={currentTime}
              blocks={blocks}
              className="w-full h-full max-w-full max-h-full"
              showHourNumbers={true}
              dialMode={settings.dialMode}
              twelveHourStart={settings.twelveHourStart}
              dayNightMode={activeDayNight}
            />
          </div>,
          pipWindow.document.body
        )}
    </div>
  );
};
export default App;
