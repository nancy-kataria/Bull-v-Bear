import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save } from "lucide-react";

type Props = {
  open: boolean;
  ticker: string;
  initialBody?: string;
  mode: "add" | "edit";
  onClose: () => void;
  onSave: (body: string) => void;
  isSaving?: boolean;
};

export function NoteEditorModal({
  open,
  ticker,
  initialBody = "",
  mode,
  onClose,
  onSave,
  isSaving = false,
}: Props) {
  const [body, setBody] = useState(initialBody);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 480) + "px";
  }, [body, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && body.trim()) {
        onSave(body.trim());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, body, onClose, onSave]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            key={`${ticker}-${open}`}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-system/40 bg-card shadow-[var(--shadow-elevated)]"
            style={{ boxShadow: "var(--shadow-elevated), var(--glow-system)" }}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-system">
                  {mode === "add" ? "New Note" : "Edit Note"}
                </span>
                <span className="font-mono text-sm font-semibold">
                  ${ticker}
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-surface hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <textarea
                ref={taRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Thesis, catalysts, risks, position sizing…"
                autoFocus
                className="w-full resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                style={{ minHeight: 160 }}
              />
            </div>
            <div className="flex items-center justify-between border-t border-border/60 bg-surface/40 px-5 py-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                ⌘ + Enter to save
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={() => body.trim() && onSave(body.trim())}
                  disabled={!body.trim() || isSaving}
                  className="inline-flex items-center gap-1.5 rounded-md bg-system px-3.5 py-1.5 text-sm font-medium text-system-foreground shadow-[var(--glow-system)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isSaving ? "Saving..." : mode === "add" ? "Add note" : "Save changes"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
