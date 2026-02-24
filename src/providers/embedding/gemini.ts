import { AppError } from "../../lib/errors";
import { fetchWithProxy } from "../../lib/http/fetch-with-proxy";

export interface GeminiEmbeddingProviderOptions {
  apiBaseUrl: string;
  apiKey: string;
  modelName: string;
  timeoutMs: number;
}

export class GeminiEmbeddingProvider {
  readonly modelName: string;

  private readonly apiBaseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(options: GeminiEmbeddingProviderOptions) {
    this.apiBaseUrl = options.apiBaseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.modelName = options.modelName.replace(/^models\//i, "");
    this.timeoutMs = options.timeoutMs;
  }

  async embed(text: string): Promise<number[]> {
    const result = await this.embedBatch([text]);
    return result[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const requests = texts.map((text) => ({
      model: `models/${this.modelName}`,
      content: { parts: [{ text }] },
    }));

    const endpoint = `${this.apiBaseUrl}/${this.modelName}:batchEmbedContents?key=${this.apiKey}`;
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetchWithProxy(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new AppError(
          `Embedding request failed with status ${response.status}`,
          "EMBEDDING_PROVIDER_ERROR",
          502,
          { status: response.status, body: body.slice(0, 1000) },
        );
      }

      const json = (await response.json()) as {
        embeddings?: { values?: number[] }[];
      };

      if (!json.embeddings || !Array.isArray(json.embeddings)) {
        throw new AppError("Embedding response missing embeddings", "EMBEDDING_PROVIDER_ERROR", 502);
      }

      return json.embeddings.map((item, index) => {
        if (!item.values || !Array.isArray(item.values)) {
          throw new AppError(
            `Embedding missing values at index ${index}`,
            "EMBEDDING_PROVIDER_ERROR",
            502,
          );
        }
        return item.values;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError("Embedding request timed out", "EMBEDDING_PROVIDER_TIMEOUT", 504);
      }
      throw new AppError(
        `Embedding request failed: ${error instanceof Error ? error.message : "unknown"}`,
        "EMBEDDING_PROVIDER_ERROR",
        502,
      );
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}
