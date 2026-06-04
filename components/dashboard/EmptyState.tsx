import Link from "next/link";
import { FileText, Plus, GraduationCap, ArrowRight } from "lucide-react";

interface EmptyStateProps {
  onAddTicker: () => void;
}

export function EmptyState({ onAddTicker }: EmptyStateProps) {
  return (
    <div className="space-y-5">
      <Link
        href="/trading-agent"
        className="group flex items-center justify-between gap-4 rounded-2xl border border-judge/40 bg-gradient-to-r from-judge/10 via-judge/5 to-transparent p-4 transition hover:border-judge/70"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-judge/15 ring-1 ring-judge/40">
            <GraduationCap className="h-5 w-5 text-judge" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              New to trading? Learn from our trading agent.
            </p>
            <p className="text-xs text-muted-foreground">
              Ask anything — from position sizing to reading earnings.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-judge px-3 py-1.5 text-xs font-semibold text-judge-foreground transition group-hover:brightness-110">
          Open agent
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </span>
      </Link>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-12 text-center">
        <FileText className="h-10 w-10 text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold text-foreground mb-2">
          No notebooks yet
        </h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Add ticker based notes: Create your first note to get started
          with your trading journal.
        </p>
        <button
          onClick={onAddTicker}
          className="inline-flex items-center gap-1.5 rounded-md bg-system px-4 py-2 text-sm font-medium text-system-foreground shadow-[var(--glow-system)] transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Add your first notebook
        </button>
      </div>
    </div>
  );
}
