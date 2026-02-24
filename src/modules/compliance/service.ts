import type { Prisma, PrismaClient } from "@prisma/client";
import { AppError } from "../../lib/errors";
import { fetchWithProxy } from "../../lib/http/fetch-with-proxy";
import { extractedFeaturesSchema } from "../image-input/schemas";
import type { ExtractedFeatures } from "../image-input/types";
import type { TargetMarket } from "../cross-cultural/types";
import { buildComplianceUserPrompt, COMPLIANCE_SYSTEM_PROMPT } from "./prompts";
import type { ComplianceRetriever } from "./retriever";
import { complianceReportSchema } from "./schemas";
import type { ComplianceAssessmentResponse, ComplianceReport } from "./types";

export interface ComplianceAssessInput {
  requestId: string;
  targetMarket: TargetMarket;
}

export interface ComplianceServiceDeps {
  prisma: PrismaClient;
  retriever: ComplianceRetriever;
  geminiApiBaseUrl: string;
  geminiApiKey: string;
  geminiComplianceModel: string;
  timeoutMs: number;
}

export class ComplianceService {
  constructor(private readonly deps: ComplianceServiceDeps) {}

  async assess(input: ComplianceAssessInput): Promise<ComplianceAssessmentResponse> {
    const existing = await this.deps.prisma.analysisRequest.findUnique({
      where: { id: input.requestId },
      include: { result: true },
    });

    if (!existing) {
      throw new AppError("Image analysis request not found", "ANALYSIS_REQUEST_NOT_FOUND", 404);
    }
    if (existing.status !== "SUCCEEDED" || !existing.result) {
      throw new AppError("Image analysis is not ready", "ANALYSIS_NOT_READY", 409, {
        status: existing.status,
      });
    }

    const features = extractedFeaturesSchema.parse({
      shape: existing.result.shape,
      colors: existing.result.colors,
      material: existing.result.material,
      style: existing.result.style,
    });

    const queryText = this.buildQueryText(features, input.targetMarket);
    const retrieved = await this.deps.retriever.retrieve(queryText, input.targetMarket, 10);
    const chunkTexts = retrieved.map((chunk) => chunk.text);
    const chunkIds = retrieved.map((chunk) => chunk.id);

    const report = await this.generateReport(features, input.targetMarket, chunkTexts);

    const created = await this.deps.prisma.complianceAssessment.create({
      data: {
        requestId: existing.id,
        targetMarket: input.targetMarket,
        report: report as unknown as Prisma.InputJsonValue,
        summary: report.summary,
        retrievedChunkIds: chunkIds as unknown as Prisma.InputJsonValue,
        provider: "gemini",
        modelName: this.deps.geminiComplianceModel,
      },
    });

    return {
      assessmentId: created.id,
      requestId: created.requestId,
      targetMarket: created.targetMarket as TargetMarket,
      report,
      summary: created.summary,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async getAssessment(assessmentId: string): Promise<ComplianceAssessmentResponse> {
    const existing = await this.deps.prisma.complianceAssessment.findUnique({
      where: { id: assessmentId },
    });

    if (!existing) {
      throw new AppError("Compliance assessment not found", "COMPLIANCE_NOT_FOUND", 404);
    }

    const report = complianceReportSchema.parse(existing.report);

    return {
      assessmentId: existing.id,
      requestId: existing.requestId,
      targetMarket: existing.targetMarket as TargetMarket,
      report,
      summary: existing.summary,
      createdAt: existing.createdAt.toISOString(),
    };
  }

  private buildQueryText(features: ExtractedFeatures, targetMarket: string): string {
    const parts = [
      `toy safety compliance requirements for ${targetMarket}`,
      `shape: ${features.shape.category}`,
      `materials: ${features.material.map((m) => m.name).join(", ")}`,
      `colors: ${features.colors.map((c) => c.name).join(", ")}`,
      `style: ${features.style.map((s) => s.name).join(", ")}`,
    ];
    return parts.join("; ");
  }

  private async generateReport(
    features: ExtractedFeatures,
    targetMarket: string,
    chunkTexts: string[],
  ): Promise<ComplianceReport> {
    const userPrompt = buildComplianceUserPrompt(features, targetMarket, chunkTexts);
    let lastError: AppError | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await this.callGemini(userPrompt);
        const textOutput = this.extractTextResponse(response);
        const parsedJson = this.parseJson(textOutput);
        return complianceReportSchema.parse(parsedJson);
      } catch (error) {
        lastError = this.normalizeError(error);
        if (lastError.code !== "MODEL_OUTPUT_INVALID") {
          throw lastError;
        }
      }
    }

    throw lastError ?? new AppError("Model output is invalid", "MODEL_OUTPUT_INVALID", 502);
  }

  private async callGemini(userPrompt: string): Promise<Record<string, unknown>> {
    const model = this.deps.geminiComplianceModel.replace(/^models\//i, "");
    const endpoint = `${this.deps.geminiApiBaseUrl}/${model}:generateContent?key=${this.deps.geminiApiKey}`;
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.deps.timeoutMs);

    try {
      const response = await fetchWithProxy(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${COMPLIANCE_SYSTEM_PROMPT}\n\n${userPrompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new AppError(
          `Compliance model request failed with status ${response.status}`,
          "PROVIDER_ERROR",
          502,
          { status: response.status, body: body.slice(0, 1000) },
        );
      }

      return (await response.json()) as Record<string, unknown>;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError("Compliance model request timed out", "PROVIDER_TIMEOUT", 504);
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
      const fencedMatch =
        payload.match(/```json\s*([\s\S]*?)\s*```/i) ?? payload.match(/```([\s\S]*?)```/i);
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

  private normalizeError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }
    if (error instanceof Error) {
      return new AppError(
        `Compliance assessment failed: ${error.message}`,
        "MODEL_OUTPUT_INVALID",
        502,
      );
    }
    return new AppError("Compliance assessment failed", "MODEL_OUTPUT_INVALID", 502);
  }
}
