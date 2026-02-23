export const DIRECTION_PRESETS = ["CHANGE_COLOR", "SEASONAL_THEME", "ADD_ACCESSORY"] as const;

export type DirectionPreset = (typeof DIRECTION_PRESETS)[number];

export type DirectionMode = "TEXT" | "PRESET";

export interface DirectionInput {
  mode: DirectionMode;
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

export interface ExtractedFeatures {
  shape: ShapeFeature;
  colors: ColorFeature[];
  material: NamedFeature[];
  style: NamedFeature[];
}

export interface AnalyzeResponse {
  requestId: string;
  input: {
    imageUrl: string;
    direction: DirectionInput;
  };
  features: ExtractedFeatures;
  model: {
    provider: string;
    modelName: string;
    latencyMs: number;
  };
}
