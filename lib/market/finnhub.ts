const API_BASE = "https://finnhub.io/api/v1";

const QUOTE_TTL_MS = 5 * 60 * 1000; // quotes: fresh for 5 min
const MOVERS_TTL_MS = 10 * 60 * 1000; // tape: refresh every 10 min

// The landing-page "tape" — Finnhub's free tier has no top-movers endpoint, so
// we show live quotes for a curated set of well-known symbols instead.
const TAPE_SYMBOLS = [
  "AAPL",
  "NVDA",
  "MSFT",
  "TSLA",
  "AMZN",
  "GOOGL",
  "META",
  "AMD",
];

function getApiKey(): string {
  return process.env.FINNHUB_API_KEY || "";
}

export class RateLimitError extends Error {}
export class UpstreamError extends Error {}

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

// Module-scoped cache shared across requests on a warm server instance.
const cache = new Map<string, CacheEntry>();

/**
 * Fetch a Finnhub endpoint with in-memory caching and graceful degradation.
 * Finnhub signals throttling with HTTP 429; on any upstream failure we serve the
 * last cached value when we have one, rather than erroring.
 */
export async function finnhubGet(
  path: string,
  cacheKey: string,
  ttlMs: number,
): Promise<unknown> {
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new UpstreamError("Finnhub API key not configured");
  }

  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${API_BASE}/${path}${sep}token=${apiKey}`, {
    cache: "no-store",
  });

  if (res.status === 429) {
    if (cached) return cached.value; // serve stale rather than error
    throw new RateLimitError("Finnhub rate limit reached");
  }
  if (!res.ok) {
    if (cached) return cached.value; // serve stale on upstream failure
    throw new UpstreamError(`Upstream request failed: ${res.status}`);
  }

  const json = await res.json();
  cache.set(cacheKey, { value: json, expiresAt: now + ttlMs });
  return json;
}

interface FinnhubQuote {
  c: number; // current price
  d: number | null; // change
  dp: number | null; // percent change
  pc: number; // previous close
}

export interface NormalizedQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

/** A live quote for a symbol, or null when Finnhub has no data (unknown symbol → c = 0). */
export async function getQuote(symbol: string): Promise<NormalizedQuote | null> {
  const q = (await finnhubGet(
    `quote?symbol=${encodeURIComponent(symbol)}`,
    `quote:${symbol}`,
    QUOTE_TTL_MS,
  )) as FinnhubQuote;

  if (!q || !q.c) return null; // c === 0 → unknown/unavailable symbol

  return {
    symbol,
    price: q.c,
    change: q.d ?? 0,
    changePercent: q.dp ?? 0,
  };
}

export interface MoverItem {
  sym: string;
  chg: string;
  up: boolean;
}

/**
 * Build the ticker tape from live quotes of TAPE_SYMBOLS, caching the assembled
 * result. Uses allSettled so a single failed/throttled symbol doesn't take down
 * the whole tape.
 */
export async function getMovers(): Promise<MoverItem[]> {
  const now = Date.now();
  const cached = cache.get("movers");
  if (cached && cached.expiresAt > now) {
    return cached.value as MoverItem[];
  }

  const results = await Promise.allSettled(TAPE_SYMBOLS.map((s) => getQuote(s)));
  const items = results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((q): q is NormalizedQuote => q !== null)
    .map((q) => ({
      sym: q.symbol,
      chg: `${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%`,
      up: q.changePercent >= 0,
    }));

  cache.set("movers", { value: items, expiresAt: now + MOVERS_TTL_MS });
  return items;
}
