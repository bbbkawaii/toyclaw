export const TARGET_MARKETS = [
  "US",
  "EUROPE",
  "MIDDLE_EAST",
  "SOUTHEAST_ASIA",
  "JAPAN_KOREA",
] as const;

export type TargetMarket = (typeof TARGET_MARKETS)[number];

export const TABOO_SEVERITIES = ["HIGH", "MEDIUM", "LOW"] as const;

export type TabooSeverity = (typeof TABOO_SEVERITIES)[number];

export interface TabooFinding {
  ruleId: string;
  title: string;
  severity: TabooSeverity;
  matched: boolean;
  evidence: string[];
  risk: string;
  recommendation: string;
}

export interface FestivalThemeMatch {
  themeId: string;
  name: string;
  season: string;
  relevance: number;
  reason: string;
  suggestedElements: string[];
  suggestedColors: string[];
}

export interface CompetitorStyleReference {
  referenceId: string;
  brandArchetype: string;
  styleSummary: string;
  matchingScore: number;
  opportunities: string[];
}

export interface CrossCulturalAnalysisResponse {
  analysisId: string;
  requestId: string;
  targetMarket: TargetMarket;
  tabooFindings: TabooFinding[];
  festivalThemes: FestivalThemeMatch[];
  competitorStyles: CompetitorStyleReference[];
  summary: string;
  createdAt: string;
}

