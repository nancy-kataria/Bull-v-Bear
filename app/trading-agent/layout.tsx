"use client"

import { useEffect, useMemo } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MessageSquarePlus, Scale, Trash2, MessageSquare } from "lucide-react";
import { useThreads } from "@/lib/chat_store";
import Link from "next/link";

export default function TradingAgentLayout({ children }: { children: React.ReactNode }) {
  const { threads, ready, createThread, deleteThread } = useThreads();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams() as { threadId?: string };
  const activeId = params.threadId as string | undefined;

  // Bootstrap: if at /trading-agent and we have threads, route into the first one.
  useEffect(() => {
    if (!ready) return;
    if (pathname === "/trading-agent" && threads[0]) {
      router.push(`/trading-agent/${threads[0].id}`);
    }
  }, [ready, pathname, threads, router]);

  const sorted = useMemo(
    () => [...threads].sort((a, b) => b.updatedAt - a.updatedAt),
    [threads],
  );

  const handleNew = () => {
    const id = createThread();
    router.push(`/trading-agent/${id}`);
  };

  const handleDelete = (id: string) => {
    deleteThread(id);
    if (activeId === id) {
      // pick another thread to navigate to
      const remaining = threads.filter((t) => t.id !== id);
      const target = remaining[0]?.id;
      if (target) {
        router.push(`/trading-agent/${target}`);
      } else {
        router.push("/trading-agent");
      }
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-system/15 ring-1 ring-system/40">
              <Scale className="h-4 w-4 text-system" />
            </div>
            <span className="font-mono text-sm font-semibold tracking-wide">JuryMind</span>
            <span className="ml-2 hidden rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:inline">
              Trading Agent
            </span>
          </Link>
          <Link
            href="/trading-notes"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Notes
          </Link>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr]">
        <aside className="flex min-h-0 flex-col border-r border-border/60 bg-card/30">
          <div className="p-3">
            <button
              onClick={handleNew}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-system px-3 py-2 text-sm font-medium text-system-foreground shadow-[var(--glow-system)] transition hover:brightness-110"
            >
              <MessageSquarePlus className="h-4 w-4" />
              New conversation
            </button>
          </div>
          <div className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Conversations
          </div>
          <ul className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
            {ready &&
              sorted.map((t) => {
                const active = t.id === activeId;
                return (
                  <li key={t.id}>
                    <motion.div
                      whileHover={{ x: 2 }}
                      className={[
                        "group relative flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm transition",
                        active
                          ? "border-system/60 bg-system/10"
                          : "border-transparent hover:border-border/60 hover:bg-surface/60",
                      ].join(" ")}
                      style={active ? { boxShadow: "var(--glow-system)" } : undefined}
                    >
                      <Link
                        href={`/trading-agent/${t.id}`}
                        className="flex min-w-0 flex-1 items-center gap-2"
                      >
                        <MessageSquare
                          className={[
                            "h-3.5 w-3.5 shrink-0",
                            active ? "text-system" : "text-muted-foreground",
                          ].join(" ")}
                        />
                        <span className="truncate">{t.title || "Untitled"}</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(t.id)}
                        aria-label="Delete conversation"
                        className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-bear/10 hover:text-bear group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </motion.div>
                  </li>
                );
              })}
          </ul>
          <div className="border-t border-border/60 p-3 text-[11px] text-muted-foreground">
            History stored in this browser.
          </div>
        </aside>

        <main className="min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}