import { motion } from "framer-motion";
import type { ConfidenceGaugeProps } from '@/types';

export function ConfidenceGauge({ value, size = 120, variant = "bull" }: ConfidenceGaugeProps) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = Math.PI * r; // semi-circle
  const dash = circumference * Math.min(Math.max(value, 0), 1);
  const colorVar = `var(--${variant})`;
  const pct = Math.round(value * 100);

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size, height: size / 2 + 24 }}>
      <svg width={size} height={size / 2 + stroke / 2} viewBox={`0 0 ${size} ${size / 2 + stroke / 2}`}>
        <defs>
          <linearGradient id={`grad-${variant}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={colorVar} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colorVar} stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d={`M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Arc */}
        <motion.path
          d={`M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          fill="none"
          stroke={`url(#grad-${variant})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${colorVar})` }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="font-mono text-2xl font-bold tabular-nums" style={{ color: colorVar }}>
          {pct}%
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Confidence</span>
      </div>
    </div>
  );
}