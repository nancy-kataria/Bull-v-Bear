export type VerdictType = 'BUY' | 'SELL' | 'HOLD';

export interface Argument {
  point: string;
  weight: 'strong' | 'moderate' | 'weak';
  riskTag?: string;
}

export interface Source {
  id: string;
  title: string;
  domain: string;
  url: string;
  type: 'web' | 'note' | 'filing';
  date: string;
}

export interface VerdictData {
  ticker: string;
  companyName: string;
  price: number;
  change: number;
  changePct: number;
  verdict: VerdictType;
  confidence: number;
  summary: string;
  bullArguments: Argument[];
  bearArguments: Argument[];
  sources: Source[];
  riskTags: string[];
  processingSteps: ProcessingStep[];
}

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done';
}
