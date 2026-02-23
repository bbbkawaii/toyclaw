export interface ImageGenerationInput {
  prompt: string;
  referenceImageBase64?: string;
  mimeType?: string;
}

export interface ImageGenerationResult {
  imageBase64?: string;
  mimeType?: string;
  rawResponse: unknown;
}

export interface ImageGenerationProvider {
  readonly providerName: string;
  readonly modelName: string;
  generatePreview(input: ImageGenerationInput): Promise<ImageGenerationResult>;
}
