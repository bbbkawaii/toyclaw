import type { Prisma, PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { AppError } from "../../lib/errors";
import type { ImageGenerationProvider } from "../../providers/image/base";
import { getMarketProfile } from "../cross-cultural/knowledge-base";
import {
  competitorStyleReferenceSchema,
  festivalThemeMatchSchema,
  tabooFindingSchema,
} from "../cross-cultural/schemas";
import type { CompetitorStyleReference, FestivalThemeMatch, TabooFinding, TargetMarket } from "../cross-cultural/types";
import { extractedFeaturesSchema } from "../image-input/schemas";
import type { ExtractedFeatures } from "../image-input/types";
import {
  buildPreviewAssetPrompt,
  buildShowcaseVideoScript,
  buildThreeViewAssetPrompt,
  type AssetPromptContext,
} from "./prompts/assets";
import { redesignResultPayloadSchema } from "./schemas";
import type {
  ColorSchemeSuggestion,
  ImageAssetResult,
  PackagingStyleSuggestion,
  RedesignAssetFlags,
  RedesignAssets,
  RedesignSuggestionResponse,
  ShapeDetailAdjustment,
  ShowcaseVideoAssetResult,
  SuggestionPriority,
  SuggestedColor,
  ThreeViewAssetResult,
} from "./types";

export interface CreateRedesignSuggestionInput {
  requestId: string;
  crossCulturalAnalysisId: string;
  assets?: Partial<RedesignAssetFlags>;
}

interface RedesignServiceDeps {
  prisma: PrismaClient;
  uploadDir: string;
  imageProvider?: ImageGenerationProvider;
}

interface ReferenceImage {
  imageBase64: string;
  mimeType: string;
}

interface PackagingBlueprint {
  styleName: string;
  materials: string[];
  visualElements: string[];
  copyTone: string;
  reason: string;
}

const DEFAULT_ASSET_FLAGS: RedesignAssetFlags = {
  previewImage: true,
  threeView: true,
  showcaseVideo: true,
};

const COLOR_LOOKUP: Record<string, string> = {
  red: "#EF4444",
  green: "#10B981",
  "forest green": "#166534",
  blue: "#3B82F6",
  "deep blue": "#1D4ED8",
  navy: "#1E3A8A",
  "midnight blue": "#1E293B",
  yellow: "#EAB308",
  orange: "#F97316",
  purple: "#7C3AED",
  pink: "#EC4899",
  coral: "#FB7185",
  gold: "#D4AF37",
  silver: "#94A3B8",
  white: "#F8FAFC",
  "off-white": "#F1F5F9",
  cream: "#FFF7D6",
  beige: "#D6D3D1",
  brown: "#8B5E3C",
  black: "#111827",
  mint: "#6EE7B7",
  turquoise: "#06B6D4",
  aqua: "#22D3EE",
  lime: "#84CC16",
  sand: "#D4B483",
  sky: "#38BDF8",
  "sky blue": "#38BDF8",
  azure: "#2563EB",
  teal: "#0F766E",
  pastel: "#C4B5FD",
  gray: "#9CA3AF",
  "brick red": "#B91C1C",
  mustard: "#CA8A04",
  peach: "#FB7185",
  lavender: "#A78BFA",
  emerald: "#059669",
};

const MARKET_PACKAGING_BLUEPRINTS: Record<TargetMarket, PackagingBlueprint[]> = {
  US: [
    {
      styleName: "Retail Shelf Hero Box",
      materials: ["FSC paperboard", "water-based matte coating"],
      visualElements: ["large hero image", "easy age label", "scan-to-video QR"],
      copyTone: "confident, family-friendly, benefit-first",
      reason: "US retail relies on fast shelf comprehension and strong value communication.",
    },
    {
      styleName: "Holiday Gift Sleeve",
      materials: ["recyclable sleeve", "foil accent sticker"],
      visualElements: ["gift badge", "limited edition marker", "festive icon strip"],
      copyTone: "warm, celebratory, collectible",
      reason: "Seasonal gifting improves conversion in Q4 and party windows.",
    },
  ],
  EUROPE: [
    {
      styleName: "Eco Minimal Carton",
      materials: ["recycled kraft board", "soy-ink print"],
      visualElements: ["material story icon", "low-ink front panel", "certification-ready layout"],
      copyTone: "clean, transparent, sustainability-led",
      reason: "Sustainability signaling strongly influences product trust across EU channels.",
    },
    {
      styleName: "Craft Story Pack",
      materials: ["textured paper wrap", "single-color insert card"],
      visualElements: ["illustrated usage scene", "modular part map", "language-ready side panel"],
      copyTone: "educational, understated premium",
      reason: "Craft-forward presentation supports premium positioning and learning narratives.",
    },
  ],
  MIDDLE_EAST: [
    {
      styleName: "Premium Family Gift Carton",
      materials: ["rigid board", "spot UV + soft-touch film"],
      visualElements: ["gift-ready structure", "bilingual typography blocks", "modest character art"],
      copyTone: "elegant, trust-focused, family-oriented",
      reason: "Giftability and family-safe visual tone are major purchase drivers.",
    },
    {
      styleName: "Festival Sleeve Edition",
      materials: ["removable festive sleeve", "metallic badge"],
      visualElements: ["seasonal motif band", "collectible variant code", "local event callout"],
      copyTone: "celebratory, premium, respectful",
      reason: "Festive localization can accelerate campaign relevance during key shopping windows.",
    },
  ],
  SOUTHEAST_ASIA: [
    {
      styleName: "Color-Rich Value Pack",
      materials: ["humidity-resistant carton", "waterproof coating"],
      visualElements: ["piece count highlight", "accessory map", "social share cue"],
      copyTone: "energetic, value-driven, social",
      reason: "Value perception and social-friendly visuals perform well in SEA e-commerce.",
    },
    {
      styleName: "Portable Travel Blister",
      materials: ["lightweight recycled PET window", "reinforced hanger tab"],
      visualElements: ["compact size cue", "on-the-go icon set", "festival-ready sticker area"],
      copyTone: "playful, practical, quick-read",
      reason: "Portable formats support holiday travel and convenience-store channels.",
    },
  ],
  JAPAN_KOREA: [
    {
      styleName: "Precision Window Box",
      materials: ["rigid matte box", "anti-scratch window panel"],
      visualElements: ["clean hierarchy", "detail close-up frame", "character profile card"],
      copyTone: "refined, detail-centric, collectible",
      reason: "High detail expectation requires premium finish and clean information architecture.",
    },
    {
      styleName: "Seasonal Capsule Sleeve",
      materials: ["soft-touch paper sleeve", "serial number stamp"],
      visualElements: ["limited color marker", "series matrix", "display stand guide"],
      copyTone: "curated, subtle, fan-community friendly",
      reason: "Capsule and seasonal variant culture supports repeat purchase behavior.",
    },
  ],
};

export class RedesignService {
  constructor(private readonly deps: RedesignServiceDeps) {}

  async createSuggestion(input: CreateRedesignSuggestionInput): Promise<RedesignSuggestionResponse> {
    const [analysisRequest, crossCultural] = await Promise.all([
      this.deps.prisma.analysisRequest.findUnique({
        where: { id: input.requestId },
        include: { result: true },
      }),
      this.deps.prisma.crossCulturalAnalysis.findUnique({
        where: { id: input.crossCulturalAnalysisId },
      }),
    ]);

    if (!analysisRequest) {
      throw new AppError("Image analysis request not found", "ANALYSIS_REQUEST_NOT_FOUND", 404);
    }
    if (analysisRequest.status !== "SUCCEEDED" || !analysisRequest.result) {
      throw new AppError("Image analysis is not ready", "ANALYSIS_NOT_READY", 409, {
        status: analysisRequest.status,
      });
    }
    if (!crossCultural) {
      throw new AppError("Cross-cultural analysis not found", "CROSS_CULTURAL_NOT_FOUND", 404);
    }
    if (crossCultural.requestId !== analysisRequest.id) {
      throw new AppError(
        "crossCulturalAnalysisId does not belong to requestId",
        "CROSS_CULTURAL_MISMATCH",
        400,
      );
    }

    const features = extractedFeaturesSchema.parse({
      shape: analysisRequest.result.shape,
      colors: analysisRequest.result.colors,
      material: analysisRequest.result.material,
      style: analysisRequest.result.style,
    });
    const tabooFindings = tabooFindingSchema.array().parse(crossCultural.tabooFindings) as TabooFinding[];
    const festivalThemes = festivalThemeMatchSchema.array().parse(crossCultural.festivalThemes) as FestivalThemeMatch[];
    const competitorStyles = competitorStyleReferenceSchema
      .array()
      .parse(crossCultural.competitorStyles) as CompetitorStyleReference[];
    const targetMarket = crossCultural.targetMarket as TargetMarket;

    const colorSchemes = this.buildColorSchemes(targetMarket, features, festivalThemes);
    const shapeAdjustments = this.buildShapeAdjustments(targetMarket, tabooFindings, festivalThemes, competitorStyles);
    const packagingSuggestions = this.buildPackagingSuggestions(targetMarket, festivalThemes);
    const flags = this.resolveAssetFlags(input.assets);

    const promptContext: AssetPromptContext = {
      targetMarket,
      directionValue: analysisRequest.directionValue,
      shapeCategory: features.shape.category,
      materialNames: features.material.map((item) => item.name),
      styleNames: features.style.map((item) => item.name),
      colorSchemes,
      shapeAdjustments,
      packagingSuggestions,
      festivalTheme: festivalThemes[0],
    };

    const referenceImage = await this.loadReferenceImage(analysisRequest.imagePath, analysisRequest.mimeType);
    const assets = await this.generateAssets(promptContext, flags, referenceImage);

    const parsedPayload = redesignResultPayloadSchema.parse({
      targetMarket,
      colorSchemes,
      shapeAdjustments,
      packagingSuggestions,
      assets,
    });

    const created = await this.deps.prisma.redesignSuggestion.create({
      data: {
        requestId: analysisRequest.id,
        crossCulturalAnalysisId: crossCultural.id,
        targetMarket,
        colorSchemes: parsedPayload.colorSchemes as unknown as Prisma.InputJsonValue,
        shapeAdjustments: parsedPayload.shapeAdjustments as unknown as Prisma.InputJsonValue,
        packagingSuggestions: parsedPayload.packagingSuggestions as unknown as Prisma.InputJsonValue,
        assets: parsedPayload.assets as unknown as Prisma.InputJsonValue,
        assetProvider: this.deps.imageProvider?.providerName,
        assetModelName: this.deps.imageProvider?.modelName,
      },
    });

    return {
      suggestionId: created.id,
      requestId: created.requestId,
      crossCulturalAnalysisId: created.crossCulturalAnalysisId,
      targetMarket: created.targetMarket as TargetMarket,
      colorSchemes: parsedPayload.colorSchemes,
      shapeAdjustments: parsedPayload.shapeAdjustments,
      packagingSuggestions: parsedPayload.packagingSuggestions,
      assets: parsedPayload.assets,
      ...(created.assetProvider && created.assetModelName
        ? {
            model: {
              provider: created.assetProvider,
              modelName: created.assetModelName,
            },
          }
        : {}),
      createdAt: created.createdAt.toISOString(),
    };
  }

  async getSuggestion(suggestionId: string): Promise<RedesignSuggestionResponse> {
    const existing = await this.deps.prisma.redesignSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!existing) {
      throw new AppError("Redesign suggestion not found", "REDESIGN_NOT_FOUND", 404);
    }

    const payload = redesignResultPayloadSchema.parse({
      targetMarket: existing.targetMarket,
      colorSchemes: existing.colorSchemes,
      shapeAdjustments: existing.shapeAdjustments,
      packagingSuggestions: existing.packagingSuggestions,
      assets: existing.assets,
    });

    return {
      suggestionId: existing.id,
      requestId: existing.requestId,
      crossCulturalAnalysisId: existing.crossCulturalAnalysisId,
      targetMarket: payload.targetMarket as TargetMarket,
      colorSchemes: payload.colorSchemes,
      shapeAdjustments: payload.shapeAdjustments,
      packagingSuggestions: payload.packagingSuggestions,
      assets: payload.assets,
      ...(existing.assetProvider && existing.assetModelName
        ? {
            model: {
              provider: existing.assetProvider,
              modelName: existing.assetModelName,
            },
          }
        : {}),
      createdAt: existing.createdAt.toISOString(),
    };
  }

  private buildColorSchemes(
    targetMarket: TargetMarket,
    features: ExtractedFeatures,
    festivalThemes: FestivalThemeMatch[],
  ): ColorSchemeSuggestion[] {
    const marketProfile = getMarketProfile(targetMarket);
    const dominant = features.colors[0];
    const dominantHex = normalizeColorHex(dominant?.hex ?? "#3B82F6");
    const dominantName = dominant?.name ?? "core blue";
    const topThemeColors = festivalThemes[0]?.suggestedColors.slice(0, 3) ?? [];
    const mappedThemeColors = topThemeColors.map((value, index) => ({
      name: value,
      hex: this.resolveColorHex(value, marketProfile.safePalette[index] ?? "#9CA3AF"),
      usage: index === 0 ? "primary" : index === 1 ? "accent" : "support",
    }));

    const schemeA: ColorSchemeSuggestion = {
      schemeName: "Market Fit Core",
      positioning: "稳健常销款",
      colors: [
        { name: dominantName, hex: dominantHex, usage: "primary body" },
        {
          name: "market accent",
          hex: normalizeColorHex(marketProfile.safePalette[0] ?? "#0F766E"),
          usage: "accent details",
        },
        {
          name: "clean neutral",
          hex: normalizeColorHex(marketProfile.safePalette[3] ?? "#F8FAFC"),
          usage: "logo and packaging background",
        },
      ],
      reason: "Preserves original recognition while shifting to a market-proven palette.",
    };

    const schemeB: ColorSchemeSuggestion = {
      schemeName: "Seasonal Campaign",
      positioning: festivalThemes[0]?.name ?? "节日营销款",
      colors:
        mappedThemeColors.length >= 2
          ? mappedThemeColors
          : [
              {
                name: "festival primary",
                hex: normalizeColorHex(marketProfile.safePalette[1] ?? "#2563EB"),
                usage: "primary body",
              },
              {
                name: "festival accent",
                hex: normalizeColorHex(marketProfile.safePalette[2] ?? "#F59E0B"),
                usage: "accessory highlights",
              },
            ],
      reason: "Aligns visual language with near-term seasonal campaigns.",
    };

    const schemeC: ColorSchemeSuggestion = {
      schemeName: "Differentiated Shelf Pop",
      positioning: "竞品差异款",
      colors: [
        {
          name: "deep anchor",
          hex: normalizeColorHex(marketProfile.safePalette[0] ?? "#1E3A8A"),
          usage: "outline and frame",
        },
        {
          name: "bright pop",
          hex: normalizeColorHex(marketProfile.safePalette[2] ?? "#F97316"),
          usage: "attention-grabbing accessory",
        },
        {
          name: "airy support",
          hex: normalizeColorHex(marketProfile.safePalette[1] ?? "#10B981"),
          usage: "secondary panel",
        },
      ],
      reason: "Improves shelf visibility while keeping culturally neutral tone.",
    };

    return [schemeA, schemeB, schemeC];
  }

  private buildShapeAdjustments(
    targetMarket: TargetMarket,
    tabooFindings: TabooFinding[],
    festivalThemes: FestivalThemeMatch[],
    competitorStyles: CompetitorStyleReference[],
  ): ShapeDetailAdjustment[] {
    const riskDriven = tabooFindings
      .filter((item) => item.matched)
      .slice(0, 2)
      .map((item) => ({
        title: `Mitigate: ${item.title}`,
        priority: this.mapSeverityToPriority(item.severity),
        actions: [item.recommendation, "Run local distributor review before final mold commit"],
        reason: item.risk,
      }));

    const seasonalDriven: ShapeDetailAdjustment = {
      title: `Seasonal story add-on (${festivalThemes[0]?.name ?? "regional campaign"})`,
      priority: "MEDIUM",
      actions: [
        `Add detachable accessory inspired by ${festivalThemes[0]?.name ?? "local festival"}`,
        "Reserve one clear hero area for campaign icon or badge",
      ],
      reason: "Keeps tooling change small while boosting campaign relevance.",
    };

    const competitorDriven: ShapeDetailAdjustment = {
      title: `Differentiate against ${competitorStyles[0]?.brandArchetype ?? "mainstream competitor"}`,
      priority: "MEDIUM",
      actions:
        competitorStyles[0]?.opportunities.slice(0, 2) ?? [
          "Increase depth layering on key details",
          "Design one signature silhouette element for recall",
        ],
      reason: "Builds recognizability without overhauling the base product.",
    };

    const qualityAdjustment: ShapeDetailAdjustment = {
      title: `${targetMarket} quality expectation upgrade`,
      priority: "LOW",
      actions: ["Tighten seam lines around face and joints", "Use matte + gloss contrast to improve perceived quality"],
      reason: "Small finishing improvements improve trust across cross-border channels.",
    };

    return [...riskDriven, seasonalDriven, competitorDriven, qualityAdjustment].slice(0, 4);
  }

  private buildPackagingSuggestions(
    targetMarket: TargetMarket,
    festivalThemes: FestivalThemeMatch[],
  ): PackagingStyleSuggestion[] {
    const base = MARKET_PACKAGING_BLUEPRINTS[targetMarket] ?? [];
    const seasonalTheme = festivalThemes[0];

    const seasonalAddon: PackagingStyleSuggestion = {
      styleName: "Campaign Overlay Kit",
      materials: ["removable campaign sleeve", "recyclable sticker pack"],
      visualElements: [
        `${seasonalTheme?.name ?? "Seasonal"} logo lockup`,
        "localized CTA badge",
        "quick scan QR for product demo",
      ],
      copyTone: "localized, concise, action-oriented",
      reason: "Campaign overlays enable market-specific refresh without redesigning base packaging.",
    };

    const suggestions = base.map((item) => ({
      styleName: item.styleName,
      materials: item.materials,
      visualElements: item.visualElements,
      copyTone: item.copyTone,
      reason: item.reason,
    }));
    suggestions.push(seasonalAddon);

    return suggestions.slice(0, 3);
  }

  private resolveAssetFlags(raw?: Partial<RedesignAssetFlags>): RedesignAssetFlags {
    return {
      previewImage: raw?.previewImage ?? DEFAULT_ASSET_FLAGS.previewImage,
      threeView: raw?.threeView ?? DEFAULT_ASSET_FLAGS.threeView,
      showcaseVideo: raw?.showcaseVideo ?? DEFAULT_ASSET_FLAGS.showcaseVideo,
    };
  }

  private async loadReferenceImage(imagePath: string, mimeType: string): Promise<ReferenceImage | undefined> {
    const absolutePath = join(this.deps.uploadDir, imagePath);

    try {
      const optimized = await sharp(absolutePath, { failOnError: false })
        .rotate()
        .resize({
          width: 1024,
          height: 1024,
          fit: "inside",
          withoutEnlargement: true,
        })
        .png({
          compressionLevel: 9,
        })
        .toBuffer();

      return {
        imageBase64: optimized.toString("base64"),
        mimeType: "image/png",
      };
    } catch {
      try {
        const file = await readFile(absolutePath);
        return {
          imageBase64: file.toString("base64"),
          mimeType,
        };
      } catch {
        return undefined;
      }
    }
  }

  private async generateAssets(
    context: AssetPromptContext,
    flags: RedesignAssetFlags,
    referenceImage: ReferenceImage | undefined,
  ): Promise<RedesignAssets> {
    const previewPrompt = buildPreviewAssetPrompt(context);
    const previewImage = flags.previewImage
      ? await this.generateImageAsset(previewPrompt, referenceImage)
      : this.skippedImageAsset(previewPrompt, "DISABLED_BY_REQUEST");

    // Use the preview output as reference for three-view to ensure visual consistency.
    // Falls back to the original reference if preview didn't produce an image.
    const threeViewReference: ReferenceImage | undefined =
      previewImage.status === "READY" && previewImage.imageBase64
        ? { imageBase64: previewImage.imageBase64, mimeType: previewImage.mimeType ?? "image/png" }
        : referenceImage;

    const [threeView, showcaseVideo] = await Promise.all([
      this.generateThreeViewAssets(context, flags.threeView, threeViewReference),
      this.generateShowcaseVideoAssets(context, flags.showcaseVideo),
    ]);

    return {
      previewImage,
      threeView,
      showcaseVideo,
    };
  }

  private async generateThreeViewAssets(
    context: AssetPromptContext,
    enabled: boolean,
    referenceImage: ReferenceImage | undefined,
  ): Promise<ThreeViewAssetResult> {
    const frontPrompt = buildThreeViewAssetPrompt(context, "front");
    const sidePrompt = buildThreeViewAssetPrompt(context, "side");
    const backPrompt = buildThreeViewAssetPrompt(context, "back");

    if (!enabled) {
      return {
        front: this.skippedImageAsset(frontPrompt, "DISABLED_BY_REQUEST"),
        side: this.skippedImageAsset(sidePrompt, "DISABLED_BY_REQUEST"),
        back: this.skippedImageAsset(backPrompt, "DISABLED_BY_REQUEST"),
      };
    }

    const [front, side, back] = await Promise.all([
      this.generateImageAsset(frontPrompt, referenceImage),
      this.generateImageAsset(sidePrompt, referenceImage),
      this.generateImageAsset(backPrompt, referenceImage),
    ]);

    return { front, side, back };
  }

  private async generateShowcaseVideoAssets(
    context: AssetPromptContext,
    enabled: boolean,
  ): Promise<ShowcaseVideoAssetResult> {
    const script = buildShowcaseVideoScript(context);

    if (!enabled) {
      return {
        status: "SKIPPED",
        script,
        keyframes: [],
        reason: "DISABLED_BY_REQUEST",
      };
    }

    return {
      status: "SCRIPT_ONLY",
      script,
      keyframes: [],
      reason: "VIDEO_MODEL_NOT_CONFIGURED",
    };
  }

  private async generateImageAsset(
    prompt: string,
    referenceImage: ReferenceImage | undefined,
  ): Promise<ImageAssetResult> {
    if (!this.deps.imageProvider) {
      return this.skippedImageAsset(prompt, "IMAGE_PROVIDER_NOT_CONFIGURED");
    }

    let latestError: unknown;

    if (referenceImage) {
      const withReference = await this.generateImageAttempt({
        prompt,
        referenceImage,
      });
      if (withReference.ok) {
        return withReference.asset;
      }
      latestError = withReference.error;
    }

    const textOnly = await this.generateImageAttempt({
      prompt,
    });
    if (textOnly.ok) {
      return textOnly.asset;
    }
    latestError = textOnly.error ?? latestError;

    if (latestError instanceof Error) {
      return {
        status: "FAILED",
        prompt,
        reason: latestError.message,
      };
    }

    return {
      status: "FAILED",
      prompt,
      reason: "IMAGE_PROVIDER_ERROR",
    };
  }

  private async generateImageAttempt(input: {
    prompt: string;
    referenceImage?: ReferenceImage;
  }): Promise<{ ok: true; asset: ImageAssetResult } | { ok: false; error: unknown }> {
    const imageProvider = this.deps.imageProvider;
    if (!imageProvider) {
      return { ok: false, error: new AppError("Image provider is not configured", "IMAGE_PROVIDER_NOT_CONFIGURED", 500) };
    }

    try {
      const result = await imageProvider.generatePreview({
        prompt: input.prompt,
        referenceImageBase64: input.referenceImage?.imageBase64,
        mimeType: input.referenceImage?.mimeType,
      });

      if (!result.imageBase64) {
        return { ok: false, error: new AppError("Image provider returned no image", "IMAGE_PROVIDER_NO_IMAGE", 502) };
      }

      return {
        ok: true,
        asset: {
          status: "READY",
          prompt: input.prompt,
          imageBase64: result.imageBase64,
          mimeType: result.mimeType ?? "image/png",
        },
      };
    } catch (error) {
      return { ok: false, error };
    }
  }

  private skippedImageAsset(prompt: string, reason: string): ImageAssetResult {
    return {
      status: "SKIPPED",
      prompt,
      reason,
    };
  }

  private mapSeverityToPriority(severity: TabooFinding["severity"]): SuggestionPriority {
    switch (severity) {
      case "HIGH":
        return "HIGH";
      case "MEDIUM":
        return "MEDIUM";
      default:
        return "LOW";
    }
  }

  private resolveColorHex(colorName: string, fallback: string): string {
    if (colorName.startsWith("#")) {
      return normalizeColorHex(colorName);
    }

    const normalized = colorName.trim().toLowerCase();
    if (COLOR_LOOKUP[normalized]) {
      return normalizeColorHex(COLOR_LOOKUP[normalized]);
    }

    // Try matching shortened tokens like "pastel blue", "deep navy", etc.
    const token = normalized
      .split(/[\s/-]+/)
      .find((part) => COLOR_LOOKUP[part] !== undefined);
    if (token && COLOR_LOOKUP[token]) {
      return normalizeColorHex(COLOR_LOOKUP[token]);
    }

    return normalizeColorHex(fallback);
  }
}

function normalizeColorHex(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(normalized)) {
    return normalized;
  }
  if (/^#[0-9A-F]{3}$/.test(normalized)) {
    const [_, a, b, c] = normalized;
    return `#${a}${a}${b}${b}${c}${c}`;
  }
  return "#9CA3AF";
}
