import { z } from "zod";
import { TARGET_MARKETS } from "../cross-cultural/types";

export const redesignSuggestBodySchema = z.object({
  requestId: z.string().uuid(),
  crossCulturalAnalysisId: z.string().uuid(),
  assets: z
    .object({
      previewImage: z.boolean().optional(),
      threeView: z.boolean().optional(),
      showcaseVideo: z.boolean().optional(),
    })
    .optional(),
});

export const redesignSuggestParamsSchema = z.object({
  suggestionId: z.string().uuid(),
});

const suggestedColorSchema = z.object({
  name: z.string().min(1),
  hex: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color")
    .transform((value) => value.toUpperCase()),
  usage: z.string().min(1),
});

export const colorSchemeSuggestionSchema = z.object({
  schemeName: z.string().min(1),
  positioning: z.string().min(1),
  colors: z.array(suggestedColorSchema).min(2),
  reason: z.string().min(1),
});

export const shapeDetailAdjustmentSchema = z.object({
  title: z.string().min(1),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  actions: z.array(z.string().min(1)).min(1),
  reason: z.string().min(1),
});

export const packagingStyleSuggestionSchema = z.object({
  styleName: z.string().min(1),
  materials: z.array(z.string().min(1)).min(1),
  visualElements: z.array(z.string().min(1)).min(1),
  copyTone: z.string().min(1),
  reason: z.string().min(1),
});

export const imageAssetResultSchema = z.object({
  status: z.enum(["READY", "SKIPPED", "FAILED"]),
  prompt: z.string().min(1),
  imageBase64: z.string().min(1).optional(),
  mimeType: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
});

export const threeViewAssetResultSchema = z.object({
  front: imageAssetResultSchema,
  side: imageAssetResultSchema,
  back: imageAssetResultSchema,
});

export const showcaseVideoKeyframeSchema = z.object({
  label: z.string().min(1),
  prompt: z.string().min(1),
  imageBase64: z.string().min(1).optional(),
  mimeType: z.string().min(1).optional(),
});

export const showcaseVideoAssetResultSchema = z.object({
  status: z.enum(["SCRIPT_ONLY", "SKIPPED"]),
  script: z.string().min(1),
  keyframes: z.array(showcaseVideoKeyframeSchema),
  reason: z.string().min(1).optional(),
});

export const redesignAssetsSchema = z.object({
  previewImage: imageAssetResultSchema,
  threeView: threeViewAssetResultSchema,
  showcaseVideo: showcaseVideoAssetResultSchema,
});

export const redesignResultPayloadSchema = z.object({
  targetMarket: z.enum(TARGET_MARKETS),
  colorSchemes: z.array(colorSchemeSuggestionSchema).min(1),
  shapeAdjustments: z.array(shapeDetailAdjustmentSchema).min(1),
  packagingSuggestions: z.array(packagingStyleSuggestionSchema).min(1),
  assets: redesignAssetsSchema,
});

export type RedesignSuggestBodySchema = z.infer<typeof redesignSuggestBodySchema>;
