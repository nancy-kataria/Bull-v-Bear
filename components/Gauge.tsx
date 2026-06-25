import { useEffect, useRef, useState } from 'react';
import type { VerdictType } from '@/types';

interface GaugeProps {
  confidence: number;
  verdict: VerdictType;
  size?: number;
}

const verdictColor: Record<VerdictType, string> = {
  BUY: '#10B981',
  SELL: '#EF4444',
  HOLD: '#FFBF00',
};

export default function Gauge({ confidence, verdict, size = 160 }: GaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1400;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setAnimatedValue(easeOut(progress) * confidence);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [confidence]);

  const cx = size / 2;
  const cy = size / 2 + 8;
  const r = (size / 2) * 0.76;
  const strokeWidth = size * 0.072;
  const startAngle = -210;
  const totalArc = 240;

  const polarToXY = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (startDeg: number, endDeg: number) => {
    const start = polarToXY(startDeg);
    const end = polarToXY(endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const filledEndDeg = startAngle + totalArc * animatedValue;
  const color = verdictColor[verdict];
  const isHigh = confidence >= 0.8;
  const isLow = confidence <= 0.4;
  const pct = Math.round(animatedValue * 100);

  const needleAngle = startAngle + totalArc * animatedValue;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLen = r * 0.72;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`} className="overflow-visible">
        <defs>
          <filter id="glow-gauge">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={describeArc(startAngle, startAngle + totalArc)}
          fill="none"
          stroke="#1F2937"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      
        {Array.from({ length: 11 }).map((_, i) => {
          const tickDeg = startAngle + (totalArc / 10) * i;
          const tickRad = (tickDeg * Math.PI) / 180;
          const inner = r - strokeWidth / 2 - 4;
          const outer = r - strokeWidth / 2 - 10;
          return (
            <line
              key={i}
              x1={cx + inner * Math.cos(tickRad)}
              y1={cy + inner * Math.sin(tickRad)}
              x2={cx + outer * Math.cos(tickRad)}
              y2={cy + outer * Math.sin(tickRad)}
              stroke="#374151"
              strokeWidth={1}
            />
          );
        })}

        {animatedValue > 0.01 && (
          <path
            d={describeArc(startAngle, filledEndDeg)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter={isHigh ? 'url(#glow-gauge)' : undefined}
            opacity={isLow ? 0.5 : 1}
          />
        )}

        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          className={isLow ? 'origin-center' : ''}
          style={isLow ? { animation: 'needleShake 0.5s ease-in-out infinite', transformOrigin: `${cx}px ${cy}px` } : {}}
        />
        <circle cx={cx} cy={cy} r={strokeWidth * 0.4} fill={color} />

        <text
          x={cx}
          y={cy - r * 0.15}
          textAnchor="middle"
          fill={color}
          fontSize={size * 0.18}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="700"
          filter={isHigh ? 'url(#glow-gauge)' : undefined}
        >
          {pct}%
        </text>
        <text
          x={cx}
          y={cy + r * 0.12}
          textAnchor="middle"
          fill="#6B7280"
          fontSize={size * 0.075}
          fontFamily="Inter, sans-serif"
          fontWeight="500"
          letterSpacing="0.08em"
        >
          CONFIDENCE
        </text>
      </svg>
    </div>
  );
}
