import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-judge/15 text-judge ring-1 ring-judge/40">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className="flex items-center gap-1.5 pt-2 text-sm text-muted-foreground">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-judge [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-judge [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-judge" />
        <span className="ml-2 font-mono text-[11px] uppercase tracking-wider">Thinking…</span>
      </div>
    </motion.div>
  );
}
