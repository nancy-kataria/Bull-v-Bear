import { NextResponse } from "next/server";
import { getMovers } from "@/lib/market/finnhub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tickers = await getMovers();
    return NextResponse.json({ tickers });
  } catch (error) {
    console.error("Movers fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch movers" }, { status: 502 });
  }
}
