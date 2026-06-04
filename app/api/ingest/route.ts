import { NextResponse } from "next/server";
import { prisma } from "@/prisma/prisma";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    // Initializing Supabase Client to get the user session
    const supabase = await createClient();

    // Identifing the logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, ticker, noteId } = await req.json();

    if (!content || !ticker || !noteId) {
      return NextResponse.json(
        { error: "Content, ticker, and noteId are required" },
        { status: 400 },
      );
    }

    // Verify the note belongs to the user
    const note = await prisma.tradingNote.findUnique({
      where: { id: noteId },
      include: { ticker: true },
    });

    if (!note || note.userId !== user.id) {
      return NextResponse.json(
        { error: "Note not found or unauthorized" },
        { status: 404 },
      );
    }

    // Create a note chunk for embeddings/vector storage
    // Split content into chunks if it's large (e.g., > 1000 chars)
    const chunkSize = 1000;
    const chunks = [];
    
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.substring(i, i + chunkSize));
    }

    // Create note chunks
    for (const chunkContent of chunks) {
      await prisma.noteChunk.create({
        data: {
          noteId,
          chunkContent,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Data ingested successfully",
      chunksCreated: chunks.length,
    });
  } catch (error) {
    console.error("Ingestion error:", error);
    return NextResponse.json(
      { error: "Failed to ingest data" },
      { status: 500 },
    );
  }
}
