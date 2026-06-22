-- NOTE: Prisma auto-generated `DROP INDEX "idx_note_chunk_embedding";` here because the
-- HNSW vector index lives on an Unsupported("vector") column it can't represent in the
-- schema. That line was intentionally removed to preserve the RAG search index.

-- AlterTable
ALTER TABLE "NoteChunk" ADD COLUMN     "documentId" TEXT,
ALTER COLUMN "noteId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TickerDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tickerId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fullText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TickerDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TickerDocument_userId_tickerId_idx" ON "TickerDocument"("userId", "tickerId");

-- CreateIndex
CREATE INDEX "NoteChunk_documentId_idx" ON "NoteChunk"("documentId");

-- AddForeignKey
ALTER TABLE "NoteChunk" ADD CONSTRAINT "NoteChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TickerDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TickerDocument" ADD CONSTRAINT "TickerDocument_tickerId_fkey" FOREIGN KEY ("tickerId") REFERENCES "Ticker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
