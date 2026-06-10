import { useCallback, useState, useEffect } from "react";

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

  const [ready, setReady] = useState(false);

  // Fetch threads from API on mount
  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const response = await fetch("/api/assistant");
        if (response.ok) {
          const chats = await response.json();
          if (chats && Array.isArray(chats) && chats.length > 0) {
            // Convert DB format to Thread format
            const threadsFromDB = chats.map((chat) => ({
              id: chat.id,
              title: chat.title,
              updatedAt: new Date(chat.updatedAt).getTime(),
              messages: Array.isArray(chat.messages) ? chat.messages : [],
            }));
            setThreads(threadsFromDB);
            writeStorage(threadsFromDB);
          }
        }
      } catch (error) {
        console.error("Failed to fetch threads from API:", error);
        // Fall back to localStorage
      } finally {
        setReady(true);
      }
    };

    fetchThreads();
  }, []);

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
