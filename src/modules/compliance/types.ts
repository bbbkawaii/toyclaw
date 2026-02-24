import type { TargetMarket } from "../cross-cultural/types";

export interface ApplicableStandard {
  standardId: string;
  standardName: string;
  mandatory: boolean;
  relevance: string;
}

export interface MaterialFinding {
  material: string;
  concern: string;
  requirement: string;
  sourceStandard: string;
}

export interface AgeGrading {
  recommendedAge: string;
  reason: string;
  requiredWarnings: string[];
}

export interface LabelRequirement {
  item: string;
  detail: string;
  mandatory: boolean;
}

export interface CertificationStep {
  step: string;
  description: string;
}

export interface ComplianceReport {
  applicableStandards: ApplicableStandard[];
  materialFindings: MaterialFinding[];
  ageGrading: AgeGrading;
  labelRequirements: LabelRequirement[];
  certificationPath: CertificationStep[];
  summary: string;
}

export interface ComplianceAssessmentResponse {
  assessmentId: string;
  requestId: string;
  targetMarket: TargetMarket;
  report: ComplianceReport;
  summary: string;
  createdAt: string;
}

export interface ComplianceChunk {
  id: string;
  text: string;
  market: string;
  source: string;
  section: string;
  embedding: number[];
}

export interface ComplianceIndex {
  version: string;
  createdAt: string;
  docCount: number;
  chunkCount: number;
}
