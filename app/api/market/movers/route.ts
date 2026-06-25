import { NextResponse } from "next/server";
import { avFetch, RateLimitError } from "@/lib/market/alphaVantage";
import type { ActiveTradedItem } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MOVERS_TTL_MS = 10 * 60 * 1000;

export async function GET() {
  try {
    const json = (await avFetch(
      { function: "TOP_GAINERS_LOSERS" },
      "movers",
      MOVERS_TTL_MS,
    )) as { most_actively_traded?: ActiveTradedItem[] };

    const active = json.most_actively_traded || [];
    const tickers = active.map((item) => {
      const changePercent = parseFloat(item.change_percentage);
      const up = changePercent >= 0;
      return {
        sym: item.ticker,
        chg: `${up ? "+" : ""}${changePercent.toFixed(2)}%`,
        up,
      };
    });

    return NextResponse.json({ tickers });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    console.error("Movers fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch movers" }, { status: 502 });
  }
}
