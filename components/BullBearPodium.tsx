import { ChevronRight } from 'lucide-react';
import type { BullBearPodiumProps } from '@/types';

export default function BullBearPodium({ side, arguments: args, streaming = false }: BullBearPodiumProps) {
  const isBull = side === 'bull';
  const color = isBull ? 'bull' : 'bear';
  const label = isBull ? 'Bull Analyst' : 'Bear Analyst';
  const tagline = isBull ? 'Constructive Case' : 'Risk Case';

  return (
    <div
      className={`
        card-base h-full flex flex-col transition-all duration-500
        ${streaming
          ? isBull
            ? 'border-bull/50 animate-[glowBull_2s_ease-in-out_infinite_alternate]'
            : 'border-bear/50 animate-[glowBear_2s_ease-in-out_infinite_alternate]'
          : ''
        }
      `}
    >
      <div
        className={`
          flex items-center gap-3 px-5 py-4 border-b border-neutral-border
          ${isBull ? 'bg-gradient-to-r from-bull-dim/40 to-transparent' : 'bg-gradient-to-r from-bear-dim/40 to-transparent'}
        `}
      >
        <div className={`w-3 h-3 rounded-full bg-${color} ${streaming ? 'animate-pulse' : ''}`} />
        <div>
          <div className={`font-mono font-bold text-sm text-${color} tracking-wide`}>{label}</div>
          <div className="text-xs text-neutral-muted font-mono">{tagline}</div>
        </div>
        {streaming && (
          <div className="ml-auto flex gap-1">
            <span className={`stream-dot text-${color}`} />
            <span className={`stream-dot text-${color}`} />
            <span className={`stream-dot text-${color}`} />
          </div>
        )}
      </div>

      <div className="flex-1 p-5 space-y-3">
        {streaming && args.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 rounded animate-shimmer bg-neutral-subtle" style={{ width: `${70 + i * 8}%` }} />
                <div className="h-3 rounded animate-shimmer bg-neutral-subtle" style={{ width: `${50 + i * 5}%` }} />
              </div>
            ))}
          </div>
        ) : (
          args.map((arg, i) => (
            <div
              key={i}
              className={`
                flex gap-2.5 p-3 rounded-lg border transition-all duration-200
                ${isBull
                  ? 'bg-bull-dim/10 border-bull/20 hover:border-bull/40 hover:bg-bull-dim/20'
                  : 'bg-bear-dim/10 border-bear/20 hover:border-bear/40 hover:bg-bear-dim/20'
                }
              `}
            >
              <ChevronRight size={14} className={`text-${color} shrink-0 mt-0.5`} />
              <div>
                <p className={`text-sm leading-snug ${arg.weight === 'strong' ? 'text-neutral-white' : arg.weight === 'moderate' ? 'text-neutral-bright' : 'text-neutral-label'}`}>
                  {arg.point}
                </p>
                {arg.riskTag && (
                  <span className={`inline-block mt-1.5 text-xs font-mono px-2 py-0.5 rounded-full border ${isBull ? 'text-bull border-bull/30 bg-bull-dim/30' : 'text-bear border-bear/30 bg-bear-dim/30'}`}>
                    {arg.riskTag}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
