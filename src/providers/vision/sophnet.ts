import {
  FEATURE_EXTRACTION_SYSTEM_PROMPT,
  buildFeatureExtractionUserPrompt,
} from "../../modules/image-input/prompts/feature-extract";
import { extractedFeaturesSchema } from "../../modules/image-input/schemas";
import { fetchWithProxy } from "../../lib/http/fetch-with-proxy";
import type { VisionProvider, VisionProviderInput, VisionProviderResult } from "./base";
import { AppError } from "../../lib/errors";

export interface SophnetVisionProviderOptions {
  apiUrl: string;
  apiKey: string;
  modelName: string;
  timeoutMs: number;
}

export class SophnetVisionProvider implements VisionProvider {
  readonly providerName = "sophnet";
  readonly modelName: string;

  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(options: SophnetVisionProviderOptions) {
    this.apiUrl = options.apiUrl;
    this.apiKey = options.apiKey;
    this.modelName = options.modelName;
    this.timeoutMs = options.timeoutMs;
  }

  async extractFeatures(input: VisionProviderInput): Promise<VisionProviderResult> {
    let latestError: AppError | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const startedAt = Date.now();
        const requestPayload: Record<string, unknown> = {
          model: this.modelName,
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content: FEATURE_EXTRACTION_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: buildFeatureExtractionUserPrompt(input.direction),
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${input.mimeType};base64,${input.imageBase64}`,
                  },
                },
              ],
            },
          ],
        };
        if (attempt === 0) {
          requestPayload.response_format = { type: "json_object" };
        }

        const response = await this.postWithTimeout({
          ...requestPayload,
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
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetchWithProxy(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const failureBody = await response.text();
        throw new AppError(
          `Vision provider request failed with status ${response.status}`,
          "PROVIDER_ERROR",
          502,
          {
            status: response.status,
            body: failureBody.slice(0, 1000),
          },
        );
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
    const choices = response.choices;
    if (!Array.isArray(choices) || choices.length === 0) {
      throw new AppError("Model output is missing choices", "MODEL_OUTPUT_INVALID", 502);
    }

    const first = choices[0];
    if (!first || typeof first !== "object") {
      throw new AppError("Model output is malformed", "MODEL_OUTPUT_INVALID", 502);
    }

    const message = "message" in first ? (first as { message?: unknown }).message : undefined;
    if (!message || typeof message !== "object") {
      throw new AppError("Model output is missing message content", "MODEL_OUTPUT_INVALID", 502);
    }

    const content = "content" in message ? (message as { content?: unknown }).content : undefined;
    if (typeof content === "string" && content.trim().length > 0) {
      return content;
    }

    if (Array.isArray(content)) {
      const joined = content
        .map((item) => {
          if (item && typeof item === "object") {
            const text = "text" in item ? (item as { text?: unknown }).text : undefined;
            return typeof text === "string" ? text : "";
          }
          return "";
        })
        .join("\n")
        .trim();

      if (joined.length > 0) {
        return joined;
      }
    }

    throw new AppError("Model output text is empty", "MODEL_OUTPUT_INVALID", 502);
  }

  private parseJson(payload: string): unknown {
    try {
      return JSON.parse(payload);
    } catch {
      // Some providers wrap JSON with markdown fences.
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
