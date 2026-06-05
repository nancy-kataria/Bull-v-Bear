import { useState, useEffect } from 'react'

interface PriceData {
  price: number
  change: number
  changePercent: number
  symbol: string
  timestamp: number
}

interface CachedPrice extends PriceData {
  expiresAt: number
}

// Store cache in memory (resets on page refresh)
const priceCache: Record<string, CachedPrice> = {}
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes

export function useAlphaVantagePrice(ticker: string) {
  const [data, setData] = useState<PriceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoading(true)
        setError(null)

        const cacheKey = ticker.toUpperCase()

        // Check if data exists in cache and hasn't expired
        if (priceCache[cacheKey] && priceCache[cacheKey].expiresAt > Date.now()) {
          const cached = priceCache[cacheKey]
          setData({
            price: cached.price,
            change: cached.change,
            changePercent: cached.changePercent,
            symbol: cached.symbol,
            timestamp: cached.timestamp,
          })
          setLoading(false)
          return
        }

        // Fetch from Alpha Vantage API
        const apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY
        if (!apiKey) {
          setError('Alpha Vantage API key not configured')
          setLoading(false)
          return
        }

        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${cacheKey}&apikey=${apiKey}`
        )

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`)
        }

        const jsonData = await response.json()

        // Handle API errors
        if (jsonData['Error Message']) {
          throw new Error(jsonData['Error Message'])
        }

        if (jsonData['Note']) {
          // Rate limit hit
          setError('API rate limit reached. Please try again in a moment.')
          setLoading(false)
          return
        }

        const quote = jsonData['Global Quote']

        if (!quote || !quote['05. price']) {
          throw new Error('Invalid stock symbol or no data available')
        }

        const price = parseFloat(quote['05. price'])
        const change = parseFloat(quote['09. change'])
        const changePercent = parseFloat(quote['10. change percent'])

        const priceData: PriceData = {
          price,
          change,
          changePercent,
          symbol: quote['01. symbol'],
          timestamp: Date.now(),
        }

        // Cache the result
        priceCache[cacheKey] = {
          ...priceData,
          expiresAt: Date.now() + CACHE_DURATION_MS,
        }

        setData(priceData)
        setError(null)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch price data'
        setError(errorMessage)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    if (ticker) {
      fetchPrice()
    }
  }, [ticker])

  return {
    price: data?.price ?? 0,
    change: data?.change ?? 0,
    changePercent: data?.changePercent ?? 0,
    loading,
    error,
  }
}
