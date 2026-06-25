// Shared domain types used across multiple modules.
// Component prop types live with their components; API DTOs live in lib/api.ts.

export type VerdictType = 'BUY' | 'SELL' | 'HOLD';

export type Phase = 'idle' | 'processing' | 'deliberating' | 'verdict';

// ---------------------------------------------------------------------------
// Chat / debate
// ---------------------------------------------------------------------------
export interface ChatAnalystPoint {
  tag: string;
  content: string;
  sourceIndex: number;
}

export interface ChatApiResponse {
  bull: {
    points: ChatAnalystPoint[];
  };
  bear: {
    points: ChatAnalystPoint[];
  };
  decision: {
    verdict: VerdictType;
    confidence: number;
    reasoning: string;
    keyRisks: string[];
  };
  sources?: unknown[];
}

export interface Argument {
  point: string;
  weight: 'strong' | 'moderate' | 'weak';
  riskTag?: string;
  sourceIndex?: number;
}

export interface Source {
  id: string;
  title: string;
  domain: string;
  url: string;
  type: 'web' | 'note' | 'filing';
  date: string;
  snippet?: string;
}

export interface VerdictData {
  ticker: string;
  companyName?: string;
  price?: number;
  change?: number;
  changePct?: number;
  verdict: VerdictType;
  confidence: number;
  summary: string;
  bullArguments: Argument[];
  bearArguments: Argument[];
  sources: Source[];
  riskTags: string[];
  processingSteps?: ProcessingStep[];
}

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done';
}

// ---------------------------------------------------------------------------
// Market data
// ---------------------------------------------------------------------------
export interface TickerItem {
  sym: string;
  chg: string;
  up: boolean;
}

export interface ActiveTradedItem {
  ticker: string;
  change_percentage: string;
}

// ---------------------------------------------------------------------------
// Notes / tickers / documents
// ---------------------------------------------------------------------------
export interface Ticker {
  id: string;
  symbol: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradingNote {
  id: string;
  userId: string;
  tickerId: string;
  ticker?: Ticker;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Note = {
  id: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

export interface Folder {
  id: string;
  ticker: string;
  notes: (Note & { dbId?: string })[];
  docs: Doc[];
}

export type DocType = "pdf" | "docx";

export type Doc = {
  id: string;
  name: string;
  type: DocType;
  size?: number;
  createdAt: number;
};
