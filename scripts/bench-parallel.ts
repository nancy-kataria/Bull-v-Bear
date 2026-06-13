import "./_env";
import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { stats, reportRow } from "./_stats";

/**
 * Quantifies the win from running the bull and bear analyst agents
 * concurrently (Promise.all in app/api/chat/route.ts) versus sequentially.
 * Runs the same two LLM calls both ways and reports the latency delta.
 *
 * Usage: npm run bench:parallel
 *   BENCH_ITERATIONS=10 npm run bench:parallel
 */
const ITERATIONS = Number(process.env.BENCH_ITERATIONS ?? 8);

const AnalystSchema = z.object({
  points: z.array(
    z.object({
      tag: z.string(),
      content: z.string(),
      sourceIndex: z.number(),
    }),
  ),
});

const SOURCES = `[Source 0]: {"fact":"Revenue grew 22% YoY to $35B, beating estimates."}
[Source 1]: {"fact":"Gross margin expanded to 75% on strong data-center demand."}
[Source 2]: {"fact":"Forward P/E of 45 sits well above the 5-year average of ~30."}
[Source 3]: {"fact":"Two customers account for roughly 40% of total revenue."}`;
const QUESTION = "Is this a buy at current levels?";

const analyst = (side: "BULL" | "BEAR") =>
  generateText({
    model: openai("gpt-4o-mini"),
    output: Output.object({ schema: AnalystSchema }),
    system:
      side === "BULL"
        ? "You are a BULL analyst. Argue why this is a BUY. For every point, provide the 'sourceIndex'."
        : "You are a BEAR analyst. Argue why this is a SELL/AVOID. For every point, provide the 'sourceIndex'.",
    prompt: `Sources:\n${SOURCES}\n\nQuestion: ${QUESTION}`,
  });

async function main() {
  if (!process.env.OPENAI_API_KEY)
    throw new Error("OPENAI_API_KEY is not set (.env.local)");

  console.log(`\nAnalyst-agent parallelization benchmark`);
  console.log(`Iterations:  ${ITERATIONS} (each runs both modes)\n`);

  // Warm-up — not counted.
  await Promise.all([analyst("BULL"), analyst("BEAR")]);

  const seq: number[] = [];
  const par: number[] = [];

  for (let i = 0; i < ITERATIONS; i++) {
    let t0 = performance.now();
    await analyst("BULL");
    await analyst("BEAR");
    seq.push(performance.now() - t0);

    t0 = performance.now();
    await Promise.all([analyst("BULL"), analyst("BEAR")]);
    par.push(performance.now() - t0);
  }

  const seqStats = stats(seq);
  const parStats = stats(par);
  reportRow("Sequential", seqStats);
  reportRow("Parallel (Promise.all)", parStats);

  const reduction = ((seqStats.mean - parStats.mean) / seqStats.mean) * 100;
  const speedup = seqStats.mean / parStats.mean;
  console.log(
    `\nMean latency reduction: ${reduction.toFixed(1)}%  ` +
      `(${speedup.toFixed(2)}x speedup)\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
