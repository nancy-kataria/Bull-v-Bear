import { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronRight, FileText, Globe, StickyNote } from 'lucide-react';
import type { DisplayVerdictCardProps, VerdictType } from '@/types';
import Gauge from '@/components/Gauge';
import RiskPill from '@/components/RiskPill';

const verdictConfig: Record<VerdictType, { label: string; bg: string; border: string; text: string; glow: string; ambient: string }> = {
  BUY: {
    label: 'BUY',
    bg: 'bg-bull-dim',
    border: 'border-bull',
    text: 'text-bull',
    glow: 'glow-bull',
    ambient: 'shadow-[0_8px_60px_rgba(16,185,129,0.25)]',
  },
  SELL: {
    label: 'SELL',
    bg: 'bg-bear-dim',
    border: 'border-bear',
    text: 'text-bear',
    glow: 'glow-bear',
    ambient: 'shadow-[0_8px_60px_rgba(239,68,68,0.25)]',
  },
  HOLD: {
    label: 'HOLD',
    bg: 'bg-amber-dim',
    border: 'border-amber-verdict',
    text: 'text-amber-verdict',
    glow: 'glow-amber',
    ambient: 'shadow-[0_8px_60px_rgba(255,191,0,0.2)]',
  },
};

const sourceIcon = (type: string) => {
  if (type === 'filing') return <FileText size={12} />;
  if (type === 'note') return <StickyNote size={12} />;
  return <Globe size={12} />;
};

export default function DisplayVerdictCard({ data, animate = false }: DisplayVerdictCardProps) {
  const [hoveredRisk, setHoveredRisk] = useState<string | null>(null);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const cfg = verdictConfig[data.verdict];
  let quoteSummary = null;

  if (data.price !== undefined && data.change !== undefined && data.changePct !== undefined) {
    const price = data.price;
    const change = data.change;
    const changePct = data.changePct;

    quoteSummary = (
      <div className="flex items-center gap-2 mt-0.5">
        <span className="font-mono font-semibold text-neutral-white">${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        <span className={`flex items-center gap-0.5 text-xs font-mono font-medium px-1.5 py-0.5 rounded ${change >= 0 ? 'bg-bull-dim text-bull' : 'bg-bear-dim text-bear'}`}>
          {change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {change >= 0 ? '+' : ''}{changePct.toFixed(2)}%
        </span>
      </div>
    );
  }

  return (
    <div
      className={`
        card-elevated overflow-hidden w-full
        ${cfg.ambient}
        ${animate ? 'animate-slide-up' : ''}
      `}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-border">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xl text-neutral-white tracking-wider">${data.ticker}</span>
              {data.companyName && <span className="text-xs font-mono text-neutral-muted">{data.companyName}</span>}
            </div>
            {quoteSummary ?? (
              <div className="mt-0.5 inline-flex items-center rounded-md border border-border bg-surface px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Live chat answer
              </div>
            )}
          </div>
        </div>
        <Gauge confidence={data.confidence} verdict={data.verdict} size={120} />
      </div>

      <div className="px-5 py-3 border-t border-neutral-border flex flex-wrap gap-2">
        <span className="text-xs text-neutral-muted font-mono mr-1 self-center">RISKS:</span>
        {data.riskTags.map(tag => (
          <RiskPill
            key={tag}
            tag={tag}
            onHover={setHoveredRisk}
            active={hoveredRisk === tag}
          />
        ))}
      </div>

      <div
        className={`
          flex items-center justify-between px-5 py-4
          ${cfg.bg} border-t ${cfg.border}
          ${cfg.glow}
        `}
      >
        <div>
          <div className="text-xs font-mono text-neutral-muted tracking-widest uppercase mb-1">Judge&apos;s Verdict</div>
          <div className={`font-mono font-black text-3xl tracking-widest ${cfg.text} ${data.verdict === 'BUY' ? 'text-glow-bull' : data.verdict === 'SELL' ? 'text-glow-bear' : 'text-glow-amber'}`}>
            {cfg.label}
          </div>
        </div>
        <div className="max-w-sm">
          <p className="text-xs text-neutral-label leading-relaxed italic">&quot;{data.summary}&quot;</p>
        </div>
      </div>

      <div className="border-t border-neutral-border">
        <button
          onClick={() => setSourcesExpanded(!sourcesExpanded)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-navy-700/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-6 h-7 bg-navy-600 border border-neutral-border rounded-sm"
                  style={{ transform: `rotate(${(i - 1) * 4}deg)`, zIndex: i }}
                />
              ))}
            </div>
            <span className="text-xs font-mono text-neutral-label tracking-wide">EVIDENCE FOLDER</span>
            <span className="text-xs font-mono text-neutral-muted">({data.sources.length} exhibits)</span>
          </div>
          <ChevronRight
            size={14}
            className={`text-neutral-muted transition-transform duration-300 ${sourcesExpanded ? 'rotate-90' : ''}`}
          />
        </button>

        {sourcesExpanded && (
          <div className="px-5 pb-4 space-y-2 animate-fade-in">
            {data.sources.map((source, i) => (
              <div
                key={source.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-navy-800 border border-neutral-border hover:border-electric/40 transition-colors"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-center w-6 h-6 rounded bg-navy-600 text-neutral-muted shrink-0 mt-0.5">
                  {sourceIcon(source.type)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-neutral-white truncate">{source.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-mono ${source.type === 'note' ? 'text-amber-verdict' : 'text-electric'}`}>{source.domain}</span>
                    <span className="text-xs text-neutral-muted">{source.date}</span>
                  </div>
                </div>
                <span className="text-xs font-mono text-neutral-muted shrink-0">EX-{String(i + 1).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
