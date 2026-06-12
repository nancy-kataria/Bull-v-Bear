import { prisma } from '@/prisma/prisma';
import { Prisma } from '@/app/generated/prisma';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

/**
 * Semantic search over ingested note chunks using pgvector cosine distance.
 * Embeds the query in the same space the chunks were ingested into
 * (see app/api/ingest/route.ts) and returns the closest matches.
 */
export async function findRelevantFinance(
  query: string,
  userId?: string | null,
  limit = 3,
  ticker?: string | null,
) {
  // Embed the query the same way chunks are embedded at ingest time so the
  // vectors live in a comparable space.
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: ticker
      ? `Ticker: ${ticker.toUpperCase()} \n\n Content: ${query}`
      : query,
  });

  const vectorString = `[${embedding.join(',')}]`;

  // Build dynamic filters. A chunk must have an embedding to be ranked.
  const conditions: Prisma.Sql[] = [Prisma.sql`nc."embedding" IS NOT NULL`];
  if (userId) conditions.push(Prisma.sql`tn."userId" = ${userId}`);
  if (ticker) conditions.push(Prisma.sql`t."symbol" = ${ticker.toUpperCase()}`);

  const rows = await prisma.$queryRaw<
    { id: string; chunkContent: string; symbol: string }[]
  >(Prisma.sql`
    SELECT nc."id", nc."chunkContent", t."symbol"
    FROM "NoteChunk" nc
    JOIN "TradingNote" tn ON tn."id" = nc."noteId"
    JOIN "Ticker" t ON t."id" = tn."tickerId"
    WHERE ${Prisma.join(conditions, ' AND ')}
    ORDER BY nc."embedding" <=> ${vectorString}::vector
    LIMIT ${limit}
  `);

  // Map to match the expected result format
  return rows.map((row) => ({
    id: row.id,
    content: row.chunkContent,
    metadata: { ticker: row.symbol },
    ticker: row.symbol,
  }));
}
