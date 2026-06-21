import "./_env";

import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Prisma } from "@/app/generated/prisma";
import { prisma } from "@/prisma/prisma";
import { BENCH_USER_EMAIL } from "./_bench";
import { buildSeedNotes } from "./_seed-data";

/**
 * Populates a dedicated benchmark user with tickers, notes, and embedded
 * NoteChunk rows so bench-retrieval has a real pgvector index to query.
 * Usage:
 *   npm run seed:bench           seed (replaces any prior benchmark data)
 *   npm run seed:bench -- --clean   remove the benchmark user and all its data
 */
const CLEAN = process.argv.includes("--clean");
const EMBED_BATCH = 96;

async function removeBenchUser(): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email: BENCH_USER_EMAIL },
  });
  if (!user) return false;
  // Cascade deletes tickers -> notes -> chunks and debates.
  await prisma.user.delete({ where: { id: user.id } });
  return true;
}

async function seed() {
  // Fresh start so re-running doesn't accumulate duplicate data.
  await removeBenchUser();

  const user = await prisma.user.create({
    data: { email: BENCH_USER_EMAIL, name: "Benchmark" },
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const notes = buildSeedNotes();
  const tickerIdBySymbol = new Map<string, string>();

  // Pending chunks across all notes, so we can embed them in batches.
  const pending: { chunkId: string; embedInput: string }[] = [];
  let noteCount = 0;

  for (const { symbol, body } of notes) {
    let tickerId = tickerIdBySymbol.get(symbol);
    if (!tickerId) {
      const ticker = await prisma.ticker.create({
        data: { symbol, userId: user.id },
      });
      tickerId = ticker.id;
      tickerIdBySymbol.set(symbol, tickerId);
    }

    const note = await prisma.tradingNote.create({
      data: { userId: user.id, tickerId, content: body },
    });
    noteCount++;

    const chunks = await splitter.splitText(body);
    for (const chunkContent of chunks) {
      const chunk = await prisma.noteChunk.create({
        data: { noteId: note.id, chunkContent },
      });
      pending.push({
        chunkId: chunk.id,
        embedInput: `Ticker: ${symbol} \n\n Content: ${chunkContent}`,
      });
    }
  }

  console.log(
    `Created ${tickerIdBySymbol.size} tickers, ${noteCount} notes, ${pending.length} chunks.`,
  );

  // Embed in batches, then write the vectors back.
  let embedded = 0;
  for (let i = 0; i < pending.length; i += EMBED_BATCH) {
    const batch = pending.slice(i, i + EMBED_BATCH);
    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: batch.map((p) => p.embedInput),
    });

    await Promise.all(
      batch.map((p, j) => {
        const vectorString = `[${embeddings[j].join(",")}]`;
        return prisma.$executeRaw(Prisma.sql`
          UPDATE "NoteChunk"
          SET "embedding" = ${vectorString}::vector
          WHERE id = ${p.chunkId}
        `);
      }),
    );
    embedded += batch.length;
    console.log(`Embedded ${embedded}/${pending.length} chunks...`);
  }

  console.log(`\nDone. Benchmark index ready under ${BENCH_USER_EMAIL}.`);
}

async function main() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is not set (.env.local)");

  if (CLEAN) {
    const removed = await removeBenchUser();
    console.log(
      removed
        ? `Removed benchmark user ${BENCH_USER_EMAIL} and all its data.`
        : "No benchmark user found; nothing to clean.",
    );
  } else {
    if (!process.env.OPENAI_API_KEY)
      throw new Error("OPENAI_API_KEY is not set (.env.local)");
    await seed();
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
