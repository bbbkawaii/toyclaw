export const DIRECTION_PRESETS = ["CHANGE_COLOR", "SEASONAL_THEME", "ADD_ACCESSORY"] as const;
export type DirectionPreset = (typeof DIRECTION_PRESETS)[number];

export const TARGET_MARKETS = [
  "US",
  "EUROPE",
  "MIDDLE_EAST",
  "SOUTHEAST_ASIA",
  "JAPAN_KOREA",
] as const;
export type TargetMarket = (typeof TARGET_MARKETS)[number];

export interface DirectionInput {
  mode: "TEXT" | "PRESET";
  value: string;
}

export interface ShapeFeature {
  category: string;
  confidence: number;
  evidence?: string;
}

export interface ColorFeature {
  name: string;
  hex: string;
  proportion: number;
  confidence: number;
}

export interface NamedFeature {
  name: string;
  confidence: number;
  evidence?: string;
}

export interface AnalyzeResponse {
  requestId: string;
  input: {
    imageUrl: string;
    direction: DirectionInput;
  };
  features: {
    shape: ShapeFeature;
    colors: ColorFeature[];
    material: NamedFeature[];
    style: NamedFeature[];
  };
  model: {
    provider: string;
    modelName: string;
    latencyMs: number;
  };
}

export interface TabooFinding {
  ruleId: string;
  title: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
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

export interface SuggestedColor {
  name: string;
  hex: string;
  usage: string;
}

export interface ColorSchemeSuggestion {
  schemeName: string;
  positioning: string;
  colors: SuggestedColor[];
  reason: string;
}

export interface ShapeDetailAdjustment {
  title: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  actions: string[];
  reason: string;
}

export interface PackagingStyleSuggestion {
  styleName: string;
  materials: string[];
  visualElements: string[];
  copyTone: string;
  reason: string;
}

export interface ImageAssetResult {
  status: "READY" | "SKIPPED" | "FAILED";
  prompt: string;
  imageBase64?: string;
  mimeType?: string;
  reason?: string;
}

export type RetryableRedesignAssetKey =
  | "previewImage"
  | "threeView.front"
  | "threeView.side"
  | "threeView.back";

export interface ShowcaseVideoKeyframe {
  label: string;
  prompt: string;
  imageBase64?: string;
  mimeType?: string;
}

export interface RedesignSuggestionResponse {
  suggestionId: string;
  requestId: string;
  crossCulturalAnalysisId: string;
  targetMarket: TargetMarket;
  colorSchemes: ColorSchemeSuggestion[];
  shapeAdjustments: ShapeDetailAdjustment[];
  packagingSuggestions: PackagingStyleSuggestion[];
  assets: {
    previewImage: ImageAssetResult;
    threeView: {
      front: ImageAssetResult;
      side: ImageAssetResult;
      back: ImageAssetResult;
    };
    showcaseVideo: {
      status: "SCRIPT_ONLY" | "SKIPPED";
      script: string;
      keyframes: ShowcaseVideoKeyframe[];
      reason?: string;
    };
  };
  model?: {
    provider: string;
    modelName: string;
  };
  createdAt: string;
}

export interface AppErrorResponse {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}
