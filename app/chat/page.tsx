"use client"

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scale, Send, Mic, RotateCcw, Gavel, LogOut } from 'lucide-react';
import { Footer } from '@/components/Footer';
import BullBearPodium from '@/components/BullBearPodium';
import ProcessingSteps from '@/components/ProcessingSteps';
import DisplayVerdictCard from '@/components/DisplayVerdictCard';
import ExhibitHall from '@/components/ExhibitHall';
import { useProtected } from '@/lib/use-protected';
import { signOut } from '@/app/auth/actions';
import type { Argument, ChatAnalystPoint, ChatApiResponse, ChatPageSearchResult, Phase, ProcessingStep, Source, VerdictData } from '@/types';

const STEPS_SEQUENCE: { delay: number; id: string; label: string }[] = [
  { delay: 400, id: 'p1', label: 'Summoning Analysts...' },
  { delay: 1400, id: 'p2', label: 'Scanning Private Insights...' },
  { delay: 2600, id: 'p3', label: 'Cross-referencing Web Context...' },
  { delay: 3800, id: 'p4', label: 'Staging Deliberation...' },
  { delay: 5200, id: 'p5', label: "Rendering Judge's Verdict..." },
];

const SUGGESTIONS = [
  'Should I buy $NVDA given the current AI spending cycle?',
  'Analyze $MSFT vs $GOOG for a 12-month hold position',
  'Is $QQQ overbought? Compare with my tech rotation notes.',
  'Should I take profits on $TSLA after the recent run?',
];

const extractTicker = (query: string) => query.match(/\$([A-Z]{1,5})\b/)?.[1] ?? 'NVDA';

const normalizeSourceType = (value: unknown): Source['type'] => {
  return value === 'filing' || value === 'note' ? value : 'web';
};

const toExhibitSource = (result: ChatPageSearchResult, index: number): Source => {
  const content = result.content?.trim() ?? '';
  const metadata = result.metadata ?? {};

  return {
    id: result.id ?? `search-${index}`,
    title: metadata.title ?? (content.slice(0, 90) || `Relevant exhibit ${index + 1}`),
    domain: metadata.domain ?? 'database',
    url: metadata.url ?? '#',
    type: normalizeSourceType(metadata.type),
    date: metadata.date ?? new Date().toISOString().slice(0, 10),
  };
};

const buildArguments = (
  analystData: { points: ChatAnalystPoint[] }
): Argument[] => {
  return analystData.points.slice(0, 4).map((pt, index) => ({
    point: pt.content,
    weight: index === 0 ? 'strong' : index === 1 ? 'moderate' : 'weak',
    riskTag: pt.tag,
    sourceIndex: pt.sourceIndex 
  }));
};

const buildVerdictData = (
  question: string,
  apiResponse: ChatApiResponse,
  sources: Source[],
): VerdictData => {
  const ticker = extractTicker(question);

  return {
    ticker,
    verdict: apiResponse.decision.verdict,
    confidence: apiResponse.decision.confidence,
    summary: apiResponse.decision.reasoning,
    bullArguments: buildArguments(apiResponse.bull),
    bearArguments: buildArguments(apiResponse.bear),
    riskTags: apiResponse.decision.keyRisks,
    sources,
  };
};

export default function JuryRoomPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useProtected();
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [steps, setSteps] = useState<ProcessingStep[]>([]);
  const [verdict, setVerdict] = useState<VerdictData | null>(null);
  const [showBull, setShowBull] = useState(false);
  const [showBear, setShowBear] = useState(false);
  const [exhibits, setExhibits] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const requestIdRef = useRef(0);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const handleSubmit = async () => {
    if (!input.trim() || phase !== 'idle') return;
    const requestId = ++requestIdRef.current;
    clearTimers();
    setError(null);
    setVerdict(null);
    setShowBull(false);
    setShowBear(false);
    setExhibits([]);
    setPhase('processing');
    setSteps(STEPS_SEQUENCE.map(s => ({ id: s.id, label: s.label, status: 'pending' as const })));

    const ingestPromise = fetch('/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: input,
        metadata: {
          source: 'chat',
          createdAt: new Date().toISOString(),
        },
      }),
    });

    const dataPromise = Promise.all([
      fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input }),
      }),
      fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: input }],
        }),
      }),
    ]).then(async ([searchResponse, chatResponse]) => {
      if (!searchResponse.ok) {
        if (searchResponse.status === 401) {
          clearTimers();
          setPhase('idle');
          router.push('/login');
          return null;
        }
        throw new Error('Search failed');
      }

      if (!chatResponse.ok) {
        if (chatResponse.status === 401) {
          clearTimers();
          setPhase('idle');
          router.push('/login');
          return null;
        }
        throw new Error('Chat analysis failed');
      }

      const searchJson = (await searchResponse.json()) as { results?: ChatPageSearchResult[] };
      const chatJson = (await chatResponse.json()) as ChatApiResponse;
      const mappedSources = (searchJson.results ?? []).map(toExhibitSource);

      return {
        exhibits: mappedSources,
        verdictData: buildVerdictData(input, chatJson, mappedSources),
      };
    });

    STEPS_SEQUENCE.forEach((seq, i) => {
      const t1 = setTimeout(() => {
        setSteps(prev => prev.map(s => s.id === seq.id ? { ...s, status: 'running' } : s));
      }, seq.delay);

      const doneDelay = i < STEPS_SEQUENCE.length - 1 ? STEPS_SEQUENCE[i + 1].delay - 100 : seq.delay + 1200;
      const t2 = setTimeout(() => {
        setSteps(prev => prev.map(s => s.id === seq.id ? { ...s, status: 'done' } : s));

        if (seq.id === 'p3') {
          setPhase('deliberating');
          setShowBull(true);
          setTimeout(() => setShowBear(true), 600);
        }
        if (seq.id === 'p5') {
          setTimeout(() => {
            setPhase('verdict');
          }, 400);
        }
      }, doneDelay);

      timersRef.current.push(t1, t2);
    });

    void ingestPromise.catch(error => {
      console.warn('Ingest failed:', error);
    });

    try {
      const result = await dataPromise;

      if (!result || requestId !== requestIdRef.current) return;

      setExhibits(result.exhibits);
      setVerdict(result.verdictData);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;

      console.error('Chat analysis error:', error);
      clearTimers();
      setError(error instanceof Error ? error.message : 'Failed to generate verdict');
      setPhase('idle');
    }
  };

  const handleReset = () => {
    requestIdRef.current += 1;
    clearTimers();
    setInput('');
    setPhase('idle');
    setSteps([]);
    setVerdict(null);
    setShowBull(false);
    setShowBear(false);
    setExhibits([]);
    setError(null);
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (phase === 'verdict' && verdict) {
      const clearTimer = setTimeout(() => {
        setInput('');
      }, 500);
      return () => clearTimeout(clearTimer);
    }
  }, [phase, verdict]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-neutral-muted">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-border bg-navy-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 text-neutral-muted hover:text-neutral-white transition-colors text-sm cursor-pointer"
          >
            <LogOut size={15} />
            Sign Out
          </button>
          <div className="w-px h-5 bg-neutral-border" />
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-electric-dim border border-electric/30">
              <Scale size={13} className="text-electric" />
            </div>
            <Link href="/" className="font-mono font-bold text-sm text-neutral-white hover:text-electric transition-colors">
              Bull v. Bear
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {phase !== 'idle' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-border text-neutral-muted hover:text-neutral-white hover:border-neutral-muted transition-all text-xs"
            >
              <RotateCcw size={12} />
              New Case
            </button>
          )}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono ${phase === 'idle' ? 'border-neutral-border text-neutral-muted' : phase === 'verdict' ? 'border-bull/40 text-bull bg-bull-dim/20' : 'border-electric/40 text-electric bg-electric-dim/20'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${phase === 'idle' ? 'bg-neutral-muted' : phase === 'verdict' ? 'bg-bull' : 'bg-electric animate-pulse'}`} />
            {phase === 'idle' ? 'Standby' : phase === 'processing' ? 'Processing' : phase === 'deliberating' ? 'Deliberating' : 'Verdict Ready'}
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr_260px] gap-0 min-h-0">
        {/* Left: Input */}
        <div className="border-r border-neutral-border bg-navy-900/40 flex flex-col p-6 gap-5">
          <div>
            <h2 className="text-xs font-mono font-semibold text-neutral-label tracking-widest uppercase mb-1">Inquiry</h2>
            <p className="text-xs text-neutral-muted">State your investment thesis or ask a question</p>
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); autoResize(); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
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
              onClick={handleSubmit}
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

          {phase === 'idle' && (
            <div>
              <div className="text-xs font-mono text-neutral-muted tracking-wide mb-2">SUGGESTED QUERIES</div>
              <div className="space-y-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(s); textareaRef.current?.focus(); }}
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

        <div className="flex flex-col gap-5 p-6 overflow-y-auto">
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

        <div className="border-l border-neutral-border bg-navy-900/40 hidden lg:flex flex-col overflow-hidden">
          <ExhibitHall sources={phase === 'verdict' && verdict ? verdict.sources : exhibits} />
        </div>
      </div>

      <Footer />
    </div>
  );
}

