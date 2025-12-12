
export enum ViewState {
  HOME = 'HOME',
  SCAN_UPLOAD = 'SCAN_UPLOAD',
  ANALYSIS_LOADING = 'ANALYSIS_LOADING',
  ANALYSIS_RESULT = 'ANALYSIS_RESULT',
  VAULT_DASHBOARD = 'VAULT_DASHBOARD',
  NEGOTIATION_COACH = 'NEGOTIATION_COACH',
  COMPANY_SEARCH = 'COMPANY_SEARCH',
  COMMUNITY = 'COMMUNITY',
  CONTRACT_CHAT = 'CONTRACT_CHAT',
  EDUCATION = 'EDUCATION',
  SETTINGS = 'SETTINGS'
}

export enum RiskLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum UserIdentity {
  CONSUMER = 'Individual Consumer',
  FREELANCER = 'Freelancer / Sole Prop',
  SMALL_BUSINESS = 'Small Business Owner'
}

export enum NegotiationTone {
  POLITE = 'Polite & Cooperative',
  ASSERTIVE = 'Firm & Professional',
  AGGRESSIVE = 'Aggressive & Hardball'
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export interface ContractFlag {
  type: 'RED' | 'YELLOW' | 'GREEN';
  clause: string;
  explanation: string;
  financialImpact?: string;
  confidence: number; // 0-100% certainty
}

export interface TrickeryTactic {
  tactic: string; 
  quote?: string; 
  explanation: string; 
  counterMove: string; 
  confidence: number; // 0-100% certainty
}

export interface NegotiationPoint {
    point: string;
    confidence: number; // 0-100% likelihood of success
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ContractAnalysis {
  id?: string;
  hash?: string; // For Context Caching
  providerName?: string;
  dateAdded?: string;
  summary: string;
  parties: string[];
  duration: string;
  totalCost: string;
  riskScore: number; 
  riskLevel: RiskLevel;
  flags: ContractFlag[];
  trickery: TrickeryTactic[];
  betterAlternatives?: string[];
  negotiationPoints: NegotiationPoint[];
  groundingSources?: GroundingSource[];
  contractType: string; 
}

export interface ContractVersion {
  versionId: string;
  dateCreated: string;
  summary: string;
  riskScore: number;
  totalCost: string;
  changesNote?: string; 
}

export interface VaultContract extends ContractAnalysis {
  id: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
  renewalDate?: string;
  thumbnail?: string; // Base64 image data or 'PDF' marker string
  savedDraft?: {
    subject: string;
    body: string;
    updatedAt: number;
  };
  versions: ContractVersion[]; 
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sources?: GroundingSource[];
}

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  trustScore: number; 
  logoUrl?: string;
  commonTraps: string[];
  positiveTraits: string[];
  userRatings: {
    negotiability: number; 
    transparency: number; 
  };
  totalContractsAnalyzed: number;
  sources?: GroundingSource[];
}

export interface CommunityReview {
  id: string;
  companyId: string;
  companyName: string;
  authorName: string; 
  rating: number; 
  title: string;
  content: string;
  timestamp: number;
  status: ReviewStatus;
  verifiedCustomer: boolean; 
  linkedContractId?: string; 
}

export interface IntegrationStatus {
    id: string;
    name: string;
    icon: string;
    connected: boolean;
    description: string;
}
