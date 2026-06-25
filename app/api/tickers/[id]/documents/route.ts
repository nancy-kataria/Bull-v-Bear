import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/prisma/prisma";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@ai-sdk/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embedMany } from "ai";
import {
  ALLOWED_MIME_TYPES,
  PDF_MIME,
  resolveMimeType,
  extractDocumentText,
} from "@/lib/documents/extract";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "ticker-documents";
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

/** Resolve a ticker by DB id or by symbol (the [id] param can be either), scoped to the user. */
async function resolveTicker(id: string, userId: string) {
  const byId = await prisma.ticker.findUnique({ where: { id } });
  if (byId) return byId.userId === userId ? byId : null;
  const bySymbol = await prisma.ticker.findUnique({
    where: { userId_symbol: { userId, symbol: id.toUpperCase() } },
  });
  return bySymbol && bySymbol.userId === userId ? bySymbol : null;
}

/**
 * Parse the uploaded file's text, chunk it, embed each chunk, and store the
 * vectors in NoteChunk (linked to the document). Best-effort: the raw text is
 * never persisted, and a failure here does not fail the upload.
 */
async function ingestDocument(documentId: string, symbol: string, buffer: Buffer, mimeType: string) {
  const text = (await extractDocumentText(buffer, mimeType)).trim();
  if (!text) return 0;

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const chunks = await splitter.splitText(text);
  if (chunks.length === 0) return 0;

  const { embeddings } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: chunks.map(
      (chunkContent) => `Ticker: ${symbol.toUpperCase()} \n\n Content: ${chunkContent}`,
    ),
  });

  await Promise.all(
    chunks.map(async (chunkContent, i) => {
      const chunkRecord = await prisma.noteChunk.create({
        data: { documentId, chunkContent },
      });
      const vectorString = `[${embeddings[i].join(",")}]`;
      await prisma.$executeRaw`
        UPDATE "NoteChunk"
        SET "embedding" = ${vectorString}::vector
        WHERE id = ${chunkRecord.id}
      `;
    }),
  );

  return chunks.length;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticker = await resolveTicker(id, user.id);
    if (!ticker) {
      return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const mimeType = resolveMimeType(file.name, file.type);
    if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: "Only PDF and DOCX files are supported" },
        { status: 415 },
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds the 15 MB limit" },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Keep the original name visible to the user but make the storage key unique
    // and free of path-breaking characters.
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const storagePath = `${user.id}/${ticker.id}/${randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

    if (uploadError) {
      console.error("Storage upload failed:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 502 },
      );
    }

    const document = await prisma.tickerDocument.create({
      data: {
        userId: user.id,
        tickerId: ticker.id,
        fileName: file.name,
        fileUrl: storagePath,
        fileType: mimeType,
      },
    });

    // Best-effort RAG ingestion. If parsing/embedding fails the file is still
    // stored and viewable; it just won't be searchable.
    let chunksCreated = 0;
    try {
      chunksCreated = await ingestDocument(document.id, ticker.symbol, buffer, mimeType);
      if (chunksCreated === 0) {
        console.warn(
          `No text extracted from "${file.name}" — likely a scanned/image-only ` +
            `${mimeType === PDF_MIME ? "PDF" : "file"} with no text layer. Stored but not indexed for RAG.`,
        );
      }
    } catch (err) {
      console.error("Document RAG ingestion failed (file kept):", err);
    }

    return NextResponse.json({ ...document, chunksCreated }, { status: 201 });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticker = await resolveTicker(id, user.id);
    if (!ticker) {
      return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
    }

    const documents = await prisma.tickerDocument.findMany({
      where: { userId: user.id, tickerId: ticker.id },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error listing documents:", error);
    return NextResponse.json(
      { error: "Failed to list documents" },
      { status: 500 },
    );
  }
}
