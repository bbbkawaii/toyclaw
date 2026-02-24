import { z } from "zod";
import { TARGET_MARKETS } from "../cross-cultural/types";

export const complianceAssessBodySchema = z.object({
  requestId: z.string().uuid(),
  targetMarket: z.enum(TARGET_MARKETS),
});

export const complianceAssessParamsSchema = z.object({
  assessmentId: z.string().uuid(),
});

export const applicableStandardSchema = z.object({
  standardId: z.string().min(1),
  standardName: z.string().min(1),
  mandatory: z.boolean(),
  relevance: z.string().min(1),
});

export const materialFindingSchema = z.object({
  material: z.string().min(1),
  concern: z.string().min(1),
  requirement: z.string().min(1),
  sourceStandard: z.string().min(1),
});

export const ageGradingSchema = z.object({
  recommendedAge: z.string().min(1),
  reason: z.string().min(1),
  requiredWarnings: z.array(z.string().min(1)),
});

export const labelRequirementSchema = z.object({
  item: z.string().min(1),
  detail: z.string().min(1),
  mandatory: z.boolean(),
});

export const certificationStepSchema = z.object({
  step: z.string().min(1),
  description: z.string().min(1),
});

export const complianceReportSchema = z.object({
  applicableStandards: z.array(applicableStandardSchema).min(1),
  materialFindings: z.array(materialFindingSchema),
  ageGrading: ageGradingSchema,
  labelRequirements: z.array(labelRequirementSchema),
  certificationPath: z.array(certificationStepSchema).min(1),
  summary: z.string().min(1),
});

export type ComplianceAssessBodySchema = z.infer<typeof complianceAssessBodySchema>;
