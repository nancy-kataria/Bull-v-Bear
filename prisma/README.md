# Prisma / Database Notes

## (read before running `migrate dev`)

`NoteChunk.embedding` is a pgvector column typed as `Unsupported("vector(1536)")`, and it
has an HNSW index (`idx_note_chunk_embedding`) for cosine-similarity RAG search:

```sql
CREATE INDEX "idx_note_chunk_embedding"
  ON "NoteChunk" USING hnsw ("embedding" vector_cosine_ops);
```

Prisma **cannot represent an index on an `Unsupported` column** in `schema.prisma`. Because
of that, every time you run `npx prisma migrate dev`, Prisma diffs the schema against the
database, concludes the index "shouldn't exist," and adds this line to the top of the newly
generated migration:

```sql
-- DropIndex
DROP INDEX "idx_note_chunk_embedding";
```

If that line is applied, **it deletes the vector search index** and RAG retrieval falls back
to a slow sequential scan.

### What to do every time you create a migration

1. Generate the migration **without applying it** so you can inspect it first:
   ```bash
   npx prisma migrate dev --name <your_change> --create-only
   ```
2. Open the new file under `prisma/migrations/<timestamp>_<your_change>/migration.sql` and
   **delete any `DROP INDEX "idx_note_chunk_embedding";` line** (and its `-- DropIndex` comment).
3. Apply it:
   ```bash
   npx prisma migrate deploy
   ```

The index is created (idempotently) in
`prisma/migrations/20260612000000_debate_ticker_optional_and_embedding/migration.sql`, so a
full `migrate reset` recreates it correctly — it only needs protecting in *new* migrations.

## Recovering from drift

If `migrate dev` reports drift on `NoteChunk` ("Added index on columns (embedding)"), it
means the HNSW index exists in the database but isn't tracked in migration history. It is now
tracked (see the migration above), so this shouldn't recur. If it does, fold the
`CREATE INDEX IF NOT EXISTS ...` statement into a migration rather than creating the index
out-of-band in the Supabase SQL editor.

## Schema notes

- `NoteChunk` belongs to **either** a `TradingNote` **or** a `TickerDocument` — both `noteId`
  and `documentId` are nullable. Nothing at the DB level enforces "exactly one is set"; if you
  want that guarantee, add a Postgres `CHECK` constraint in a migration (Prisma can't express it).
