import "./_env";

import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { findRelevantFinance } from "@/lib/search";
import { prisma } from "@/prisma/prisma";
import { BENCH_USER_EMAIL } from "./_bench";
import { stats, reportRow } from "./_stats";

/**
 * End-to-end latency of the debate pipeline (mirrors app/api/chat/route.ts),
 * minus HTTP/auth overhead, with a per-stage breakdown:
 *   research -> parallel debate (bull+bear) -> judge -> persist
 *
 * Requires the benchmark user/index from `npm run seed:bench`.
 * Usage: npm run bench:pipeline
 */
const ITERATIONS = Number(process.env.BENCH_ITERATIONS ?? 5);
const TICKER = process.env.BENCH_TICKER ?? "NVDA";
const QUESTION =
  process.env.BENCH_QUERY ?? `Is $${TICKER} a buy at current levels?`;

const AnalystSchema = z.object({
  points: z.array(
    z.object({
      tag: z.string(),
      content: z.string(),
      sourceIndex: z.number(),
    }),
  ),
});

const VerdictSchema = z.object({
  verdict: z.enum(["BUY", "HOLD", "SELL"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  keyRisks: z.array(z.string()),
});

// @tavily/ai-sdk is ESM-only; dynamic import avoids tsx's CJS resolution path.
type ToolMap = Record<string, unknown>;
async function buildWebTool(): Promise<ToolMap> {
  if (!process.env.TAVILY_API_KEY) return {};
  const { tavilySearch } = await import("@tavily/ai-sdk");
  return {
    searchWeb: tavilySearch({
      apiKey: process.env.TAVILY_API_KEY,
      searchDepth: "advanced",
    }),
  };
}

async function runOnce(
  userId: string,
  tickerId: string | null,
  webTool: ToolMap,
) {
  const timings: Record<string, number> = {};

  // 1. Research (local RAG + optional web search) via tool-calling.
  let t = performance.now();
  const research = await generateText({
    model: openai("gpt-4o"),
    system: "You are a research assistant. Find the most relevant financial facts.",
    prompt: QUESTION,
    tools: {
      searchLocalDB: {
        description: "Search internal database for historical financial insights.",
        inputSchema: z.object({ query: z.string() }),
        execute: async ({ query }) =>
          JSON.stringify(await findRelevantFinance(query, userId, 3, TICKER)),
      },
      ...webTool,
    },
  });
  timings.research = performance.now() - t;

  const context = research.text;
  const sources = research.steps
    .flatMap((s) => s.toolResults.map((tr) => tr.output))
    .filter(Boolean);
  const indexed = sources.map((s, i) => `[Source ${i}]: ${JSON.stringify(s)}`).join("\n");

  // 2. Parallel debate (bull vs bear).
  t = performance.now();
  const [bull, bear] = await Promise.all([
    generateText({
      model: openai("gpt-4o-mini"),
      output: Output.object({ schema: AnalystSchema }),
      system: "You are a BULL analyst. Argue why this is a BUY. For every point, provide the 'sourceIndex'.",
      prompt: `Sources:\n${indexed}\n\nQuestion: ${QUESTION}`,
    }),
    generateText({
      model: openai("gpt-4o-mini"),
      output: Output.object({ schema: AnalystSchema }),
      system: "You are a BEAR analyst. Argue why this is a SELL/AVOID. For every point, provide the 'sourceIndex'.",
      prompt: `Sources:\n${indexed}\n\nQuestion: ${QUESTION}`,
    }),
  ]);
  timings.debate = performance.now() - t;

  // 3. Judge verdict.
  t = performance.now();
  const verdict = await generateText({
    model: openai("gpt-4o"),
    output: Output.object({ schema: VerdictSchema }),
    system: "You are the Judge. Compare the Bull and Bear arguments and give a final verdict.",
    prompt: `Bull Arguments: ${JSON.stringify(bull.output.points)}
       Bear Arguments: ${JSON.stringify(bear.output.points)}
       Original Context: ${context}`,
  });
  timings.judge = performance.now() - t;

  // 4. Persist.
  t = performance.now();
  await prisma.debate.create({
    data: {
      userId,
      tickerId,
      userQuery: QUESTION,
      bullResponse: bull.output,
      bearResponse: bear.output,
      judgeVerdict: verdict.output,
    },
  });
  timings.persist = performance.now() - t;

  timings.total =
    timings.research + timings.debate + timings.judge + timings.persist;
  return timings;
}

async function main() {
  if (!process.env.OPENAI_API_KEY)
    throw new Error("OPENAI_API_KEY is not set (.env.local)");

  const user = await prisma.user.findUnique({
    where: { email: BENCH_USER_EMAIL },
  });
  if (!user)
    throw new Error(
      `Benchmark user not found. Run \`npm run seed:bench\` first.`,
    );

  const ticker = await prisma.ticker.findUnique({
    where: { userId_symbol: { userId: user.id, symbol: TICKER } },
  });

  console.log(`\nDebate pipeline latency benchmark`);
  console.log(`Iterations:  ${ITERATIONS}`);
  console.log(`Web search:  ${process.env.TAVILY_API_KEY ? "enabled (Tavily)" : "disabled (no TAVILY_API_KEY)"}`);
  console.log(`Question: "${QUESTION}"\n`);

  const webTool = await buildWebTool();

  // Warm-up — not counted.
  await runOnce(user.id, ticker?.id ?? null, webTool);

  const byStage: Record<string, number[]> = {
    research: [],
    debate: [],
    judge: [],
    persist: [],
    total: [],
  };

  for (let i = 0; i < ITERATIONS; i++) {
    const t = await runOnce(user.id, ticker?.id ?? null, webTool);
    for (const k of Object.keys(byStage)) byStage[k].push(t[k]);
    console.log(`  iteration ${i + 1}/${ITERATIONS}: ${t.total.toFixed(0)} ms`);
  }

  console.log("");
  reportRow("Research (RAG+web)", stats(byStage.research));
  reportRow("Debate (bull+bear)", stats(byStage.debate));
  reportRow("Judge", stats(byStage.judge));
  reportRow("Persist (DB)", stats(byStage.persist));
  reportRow("TOTAL", stats(byStage.total));
  console.log("");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
