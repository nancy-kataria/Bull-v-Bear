export type VerdictType = 'BUY' | 'SELL' | 'HOLD';

export type Phase = 'idle' | 'processing' | 'deliberating' | 'verdict';

export interface ChatPageSearchResultMetadata {
  title?: string;
  domain?: string;
  url?: string;
  type?: Source['type'];
  date?: string;
  [key: string]: unknown;
}

export interface ChatPageSearchResult {
  id?: string;
  content?: string;
  metadata?: ChatPageSearchResultMetadata;
}

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

export interface BulletPoint {
  label: string;
  detail: string;
}

export interface VerdictCardProps {
  ticker: string;
  price: string;
  change: string;
  changePositive?: boolean;
  verdict: VerdictType;
  confidence: number;
  bullPoints: BulletPoint[];
  bearPoints: BulletPoint[];
  sources?: number;
  tilt?: boolean;
}

export interface DisplayVerdictCardProps {
  data: VerdictData;
  animate?: boolean;
}

export interface BullBearPodiumProps {
  side: 'bull' | 'bear';
  arguments: Argument[];
  streaming?: boolean;
}

export interface ProcessingStepsProps {
  steps: ProcessingStep[];
}

export interface GaugeProps {
  confidence: number;
  verdict: VerdictType;
  size?: number;
}

export interface RiskPillProps {
  tag: string;
  relatedSentence?: string;
  onHover: (tag: string | null) => void;
  active: boolean;
}

export interface ConfidenceGaugeProps {
  value: number;
  size?: number;
  variant?: 'bull' | 'bear' | 'judge';
}

export interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface NavProps {
  setShowSignInModal: (value: boolean) => void;
  setShowSignUpModal: (value: boolean) => void;
}

export interface StatProps {
  value: string;
  label: string;
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

export interface TickerItem {
  sym: string;
  chg: string;
  up: boolean;
}
export interface ActiveTradedItem {
  ticker: string;
  change_percentage: string;
}

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
  chunks?: NoteChunk[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteChunk {
  id: string;
  noteId: string;
  note?: TradingNote;
  chunkContent: string;
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

export interface AnalysisPanelProps {
  phase: Phase;
  showBull: boolean;
  showBear: boolean;
  verdict: VerdictData | null;
}

export type DocType = "pdf" | "docx";

export type Doc = {
  id: string;
  name: string;
  type: DocType;
  size?: number;
  createdAt: number;
};