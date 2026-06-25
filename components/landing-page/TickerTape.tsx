import { useMovers } from "@/hooks/queries";

export function TickerTape() {
  const { data, isLoading } = useMovers();
  const tickers = data?.tickers ?? [];

  if (isLoading) {
    return (
      <div className="border-y border-border/60 bg-surface/40 py-2.5 text-center font-mono text-xs text-foreground/40">
        Loading market data...
      </div>
    );
  }

  if (tickers.length === 0) {
    return (
      <div className="border-y border-border/60 bg-surface/40 py-2.5 text-center font-mono text-xs text-foreground/40">
        Market data unavailable
      </div>
    );
  }

  // Duplicating items to ensure seamless infinite looping animation
  const items = [...tickers, ...tickers];

  return (
    <div className="ticker-tape-mask overflow-hidden border-y border-border/60 bg-surface/40 py-2.5">
      <div className="animate-ticker flex w-max gap-8 whitespace-nowrap">
        {items.map((t, i) => (
          <div key={i} className="flex items-center gap-2 font-mono text-xs">
            <span className="font-semibold tracking-wider text-foreground/80">
              ${t.sym}
            </span>
            <span className={t.up ? "text-bull" : "text-bear"}>{t.chg}</span>
            <span className="text-border">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
