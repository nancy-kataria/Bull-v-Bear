import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(
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

    const note = await prisma.tradingNote.findUnique({
      where: { id },
      include: { ticker: true },
    });

    if (!note || note.userId !== user.id) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error fetching trading note:", error);
    return NextResponse.json(
      { error: "Failed to fetch trading note" },
      { status: 500 }
    );
  }
}

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

    const { content } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Verify note belongs to user
    const note = await prisma.tradingNote.findUnique({
      where: { id },
    });

    if (!note || note.userId !== user.id) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Update trading note
    const updatedNote = await prisma.tradingNote.update({
      where: { id },
      data: { content },
      include: { ticker: true },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("Error updating trading note:", error);
    return NextResponse.json(
      { error: "Failed to update trading note" },
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

    // Verify note belongs to user
    const note = await prisma.tradingNote.findUnique({
      where: { id },
    });

    if (!note || note.userId !== user.id) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Delete trading note
    await prisma.tradingNote.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting trading note:", error);
    return NextResponse.json(
      { error: "Failed to delete trading note" },
      { status: 500 }
    );
  }
}
