import { Bot } from "lucide-react";

interface EmptyStateProps {
  onPick: (question: string) => void;
}

export function EmptyState({ onPick }: EmptyStateProps) {
  const suggestions = [
    "What is position sizing and why does it matter?",
    "How do I read a company's earnings report?",
    "Explain risk-to-reward ratios with an example.",
    "What's the difference between trading and investing?",
  ];

  return (
    <div className="flex flex-col items-center pt-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-judge/15 ring-1 ring-judge/40">
        <Bot className="h-6 w-6 text-judge" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight">Learn the discipline of trading.</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Ask the agent anything — from market basics to risk management. Built to teach, not to tell
        you what to buy.
      </p>
      <div className="mt-8 grid w-full max-w-xl gap-2 sm:grid-cols-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-xl border border-border/60 bg-card p-3 text-left text-sm transition hover:border-system/50 hover:bg-surface"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
