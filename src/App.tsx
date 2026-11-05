import React, { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useClockStore } from './store/useClockStore';
import { ClockDial } from './components/ClockDial';
import { SettingsModal } from './components/SettingsModal';
import { useDocumentPiP } from './hooks/useDocumentPiP';
import {
  ExternalLink,
  Settings as SettingsIcon,
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

  // F1 단축키 콜백 등록을 포함한 Document PiP 훅
  const { isSupported, isPiPActive, pipWindow, requestPiP, closePiP } = useDocumentPiP({
    width: 340,
    height: 340,
    onF1Press: () => {
      setIsSettingsOpen(true);
    },
  });

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
            <h1 className="font-bold text-base tracking-wide text-slate-100 flex items-center gap-1.5">
              DailyClock
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                PiP Ready
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">24시간 원형 일과표 & 시침</p>
          </div>
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="flex items-center gap-2">
          {/* 12H / 24H 모드 빠른 토글 버튼 */}
          <button
            onClick={() => updateSettings({ dialMode: settings.dialMode === '12h' ? '24h' : '12h' })}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 flex items-center gap-1 transition-colors"
            title="12시간 주간 모드 / 24시간 모드 전환"
          >
            {settings.dialMode === '12h' ? '☀️ 12H 주간 모드' : '🌙 24H 전체 모드'}
          </button>

          {/* Always on Top 플로팅 버튼 */}
          <button
            onClick={isPiPActive ? closePiP : requestPiP}
            disabled={!isSupported}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              isPiPActive
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={isSupported ? '화면 최상단 플로팅 윈도우 열기' : '이 브라우저는 Document PiP를 지원하지 않습니다'}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {isPiPActive ? '플로팅 창 닫기' : '최상단 플로팅 뷰'}
          </button>

          {/* 환경설정 버튼 (F1) */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
            환경설정 <kbd className="text-[10px] bg-slate-900 px-1 py-0.5 rounded text-slate-400">F1</kbd>
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

        {/* 24시간 / 12시간 원형 다이얼 차트 */}
        <div className="relative">
          <ClockDial
            currentTime={currentTime}
            blocks={blocks}
            size={380}
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

      {/* 하단 단축키 가이드 */}
      <footer className="text-center text-xs text-slate-500 py-1">
        단축키 <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-slate-400">F1</kbd> 환경설정
        &nbsp;|&nbsp; 24시간 단일 시침 인디케이터 &nbsp;|&nbsp; Chromium Document PiP 지원
      </footer>

      {/* 환경설정 모달 */}
      <SettingsModal />

      {/* Document PiP 플로팅 창 렌더링 (헤더/버튼 없이 시계만 100% 렌더링) */}
      {isPiPActive &&
        pipWindow &&
        createPortal(
          <div className="w-full h-full flex items-center justify-center bg-slate-950 p-0 m-0 overflow-hidden">
            <ClockDial
              currentTime={currentTime}
              blocks={blocks}
              size={320}
              showHourNumbers={true}
              dialMode={settings.dialMode}
              twelveHourStart={settings.twelveHourStart}
            />
          </div>,
          pipWindow.document.body
        )}
    </div>
  );
};
export default App;
