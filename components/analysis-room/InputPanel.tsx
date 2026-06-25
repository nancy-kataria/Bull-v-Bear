import { Send, Mic, Gavel } from 'lucide-react';
import ProcessingSteps from '@/components/analysis-room/ProcessingSteps';
import type { Phase, ProcessingStep } from '@/types';

const SUGGESTIONS = [
  'Should I buy $NVDA given the current AI spending cycle?',
  'Analyze $MSFT vs $GOOG for a 12-month hold position',
  'Is $QQQ overbought? Compare with my tech rotation notes.',
  'Should I take profits on $TSLA after the recent run?',
];

interface InputPanelProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  phase: Phase;
  error: string | null;
  steps: ProcessingStep[];
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onSuggestionClick: (suggestion: string) => void;
  autoResize: () => void;
  showSuggestions?: boolean;
}

export function InputPanel({
  input,
  onInputChange,
  onSubmit,
  phase,
  error,
  steps,
  textareaRef,
  onSuggestionClick,
  autoResize,
  showSuggestions = true,
}: InputPanelProps) {
  return (
    <div className="border-r border-neutral-border bg-navy-900/40 flex flex-col p-6 gap-5 overflow-y-auto min-h-0">
      <div>
        <h2 className="text-xs font-mono font-semibold text-neutral-label tracking-widest uppercase mb-1">Inquiry</h2>
        <p className="text-xs text-neutral-muted">State your investment thesis or ask a question</p>
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => { onInputChange(e.target.value); autoResize(); }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
          disabled={phase !== 'idle'}
          placeholder="Should I buy $NVDA given the current AI spending cycle?"
          className={`
            w-full bg-navy-800 border rounded-xl px-4 py-3 text-sm text-neutral-white placeholder-neutral-muted
            resize-none outline-none font-sans leading-relaxed min-h-[80px]
            transition-all duration-200
            ${phase !== 'idle' ? 'opacity-50 cursor-not-allowed border-neutral-border' : 'border-neutral-border focus:border-electric/50 focus:shadow-[0_0_0_1px_rgba(56,189,248,0.2)]'}
          `}
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSubmit}
          disabled={!input.trim() || phase !== 'idle'}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
            ${input.trim() && phase === 'idle'
              ? 'bg-electric text-navy-900 hover:bg-electric/90 shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)]'
              : 'bg-navy-700 text-neutral-muted cursor-not-allowed border border-neutral-border'
            }
          `}
        >
          <Gavel size={14} />
          Convene Jury
          <Send size={12} />
        </button>
        <button
          disabled={phase !== 'idle'}
          className="flex items-center justify-center w-10 h-10 rounded-xl border border-neutral-border text-neutral-muted hover:text-neutral-white hover:border-neutral-muted transition-all disabled:opacity-30"
        >
          <Mic size={14} />
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-bear/40 bg-bear-dim/20 px-4 py-3 text-sm text-bear">
          {error}
        </div>
      )}

      {phase === 'idle' && showSuggestions && (
        <div>
          <div className="text-xs font-mono text-neutral-muted tracking-wide mb-2">SUGGESTED QUERIES</div>
          <div className="space-y-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => { onSuggestionClick(s); textareaRef.current?.focus(); }}
                className="w-full text-left text-xs text-neutral-label px-3 py-2.5 rounded-lg border border-neutral-border hover:border-electric/30 hover:bg-navy-700/60 hover:text-neutral-white transition-all duration-150 leading-relaxed"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {steps.length > 0 && (
        <div>
          <div className="text-xs font-mono text-neutral-muted tracking-wide mb-2">PROCESSING LOG</div>
          <ProcessingSteps steps={steps} />
        </div>
      )}
    </div>
  );
}
