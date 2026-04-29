import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { tavilySearch } from "@tavily/ai-sdk";
import { findRelevantFinance } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";

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
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // to gather context (Local RAG + Tavily Web Search)
    const researchResult = await generateText({
      model: openai("gpt-4o"),
      system:
        "You are a research assistant. Find the most relevant financial facts.",
      prompt: lastMessage,
      tools: {
        searchLocalDB: {
          description:
            "Search internal database for historical financial insights.",
          inputSchema: z.object({ query: z.string() }),
          execute: async ({ query }) => {
            const results = await findRelevantFinance(query, user.id);
            return JSON.stringify(results);
          },
        },
        searchWeb: tavilySearch({
          apiKey: process.env.TAVILY_API_KEY,
          searchDepth: "advanced",
        }),
      },
    });
    const context = researchResult.text;

    // parallel debate (Bull vs Bear)
    const [bull, bear] = await Promise.all([
      generateText({
        model: openai("gpt-4o-mini"),
        system:
          "You are a BULL analyst. Use the context to argue why this is a BUY. Use the specific revenue numbers and dates from the provided sources. Do not give general advice.",
        prompt: `Context: ${context}\n\nQuestion: ${lastMessage}`,
      }),
      generateText({
        model: openai("gpt-4o-mini"),
        system:
          "You are a BEAR analyst. Use the context to argue why this is a SELL/AVOID. Use the specific revenue numbers and dates from the provided sources. Do not give general advice.",
        prompt: `Context: ${context}\n\nQuestion: ${lastMessage}`,
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
      prompt: `Bull: ${bull.text}\n\nBear: ${bear.text}\n\nOriginal Context: ${context}`,
    });

    const sources = researchResult.steps
      .flatMap((step) =>
        step.toolResults.map((toolResult) => {
          return toolResult.output;
        }),
      )
      .filter(Boolean);

    return Response.json({
      bull: bull.text,
      bear: bear.text,
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
