import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { finnhubGet, RateLimitError, UpstreamError } from '@/lib/market/finnhub';

describe('Finnhub Fetch Engine', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
    process.env.FINNHUB_API_KEY = 'test-secret-key';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('should fetch successfully from API and cache the result', async () => {
    const mockData = { c: 180, d: 1.5, dp: 0.84 };

    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    } as Response);

    // First call hits the network
    const first = await finnhubGet('quote?symbol=AAPL', 'cache-key-success', 5000);
    expect(first).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    // Second call is served from cache
    const second = await finnhubGet('quote?symbol=AAPL', 'cache-key-success', 5000);
    expect(second).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  test('should throw UpstreamError if no API key is configured', async () => {
    delete process.env.FINNHUB_API_KEY;

    await expect(
      finnhubGet('quote?symbol=AAPL', 'key-no-env', 5000)
    ).rejects.toThrow(UpstreamError);

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test('should throw UpstreamError if the network request fails and no cache exists', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(
      finnhubGet('quote?symbol=AAPL', 'key-network-fail', 5000)
    ).rejects.toThrow(UpstreamError);
  });

  test('should fall back to stale cache if the network request fails later', async () => {
    const cachedData = { c: 100 };

    // Prime the cache, then immediately expire it (negative TTL)
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => cachedData,
    } as Response);
    await finnhubGet('quote?symbol=AAPL', 'stale-fallback-key', -100);

    // Next call fails upstream → should serve stale value
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 503,
    } as Response);

    const result = await finnhubGet('quote?symbol=AAPL', 'stale-fallback-key', 5000);
    expect(result).toEqual(cachedData);
  });

  test('should throw RateLimitError when Finnhub returns HTTP 429', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 429,
    } as Response);

    await expect(
      finnhubGet('quote?symbol=AAPL', 'key-rate-limit', 5000)
    ).rejects.toThrow(RateLimitError);
  });

  test('should fall back to stale cache if a 429 hits later', async () => {
    const originalData = { c: 100 };

    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => originalData,
    } as Response);
    await finnhubGet('quote?symbol=AAPL', 'stale-rate-limit-key', -10);

    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
    } as Response);

    const result = await finnhubGet('quote?symbol=AAPL', 'stale-rate-limit-key', 5000);
    expect(result).toEqual(originalData);
  });
});
