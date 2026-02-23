import { z } from "zod";
import { DIRECTION_PRESETS } from "./types";

export const directionPresetSchema = z.enum(DIRECTION_PRESETS);

export const shapeFeatureSchema = z.object({
  category: z.string().min(1),
  confidence: z.number().min(0).max(1),
  evidence: z.string().min(1).optional(),
});

export const colorFeatureSchema = z.object({
  name: z.string().min(1),
  hex: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color")
    .transform((v) => v.toUpperCase()),
  proportion: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
});

export const namedFeatureSchema = z.object({
  name: z.string().min(1),
  confidence: z.number().min(0).max(1),
  evidence: z.string().min(1).optional(),
});

export const extractedFeaturesSchema = z.object({
  shape: shapeFeatureSchema,
  colors: z.array(colorFeatureSchema).min(1),
  material: z.array(namedFeatureSchema).min(1),
  style: z.array(namedFeatureSchema).min(1),
});

export type ExtractedFeaturesSchema = z.infer<typeof extractedFeaturesSchema>;
