"use client"

import { useEffect, useMemo } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { MessageSquarePlus, Trash2, MessageSquare, LogOut } from "lucide-react";
import { useThreads } from "@/hooks/chat_store";
import Link from "next/link";
import { useProtected } from "@/hooks/use-protected";
import { signOut } from "@/app/auth/actions";
import { Header } from "@/components/Header";

export default function TradingAgentLayout({ children }: { children: React.ReactNode }) {
  const { threads, ready, createThread, deleteThread } = useThreads();
  const { isLoading, isAuthenticated } = useProtected();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams() as { chatId?: string };
  const activeId = params.chatId as string | undefined;

  // Bootstrap: if at /trading-assistant and we have threads, route into the first one.
  useEffect(() => {
    if (!ready) return;
    if (pathname === "/trading-assistant" && threads[0]) {
      router.push(`/trading-assistant/${threads[0].id}`);
    }
  }, [ready, pathname, threads, router]);

  const sorted = useMemo(
    () => [...threads].sort((a, b) => b.updatedAt - a.updatedAt),
    [threads],
  );

  const handleNew = () => {
    const id = createThread();
    router.push(`/trading-assistant/${id}`);
  };

  const handleDelete = (id: string) => {
    deleteThread(id);
    if (activeId === id) {
      // pick another thread to navigate to
      const remaining = threads.filter((t) => t.id !== id);
      const target = remaining[0]?.id;
      if (target) {
        router.push(`/trading-assistant/${target}`);
      } else {
        router.push("/trading-assistant");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <Header
        maxWidth="max-w-[1600px]"
        backLink={{ href: "/dashboard", label: "Dashboard" }}
        badge="Trading Assistant"
        actions={
          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        }
      />

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
                        href={`/trading-assistant/${t.id}`}
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