export type VerdictType = 'BUY' | 'SELL' | 'HOLD';

export type Phase = 'idle' | 'processing' | 'deliberating' | 'verdict';

export interface ChatPageProps {
  onBack: () => void;
}

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

export interface NavProps {
  setShowSignInModal: (value: boolean) => void;
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
