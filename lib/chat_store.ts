import { useCallback, useState } from "react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export type Thread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
};

const KEY = "jurymind:trading-agent-threads:v1";

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function defaultThread(): Thread {
  return {
    id: uid(),
    title: "New conversation",
    updatedAt: Date.now(),
    messages: [],
  };
}

function readStorage(): Thread[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Thread[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStorage(threads: Thread[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(threads));
  } catch {}
}

export function useThreads() {
  const [threads, setThreads] = useState<Thread[]>(() => {
    const existing = readStorage();
    if (existing && existing.length > 0) return existing;
    const t = defaultThread();
    try {
      writeStorage([t]);
    } catch {}
    return [t];
  });

  const [ready, setReady] = useState(() => {
    if (typeof window === "undefined") return false;
    return true;
  });

  const update = useCallback((updater: (prev: Thread[]) => Thread[]) => {
    setThreads((prev) => {
      const next = updater(prev);
      writeStorage(next);
      return next;
    });
  }, []);

  const createThread = useCallback((): string => {
    const t = defaultThread();
    update((prev) => [t, ...prev]);
    return t.id;
  }, [update]);

  const deleteThread = useCallback(
    (id: string) => {
      update((prev) => {
        const filtered = prev.filter((t) => t.id !== id);
        if (filtered.length === 0) return [defaultThread()];
        return filtered;
      });
    },
    [update],
  );

  const appendMessage = useCallback(
    (threadId: string, msg: ChatMessage) => {
      update((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                updatedAt: Date.now(),
                title:
                  t.messages.length === 0 && msg.role === "user"
                    ? msg.content.slice(0, 48) +
                      (msg.content.length > 48 ? "…" : "")
                    : t.title,
                messages: [...t.messages, msg],
              }
            : t,
        ),
      );
    },
    [update],
  );

  return { threads, ready, createThread, deleteThread, appendMessage };
}

const REPLIES = [
  "Great question. Let's think in terms of risk first: position sizing matters more than picking the perfect entry. A reasonable rule for beginners is to risk no more than 1–2% of your account on any single trade.",
  "Before placing a trade, ask three things: (1) What's my thesis? (2) Where am I wrong? (3) How much will I lose if I'm wrong? If you can't answer all three, you're not ready to enter.",
  "Volatility and risk are not the same thing. Volatility is how much price moves; risk is the probability of permanent capital loss. A boring stock with terrible fundamentals can be far riskier than a volatile but profitable one.",
  "A simple framework: study the company's revenue trend, free cash flow, debt level, and competitive moat. Numbers alone don't predict the future, but they tell you what's already true.",
  "Remember — the goal isn't to be right, it's to be profitable over time. Even the best traders lose on 40% of their trades. Edge comes from making your winners bigger than your losers.",
];

export function mockAssistantReply(userText: string): string {
  const idx = Math.abs(hash(userText)) % REPLIES.length;
  return REPLIES[idx];
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
