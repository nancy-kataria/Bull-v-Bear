import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { prisma } from '@/prisma/prisma';

export async function findRelevantFinance(query: string, userId?: string | null, limit = 3) {
  // Turning the user's question into a vector 
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: query,
  });

  // Format for pgvector [0.1, 0.2...]
  const vectorString = `[${embedding.join(',')}]`;

  // Query Supabase for the most similar rows. If `userId` is provided,
  // restrict results to that user; otherwise search across all users.
  let locations;
  if (userId) {
    locations = await prisma.$queryRaw`
      SELECT id, content, metadata,
      1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM "FinancialInsight"
      WHERE "userId" = ${userId}
        AND 1 - (embedding <=> ${vectorString}::vector) > 0.5
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;
  } else {
    locations = await prisma.$queryRaw`
      SELECT id, content, metadata,
      1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM "FinancialInsight"
      WHERE 1 - (embedding <=> ${vectorString}::vector) > 0.5
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;
  }

  return locations;
}