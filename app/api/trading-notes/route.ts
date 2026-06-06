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

    const { ticker, content } = await req.json();

    if (!ticker || !content) {
      return NextResponse.json(
        { error: "Ticker and content are required" },
        { status: 400 }
      );
    }

    // Get or verify ticker exists for this user
    const tickerRecord = await prisma.ticker.findUnique({
      where: {
        userId_symbol: {
          userId: user.id,
          symbol: ticker.toUpperCase(),
        },
      },
    });

    if (!tickerRecord) {
      return NextResponse.json(
        { error: "Ticker not found or does not belong to user" },
        { status: 404 }
      );
    }

    // Create trading note
    const note = await prisma.tradingNote.create({
      data: {
        userId: user.id,
        tickerId: tickerRecord.id,
        content,
      },
      include: { ticker: true },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating trading note:", error);
    return NextResponse.json(
      { error: "Failed to create trading note" },
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

    const { searchParams } = new URL(req.url);
    const tickerId = searchParams.get("tickerId");

    const where: { userId: string; tickerId?: string } = { userId: user.id };
    if (tickerId) {
      where.tickerId = tickerId;
    }

    const notes = await prisma.tradingNote.findMany({
      where,
      include: { ticker: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching trading notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch trading notes" },
      { status: 500 }
    );
  }
}
