import { motion } from "framer-motion";
import { ArrowUpRight, Gavel, TrendingUp, TrendingDown, FileText } from "lucide-react";
import { ConfidenceGauge } from "@/components/ConfidenceGauge";
import type { VerdictType } from '@/types';

interface BulletPoint {
  label: string;
  detail: string;
}

interface VerdictCardProps {
  ticker: string;
  price: string;
  change: string;
  changePositive?: boolean;
  verdict: VerdictType;
  confidence: number;
  bullPoints: BulletPoint[];
  bearPoints: BulletPoint[];
  sources?: number;
  tilt?: boolean;
}

const verdictTone: Record<VerdictType, { color: string; glow: string; bg: string; label: string }> = {
  BUY: { color: "var(--bull)", glow: "var(--glow-bull)", bg: "var(--gradient-bull)", label: "BUY" },
  SELL: { color: "var(--bear)", glow: "var(--glow-bear)", bg: "var(--gradient-bear)", label: "SELL" },
  HOLD: { color: "var(--judge)", glow: "var(--glow-judge)", bg: "var(--gradient-judge)", label: "HOLD" },
};

export function VerdictCard({
  ticker,
  price,
  change,
  changePositive = true,
  verdict,
  confidence,
  bullPoints,
  bearPoints,
  sources = 12,
  tilt = false,
}: VerdictCardProps) {
  const tone = verdictTone[verdict];

  const gaugeVariant = verdict === "BUY" ? "bull" : verdict === "SELL" ? "bear" : "judge";

  return (
    <div className={tilt ? "perspective-hero" : ""}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={
          tilt
            ? { transform: "rotateX(6deg) rotateY(-4deg)", transformStyle: "preserve-3d" }
            : undefined
        }
        className="relative w-full overflow-hidden rounded-3xl border border-border/80 bg-surface-elevated/90 shadow-[var(--shadow-elevated)] backdrop-blur-xl"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-60"
          style={{ boxShadow: tone.glow }}
        />
        <div className="relative flex items-start justify-between gap-4 border-b border-border/60 bg-surface/60 p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-system/10 ring-1 ring-system/30">
              <span className="font-mono text-sm font-bold text-system">$</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-bold tracking-tight">{ticker}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${
                    changePositive ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"
                  }`}
                >
                  {changePositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {change}
                </span>
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">{price}</div>
            </div>
          </div>
          <ConfidenceGauge value={confidence} size={110} variant={gaugeVariant} />
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-4 hidden h-[calc(100%-2rem)] -translate-x-1/2 md:block"
          >
            <div className="h-full w-px bg-gradient-to-b from-transparent via-border to-transparent" />
          </div>

          {/* Bull side */}
          <div className="gradient-bull p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-bull/20 ring-1 ring-bull/40">
                  <TrendingUp className="h-3.5 w-3.5 text-bull" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-bull">
                  The Bull
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">PROSECUTION</span>
            </div>
            <ul className="space-y-3">
              {bullPoints.map((b, i) => (
                <li key={i} className="group flex gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-bull shadow-[0_0_8px_var(--bull)]" />
                  <div>
                    <span className="font-medium text-foreground">{b.label}</span>
                    <span className="ml-1.5 text-muted-foreground">{b.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Bear side */}
          <div className="gradient-bear p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-bear/20 ring-1 ring-bear/40">
                  <TrendingDown className="h-3.5 w-3.5 text-bear" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-bear">
                  The Bear
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">DEFENSE</span>
            </div>
            <ul className="space-y-3">
              {bearPoints.map((b, i) => (
                <li key={i} className="group flex gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-bear shadow-[0_0_8px_var(--bear)]" />
                  <div>
                    <span className="font-medium text-foreground">{b.label}</span>
                    <span className="ml-1.5 text-muted-foreground">{b.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Verdict Footer */}
        <div
          className="relative flex items-center justify-between gap-4 border-t border-border/60 px-5 py-4 sm:px-6"
          style={{ background: tone.bg }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl ring-1"
              style={{ background: `color-mix(in oklab, ${tone.color} 18%, transparent)`, borderColor: tone.color }}
            >
              <Gavel className="h-5 w-5" style={{ color: tone.color }} />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Judge&apos;s Verdict
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="font-mono text-2xl font-bold tracking-tight"
                  style={{ color: tone.color, textShadow: `0 0 24px ${tone.color}` }}
                >
                  {tone.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  with <span className="font-mono text-foreground">{Math.round(confidence * 100)}%</span> confidence
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-1.5 backdrop-blur">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground">
              {sources} <span className="text-foreground/70">exhibits</span>
            </span>
            <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}