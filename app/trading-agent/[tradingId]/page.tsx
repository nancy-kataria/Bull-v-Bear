"use client"

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Info, Bot, User as UserIcon } from "lucide-react";
import { useThreads, mockAssistantReply, type ChatMessage } from "@/lib/chat_store";

export default function ThreadView() {
  const params = useParams() as { tradingId: string };
  const threadId = params.tradingId;
  const { threads, ready, appendMessage } = useThreads();
  const thread = useMemo(() => threads.find((t) => t.id === threadId), [threads, threadId]);

  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Focus textarea on mount + thread change
  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId]);

  // Auto-scroll to bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread?.messages.length, pending]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading conversation…
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Conversation not found.
      </div>
    );
  }

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || pending) return;
    setInput("");
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    appendMessage(thread.id, userMsg);
    setPending(true);
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));
    appendMessage(thread.id, {
      id: crypto.randomUUID(),
      role: "assistant",
      content: mockAssistantReply(text),
      createdAt: Date.now(),
    });
    setPending(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isEmpty = thread.messages.length === 0 && !pending;

  return (
    <div className="flex h-full flex-col">
      {/* Disclaimer banner */}
      <div className="border-b border-judge/30 bg-judge/5 px-6 py-2.5">
        <div className="mx-auto flex max-w-3xl items-start gap-2.5 text-xs text-judge">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p className="leading-relaxed">
            This is not investment advice. The trading agent is here to help you learn the
            principles of disciplined trading — every decision and its consequences remain
            entirely your own.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-8">
          {isEmpty ? (
            <EmptyState onPick={(q) => setInput(q)} />
          ) : (
            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {thread.messages.map((m) => (
                  <MessageRow key={m.id} message={m} />
                ))}
              </AnimatePresence>
              {pending && <TypingIndicator />}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="relative rounded-2xl border border-border bg-card focus-within:border-system/60 focus-within:ring-1 focus-within:ring-system/40">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Ask the trading agent anything…"
              className="block max-h-[200px] w-full resize-none bg-transparent px-4 py-3 pr-14 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={handleSubmit}
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
    </div>
  );
}

function MessageRow({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={["flex gap-3", isUser ? "flex-row-reverse" : ""].join(" ")}
    >
      <div
        className={[
          "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1",
          isUser
            ? "bg-system/20 text-system ring-system/40"
            : "bg-judge/15 text-judge ring-judge/40",
        ].join(" ")}
      >
        {isUser ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div className={["max-w-[80%]", isUser ? "text-right" : ""].join(" ")}>
        {isUser ? (
          <div className="inline-block rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-left text-sm leading-relaxed text-primary-foreground">
            {message.content}
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/95">
            {message.content}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
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

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
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