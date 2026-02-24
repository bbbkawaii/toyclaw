import type { TargetMarket } from "../cross-cultural/types";

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

export type SuggestionPriority = "HIGH" | "MEDIUM" | "LOW";

export interface ShapeDetailAdjustment {
  title: string;
  priority: SuggestionPriority;
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

export type GeneratedAssetStatus = "READY" | "SKIPPED" | "FAILED";

export interface ImageAssetResult {
  status: GeneratedAssetStatus;
  prompt: string;
  imageBase64?: string;
  mimeType?: string;
  reason?: string;
}

export interface ThreeViewAssetResult {
  front: ImageAssetResult;
  side: ImageAssetResult;
  back: ImageAssetResult;
}

export interface ShowcaseVideoKeyframe {
  label: string;
  prompt: string;
  imageBase64?: string;
  mimeType?: string;
}

export interface ShowcaseVideoAssetResult {
  status: "SCRIPT_ONLY" | "SKIPPED";
  script: string;
  keyframes: ShowcaseVideoKeyframe[];
  reason?: string;
}

export interface RedesignAssets {
  previewImage: ImageAssetResult;
  threeView: ThreeViewAssetResult;
  showcaseVideo: ShowcaseVideoAssetResult;
}

export interface RedesignAssetFlags {
  previewImage: boolean;
  threeView: boolean;
  showcaseVideo: boolean;
}

export type RetryableRedesignAsset = "previewImage" | "threeView.front" | "threeView.side" | "threeView.back";

export interface RedesignSuggestionResponse {
  suggestionId: string;
  requestId: string;
  crossCulturalAnalysisId: string;
  targetMarket: TargetMarket;
  colorSchemes: ColorSchemeSuggestion[];
  shapeAdjustments: ShapeDetailAdjustment[];
  packagingSuggestions: PackagingStyleSuggestion[];
  assets: RedesignAssets;
  model?: {
    provider: string;
    modelName: string;
  };
  createdAt: string;
}
