import React, { useMemo, useState } from 'react';
import {
  calculateNeedleAngle,
  calculate12hNeedleAngle,
  convertBlockToArcs,
  convertBlockTo12hArcs,
  checkUpcomingTransition,
  type RoutineBlock,
  type ArcSegment,
} from '../core/dial';

interface ClockDialProps {
  currentTime: Date;
  blocks?: RoutineBlock[];
  size?: number; // 기본 400
  showHourNumbers?: boolean;
  dialMode?: '24h' | '12h'; // 기본 '12h'
  twelveHourStart?: number;  // 12시간 모드 주간 시작 시각 (기본 8)
}

/**
 * 원형 다이얼 SVG 컴포넌트
 * - 피드백 반영: 화살촉을 중앙 원(r=90)부터 일과 칸(r=114)까지 30px 길이로 시원하게 길게 뻗은
 *   '롱 쉐브론 화살표(Long Arrow Dart)'로 업그레이드하여 압도적인 시인성과 세련미 제공
 */
export const ClockDial: React.FC<ClockDialProps> = ({
  currentTime,
  blocks = [],
  size = 400,
  showHourNumbers = true,
  dialMode = '12h',
  twelveHourStart = 8,
}) => {
  const center = 200;
  const outerRadius = 162;
  const innerRadius = 114;
  const centerCoreRadius = 90;
  const labelRadius = 138;
  const dialRadius = 178;

  const is12h = dialMode === '12h';

  // 마우스 호버된 일과 호(Arc) 상태 (SDD 005)
  const [hoveredArc, setHoveredArc] = useState<ArcSegment | null>(null);

  // 일과 전환 5초 전 카운트다운 감지 (SDD 007)
  const transitionInfo = useMemo(() => {
    return checkUpcomingTransition(currentTime, blocks);
  }, [currentTime, blocks]);

  // 시침 각도 계산
  const needleAngle = useMemo(() => {
    const time = {
      hours: currentTime.getHours(),
      minutes: currentTime.getMinutes(),
      seconds: currentTime.getSeconds(),
    };
    return is12h ? calculate12hNeedleAngle(time) : calculateNeedleAngle(time);
  }, [currentTime, is12h]);

  // 12시간 모드 주간 범위(startHour ~ startHour+12) 내 여부 판별
  const isIn12hRange = useMemo(() => {
    if (!is12h) return true;
    const currentMin = currentTime.getHours() * 60 + currentTime.getMinutes();
    const startMin = twelveHourStart * 60;
    const endMin = (twelveHourStart + 12) * 60;

    if (endMin <= 24 * 60) {
      return currentMin >= startMin && currentMin < endMin;
    } else {
      return currentMin >= startMin || currentMin < (endMin % (24 * 60));
    }
  }, [currentTime, is12h, twelveHourStart]);

  // 디지털 시간 포맷팅
  const hoursStr = currentTime.getHours().toString().padStart(2, '0');
  const minutesStr = currentTime.getMinutes().toString().padStart(2, '0');
  const secondsStr = currentTime.getSeconds().toString().padStart(2, '0');
  const dateStr = `${(currentTime.getMonth() + 1).toString().padStart(2, '0')}.${currentTime.getDate().toString().padStart(2, '0')}`;
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dayStr = dayNames[currentTime.getDay()];

  // 일과 블록들을 ArcSegment 목록으로 변환
  const arcSegments = useMemo(() => {
    if (is12h) {
      return blocks.flatMap((block) => convertBlockTo12hArcs(block, twelveHourStart));
    }
    return blocks.flatMap((block) => convertBlockToArcs(block));
  }, [blocks, is12h, twelveHourStart]);

  // 각도 -> SVG 좌표 변환 (0도는 상단 -90도 회전)
  const polarToCartesian = (radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: center + radius * Math.cos(angleInRadians),
      y: center + radius * Math.sin(angleInRadians),
    };
  };

  // 도넛 호 SVG Path 생성
  const describeArc = (startAngle: number, endAngle: number, rIn: number, rOut: number) => {
    const sweep = endAngle - startAngle;
    if (sweep <= 0) return '';

    const effectiveEnd = sweep >= 360 ? startAngle + 359.999 : endAngle;
    const largeArcFlag = sweep > 180 ? 1 : 0;

    const startOuter = polarToCartesian(rOut, startAngle);
    const endOuter = polarToCartesian(rOut, effectiveEnd);
    const endInner = polarToCartesian(rIn, effectiveEnd);
    const startInner = polarToCartesian(rIn, startAngle);

    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${rOut} ${rOut} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
      `L ${endInner.x} ${endInner.y}`,
      `A ${rIn} ${rIn} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
      'Z',
    ].join(' ');
  };

  const totalHourMarks = is12h ? 12 : 24;
  const degreesPerMark = 360 / totalHourMarks;

  return (
    <div className={`relative flex items-center justify-center p-2 select-none transition-all duration-300 ${transitionInfo ? 'scale-105' : ''}`}>
      <svg
        viewBox="0 0 400 400"
        width={size}
        height={size}
        className="drop-shadow-2xl transition-all duration-300"
      >
        <defs>
          {/* 다이얼 배경 그라데이션 */}
          <radialGradient id="dialBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="65%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          {/* 중앙 코어 그라데이션 */}
          <radialGradient id="centerCore" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#090d16" />
          </radialGradient>

          {/* 롱 화살표 골든 네온 그라데이션 */}
          <linearGradient id="longArrowGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fffbeb" />
          </linearGradient>

          {/* 화살표 네온 글로우 필터 */}
          <filter id="arrowGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#f59e0b" floodOpacity="0.9" />
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.85" />
          </filter>

          {/* 일과 전환 5초 전 다이얼 전체 네온 펄스 글로우 필터 */}
          <filter id="transitionPulseGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#f59e0b" floodOpacity="0.95" />
            <feDropShadow dx="0" dy="0" stdDeviation="16" floodColor="#d97706" floodOpacity="0.6" />
          </filter>

          {/* 호버된 호 돌출 글로우 필터 */}
          <filter id="arcHoverGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ffffff" floodOpacity="0.7" />
          </filter>
        </defs>

        {/* 바깥 테두리 및 메인 다이얼 베이스 */}
        <circle
          cx={center}
          cy={center}
          r={dialRadius}
          fill="url(#dialBg)"
          stroke={transitionInfo ? '#f59e0b' : '#334155'}
          strokeWidth={transitionInfo ? '4' : '3'}
          filter={transitionInfo ? 'url(#transitionPulseGlow)' : undefined}
          className="transition-all duration-300"
        />

        {/* 루틴 호(Arc) 영역 배경 트랙 */}
        <path
          d={describeArc(0, 359.999, innerRadius, outerRadius)}
          fill="#1e293b"
          opacity="0.35"
        />

        {/* 1. 일과 블록 호(Arc) 렌더링 */}
        {arcSegments.map((arc, index) => {
          const isHovered = hoveredArc === arc;
          const currentROut = isHovered ? outerRadius + 10 : outerRadius;

          return (
            <path
              key={`arc-${index}-${arc.startAngle}-${arc.endAngle}`}
              data-testid={`routine-arc-${index}`}
              d={describeArc(arc.startAngle, arc.endAngle, innerRadius, currentROut)}
              fill={arc.color}
              stroke={isHovered ? '#ffffff' : '#090d16'}
              strokeWidth={isHovered ? 2.5 : 1.5}
              filter={isHovered ? 'url(#arcHoverGlow)' : undefined}
              className="transition-all duration-200 cursor-pointer"
              style={{
                opacity: hoveredArc ? (isHovered ? 1 : 0.45) : 1,
              }}
              onMouseEnter={() => setHoveredArc(arc)}
              onMouseLeave={() => setHoveredArc(null)}
            />
          );
        })}

        {/* 2. 일과 칸 내부 텍스트 라벨 (가독성 보정) */}
        {arcSegments.map((arc, index) => {
          const sweep = arc.endAngle - arc.startAngle;
          if (sweep < 10 || !arc.title) return null;

          const isHovered = hoveredArc === arc;
          const currentLabelR = isHovered ? labelRadius + 4 : labelRadius;
          const midAngle = (arc.startAngle + arc.endAngle) / 2;
          const pos = polarToCartesian(currentLabelR, midAngle);

          let rot = midAngle;
          if (rot > 90 && rot < 270) {
            rot = (rot + 180) % 360;
          }

          const maxLength = Math.max(3, Math.floor(sweep / 6));
          const displayTitle =
            arc.title.length > maxLength ? `${arc.title.slice(0, maxLength)}..` : arc.title;

          return (
            <text
              key={`label-${index}-${arc.startAngle}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(${rot}, ${pos.x}, ${pos.y})`}
              className={`fill-white font-sans font-extrabold select-none pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] transition-all duration-200 ${
                isHovered ? 'text-[13px]' : 'text-[11px]'
              }`}
            >
              {displayTitle}
            </text>
          );
        })}

        {/* 3. 시간 눈금 및 숫자 라벨 */}
        {Array.from({ length: totalHourMarks }).map((_, i) => {
          const angle = i * degreesPerMark;
          const isMajor = is12h ? i % 3 === 0 : i % 3 === 0;
          const markerInner = isMajor ? 168 : 172;
          const pStart = polarToCartesian(markerInner, angle);
          const pEnd = polarToCartesian(176, angle);
          const textPos = polarToCartesian(154, angle);

          let labelText = '';
          if (is12h) {
            labelText = i === 0 ? '12' : i.toString();
          } else {
            labelText = i.toString().padStart(2, '0');
          }

          return (
            <g key={`hour-${i}`} data-testid="hour-marker">
              <line
                x1={pStart.x}
                y1={pStart.y}
                x2={pEnd.x}
                y2={pEnd.y}
                stroke={isMajor ? '#94a3b8' : '#475569'}
                strokeWidth={isMajor ? 2.5 : 1.2}
                strokeLinecap="round"
              />
              {showHourNumbers && (is12h || isMajor) && (
                <text
                  x={textPos.x}
                  y={textPos.y + 3.5}
                  textAnchor="middle"
                  className="fill-slate-400 font-mono text-[9px] font-semibold select-none pointer-events-none"
                >
                  {labelText}
                </text>
              )}
            </g>
          );
        })}

        {/* 4. 원의 중심부 (Center Core): 디지털 시계 및 상태 라벨 */}
        <circle
          cx={center}
          cy={center}
          r={centerCoreRadius}
          fill="url(#centerCore)"
          stroke={transitionInfo ? '#f59e0b' : '#334155'}
          strokeWidth={transitionInfo ? '3' : '2'}
          className="drop-shadow-lg transition-all duration-300"
        />

        {/* 5. [사용자 제안 반영] 길쭉하고 시원하게 뻗은 롱 화살표 (Long Arrow Dart) */}
        {/* 중앙 원 테두리(r=90)에서부터 일과 칸(r=114)을 향해 30px 길이로 날렵하게 뻗어나감 */}
        <g
          data-testid="clock-indicator-needle"
          transform={`rotate(${needleAngle}, ${center}, ${center})`}
          filter="url(#arrowGlow)"
          className={`transition-transform duration-300 ease-out pointer-events-none ${
            is12h && !isIn12hRange ? 'opacity-40' : 'opacity-100'
          }`}
        >
          {/* 길쭉한 화살촉 몸체 (Long Arrow Body: 끝점 y=82 ~ 밑변 y=112) */}
          <polygon
            points={`
              ${center},${center - innerRadius - 4}
              ${center + 7.5},${center - centerCoreRadius + 2}
              ${center},${center - centerCoreRadius - 6}
              ${center - 7.5},${center - centerCoreRadius + 2}
            `}
            fill="url(#longArrowGradient)"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* 화살표 중심 입체 척추선 (Center Spine Line) */}
          <line
            x1={center}
            y1={center - centerCoreRadius - 4}
            x2={center}
            y2={center - innerRadius - 2}
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.9"
          />
        </g>

        {/* 6. 중앙 영역 내용: 카운트다운 vs 호버 상세 vs 기본 디지털 시계 */}
        {transitionInfo ? (
          <g data-testid="transition-countdown" className="pointer-events-none select-none">
            <circle cx={center - 38} cy={center - 28} r="3.5" fill={transitionInfo.nextBlockColor} />
            <text
              x={center + 4}
              y={center - 26}
              textAnchor="middle"
              className="fill-amber-300 font-sans text-[11px] font-bold tracking-wider"
            >
              다음 일과 준비
            </text>

            <text
              x={center}
              y={center + 12}
              textAnchor="middle"
              className="fill-amber-400 font-mono text-[46px] font-black tracking-tight drop-shadow-[0_2px_10px_rgba(245,158,11,0.8)]"
            >
              {transitionInfo.remainingSeconds}
            </text>

            <text
              x={center}
              y={center + 34}
              textAnchor="middle"
              className="fill-white font-sans text-[12px] font-extrabold tracking-wide drop-shadow"
            >
              [{transitionInfo.nextBlockTitle}] 시작
            </text>
          </g>
        ) : hoveredArc ? (
          <g data-testid="hovered-block-detail" className="pointer-events-none select-none animate-in fade-in zoom-in-95 duration-150">
            <circle cx={center - 32} cy={center - 28} r="3.5" fill={hoveredArc.color} />
            <text
              x={center}
              y={center - 26}
              textAnchor="middle"
              className="fill-indigo-300 font-sans text-[10px] font-semibold tracking-wider uppercase"
            >
              선택된 일과 상세
            </text>

            <text
              x={center}
              y={center + 2}
              textAnchor="middle"
              className="fill-white font-sans text-[17px] sm:text-[18px] font-black tracking-tight drop-shadow-md"
            >
              {hoveredArc.title || '(제목 없음)'}
            </text>

            <text
              x={center}
              y={center + 26}
              textAnchor="middle"
              className="fill-amber-300 font-mono text-[12px] font-bold"
            >
              {hoveredArc.startHour.toString().padStart(2, '0')}:
              {hoveredArc.startMinute.toString().padStart(2, '0')} ~{' '}
              {hoveredArc.endHour.toString().padStart(2, '0')}:
              {hoveredArc.endMinute.toString().padStart(2, '0')}
            </text>

            <text
              x={center}
              y={center + 42}
              textAnchor="middle"
              className="fill-slate-400 font-sans text-[9px] font-medium"
            >
              {(() => {
                const totalM =
                  (hoveredArc.endHour * 60 + hoveredArc.endMinute) -
                  (hoveredArc.startHour * 60 + hoveredArc.startMinute);
                const positiveM = totalM > 0 ? totalM : totalM + 24 * 60;
                const h = Math.floor(positiveM / 60);
                const m = positiveM % 60;
                return `총 ${h > 0 ? `${h}시간 ` : ''}${m > 0 ? `${m}분` : ''}`;
              })()}
            </text>
          </g>
        ) : (
          <g data-testid="center-digital-clock" className="pointer-events-none select-none">
            <text
              x={center}
              y={center - 28}
              textAnchor="middle"
              className="fill-indigo-400 font-mono text-[11px] font-semibold tracking-wider"
            >
              {dateStr} {dayStr}
            </text>

            <text
              x={center - 14}
              y={center + 8}
              textAnchor="middle"
              className="fill-slate-100 font-mono text-[36px] font-black tracking-tight drop-shadow-md"
            >
              {hoursStr}:{minutesStr}
            </text>
            <text
              x={center + 42}
              y={center + 8}
              textAnchor="start"
              className="fill-amber-400 font-mono text-[18px] font-bold"
            >
              {secondsStr}
            </text>

            <text
              x={center}
              y={center + 34}
              textAnchor="middle"
              className="fill-slate-400 font-sans text-[11px] font-medium tracking-wide"
            >
              {is12h
                ? `(${twelveHourStart}시~${(twelveHourStart + 12) % 24}시)`
                : '(0시~24시)'}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
