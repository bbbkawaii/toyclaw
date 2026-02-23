import type { MultipartFile } from "@fastify/multipart";
import type { Prisma, PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { AppError } from "../../lib/errors";
import { LocalFileStorage } from "../../lib/storage/local-file";
import type { VisionProvider, VisionProviderResult } from "../../providers/vision/base";
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
const FALLBACK_PROVIDER_NAME = "local-fallback";
const FALLBACK_MODEL_NAME = "heuristic-v1";

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
      const extractedResult = await this.extractWithFallback({
        absolutePath: stored.absolutePath,
        optimizedImage,
        direction,
      });
      const extracted = extractedResult.result;

      const updated = await this.deps.prisma.analysisRequest.update({
        where: { id: requestRecord.id },
        data: {
          status: "SUCCEEDED",
          provider: extractedResult.provider,
          modelName: extractedResult.modelName,
          errorCode: null,
          errorMessage: null,
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
          provider: extractedResult.provider,
          modelName: extractedResult.modelName,
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

  private async extractWithFallback(input: {
    absolutePath: string;
    optimizedImage: { imageBase64: string; mimeType: string };
    direction: DirectionInput;
  }): Promise<{
    result: VisionProviderResult;
    provider: string;
    modelName: string;
  }> {
    try {
      const providerResult = await this.deps.provider.extractFeatures({
        imageBase64: input.optimizedImage.imageBase64,
        mimeType: input.optimizedImage.mimeType,
        direction: input.direction,
      });

      return {
        result: providerResult,
        provider: this.deps.provider.providerName,
        modelName: this.deps.provider.modelName,
      };
    } catch (providerError) {
      const fallbackResult = await this.extractFeaturesLocally(input.absolutePath, input.direction, providerError);
      return {
        result: fallbackResult,
        provider: FALLBACK_PROVIDER_NAME,
        modelName: FALLBACK_MODEL_NAME,
      };
    }
  }

  private async extractFeaturesLocally(
    absolutePath: string,
    direction: DirectionInput,
    sourceError: unknown,
  ): Promise<VisionProviderResult> {
    const startedAt = Date.now();

    try {
      const image = sharp(absolutePath, { failOnError: false }).rotate().toColourspace("srgb");
      const metadata = await image.metadata();
      const sampled = await image
        .clone()
        .resize({
          width: 96,
          height: 96,
          fit: "inside",
          withoutEnlargement: true,
        })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const colors = this.buildColorFeaturesFromSample(sampled.data, sampled.info.channels);
      const shape = this.buildShapeFallback(metadata.width, metadata.height);
      const material = this.buildMaterialFallback(colors);
      const style = this.buildStyleFallback(colors, direction.value);

      return {
        features: {
          shape,
          colors,
          material,
          style,
        },
        rawModelOutput: {
          fallback: true,
          providerUnavailable: true,
          sourceError: this.serializeSourceError(sourceError),
        },
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      throw new AppError(
        "Failed to extract image features using local fallback",
        "FALLBACK_EXTRACTION_FAILED",
        500,
        {
          sourceError: this.serializeSourceError(sourceError),
          fallbackError: this.serializeSourceError(error),
        },
      );
    }
  }

  private buildShapeFallback(width?: number, height?: number): {
    category: string;
    confidence: number;
    evidence: string;
  } {
    const safeWidth = width ?? 1;
    const safeHeight = height ?? 1;
    const ratio = safeWidth / safeHeight;

    if (ratio >= 1.35) {
      return {
        category: "横向延展造型",
        confidence: 0.57,
        evidence: `本地兜底：图像宽高比约 ${ratio.toFixed(2)}，偏横向`,
      };
    }

    if (ratio <= 0.75) {
      return {
        category: "纵向修长造型",
        confidence: 0.57,
        evidence: `本地兜底：图像宽高比约 ${ratio.toFixed(2)}，偏纵向`,
      };
    }

    return {
      category: "圆润主体造型",
      confidence: 0.6,
      evidence: `本地兜底：图像宽高比约 ${ratio.toFixed(2)}，整体均衡`,
    };
  }

  private buildMaterialFallback(colors: Array<{ confidence: number }>): Array<{
    name: string;
    confidence: number;
    evidence: string;
  }> {
    const baseConfidence = clamp01(0.52 + (colors[0]?.confidence ?? 0.5) * 0.2);
    return [
      {
        name: "塑胶主体",
        confidence: baseConfidence,
        evidence: "本地兜底：依据图像色块边缘和反射特征做保守估计",
      },
      {
        name: "软质装饰件",
        confidence: clamp01(baseConfidence - 0.08),
        evidence: "本地兜底：按常见玩具结构补充次要材质推断",
      },
    ];
  }

  private buildStyleFallback(
    colors: Array<{ rgb: [number, number, number]; confidence: number }>,
    directionValue: string,
  ): Array<{ name: string; confidence: number; evidence: string }> {
    const hasHighSaturation = colors.some((item) => getHslFromRgb(...item.rgb).s >= 0.45);
    const directionText = directionValue.toLowerCase();
    const hasSeasonalHint =
      directionText.includes("season") ||
      directionText.includes("节日") ||
      directionText.includes("新年") ||
      directionText.includes("圣诞");

    const primaryStyle = hasHighSaturation ? "高饱和卡通风" : "柔和简约风";
    const secondaryStyle = hasSeasonalHint ? "节日主题风" : "亲和玩具风";
    const baseConfidence = clamp01(0.5 + (colors[0]?.confidence ?? 0.5) * 0.15);

    return [
      {
        name: primaryStyle,
        confidence: baseConfidence,
        evidence: "本地兜底：依据主色饱和度与对比度进行风格估计",
      },
      {
        name: secondaryStyle,
        confidence: clamp01(baseConfidence - 0.06),
        evidence: "本地兜底：结合改款方向关键词进行补充风格推断",
      },
    ];
  }

  private buildColorFeaturesFromSample(
    data: Buffer,
    channels: number,
  ): Array<{ name: string; hex: string; proportion: number; confidence: number; rgb: [number, number, number] }> {
    if (channels < 3 || data.length < channels) {
      return [
        {
          name: "中性色",
          hex: "#9CA3AF",
          proportion: 1,
          confidence: 0.5,
          rgb: [156, 163, 175],
        },
      ];
    }

    const bucketMap = new Map<string, { r: number; g: number; b: number; count: number }>();
    for (let i = 0; i < data.length; i += channels) {
      const alpha = channels >= 4 ? data[i + 3] ?? 255 : 255;
      if (alpha < 24) {
        continue;
      }

      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const quantized = this.quantizeRgb(r, g, b);
      const key = `${quantized[0]}-${quantized[1]}-${quantized[2]}`;
      const existing = bucketMap.get(key);
      if (existing) {
        existing.count += 1;
        continue;
      }
      bucketMap.set(key, {
        r: quantized[0],
        g: quantized[1],
        b: quantized[2],
        count: 1,
      });
    }

    if (bucketMap.size === 0) {
      return [
        {
          name: "中性色",
          hex: "#9CA3AF",
          proportion: 1,
          confidence: 0.5,
          rgb: [156, 163, 175],
        },
      ];
    }

    const sortedBuckets = Array.from(bucketMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    const topTotal = sortedBuckets.reduce((sum, item) => sum + item.count, 0);

    return sortedBuckets.map((bucket, index) => {
      const proportion = topTotal > 0 ? bucket.count / topTotal : 1;
      const confidence = clamp01(0.5 + proportion * 0.35 - index * 0.04);
      const rgb: [number, number, number] = [bucket.r, bucket.g, bucket.b];

      return {
        name: this.inferColorName(bucket.r, bucket.g, bucket.b),
        hex: rgbToHex(bucket.r, bucket.g, bucket.b),
        proportion: Number(proportion.toFixed(3)),
        confidence: Number(confidence.toFixed(3)),
        rgb,
      };
    });
  }

  private quantizeRgb(r: number, g: number, b: number): [number, number, number] {
    const step = 32;
    const quantize = (value: number): number => {
      const bucketStart = Math.floor(value / step) * step;
      return Math.max(0, Math.min(255, bucketStart + Math.floor(step / 2)));
    };

    return [quantize(r), quantize(g), quantize(b)];
  }

  private inferColorName(r: number, g: number, b: number): string {
    const { h, s, l } = getHslFromRgb(r, g, b);

    if (l >= 0.9 && s <= 0.12) {
      return "白色";
    }
    if (l <= 0.14) {
      return "黑色";
    }
    if (s <= 0.14) {
      return l >= 0.55 ? "浅灰色" : "灰色";
    }

    if (h < 20 || h >= 345) {
      return "红色";
    }
    if (h < 45) {
      return "橙色";
    }
    if (h < 70) {
      return "黄色";
    }
    if (h < 165) {
      return "绿色";
    }
    if (h < 205) {
      return "青色";
    }
    if (h < 255) {
      return "蓝色";
    }
    if (h < 300) {
      return "紫色";
    }
    return "粉色";
  }

  private serializeSourceError(error: unknown): Record<string, unknown> {
    if (error instanceof AppError) {
      return {
        name: error.name,
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
      };
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
      };
    }

    return {
      message: "unknown error",
    };
  }
}

function clamp01(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number): string => value.toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getHslFromRgb(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  let h = 0;
  if (delta !== 0) {
    if (max === rn) {
      h = 60 * (((gn - bn) / delta) % 6);
    } else if (max === gn) {
      h = 60 * ((bn - rn) / delta + 2);
    } else {
      h = 60 * ((rn - gn) / delta + 4);
    }
  }

  if (h < 0) {
    h += 360;
  }

  return {
    h,
    s,
    l,
  };
}
