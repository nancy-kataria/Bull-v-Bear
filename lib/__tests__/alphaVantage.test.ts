import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { avFetch, RateLimitError, UpstreamError } from '@/lib/market/alphaVantage';

describe('Alpha Vantage Fetch Engine', () => {
  // Store original environment values
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global fetch mock before each test
    globalThis.fetch = vi.fn();
    
    // Set a default API key for tests
    process.env.ALPHA_VANTAGE_API_KEY = 'test-secret-key';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('should fetch successfully from API and cache the result', async () => {
    const mockData = { 'Global Quote': { '01. symbol': 'AAPL', '05. price': '180.00' } };
    
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const params = { function: 'GLOBAL_QUOTE', symbol: 'AAPL' };
    const uniqueKey = 'cache-key-success';

    // First call: Should trigger global fetch
    const firstResult = await avFetch(params, uniqueKey, 5000);
    expect(firstResult).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    // Second call: Should read immediately from cache without calling fetch again
    const secondResult = await avFetch(params, uniqueKey, 5000);
    expect(secondResult).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  test('should throw UpstreamError if no API key is configured', async () => {
    // Remove all possible API key environment variations
    delete process.env.ALPHA_VANTAGE_API_KEY;
    delete process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY;

    await expect(
      avFetch({ function: 'GLOBAL_QUOTE' }, 'key-no-env', 5000)
    ).rejects.toThrow(UpstreamError);
    
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test('should throw UpstreamError if the network request fails and no cache exists', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(
      avFetch({ function: 'GLOBAL_QUOTE' }, 'key-network-fail', 5000)
    ).rejects.toThrow(UpstreamError);
  });

  test('should fall back to stale cache if the network request fails later', async () => {
    const cachedData = { data: 'old-stale-data' };

    // Prime the cache first with a successful request
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => cachedData,
    } as Response);
    await avFetch({ function: 'GLOBAL_QUOTE' }, 'stale-fallback-key', -100); // negative TTL breaks it instantly

    // Next network call fails completely (e.g., 503 Service Unavailable)
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 503,
    } as Response);

    const result = await avFetch({ function: 'GLOBAL_QUOTE' }, 'stale-fallback-key', 5000);
    expect(result).toEqual(cachedData);
  });

  test('should throw RateLimitError if Alpha Vantage returns a Note or Information property', async () => {
    const rateLimitResponse = { Note: 'Thank you for using Alpha Vantage! Our standard API rate limit is...' };
    
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => rateLimitResponse,
    } as Response);

    await expect(
      avFetch({ function: 'GLOBAL_QUOTE' }, 'key-rate-limit', 5000)
    ).rejects.toThrow(RateLimitError);
  });

  test('should fall back to stale cache if a Rate Limit message hits later', async () => {
    const originalData = { price: '100' };
    const rateLimitResponse = { Information: 'Rate limit hit' };

    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => originalData,
    } as Response);
    await avFetch({ function: 'GLOBAL_QUOTE' }, 'stale-rate-limit-key', -10);

    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => rateLimitResponse,
    } as Response);

    const result = await avFetch({ function: 'GLOBAL_QUOTE' }, 'stale-rate-limit-key', 5000);
    expect(result).toEqual(originalData);
  });

  test('should throw UpstreamError if Alpha Vantage explicitly transmits an Error Message object', async () => {
    const errorResponse = { 'Error Message': 'Invalid API call. Please check your parameters.' };
    
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => errorResponse,
    } as Response);

    await expect(
      avFetch({ function: 'GLOBAL_QUOTE' }, 'key-api-error', 5000)
    ).rejects.toThrow(UpstreamError);
  });
});