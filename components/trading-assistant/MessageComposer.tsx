import { Send } from "lucide-react";
import { forwardRef, useEffect } from "react";

interface MessageComposerProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
}

export const MessageComposer = forwardRef<
  HTMLTextAreaElement,
  MessageComposerProps
>(
  ({ input, onInputChange, onSubmit, pending }, ref) => {
    // Auto-grow textarea
    useEffect(() => {
      const el = ref as React.MutableRefObject<HTMLTextAreaElement>;
      if (!el?.current) return;
      el.current.style.height = "auto";
      el.current.style.height = Math.min(el.current.scrollHeight, 200) + "px";
    }, [input, ref]);

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    };

    return (
      <div className="border-t border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="relative rounded-2xl border border-border bg-card focus-within:border-system/60 focus-within:ring-1 focus-within:ring-system/40">
            <textarea
              ref={ref}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Ask the trading assistant anything…"
              className="block max-h-[200px] w-full resize-none bg-transparent px-4 py-3 pr-14 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={onSubmit}
              disabled={!input.trim() || pending}
              aria-label="Send"
              className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-lg bg-system text-system-foreground shadow-[var(--glow-system)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Press Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>
    );
  },
);

MessageComposer.displayName = "MessageComposer";
