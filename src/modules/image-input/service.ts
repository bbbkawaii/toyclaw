import type { MultipartFile } from "@fastify/multipart";
import type { Prisma, PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { AppError } from "../../lib/errors";
import { LocalFileStorage } from "../../lib/storage/local-file";
import type { VisionProvider } from "../../providers/vision/base";
import { directionPresetSchema, extractedFeaturesSchema } from "./schemas";
import type { AnalyzeResponse, DirectionInput, DirectionPreset } from "./types";

export interface AnalyzeInput {
  filePart: MultipartFile;
  directionText?: string;
  directionPreset?: string;
}

interface ImageInputServiceDeps {
  prisma: PrismaClient;
  storage: LocalFileStorage;
  provider: VisionProvider;
}

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_INFERENCE_DIMENSION = 768;
const COMPRESS_IF_LARGER_THAN_BYTES = 900 * 1024;
const MAX_TARGET_BYTES = 1500 * 1024;

export class ImageInputService {
  constructor(private readonly deps: ImageInputServiceDeps) {}

  async analyzeUpload(input: AnalyzeInput): Promise<AnalyzeResponse> {
    if (!ALLOWED_MIME_TYPES.has(input.filePart.mimetype)) {
      throw new AppError("Only jpg/png/webp images are accepted", "INVALID_FILE_TYPE", 415);
    }

    const direction = this.resolveDirection(input.directionText, input.directionPreset);
    const stored = await this.deps.storage.saveFile(input.filePart);

    const requestRecord = await this.deps.prisma.analysisRequest.create({
      data: {
        imagePath: stored.relativePath,
        originalFilename: input.filePart.filename,
        mimeType: input.filePart.mimetype,
        sizeBytes: Number(input.filePart.file.bytesRead || 0),
        directionMode: direction.mode,
        directionValue: direction.value,
        provider: this.deps.provider.providerName,
        modelName: this.deps.provider.modelName,
        status: "PROCESSING",
      },
    });

    try {
      const optimizedImage = await this.prepareImageForInference(stored.absolutePath, input.filePart.mimetype);
      const extracted = await this.deps.provider.extractFeatures({
        imageBase64: optimizedImage.imageBase64,
        mimeType: optimizedImage.mimeType,
        direction,
      });

      const updated = await this.deps.prisma.analysisRequest.update({
        where: { id: requestRecord.id },
        data: {
          status: "SUCCEEDED",
          result: {
            create: {
              shape: extracted.features.shape as unknown as Prisma.InputJsonValue,
              colors: extracted.features.colors as unknown as Prisma.InputJsonValue,
              material: extracted.features.material as unknown as Prisma.InputJsonValue,
              style: extracted.features.style as unknown as Prisma.InputJsonValue,
              ...(extracted.rawModelOutput === undefined
                ? {}
                : { rawModelOutput: extracted.rawModelOutput as unknown as Prisma.InputJsonValue }),
            },
          },
        },
        include: {
          result: true,
        },
      });

      if (!updated.result) {
        throw new AppError("Analysis result was not persisted", "DB_ERROR", 500);
      }

      return {
        requestId: updated.id,
        input: {
          imageUrl: updated.imagePath,
          direction,
        },
        features: extracted.features,
        model: {
          provider: updated.provider,
          modelName: updated.modelName,
          latencyMs: extracted.latencyMs,
        },
      };
    } catch (error) {
      const appError = this.toAppError(error);
      await this.deps.prisma.analysisRequest
        .update({
          where: { id: requestRecord.id },
          data: {
            status: "FAILED",
            errorCode: appError.code,
            errorMessage: appError.message,
          },
        })
        .catch(() => undefined);

      throw appError;
    }
  }

  async getAnalysis(requestId: string): Promise<AnalyzeResponse> {
    const existing = await this.deps.prisma.analysisRequest.findUnique({
      where: { id: requestId },
      include: { result: true },
    });

    if (!existing) {
      throw new AppError("Analysis request not found", "NOT_FOUND", 404);
    }

    if (existing.status !== "SUCCEEDED" || !existing.result) {
      throw new AppError("Analysis is not available", "ANALYSIS_NOT_READY", 409, {
        status: existing.status,
        errorCode: existing.errorCode,
        errorMessage: existing.errorMessage,
      });
    }

    const parsedFeatures = extractedFeaturesSchema.parse({
      shape: existing.result.shape,
      colors: existing.result.colors,
      material: existing.result.material,
      style: existing.result.style,
    });

    return {
      requestId: existing.id,
      input: {
        imageUrl: existing.imagePath,
        direction: {
          mode: existing.directionMode,
          value: existing.directionValue,
        },
      },
      features: parsedFeatures,
      model: {
        provider: existing.provider,
        modelName: existing.modelName,
        latencyMs: 0,
      },
    };
  }

  private resolveDirection(directionText?: string, directionPreset?: string): DirectionInput {
    if (directionText && directionText.trim().length > 0) {
      return {
        mode: "TEXT",
        value: directionText.trim(),
      };
    }

    if (directionPreset) {
      const parsed = directionPresetSchema.safeParse(directionPreset);
      if (!parsed.success) {
        throw new AppError(
          "directionPreset must be one of CHANGE_COLOR/SEASONAL_THEME/ADD_ACCESSORY",
          "INVALID_DIRECTION_PRESET",
          400,
        );
      }

      return {
        mode: "PRESET",
        value: parsed.data as DirectionPreset,
      };
    }

    throw new AppError("Either directionText or directionPreset is required", "MISSING_DIRECTION", 400);
  }

  private async prepareImageForInference(
    absolutePath: string,
    originalMimeType: string,
  ): Promise<{ imageBase64: string; mimeType: string }> {
    const originalBuffer = await readFile(absolutePath);

    try {
      const metadata = await sharp(originalBuffer, { failOnError: false }).metadata();
      const width = metadata.width ?? 0;
      const height = metadata.height ?? 0;
      const needsResize = width > MAX_INFERENCE_DIMENSION || height > MAX_INFERENCE_DIMENSION;
      const needsCompress = originalBuffer.byteLength > COMPRESS_IF_LARGER_THAN_BYTES || originalMimeType === "image/png";

      if (!needsResize && !needsCompress) {
        return {
          imageBase64: originalBuffer.toString("base64"),
          mimeType: originalMimeType,
        };
      }

      let optimizedBuffer = await sharp(originalBuffer, { failOnError: false })
        .rotate()
        .resize({
          width: MAX_INFERENCE_DIMENSION,
          height: MAX_INFERENCE_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality: 72,
          effort: 4,
        })
        .toBuffer();

      if (optimizedBuffer.byteLength > MAX_TARGET_BYTES) {
        optimizedBuffer = await sharp(optimizedBuffer, { failOnError: false })
          .webp({
            quality: 68,
            effort: 4,
          })
          .toBuffer();
      }

      return {
        imageBase64: optimizedBuffer.toString("base64"),
        mimeType: "image/webp",
      };
    } catch {
      // If optimization fails for any reason, fallback to original file to keep request functional.
      return {
        imageBase64: originalBuffer.toString("base64"),
        mimeType: originalMimeType,
      };
    }
  }

  private toAppError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(error.message, "INTERNAL_ERROR", 500);
    }

    return new AppError("Unexpected error", "INTERNAL_ERROR", 500);
  }
}
