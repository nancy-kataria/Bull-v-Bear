-- Make Debate.tickerId nullable so tickerless ("general") debates can be saved
-- instead of failing the foreign key with an empty-string id.
ALTER TABLE "Debate" ALTER COLUMN "tickerId" DROP NOT NULL;

-- Ensure pgvector and the embedding column used by the ingest pipeline exist.
-- Written idempotently because the column may have been added out-of-band.
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "NoteChunk" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
