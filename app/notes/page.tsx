"use client"

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FolderOpen, Pencil, Plus, Scale, Trash2, FileText } from "lucide-react";
import {
  useTradingNotes,
  usePrice,
  lastEdited,
  formatRelative,
  formatDate,
  type Note,
} from "@/lib/mock_notes";
import { NoteEditorModal } from "@/components/NoteEditorModal";
import Link from "next/link";

export const Route = createFileRoute()({
  head: () => ({
    meta: [
      { title: "Trading Notes — JuryMind" },
      { name: "description", content: "Per-ticker trading notebooks. Capture your thesis, catalysts, and risks." },
      { property: "og:title", content: "Trading Notes — JuryMind" },
      { property: "og:description", content: "Per-ticker trading notebooks. Capture your thesis, catalysts, and risks." },
    ],
  }),
  component: TradingNotesPage,
});

export default function TradingNotesPage() {
  const { folders, addNote, updateNote, deleteNote } = useTradingNotes();
  const [selected, setSelected] = useState<string>(folders[0]?.ticker ?? "NVDA");
  const [editor, setEditor] = useState<
    | { open: false }
    | { open: true; mode: "add" }
    | { open: true; mode: "edit"; note: Note }
  >({ open: false });
  const [isIngesting, setIsIngesting] = useState(false);

  const folder = useMemo(
    () => folders.find((f) => f.ticker === selected) ?? folders[0],
    [folders, selected],
  );

  const handleSaveAndIngest = async (body: string) => {
    if (!folder) return;

    // Save locally first
    if (editor.open && editor.mode === "edit") {
      updateNote(folder.ticker, editor.note.id, body);
    } else {
      addNote(folder.ticker, body);
    }

    // Then ingest to database for search
    setIsIngesting(true);
    try {
      await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: body,
          ticker: folder.ticker,
          metadata: {
            timestamp: new Date().toISOString(),
            mode: editor.open && editor.mode === "edit" ? "edit" : "add",
          },
        }),
      });
    } catch (error) {
      console.error("Failed to ingest note:", error);
    } finally {
      setIsIngesting(false);
      setEditor({ open: false });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-system/15 ring-1 ring-system/40">
              <Scale className="h-4 w-4 text-system" />
            </div>
            <span className="font-mono text-sm font-semibold tracking-wide">JuryMind</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Chambers
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[320px_1fr]">
        <FolderSidebar
          folders={folders}
          selected={selected}
          onSelect={setSelected}
        />
        {folder && (
          <FolderView
            folder={folder}
            onAdd={() => setEditor({ open: true, mode: "add" })}
            onEdit={(note) => setEditor({ open: true, mode: "edit", note })}
            onDelete={(id) => deleteNote(folder.ticker, id)}
          />
        )}
      </main>

      <NoteEditorModal
        open={editor.open}
        ticker={folder?.ticker ?? ""}
        mode={editor.open ? editor.mode : "add"}
        initialBody={editor.open && editor.mode === "edit" ? editor.note.body : ""}
        onClose={() => setEditor({ open: false })}
        onSave={handleSaveAndIngest}
      />
    </div>
  );
}

function FolderSidebar({
  folders,
  selected,
  onSelect,
}: {
  folders: ReturnType<typeof useTradingNotes>["folders"];
  selected: string;
  onSelect: (t: string) => void;
}) {
  return (
    <aside className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Tickers
        </h2>
        <span className="font-mono text-[10px] text-muted-foreground">{folders.length}</span>
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
                style={active ? { boxShadow: "var(--glow-system)" } : undefined}
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
    </aside>
  );
}

function FolderView({
  folder,
  onAdd,
  onEdit,
  onDelete,
}: {
  folder: { ticker: string; notes: Note[] };
  onAdd: () => void;
  onEdit: (n: Note) => void;
  onDelete: (id: string) => void;
}) {
  const { price, change } = usePrice(folder.ticker);
  const sorted = [...folder.notes].sort((a, b) => b.updatedAt - a.updatedAt);
  const up = change >= 0;

  return (
    <section>
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
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Live
              </span>
            </div>
          </div>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-md bg-system px-4 py-2 text-sm font-medium text-system-foreground shadow-[var(--glow-system)] transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> New Note
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
                        <span className="text-system">Edited {formatRelative(n.updatedAt)}</span>
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
            <p className="text-sm text-muted-foreground">No notes yet for ${folder.ticker}.</p>
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