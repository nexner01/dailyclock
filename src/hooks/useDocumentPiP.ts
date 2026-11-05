import { useState, useCallback, useEffect, useRef } from 'react';

interface UseDocumentPiPOptions {
  width?: number;
  height?: number;
  onF1Press?: () => void;
}

export function useDocumentPiP(options: UseDocumentPiPOptions = {}) {
  const { width = 340, height = 340, onF1Press } = options;
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const isSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;
  const onF1PressRef = useRef(onF1Press);
  onF1PressRef.current = onF1Press;

  // 플로팅 창 열기
  const requestPiP = useCallback(async () => {
    if (!isSupported) {
      alert(
        '현재 브라우저에서는 Document Picture-in-Picture(항상 최상단 플로팅) 기능이 지원되지 않습니다.\nChrome 또는 Edge 최신 버전을 권장합니다.'
      );
      return null;
    }

    try {
      // 기존 창이 있으면 포커스
      if (pipWindow) {
        pipWindow.focus();
        return pipWindow;
      }

      // @ts-expect-error - Document PiP API는 W3C 표준 초안
      const win = await window.documentPictureInPicture.requestWindow({
        width,
        height,
      });

      // 1. 메인 창의 모든 CSS 스타일시트 복제
      const allStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
      allStyles.forEach((el) => {
        win.document.head.appendChild(el.cloneNode(true));
      });

      // 2. 윈도우 스타일 (배경 다크, 스크롤바 제거)
      win.document.body.className = 'bg-slate-950 text-slate-100 flex items-center justify-center m-0 p-0 overflow-hidden select-none h-screen w-screen';
      win.document.title = 'DailyClock';

      // 3. F1 단축키 리스너 등록
      win.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'F1') {
          e.preventDefault();
          window.focus(); // 메인 창으로 포커스
          if (onF1PressRef.current) {
            onF1PressRef.current();
          }
        }
      });

      // 4. 창 닫힘 핸들러
      win.addEventListener('pagehide', () => {
        setPipWindow(null);
      });

      setPipWindow(win);
      return win;
    } catch (err) {
      console.error('Failed to open Document PiP window:', err);
      return null;
    }
  }, [isSupported, pipWindow, width, height]);

  // 플로팅 창 닫기
  const closePiP = useCallback(() => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
    }
  }, [pipWindow]);

  // 컴포넌트 언마운트 시 창 정리
  useEffect(() => {
    return () => {
      if (pipWindow) {
        pipWindow.close();
      }
    };
  }, [pipWindow]);

  return {
    isSupported,
    isPiPActive: !!pipWindow,
    pipWindow,
    requestPiP,
    closePiP,
  };
}

