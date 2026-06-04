import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verify ticker belongs to user
    const ticker = await prisma.ticker.findUnique({
      where: { id },
    });

    if (!ticker || ticker.userId !== user.id) {
      return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
    }

    // Update ticker symbol
    const updatedTicker = await prisma.ticker.update({
      where: { id },
      data: { symbol: symbol.toUpperCase() },
    });

    return NextResponse.json(updatedTicker);
  } catch (error) {
    console.error("Error updating ticker:", error);
    return NextResponse.json(
      { error: "Failed to update ticker" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to find ticker by ID or by symbol (id parameter could be either)
    let ticker = await prisma.ticker.findUnique({
      where: { id },
    });

    // If not found by ID, try by symbol
    if (!ticker) {
      ticker = await prisma.ticker.findUnique({
        where: {
          userId_symbol: {
            userId: user.id,
            symbol: id.toUpperCase(),
          },
        },
      });
    }

    if (!ticker || ticker.userId !== user.id) {
      return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
    }

    // Delete ticker (cascades to notes)
    await prisma.ticker.delete({
      where: { id: ticker.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ticker:", error);
    return NextResponse.json(
      { error: "Failed to delete ticker" },
      { status: 500 }
    );
  }
}
