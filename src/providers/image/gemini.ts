import { AppError } from "../../lib/errors";
import { fetchWithProxy } from "../../lib/http/fetch-with-proxy";
import type {
  ImageGenerationInput,
  ImageGenerationProvider,
  ImageGenerationResult,
} from "./base";

export interface GeminiImageProviderOptions {
  apiBaseUrl: string;
  apiKey: string;
  modelName: string;
  timeoutMs: number;
}

export class GeminiImageProvider implements ImageGenerationProvider {
  readonly providerName = "gemini";
  readonly modelName: string;

  private readonly apiBaseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(options: GeminiImageProviderOptions) {
    this.apiBaseUrl = options.apiBaseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.modelName = normalizeModelName(options.modelName);
    this.timeoutMs = options.timeoutMs;
  }

  async generatePreview(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    const endpoint = `${this.apiBaseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`;
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const parts: Array<Record<string, unknown>> = [{ text: input.prompt }];
      if (input.referenceImageBase64) {
        parts.push({
          inlineData: {
            data: input.referenceImageBase64,
            mimeType: input.mimeType ?? "image/png",
          },
        });
      }

      const response = await fetchWithProxy(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts,
            },
          ],
        }),
        signal: controller.signal,
      });

      const rawResponse = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        throw new AppError(
          `Image provider request failed with status ${response.status}`,
          "IMAGE_PROVIDER_ERROR",
          502,
          rawResponse,
        );
      }

      const candidate = Array.isArray(rawResponse.candidates) ? rawResponse.candidates[0] : undefined;
      const content = candidate && typeof candidate === "object" ? candidate.content : undefined;
      const contentParts =
        content && typeof content === "object" && Array.isArray((content as { parts?: unknown }).parts)
          ? ((content as { parts: Array<Record<string, unknown>> }).parts ?? [])
          : [];
      const imagePart = contentParts.find(
        (part) => part && typeof part === "object" && "inlineData" in part,
      );
      const inlineData =
        imagePart && typeof imagePart === "object" && "inlineData" in imagePart
          ? (imagePart as { inlineData?: unknown }).inlineData
          : undefined;

      if (inlineData && typeof inlineData === "object") {
        const imageBase64 =
          "data" in inlineData && typeof (inlineData as { data?: unknown }).data === "string"
            ? (inlineData as { data: string }).data
            : undefined;
        const mimeType =
          "mimeType" in inlineData && typeof (inlineData as { mimeType?: unknown }).mimeType === "string"
            ? (inlineData as { mimeType: string }).mimeType
            : undefined;

        return {
          imageBase64,
          mimeType,
          rawResponse,
        };
      }

      return {
        rawResponse,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError("Image provider request timed out", "IMAGE_PROVIDER_TIMEOUT", 504);
      }
      if (error instanceof Error) {
        throw new AppError(`Image provider request failed: ${error.message}`, "IMAGE_PROVIDER_ERROR", 502);
      }
      throw new AppError("Image provider request failed", "IMAGE_PROVIDER_ERROR", 502);
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}

function normalizeModelName(modelName: string): string {
  return modelName.trim().replace(/^models\//i, "");
}
