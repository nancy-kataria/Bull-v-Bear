import { NextResponse } from "next/server";
import { getQuote, RateLimitError } from "@/lib/market/finnhub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol")?.trim().toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 });
  }

  try {
    const quote = await getQuote(symbol);
    if (!quote) {
      return NextResponse.json(
        { error: "Invalid stock symbol or no data available" },
        { status: 404 },
      );
    }
    return NextResponse.json(quote);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    console.error("Quote fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 502 });
  }
}
