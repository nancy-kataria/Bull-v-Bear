import { Scale, Gavel } from 'lucide-react';
import BullBearPodium from '@/components/analysis-room/BullBearPodium';
import DisplayVerdictCard from '@/components/DisplayVerdictCard';
import type { Phase, VerdictData } from '@/types';

interface AnalysisPanelProps {
  phase: Phase;
  showBull: boolean;
  showBear: boolean;
  verdict: VerdictData | null;
}



export function AnalysisPanel({ phase, showBull, showBear, verdict }: AnalysisPanelProps) {
  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto min-h-0">
      {phase === 'idle' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-20">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-navy-800 border border-neutral-border">
            <Scale size={28} className="text-neutral-muted" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-white">The Bull v. Bear Analysis Room</h3>
          <p className="text-sm text-neutral-muted max-w-sm leading-relaxed">
            Enter an investment question to convene the jury. Bull and Bear analysts will deliberate, and the Judge will deliver a verdict.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-4 w-full max-w-md text-xs">
            {[
              { label: 'Bull Analyst', color: 'text-bull', border: 'border-bull/20', bg: 'bg-bull-dim/10' },
              { label: 'Judge', color: 'text-amber-verdict', border: 'border-amber-verdict/20', bg: 'bg-amber-dim/10' },
              { label: 'Bear Analyst', color: 'text-bear', border: 'border-bear/20', bg: 'bg-bear-dim/10' },
            ].map(({ label, color, border, bg }) => (
              <div key={label} className={`py-3 rounded-xl border ${border} ${bg} font-mono font-medium ${color} text-center`}>
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {(phase === 'deliberating' || phase === 'verdict') && (
        <div className="grid md:grid-cols-2 gap-5">
          {showBull && (
            <div className="animate-slide-up">
              <BullBearPodium
                side="bull"
                arguments={phase === 'verdict' && verdict ? verdict.bullArguments : []}
                streaming={phase === 'deliberating'}
              />
            </div>
          )}
          {showBear && (
            <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <BullBearPodium
                side="bear"
                arguments={phase === 'verdict' && verdict ? verdict.bearArguments : []}
                streaming={phase === 'deliberating'}
              />
            </div>
          )}
        </div>
      )}

      {verdict && phase === 'verdict' && (
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2 mb-3">
            <Gavel size={14} className="text-amber-verdict" />
            <span className="text-xs font-mono font-semibold text-amber-verdict tracking-widest uppercase">Judge&apos;s Bench</span>
          </div>
          <DisplayVerdictCard data={verdict} animate={false} />
        </div>
      )}
    </div>
  );
}
