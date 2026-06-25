import type {
  Argument,
  ChatAnalystPoint,
  ChatApiResponse,
  Source,
  VerdictData,
} from "@/types";

// helpers to shape chat-API responses into the analysis-room view models.

// Pull the first `$TICKER` from a query; defaults to "NVDA" when none is present.
export const extractTicker = (query: string): string =>
  query.match(/\$([A-Z]{1,5})\b/)?.[1] ?? "NVDA";

// Mapping an analyst's points into weighted Arguments (first 4, by descending weight).
export const buildArguments = (analystData: {
  points: ChatAnalystPoint[];
}): Argument[] => {
  return analystData.points.slice(0, 4).map((pt, index) => ({
    point: pt.content,
    weight: index === 0 ? "strong" : index === 1 ? "moderate" : "weak",
    riskTag: pt.tag,
    sourceIndex: pt.sourceIndex,
  }));
};

// Assemble the full verdict data from the raw API response.
export const buildVerdictData = (
  question: string,
  apiResponse: ChatApiResponse,
  sources: Source[],
  tickerFromParams?: string | null,
): VerdictData => {
  const ticker = tickerFromParams || extractTicker(question);

  return {
    ticker,
    verdict: apiResponse.decision.verdict,
    confidence: apiResponse.decision.confidence,
    summary: apiResponse.decision.reasoning,
    bullArguments: buildArguments(apiResponse.bull),
    bearArguments: buildArguments(apiResponse.bear),
    riskTags: apiResponse.decision.keyRisks,
    sources,
  };
};
