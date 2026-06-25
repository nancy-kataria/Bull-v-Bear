import { useEffect, useState, useCallback } from "react";
import type { Folder, Ticker, TradingNote } from "@/types";

export type { Folder } from "@/types";

export function useTradingNotes() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickers = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/tickers");
        if (!response.ok) throw new Error("Failed to fetch tickers");

        const tickers = await response.json() as (Ticker & { notes?: TradingNote[] })[];

        // Transform API response to Folder format
        const transformedFolders: Folder[] = tickers.map((ticker) => ({
          id: ticker.id,
          ticker: ticker.symbol,
          notes: (ticker.notes || []).map((note) => ({
            id: note.id,
            body: note.content,
            createdAt: new Date(note.createdAt).getTime(),
            updatedAt: new Date(note.updatedAt).getTime(),
          })),
          docs: [],
        }));

        setFolders(transformedFolders);
        setError(null);
      } catch (err) {
        console.error("Error fetching tickers:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchTickers();
  }, []);

  const addNote = useCallback(async (ticker: string, body: string) => {
    try {
      const response = await fetch("/api/trading-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, content: body }),
      });

      if (!response.ok) throw new Error("Failed to create note");

      const newNote = await response.json();

      setFolders((prev) =>
        prev.map((f) =>
          f.ticker === ticker
            ? {
                ...f,
                notes: [
                  {
                    id: newNote.id,
                    body: newNote.content,
                    createdAt: new Date(newNote.createdAt).getTime(),
                    updatedAt: new Date(newNote.updatedAt).getTime(),
                  },
                  ...f.notes,
                ],
              }
            : f,
        ),
      );
    } catch (err) {
      console.error("Error adding note:", err);
    }
  }, []);

  const updateNote = useCallback(async (ticker: string, id: string, body: string) => {
    try {
      const response = await fetch(`/api/trading-notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: body }),
      });

      if (!response.ok) throw new Error("Failed to update note");

      const updatedNote = await response.json();

      setFolders((prev) =>
        prev.map((f) =>
          f.ticker === ticker
            ? {
                ...f,
                notes: f.notes.map((n) =>
                  n.id === id
                    ? {
                        ...n,
                        body: updatedNote.content,
                        updatedAt: new Date(updatedNote.updatedAt).getTime(),
                      }
                    : n,
                ),
              }
            : f,
        ),
      );
    } catch (err) {
      console.error("Error updating note:", err);
    }
  }, []);

  const deleteNote = useCallback(async (ticker: string, id: string) => {
    try {
      const response = await fetch(`/api/trading-notes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete note");

      setFolders((prev) =>
        prev.map((f) =>
          f.ticker === ticker
            ? { ...f, notes: f.notes.filter((n) => n.id !== id) }
            : f,
        ),
      );
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  }, []);

  const deleteFolder = useCallback(async (ticker: string) => {
    try {
      const folder = folders.find((f) => f.ticker === ticker);
      if (!folder) return;

      const response = await fetch(`/api/tickers/${folder.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete ticker");

      // Update local state
      setFolders((prev) => prev.filter((f) => f.ticker !== ticker));
    } catch (err) {
      console.error("Error deleting folder:", err);
    }
  }, [folders]);

  const addFolder = useCallback(async (ticker: string) => {
    try {
      // Check if ticker already exists
      if (folders.some((f) => f.ticker === ticker.toUpperCase())) {
        return;
      }

      const response = await fetch("/api/tickers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: ticker }),
      });

      if (!response.ok) throw new Error("Failed to create ticker");

      const newTicker = await response.json();

      // Update local state
      setFolders((prev) => [
        {
          id: newTicker.id,
          ticker: newTicker.symbol,
          notes: [],
          docs: [],
        },
        ...prev,
      ]);
    } catch (err) {
      console.error("Error adding folder:", err);
    }
  }, [folders]);

  return { folders, loading, error, addNote, updateNote, deleteNote, deleteFolder, addFolder };
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
