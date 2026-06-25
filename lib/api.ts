import type { Ticker, TradingNote } from "@/types";

/** Shared fetch helper: throws an Error carrying the API's message on failure. */
async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

const jsonHeaders = { "Content-Type": "application/json" };

export interface TickerWithNotes extends Ticker {
  notes?: TradingNote[];
}

export function fetchTickers(signal?: AbortSignal): Promise<TickerWithNotes[]> {
  return request("/api/tickers", { signal });
}

export function createTicker(symbol: string): Promise<Ticker> {
  return request("/api/tickers", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ symbol }),
  });
}

export async function deleteTicker(idOrSymbol: string): Promise<void> {
  const res = await fetch(`/api/tickers/${idOrSymbol}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to delete ticker");
  }
}

export function createNote(ticker: string, content: string): Promise<TradingNote> {
  return request("/api/trading-notes", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ ticker, content }),
  });
}

export function updateNote(noteId: string, content: string): Promise<TradingNote> {
  return request(`/api/trading-notes/${noteId}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify({ content }),
  });
}

export async function deleteNote(noteId: string): Promise<void> {
  await request(`/api/trading-notes/${noteId}`, { method: "DELETE" });
}

export function ingestNote(content: string, ticker: string, noteId: string): Promise<unknown> {
  return request("/api/ingest", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ content, ticker, noteId }),
  });
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------
export interface TickerDocumentDTO {
  id: string;
  fileName: string;
  fileType: string;
  createdAt: string;
  /** Present on upload responses; 0 means no text was extracted/indexed. */
  chunksCreated?: number;
}

export function listDocuments(tickerId: string): Promise<TickerDocumentDTO[]> {
  return request(`/api/tickers/${tickerId}/documents`);
}

export function uploadDocument(tickerId: string, file: File): Promise<TickerDocumentDTO> {
  const formData = new FormData();
  formData.append("file", file);
  return request(`/api/tickers/${tickerId}/documents`, {
    method: "POST",
    body: formData,
  });
}

export async function getDocumentUrl(tickerId: string, docId: string): Promise<string> {
  const { url } = await request<{ url: string }>(
    `/api/tickers/${tickerId}/documents/${docId}`,
  );
  return url;
}

export async function deleteDocument(tickerId: string, docId: string): Promise<void> {
  await request(`/api/tickers/${tickerId}/documents/${docId}`, { method: "DELETE" });
}

export class RateLimitError extends Error {}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export async function fetchQuote(symbol: string, signal?: AbortSignal): Promise<Quote> {
  const res = await fetch(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`, {
    signal,
  });
  if (res.status === 429) {
    throw new RateLimitError("Market data temporarily rate-limited. Try again shortly.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Invalid stock symbol or no data available");
  }
  return res.json();
}

export interface MoverItem {
  sym: string;
  chg: string;
  up: boolean;
}

export function fetchMovers(signal?: AbortSignal): Promise<{ tickers: MoverItem[] }> {
  return request("/api/market/movers", { signal });
}
