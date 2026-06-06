import { useEffect, useState, useCallback } from "react";
import type { Note } from "@/types";

export type Folder = {
  ticker: string;
  notes: Note[];
};

const KEY = "jurymind:trading-notes:v1";

const seed: Folder[] = [
  {
    ticker: "NVDA",
    notes: [
      {
        id: "n1",
        body: "Earnings beat — data center revenue up 154% YoY. Watching Blackwell ramp and supply commentary. PE stretched but FCF justifies a premium re-rating if hyperscaler capex holds.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
        updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
      {
        id: "n2",
        body: "Risk: China export controls widening. Hedge with smaller position or pair with semis ETF.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
        updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
      },
      {
        id: "n3",
        body: "Technical: holding 50-day MA. Breakout above $1,050 would be a buy trigger.",
        createdAt: Date.now() - 1000 * 60 * 60 * 36,
        updatedAt: Date.now() - 1000 * 60 * 60 * 36,
      },
      {
        id: "n4",
        body: "Position sizing: cap at 8% of portfolio. Trim into strength above $1,200.",
        createdAt: Date.now() - 1000 * 60 * 60 * 6,
        updatedAt: Date.now() - 1000 * 60 * 60 * 6,
      },
    ],
  },
  {
    ticker: "VIX",
    notes: [
      {
        id: "v1",
        body: "VIX at 14 — complacency zone. Cheap protection. Consider rolling Mar puts on SPX as a hedge.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
        updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
      },
      {
        id: "v2",
        body: "Term structure in steep contango — short vol carry attractive but fragile into CPI print.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24,
        updatedAt: Date.now() - 1000 * 60 * 60 * 24,
      },
    ],
  },
  {
    ticker: "GOLD",
    notes: [
      {
        id: "g1",
        body: "Gold breaking out above $2,400. Driven by central bank buying + real-rate compression. Long-term core allocation 5%.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
        updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
      },
      {
        id: "g2",
        body: "Miners (GDX) lagging the metal — historical pattern suggests catch-up trade.",
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
        updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
      },
      {
        id: "g3",
        body: "Risk: a hawkish Fed surprise could trigger a 5-7% pullback. Set stops at $2,280.",
        createdAt: Date.now() - 1000 * 60 * 60 * 48,
        updatedAt: Date.now() - 1000 * 60 * 60 * 48,
      },
    ],
  },
];

function load(): Folder[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed;
    return JSON.parse(raw) as Folder[];
  } catch {
    return seed;
  }
}

function save(folders: Folder[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(folders));
}

export function useTradingNotes() {
  const [folders, setFolders] = useState<Folder[]>(() => load());

  const updateAndSave = (updateFn: (prev: Folder[]) => Folder[]) => {
    setFolders((prev) => {
      const next = updateFn(prev);
      save(next);
      return next;
    });
  };

  const addNote = useCallback((ticker: string, body: string) => {
    updateAndSave((prev) =>
      prev.map((f) =>
        f.ticker === ticker
          ? {
              ...f,
              notes: [
                {
                  id: crypto.randomUUID(),
                  body,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                },
                ...f.notes,
              ],
            }
          : f,
      ),
    );
  }, []);

  const updateNote = useCallback((ticker: string, id: string, body: string) => {
    setFolders((prev) =>
      prev.map((f) =>
        f.ticker === ticker
          ? {
              ...f,
              notes: f.notes.map((n) =>
                n.id === id ? { ...n, body, updatedAt: Date.now() } : n,
              ),
            }
          : f,
      ),
    );
  }, []);

  const deleteNote = useCallback((ticker: string, id: string) => {
    setFolders((prev) =>
      prev.map((f) =>
        f.ticker === ticker
          ? { ...f, notes: f.notes.filter((n) => n.id !== id) }
          : f,
      ),
    );
  }, []);

  const deleteFolder = useCallback((ticker: string) => {
    updateAndSave((prev) => prev.filter((f) => f.ticker !== ticker));
  }, []);

  const addFolder = useCallback((ticker: string) => {
    updateAndSave((prev) => {
      // Check if ticker already exists
      if (prev.some((f) => f.ticker === ticker)) {
        return prev;
      }
      return [{ ticker: ticker.toUpperCase(), notes: [] }, ...prev];
    });
  }, []);

  return { folders, addNote, updateNote, deleteNote, deleteFolder, addFolder };
}

export function lastEdited(folder: Folder): number {
  return folder.notes.reduce((max, n) => Math.max(max, n.updatedAt), 0);
}

export function formatRelative(ts: number): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const basePrices: Record<string, number> = {
  NVDA: 1184.32,
  VIX: 14.21,
  GOLD: 2418.55,
};

export function usePrice(ticker: string) {
  const [price, setPrice] = useState<number>(() => basePrices[ticker] ?? 100);
  const [change, setChange] = useState<number>(0);

  useEffect(() => {
    const base = basePrices[ticker] ?? 100;

    const id = setInterval(() => {
      setPrice((currentPrice) => {
        const delta = (Math.random() - 0.48) * base * 0.002;
        const next = +(currentPrice + delta).toFixed(2);

        setTimeout(() => {
          setChange(+(((next - base) / base) * 100).toFixed(2));
        }, 0);

        return next;
      });
    }, 1800);

    return () => clearInterval(id);
  }, [ticker]);

  return { price, change };
}
