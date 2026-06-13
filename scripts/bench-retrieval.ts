import "./_env";

import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { Prisma } from "@/app/generated/prisma";
import { prisma } from "@/prisma/prisma";
import { stats, reportRow } from "./_stats";

/**
 * Benchmarks semantic-retrieval latency, splitting the two phases that
 * findRelevantFinance performs (lib/search.ts):
 *   1. embedding the query via OpenAI
 *   2. the pgvector cosine-distance query against NoteChunk
 *
 * Usage: npm run bench:retrieval
 *   BENCH_ITERATIONS=50 BENCH_QUERY="..." npm run bench:retrieval
 */
const ITERATIONS = Number(process.env.BENCH_ITERATIONS ?? 20);
const QUERY =
  process.env.BENCH_QUERY ??
  "Is this a good long-term buy given current valuation and growth?";

async function retrieveOnce(): Promise<{ embedMs: number; queryMs: number }> {
  const t0 = performance.now();
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: QUERY,
  });
  const t1 = performance.now();

  const vectorString = `[${embedding.join(",")}]`;
  await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT nc."id"
    FROM "NoteChunk" nc
    WHERE nc."embedding" IS NOT NULL
    ORDER BY nc."embedding" <=> ${vectorString}::vector
    LIMIT 3
  `);
  const t2 = performance.now();

  return { embedMs: t1 - t0, queryMs: t2 - t1 };
}

async function main() {
  if (!process.env.OPENAI_API_KEY)
    throw new Error("OPENAI_API_KEY is not set (.env.local)");
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is not set (.env.local)");

  const [{ count }] = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count FROM "NoteChunk" WHERE "embedding" IS NOT NULL
  `);
  const chunkCount = Number(count);

  console.log(`\nRetrieval latency benchmark`);
  console.log(`Iterations:  ${ITERATIONS}`);
  console.log(`Indexed chunks (embedding set): ${chunkCount}`);
  console.log(`Query: "${QUERY}"\n`);

  // Warm-up (cold connection + JIT) — not counted.
  await retrieveOnce();

  const embedTimes: number[] = [];
  const queryTimes: number[] = [];
  const totalTimes: number[] = [];

  for (let i = 0; i < ITERATIONS; i++) {
    const { embedMs, queryMs } = await retrieveOnce();
    embedTimes.push(embedMs);
    queryTimes.push(queryMs);
    totalTimes.push(embedMs + queryMs);
  }

  reportRow("Embedding (OpenAI)", stats(embedTimes));
  reportRow("Vector query (pg)", stats(queryTimes));
  reportRow("End-to-end", stats(totalTimes));
  console.log("");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
