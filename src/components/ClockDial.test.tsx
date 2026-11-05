import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ClockDial } from './ClockDial';
import type { RoutineBlock } from '../core/dial';

describe('<ClockDial /> Component - Taste as Code Invariants & SDD 005 & SDD 007', () => {
  const dummyBlocks: RoutineBlock[] = [
    {
      id: '1',
      title: '집중 업무',
      startHour: 9,
      startMinute: 0,
      endHour: 18,
      endMinute: 0,
      color: '#3b82f6',
    },
  ];

  it('시침(indicator-needle)은 화면에 정확히 1개만 렌더링되어야 한다', () => {
    render(<ClockDial currentTime={new Date(2026, 10, 5, 14, 30, 15)} blocks={dummyBlocks} />);
    
    const needle = screen.getAllByTestId('clock-indicator-needle');
    expect(needle).toHaveLength(1);
  });

  it('초침 또는 분침은 일절 렌더링되지 않아야 한다', () => {
    render(<ClockDial currentTime={new Date(2026, 10, 5, 14, 30, 15)} blocks={dummyBlocks} />);
    
    expect(screen.queryByTestId('minute-hand')).toBeNull();
    expect(screen.queryByTestId('second-hand')).toBeNull();
  });

  it('24시간 모드에서는 24개 시간 눈금이 렌더링되어야 한다', () => {
    render(<ClockDial currentTime={new Date(2026, 10, 5, 14, 30, 15)} blocks={dummyBlocks} dialMode="24h" />);
    
    const markers = screen.getAllByTestId('hour-marker');
    expect(markers).toHaveLength(24);
  });

  it('12시간 모드에서는 12개 시간 눈금이 렌더링되어야 한다 (SDD 004)', () => {
    render(<ClockDial currentTime={new Date(2026, 10, 5, 14, 30, 15)} blocks={dummyBlocks} dialMode="12h" />);
    
    const markers = screen.getAllByTestId('hour-marker');
    expect(markers).toHaveLength(12);
  });

  it('원의 중심에 디지털 시간(HH:mm ss)이 표시되어야 한다', () => {
    render(<ClockDial currentTime={new Date(2026, 10, 5, 19, 10, 17)} blocks={dummyBlocks} />);
    
    const centerClock = screen.getByTestId('center-digital-clock');
    expect(centerClock).toBeInTheDocument();
    expect(centerClock.textContent).toContain('19:10');
    expect(centerClock.textContent).toContain('17');
  });

  it('원의 칸(호) 내부에 일과 내용 라벨("집중 업무")이 표시되어야 한다', () => {
    render(<ClockDial currentTime={new Date(2026, 10, 5, 14, 30, 15)} blocks={dummyBlocks} />);
    
    const label = screen.getByText('집중 업무');
    expect(label).toBeInTheDocument();
  });

  it('일과 칸(호)에 마우스를 올리면 중앙에 큼직한 일과 상세 정보가 표시되어야 한다 (SDD 005)', () => {
    render(<ClockDial currentTime={new Date(2026, 10, 5, 14, 30, 15)} blocks={dummyBlocks} />);
    
    const arcPath = screen.getByTestId('routine-arc-0');
    expect(arcPath).toBeInTheDocument();

    // 마우스 호버 진입
    fireEvent.mouseEnter(arcPath);

    const detailCard = screen.getByTestId('hovered-block-detail');
    expect(detailCard).toBeInTheDocument();
    expect(detailCard.textContent).toContain('집중 업무');
    expect(detailCard.textContent).toContain('09:00');
    expect(detailCard.textContent).toContain('18:00');

    // 마우스 벗어남
    fireEvent.mouseLeave(arcPath);
    expect(screen.queryByTestId('hovered-block-detail')).toBeNull();
    expect(screen.getByTestId('center-digital-clock')).toBeInTheDocument();
  });

  it('일과 칸(호)을 클릭/터치하면 상세 정보가 토글되어야 한다 (SDD 009 모바일 터치)', () => {
    render(<ClockDial currentTime={new Date(2026, 10, 5, 14, 30, 15)} blocks={dummyBlocks} />);
    
    const arcPath = screen.getByTestId('routine-arc-0');

    // 1회 클릭 -> 상세 카드 표시
    fireEvent.click(arcPath);
    expect(screen.getByTestId('hovered-block-detail')).toBeInTheDocument();
    expect(screen.getByTestId('hovered-block-detail').textContent).toContain('집중 업무');

    // 동일 호 2회 클릭 -> 상세 해제되고 시계 복귀
    fireEvent.click(arcPath);
    expect(screen.queryByTestId('hovered-block-detail')).toBeNull();
    expect(screen.getByTestId('center-digital-clock')).toBeInTheDocument();
  });

  it('일과 시작 5초 전부터 중앙에 카운트다운이 표시되어야 한다 (SDD 007)', () => {
    // 09:00:00 시작 4초 전인 08:59:56
    render(<ClockDial currentTime={new Date(2026, 10, 5, 8, 59, 56)} blocks={dummyBlocks} />);
    
    const countdown = screen.getByTestId('transition-countdown');
    expect(countdown).toBeInTheDocument();
    expect(countdown.textContent).toContain('4');
    expect(countdown.textContent).toContain('집중 업무');
  });
});
