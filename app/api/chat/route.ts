import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";
import { tavilySearch } from "@tavily/ai-sdk";
import { findRelevantFinance } from "@/lib/search";

/**
 * 
 * @param req 
 * @returns 
 */
export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1].content;

  try {
    // to gather context (Local RAG + Tavily Web Search)
    const { text: context } = await generateText({
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
            const results = await findRelevantFinance(query);
            return JSON.stringify(results);
          },
        },
        searchWeb: tavilySearch({
          apiKey: process.env.TAVILY_API_KEY,
          searchDepth: "advanced",
        }),
      },
    });

    // parallel debate (Bull vs Bear)
    const [bull, bear] = await Promise.all([
      generateText({
        model: openai("gpt-4o-mini"),
        system:
          "You are a BULL analyst. Use the context to argue why this is a BUY.",
        prompt: `Context: ${context}\n\nQuestion: ${lastMessage}`,
      }),
      generateText({
        model: openai("gpt-4o-mini"),
        system:
          "You are a BEAR analyst. Use the context to argue why this is a SELL/AVOID.",
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

    const sources = verdict.steps.flatMap(step => 
      step.toolResults.map(toolResult => {
        return toolResult.output; 
      })).filter(Boolean);

    return Response.json({
      bull: bull.text,
      bear: bear.text,
      decision: verdict.output,
      sources: JSON.stringify(sources),
    });
  } catch (error) {
    console.error("Chat Error:", error);
    return Response.json(
      { error: "Failed to generate jury verdict" },
      { status: 500 },
    );
  }
}
