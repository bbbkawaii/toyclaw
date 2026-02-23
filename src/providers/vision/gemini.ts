import {
  FEATURE_EXTRACTION_SYSTEM_PROMPT,
  buildFeatureExtractionUserPrompt,
} from "../../modules/image-input/prompts/feature-extract";
import { extractedFeaturesSchema } from "../../modules/image-input/schemas";
import { AppError } from "../../lib/errors";
import { fetchWithProxy } from "../../lib/http/fetch-with-proxy";
import type { VisionProvider, VisionProviderInput, VisionProviderResult } from "./base";

export interface GeminiVisionProviderOptions {
  apiBaseUrl: string;
  apiKey: string;
  modelName: string;
  timeoutMs: number;
}

export class GeminiVisionProvider implements VisionProvider {
  readonly providerName = "gemini";
  readonly modelName: string;

  private readonly apiBaseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(options: GeminiVisionProviderOptions) {
    this.apiBaseUrl = options.apiBaseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.modelName = normalizeModelName(options.modelName);
    this.timeoutMs = options.timeoutMs;
  }

  async extractFeatures(input: VisionProviderInput): Promise<VisionProviderResult> {
    let latestError: AppError | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const startedAt = Date.now();
        const response = await this.postWithTimeout({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${FEATURE_EXTRACTION_SYSTEM_PROMPT}\n\n${buildFeatureExtractionUserPrompt(input.direction)}`,
                },
                {
                  inlineData: {
                    mimeType: input.mimeType,
                    data: input.imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        });

        const textOutput = this.extractTextResponse(response);
        const parsedJson = this.parseJson(textOutput);
        const features = extractedFeaturesSchema.parse(parsedJson);

        return {
          features,
          rawModelOutput: response,
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

  private async postWithTimeout(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const endpoint = `${this.apiBaseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`;
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetchWithProxy(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const failureBody = await response.text();
        throw new AppError(`Vision provider request failed with status ${response.status}`, "PROVIDER_ERROR", 502, {
          status: response.status,
          body: failureBody.slice(0, 1000),
        });
      }

      return (await response.json()) as Record<string, unknown>;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError("Vision provider request timed out", "PROVIDER_TIMEOUT", 504);
      }
      throw error;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private extractTextResponse(response: Record<string, unknown>): string {
    const candidates = response.candidates;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      throw new AppError("Model output is missing candidates", "MODEL_OUTPUT_INVALID", 502);
    }

    const candidate = candidates[0];
    if (!candidate || typeof candidate !== "object") {
      throw new AppError("Model output is malformed", "MODEL_OUTPUT_INVALID", 502);
    }

    const content = "content" in candidate ? (candidate as { content?: unknown }).content : undefined;
    if (!content || typeof content !== "object") {
      throw new AppError("Model output content is missing", "MODEL_OUTPUT_INVALID", 502);
    }

    const parts = "parts" in content ? (content as { parts?: unknown }).parts : undefined;
    if (!Array.isArray(parts) || parts.length === 0) {
      throw new AppError("Model output is missing parts", "MODEL_OUTPUT_INVALID", 502);
    }

    const text = parts
      .map((item) => {
        if (item && typeof item === "object") {
          const value = "text" in item ? (item as { text?: unknown }).text : undefined;
          return typeof value === "string" ? value : "";
        }
        return "";
      })
      .join("\n")
      .trim();

    if (!text) {
      throw new AppError("Model output text is empty", "MODEL_OUTPUT_INVALID", 502);
    }

    return text;
  }

  private parseJson(payload: string): unknown {
    try {
      return JSON.parse(payload);
    } catch {
      const fencedMatch = payload.match(/```json\s*([\s\S]*?)\s*```/i) ?? payload.match(/```([\s\S]*?)```/i);
      if (fencedMatch && fencedMatch[1]) {
        return JSON.parse(fencedMatch[1]);
      }

      const firstBrace = payload.indexOf("{");
      const lastBrace = payload.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        return JSON.parse(payload.slice(firstBrace, lastBrace + 1));
      }

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
}

function normalizeModelName(modelName: string): string {
  return modelName.trim().replace(/^models\//i, "");
}
