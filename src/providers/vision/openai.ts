import OpenAI from "openai";
import {
  FEATURE_EXTRACTION_SYSTEM_PROMPT,
  buildFeatureExtractionUserPrompt,
} from "../../modules/image-input/prompts/feature-extract";
import { extractedFeaturesSchema } from "../../modules/image-input/schemas";
import type { VisionProvider, VisionProviderInput, VisionProviderResult } from "./base";
import { AppError } from "../../lib/errors";

export interface OpenAIVisionProviderOptions {
  apiKey: string;
  modelName: string;
  timeoutMs: number;
}

const MODEL_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    shape: {
      type: "object",
      additionalProperties: false,
      properties: {
        category: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        evidence: { type: "string" },
      },
      required: ["category", "confidence"],
    },
    colors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          hex: { type: "string" },
          proportion: { type: "number", minimum: 0, maximum: 1 },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["name", "hex", "proportion", "confidence"],
      },
      minItems: 1,
    },
    material: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          evidence: { type: "string" },
        },
        required: ["name", "confidence"],
      },
      minItems: 1,
    },
    style: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          evidence: { type: "string" },
        },
        required: ["name", "confidence"],
      },
      minItems: 1,
    },
  },
  required: ["shape", "colors", "material", "style"],
};

export class OpenAIVisionProvider implements VisionProvider {
  readonly providerName = "openai";
  readonly modelName: string;

  private readonly client: OpenAI;
  private readonly timeoutMs: number;

  constructor(options: OpenAIVisionProviderOptions) {
    this.client = new OpenAI({ apiKey: options.apiKey });
    this.modelName = options.modelName;
    this.timeoutMs = options.timeoutMs;
  }

  async extractFeatures(input: VisionProviderInput): Promise<VisionProviderResult> {
    let latestError: AppError | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const startedAt = Date.now();
        const response = await this.runWithTimeout(this.client.responses.create({
          model: this.modelName,
          input: [
            {
              role: "system",
              content: [{ type: "input_text", text: FEATURE_EXTRACTION_SYSTEM_PROMPT }],
            },
            {
              role: "user",
              content: [
                { type: "input_text", text: buildFeatureExtractionUserPrompt(input.direction) },
                {
                  type: "input_image",
                  image_url: `data:${input.mimeType};base64,${input.imageBase64}`,
                },
              ],
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "toy_features",
              schema: MODEL_OUTPUT_SCHEMA,
              strict: true,
            },
          },
        } as never));

        const rawOutput = this.extractTextResponse(response as unknown as Record<string, unknown>);
        const parsedJson = this.parseJson(rawOutput);
        const features = extractedFeaturesSchema.parse(parsedJson);

        return {
          features,
          rawModelOutput: parsedJson,
          latencyMs: Date.now() - startedAt,
        };
      } catch (error) {
        latestError = this.normalizeProviderError(error);
        if (latestError.code !== "MODEL_OUTPUT_INVALID") {
          throw latestError;
        }
      }
    }

    throw latestError ?? new AppError("Model output is invalid", "MODEL_OUTPUT_INVALID", 502);
  }

  private extractTextResponse(response: Record<string, unknown>): string {
    if (typeof response.output_text === "string" && response.output_text.trim().length > 0) {
      return response.output_text;
    }

    const output = response.output;
    if (Array.isArray(output)) {
      for (const message of output) {
        if (
          message &&
          typeof message === "object" &&
          "content" in message &&
          Array.isArray((message as { content?: unknown }).content)
        ) {
          const content = (message as { content: Array<Record<string, unknown>> }).content;
          for (const part of content) {
            if (part.type === "output_text" && typeof part.text === "string") {
              return part.text;
            }
          }
        }
      }
    }

    throw new AppError("Model output is missing text payload", "MODEL_OUTPUT_INVALID", 502);
  }

  private parseJson(payload: string): unknown {
    try {
      return JSON.parse(payload);
    } catch {
      throw new AppError("Model returned non-JSON output", "MODEL_OUTPUT_INVALID", 502);
    }
  }

  private normalizeProviderError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      return new AppError("Vision provider request timed out", "PROVIDER_TIMEOUT", 504);
    }

    if (error instanceof Error) {
      return new AppError(`Vision provider request failed: ${error.message}`, "PROVIDER_ERROR", 502);
    }

    return new AppError("Vision provider request failed", "PROVIDER_ERROR", 502);
  }

  private async runWithTimeout<T>(promise: Promise<T>): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new AppError("Vision provider request timed out", "PROVIDER_TIMEOUT", 504));
      }, this.timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}
