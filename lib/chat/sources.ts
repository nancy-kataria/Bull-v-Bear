import type { Source } from "@/types";

// helpers for normalizing research results into displayable `Source[]`.

const SNIPPET_LEN = 220;
export interface ResearchStep {
  toolResults: { output?: unknown }[];
}

export interface LocalChunk {
  id: string;
  content: string;
  ticker: string;
}

export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
}

// Tavily web results from the research agent's steps
export function buildWebSources(steps: ResearchStep[]): Source[] {
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

// The user's retrieved note/document chunks
export function buildInternalSources(
  results: LocalChunk[],
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
