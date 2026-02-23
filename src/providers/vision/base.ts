import type { DirectionInput, ExtractedFeatures } from "../../modules/image-input/types";

export interface VisionProviderInput {
  imageBase64: string;
  mimeType: string;
  direction: DirectionInput;
}

export interface VisionProviderResult {
  features: ExtractedFeatures;
  rawModelOutput?: unknown;
  latencyMs: number;
}

export interface VisionProvider {
  readonly providerName: string;
  readonly modelName: string;
  extractFeatures(input: VisionProviderInput): Promise<VisionProviderResult>;
}
