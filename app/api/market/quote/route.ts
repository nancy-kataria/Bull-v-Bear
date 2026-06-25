import { NextResponse } from "next/server";
import { avFetch, RateLimitError } from "@/lib/market/alphaVantage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QUOTE_TTL_MS = 5 * 60 * 1000;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol")?.trim().toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  try {
    const json = (await avFetch(
      { function: "GLOBAL_QUOTE", symbol },
      `quote:${symbol}`,
      QUOTE_TTL_MS,
    )) as Record<string, Record<string, string>>;

    const quote = json["Global Quote"];
    if (!quote || !quote["05. price"]) {
      return NextResponse.json(
        { error: "Invalid stock symbol or no data available" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      symbol: quote["01. symbol"],
      price: parseFloat(quote["05. price"]),
      change: parseFloat(quote["09. change"]),
      changePercent: parseFloat(quote["10. change percent"]),
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    console.error("Quote fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 502 });
  }
}
