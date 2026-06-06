import { useState, useCallback } from 'react';
import type { Ticker } from '@/types';
import { TradingNote } from '@/types';

export interface FetchTickersResponse extends Ticker {
  notes?: TradingNote[];
}

export function useFetchTickersAPI() {
  const [tickers, setTickers] = useState<FetchTickersResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickers = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tickers', { signal });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tickers');
      }

      const data = await response.json();
      setTickers(data);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage = err.message || 'Failed to fetch tickers';
        setError(errorMessage);
        console.error('Error fetching tickers:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { tickers, isLoading, error, fetchTickers };
}
