import { z } from "zod";
import { TABOO_SEVERITIES, TARGET_MARKETS } from "./types";

export const crossCulturalAnalyzeBodySchema = z.object({
  requestId: z.string().uuid(),
  targetMarket: z.enum(TARGET_MARKETS),
});

export const crossCulturalAnalyzeParamsSchema = z.object({
  analysisId: z.string().uuid(),
});

export const tabooFindingSchema = z.object({
  ruleId: z.string().min(1),
  title: z.string().min(1),
  severity: z.enum(TABOO_SEVERITIES),
  matched: z.boolean(),
  evidence: z.array(z.string().min(1)),
  risk: z.string().min(1),
  recommendation: z.string().min(1),
});

export const festivalThemeMatchSchema = z.object({
  themeId: z.string().min(1),
  name: z.string().min(1),
  season: z.string().min(1),
  relevance: z.number().min(0).max(1),
  reason: z.string().min(1),
  suggestedElements: z.array(z.string().min(1)),
  suggestedColors: z.array(z.string().min(1)),
});

export const competitorStyleReferenceSchema = z.object({
  referenceId: z.string().min(1),
  brandArchetype: z.string().min(1),
  styleSummary: z.string().min(1),
  matchingScore: z.number().min(0).max(1),
  opportunities: z.array(z.string().min(1)),
});

export const crossCulturalResultPayloadSchema = z.object({
  tabooFindings: z.array(tabooFindingSchema),
  festivalThemes: z.array(festivalThemeMatchSchema),
  competitorStyles: z.array(competitorStyleReferenceSchema),
  summary: z.string().min(1),
});

export type CrossCulturalAnalyzeBodySchema = z.infer<typeof crossCulturalAnalyzeBodySchema>;

