import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
  GraduationCap,
  ArrowRight,
  Loader2,
  BarChart3,
} from "lucide-react";
import {
  formatRelative,
  formatDate,
  type Note,
  type Folder,
} from "@/lib/mock_notes";
import { useAlphaVantagePrice } from "@/lib/useAlphaVantagePrice";

interface FolderViewProps {
  folder: Folder;
  onAdd: () => void;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onDeleteFolder: () => void;
}

export function FolderView({
  folder,
  onAdd,
  onEdit,
  onDelete,
  onDeleteFolder,
}: FolderViewProps) {
  const { price, change, loading, error } = useAlphaVantagePrice(folder.ticker);
  const sorted = [...folder.notes].sort((a, b) => b.updatedAt - a.updatedAt);
  const up = change >= 0;

  return (
    <section>
      <Link
        href="/trading-assistant"
        className="group mb-5 flex items-center justify-between gap-4 rounded-2xl border border-judge/40 bg-gradient-to-r from-judge/10 via-judge/5 to-transparent p-4 transition hover:border-judge/70"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-judge/15 ring-1 ring-judge/40">
            <GraduationCap className="h-5 w-5 text-judge" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              New to trading? Learn from our trading assistant.
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

      <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-system" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Notebook
              </span>
            </div>
            <h1 className="mt-2 font-mono text-4xl font-bold tracking-tight">
              ${folder.ticker}
            </h1>
            <div className="mt-2 flex items-baseline gap-3">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : error ? (
                <span className="text-sm text-bear">{error}</span>
              ) : (
                <>
                  <span className="font-mono text-2xl tabular-nums">
                    {price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span
                    className={[
                      "font-mono text-sm tabular-nums",
                      up ? "text-bull" : "text-bear",
                    ].join(" ")}
                  >
                    {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-md bg-system px-4 py-2 text-sm font-medium text-system-foreground shadow-[var(--glow-system)] transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> New Note
          </button>
          <Link
            href={`/analysis-room?ticker=${folder.ticker}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-judge px-4 py-2 text-sm font-medium text-judge-foreground shadow-[var(--glow-judge)] transition hover:brightness-110"
          >
            <BarChart3 className="h-4 w-4" /> Bull v. Bear Analysis
          </Link>
          <button
            onClick={onDeleteFolder}
            title="Delete entire notebook"
            className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-bear hover:bg-bear/10 transition border border-border/60 hover:border-bear/40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <AnimatePresence initial={false}>
          {sorted.map((n) => (
            <motion.article
              key={n.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="group relative rounded-xl border border-border/60 bg-card p-5 transition hover:border-border"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span>Added · {formatDate(n.createdAt)}</span>
                    {n.updatedAt !== n.createdAt && (
                      <>
                        <span className="text-border">·</span>
                        <span className="text-system">
                          Edited {formatRelative(n.updatedAt)}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {n.body}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => onEdit(n)}
                    title="Edit"
                    className="rounded-md p-2 text-muted-foreground transition hover:bg-surface hover:text-system"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(n.id)}
                    title="Delete"
                    className="rounded-md p-2 text-muted-foreground transition hover:bg-surface hover:text-bear"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>

        {sorted.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No notes yet for ${folder.ticker}.
            </p>
            <button
              onClick={onAdd}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-system px-3.5 py-2 text-sm font-medium text-system-foreground shadow-[var(--glow-system)] transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" /> Write first note
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
