import { Check, Loader2 } from 'lucide-react';
import type { ProcessingStepsProps } from '@/types';

export default function ProcessingSteps({ steps }: ProcessingStepsProps) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div
          key={step.id}
          className={`
            flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all duration-300
            ${step.status === 'done'
              ? 'bg-bull-dim/20 border-bull/30 text-bull'
              : step.status === 'running'
              ? 'bg-electric-dim/20 border-electric/40 text-electric'
              : 'bg-navy-800 border-neutral-border text-neutral-muted'
            }
          `}
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="w-4 h-4 shrink-0 flex items-center justify-center">
            {step.status === 'done' && <Check size={14} />}
            {step.status === 'running' && <Loader2 size={14} className="animate-spin" />}
            {step.status === 'pending' && (
              <div className="w-3 h-3 rounded-full border border-current opacity-30" />
            )}
          </div>
          <span className="text-sm font-mono">
            {step.status === 'done' ? '[✓] ' : step.status === 'running' ? '[ ] ' : '[ ] '}
            {step.label}
          </span>
          {step.status === 'running' && (
            <span className="flex gap-1 ml-auto">
              <span className="stream-dot text-electric" />
              <span className="stream-dot text-electric" />
              <span className="stream-dot text-electric" />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
