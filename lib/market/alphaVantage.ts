const API_BASE = "https://www.alphavantage.co/query";

function getApiKey(): string {
  return (
    process.env.ALPHA_VANTAGE_API_KEY ||
    process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY ||
    ""
  );
}

export class RateLimitError extends Error {}
export class UpstreamError extends Error {}

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

// Module-scoped cache
const cache = new Map<string, CacheEntry>();

//Fetch from Alpha Vantage with caching. 
export async function avFetch(
  params: Record<string, string>,
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
    throw new UpstreamError("Alpha Vantage API key not configured");
  }

  const url = `${API_BASE}?${new URLSearchParams({ ...params, apikey: apiKey })}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    if (cached) return cached.value; // serve stale on upstream failure
    throw new UpstreamError(`Upstream request failed: ${res.status}`);
  }

  const json = (await res.json()) as Record<string, unknown>;

  if (json["Note"] || json["Information"]) {
    if (cached) return cached.value; // serve stale rather than error
    throw new RateLimitError(
      String(json["Note"] || json["Information"] || "Rate limit reached"),
    );
  }
  if (json["Error Message"]) {
    throw new UpstreamError(String(json["Error Message"]));
  }

  cache.set(cacheKey, { value: json, expiresAt: now + ttlMs });
  return json;
}
