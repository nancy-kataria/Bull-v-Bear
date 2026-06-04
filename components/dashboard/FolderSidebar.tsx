import { motion } from "framer-motion";
import { FolderOpen, Plus, FileText } from "lucide-react";
import {
  lastEdited,
  formatRelative,
  type Folder,
} from "@/lib/mock_notes";

interface FolderSidebarProps {
  folders: Folder[];
  selected: string;
  onSelect: (ticker: string) => void;
  onAddTicker: () => void;
}

export function FolderSidebar({
  folders,
  selected,
  onSelect,
  onAddTicker,
}: FolderSidebarProps) {
  if (folders.length === 0) {
    return (
      <aside className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Tickers
          </h2>
          <span className="font-mono text-[10px] text-muted-foreground">0</span>
        </div>
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center">
          <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Add ticker based notes.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col h-full">
      <div className="space-y-3 flex-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Tickers
          </h2>
          <span className="font-mono text-[10px] text-muted-foreground">
            {folders.length}
          </span>
        </div>

        <ul className="space-y-2.5">
          {folders.map((f) => {
            const active = f.ticker === selected;
            const updated = lastEdited(f);
            return (
              <li key={f.ticker}>
                <motion.button
                  onClick={() => onSelect(f.ticker)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  className={[
                    "group relative block w-full overflow-hidden rounded-xl border bg-card p-4 text-left transition",
                    active
                      ? "border-system/70"
                      : "border-border/60 hover:border-border",
                  ].join(" ")}
                  style={
                    active ? { boxShadow: "var(--glow-system)" } : undefined
                  }
                >
                  {active && (
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-system/10 via-transparent to-transparent" />
                  )}
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold tracking-tight">
                          ${f.ticker}
                        </span>
                        {active && (
                          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-system" />
                        )}
                      </div>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Last edited · {formatRelative(updated)}
                      </p>
                    </div>
                    <span
                      className={[
                        "inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition",
                        active
                          ? "border-system/50 bg-system/15 text-system"
                          : "border-border/70 bg-surface text-muted-foreground",
                      ].join(" ")}
                    >
                      <FileText className="h-3 w-3" />
                      {f.notes.length} {f.notes.length === 1 ? "Note" : "Notes"}
                    </span>
                  </div>
                </motion.button>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        onClick={onAddTicker}
        className="w-full rounded-lg border border-border/60 bg-card/40 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-system/50 hover:bg-system/5 transition flex items-center justify-center gap-1.5"
      >
        <Plus className="h-4 w-4" />
        Add Ticker
      </button>
    </aside>
  );
}
