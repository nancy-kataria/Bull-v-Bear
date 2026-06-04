import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { symbol } = await req.json();

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      );
    }

    // Check if ticker already exists for this user
    const existingTicker = await prisma.ticker.findUnique({
      where: {
        userId_symbol: {
          userId: user.id,
          symbol: symbol.toUpperCase(),
        },
      },
    });

    if (existingTicker) {
      return NextResponse.json(
        { error: "Ticker already exists for this user" },
        { status: 409 }
      );
    }

    // Create new ticker
    const ticker = await prisma.ticker.create({
      data: {
        symbol: symbol.toUpperCase(),
        userId: user.id,
      },
    });

    return NextResponse.json(ticker, { status: 201 });
  } catch (error) {
    console.error("Error creating ticker:", error);
    return NextResponse.json(
      { error: "Failed to create ticker" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickers = await prisma.ticker.findMany({
      where: { userId: user.id },
      include: { notes: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tickers);
  } catch (error) {
    console.error("Error fetching tickers:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickers" },
      { status: 500 }
    );
  }
}
