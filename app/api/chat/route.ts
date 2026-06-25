import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { tavilySearch } from "@tavily/ai-sdk";
import { findRelevantFinance } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/prisma/prisma";
import type { Source } from "@/types";

const SNIPPET_LEN = 220;

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
}

function buildWebSources(
  steps: { toolResults: { output?: unknown }[] }[],
): Source[] {
  const sources: Source[] = [];
  for (const step of steps) {
    for (const tr of step.toolResults) {
      const out = tr.output;
      if (
        !out ||
        typeof out !== "object" ||
        !Array.isArray((out as { results?: unknown }).results)
      ) {
        continue;
      }
      const results = (out as {
        results: {
          title?: string;
          url?: string;
          content?: string;
          publishedDate?: string;
        }[];
      }).results;
      for (const r of results) {
        if (!r?.url) continue;
        sources.push({
          id: `web-${sources.length}`,
          type: "web",
          title: r.title || r.url,
          domain: hostname(r.url),
          url: r.url,
          snippet: (r.content || "").slice(0, SNIPPET_LEN),
          date: (r.publishedDate || "").slice(0, 10),
        });
      }
    }
  }
  return sources;
}

/** The user's retrieved note/document chunks → internal sources (snippets, no URL). */
function buildInternalSources(
  results: { id: string; content: string; ticker: string }[],
  activeTicker: string | null,
): Source[] {
  return results
    .filter((r) => r.content)
    .map((r, i) => ({
      id: r.id || `note-${i}`,
      type: "note" as const,
      title: `${(r.ticker || activeTicker || "Your").toUpperCase()} — from your library`,
      domain: "Your notes & documents",
      url: "",
      snippet: r.content.slice(0, SNIPPET_LEN),
      date: "",
    }));
}

const AnalystSchema = z.object({
  points: z.array(
    z.object({
      tag: z.string().describe("Short 2-3 word risk or growth tag"),
      content: z.string().describe("The full argument point"),
      sourceIndex: z
        .number()
        .describe("The index of the source from context that supports this"),
    }),
  ),
});

/**
 * Handles chat requests by gathering finance context via tool-calling,
 * generating bull and bear analyses, and returning a structured verdict.
 *
 * @param req Incoming request containing messages array.
 * @returns JSON response with `bull`, `bear`, `decision`, and `sources`,
 * or a 500 error payload when generation fails.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { messages, tickerContext } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // Extract the ticker
    const tickerMatch = lastMessage.match(/\$([A-Z]{1,5})\b/);
    const activeTicker = tickerContext 
      ? tickerContext.toUpperCase() 
      : (tickerMatch ? tickerMatch[1].toUpperCase() : null);

    // Deterministic local RAG: always retrieve the user's relevant notes/documents
    // for this ticker, rather than leaving it to the model to decide to call a tool.
    const localResults = await findRelevantFinance(
      lastMessage,
      user.id,
      6,
      activeTicker,
    );

    // Web research via the model (Tavily) for fresh external context.
    const researchResult = await generateText({
      model: openai("gpt-4o"),
      system:
        "You are a research assistant. Use web search to find the most relevant, recent financial facts.",
      prompt: lastMessage,
      tools: {
        searchWeb: tavilySearch({
          apiKey: process.env.TAVILY_API_KEY,
          searchDepth: "advanced",
        }),
      },
    });

    // Internal sources first (the user's own data), then web — one ordered array
    // so the sourceIndex the analysts cite lines up with what the UI renders.
    const internalSources = buildInternalSources(localResults, activeTicker);
    const webSources = buildWebSources(researchResult.steps);
    const sources = [...internalSources, ...webSources];

    // Feed both the user's data and web findings into the debate context.
    const localContext = localResults
      .map((r, i) => `[Your note/doc ${i}] (${r.ticker}): ${r.content}`)
      .join("\n\n");
    const context = [localContext, researchResult.text]
      .filter(Boolean)
      .join("\n\n");

    const indexedSourcesForAI = sources
      .map((s, i) => `[Source ${i}] (${s.type}): ${s.title}\n${s.snippet ?? ""}`)
      .join("\n\n");

    // parallel debate (Bull vs Bear)
    const [bull, bear] = await Promise.all([
      generateText({
        model: openai("gpt-4o-mini"),
        output: Output.object({ schema: AnalystSchema }),
        system: `You are a BULL analyst. Argue why this is a BUY. 
             For every point, you MUST provide the 'sourceIndex' that matches the source list provided.`,
        prompt: `Sources:\n${indexedSourcesForAI}\n\nQuestion: ${lastMessage}`,
      }),
      generateText({
        model: openai("gpt-4o-mini"),
        output: Output.object({ schema: AnalystSchema }),
        system: `You are a BEAR analyst. Argue why this is a SELL/AVOID.
             For every point, you MUST provide the 'sourceIndex' that matches the source list provided.`,
        prompt: `Sources:\n${indexedSourcesForAI}\n\nQuestion: ${lastMessage}`,
      }),
    ]);

    // the judge's final verdict
    const verdict = await generateText({
      model: openai("gpt-4o"),
      output: Output.object({
        schema: z.object({
          verdict: z.enum(["BUY", "HOLD", "SELL"]),
          confidence: z.number().min(0).max(1),
          reasoning: z.string(),
          keyRisks: z.array(z.string()),
        }),
      }),
      system:
        "You are the Judge. Compare the Bull and Bear arguments and give a final verdict.",
      prompt: `Bull Arguments: ${JSON.stringify(bull.output.points)}
         Bear Arguments: ${JSON.stringify(bear.output.points)}
         Original Context: ${context}`,
    });


    // Get or create ticker for debate association
    let tickerId: string | null = null;
    if (activeTicker) {
      const tickerRecord = await prisma.ticker.findUnique({
        where: {
          userId_symbol: {
            userId: user.id,
            symbol: activeTicker,
          },
        },
      });
      tickerId = tickerRecord?.id || null;

      if (!tickerId) {
        const newTicker = await prisma.ticker.create({
          data: { symbol: activeTicker, userId: user.id },
        });
        tickerId = newTicker.id;
      }
    }

    const savedDebate = await prisma.debate.create({
      data: {
        userId: user.id,
        tickerId, // null for general (tickerless) debates
        userQuery: lastMessage,
        // Store as native JSON (the columns are JSONB) — do not pre-stringify,
        // or the values get double-encoded as JSON strings inside JSONB.
        bullResponse: bull.output,
        bearResponse: bear.output,
        judgeVerdict: verdict.output,
      },
    });

    return Response.json({
      id: savedDebate.id, // Return the ID so the frontend can reference it
      bull: bull.output,
      bear: bear.output,
      decision: verdict.output,
      sources: sources,
    });
  } catch (error) {
    console.error("Chat Error:", error);
    return Response.json(
      { error: "Failed to generate jury verdict" },
      { status: 500 },
    );
  }
}
