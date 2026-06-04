interface TickerInputModalProps {
  isOpen: boolean;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export function TickerInputModal({
  isOpen,
  value,
  onValueChange,
  onSubmit,
  onClose,
}: TickerInputModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Add New Ticker
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Enter a stock ticker symbol (e.g., AAPL, MSFT)
        </p>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
            if (e.key === "Escape") {
              onClose();
              onValueChange("");
            }
          }}
          placeholder="Enter ticker symbol"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-system/50 focus:ring-1 focus:ring-system/40 mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose();
              onValueChange("");
            }}
            className="flex-1 rounded-lg border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!value.trim()}
            className="flex-1 rounded-lg bg-system px-4 py-2 text-sm font-medium text-system-foreground hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Add Ticker
          </button>
        </div>
      </div>
    </div>
  );
}
