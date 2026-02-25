import { create } from "zustand";
import type {
  AnalyzeResponse,
  ComplianceAssessmentResponse,
  CrossCulturalAnalysisResponse,
  RedesignSuggestionResponse,
  TargetMarket,
} from "../shared/types/api";

export type WorkflowStep = "step1" | "step2" | "step3";

interface WorkflowState {
  step: WorkflowStep;
  requestId?: string;
  analysisId?: string;
  suggestionId?: string;
  complianceId?: string;
  targetMarket?: TargetMarket;
  imageResult?: AnalyzeResponse;
  crossCulturalResult?: CrossCulturalAnalysisResponse;
  redesignResult?: RedesignSuggestionResponse;
  complianceResult?: ComplianceAssessmentResponse;
  complianceAvailable: boolean;
  setStep: (step: WorkflowStep) => void;
  setTargetMarket: (market: TargetMarket) => void;
  setImageResult: (value: AnalyzeResponse) => void;
  setCrossCulturalResult: (value: CrossCulturalAnalysisResponse) => void;
  setRedesignResult: (value: RedesignSuggestionResponse) => void;
  setComplianceResult: (value: ComplianceAssessmentResponse) => void;
  setComplianceAvailable: (available: boolean) => void;
  reset: () => void;
}

const initialState: Pick<
  WorkflowState,
  | "step"
  | "requestId"
  | "analysisId"
  | "suggestionId"
  | "complianceId"
  | "targetMarket"
  | "imageResult"
  | "crossCulturalResult"
  | "redesignResult"
  | "complianceResult"
  | "complianceAvailable"
> = {
  step: "step1",
  requestId: undefined,
  analysisId: undefined,
  suggestionId: undefined,
  complianceId: undefined,
  targetMarket: undefined,
  imageResult: undefined,
  crossCulturalResult: undefined,
  redesignResult: undefined,
  complianceResult: undefined,
  complianceAvailable: false,
};

export const useWorkflowStore = create<WorkflowState>((set) => ({
  ...initialState,
  setStep: (step) => {
    set({ step });
  },
  setTargetMarket: (market) => {
    set({ targetMarket: market });
  },
  setImageResult: (value) => {
    set({
      imageResult: value,
      requestId: value.requestId,
      crossCulturalResult: undefined,
      analysisId: undefined,
      redesignResult: undefined,
      suggestionId: undefined,
      complianceResult: undefined,
      complianceId: undefined,
    });
  },
  setCrossCulturalResult: (value) => {
    set({
      crossCulturalResult: value,
      analysisId: value.analysisId,
      redesignResult: undefined,
      suggestionId: undefined,
      complianceResult: undefined,
      complianceId: undefined,
    });
  },
  setRedesignResult: (value) => {
    set({
      redesignResult: value,
      suggestionId: value.suggestionId,
    });
  },
  setComplianceResult: (value) => {
    set({
      complianceResult: value,
      complianceId: value.assessmentId,
    });
  },
  setComplianceAvailable: (available) => {
    set({ complianceAvailable: available });
  },
  reset: () => {
    set(initialState);
  },
}));
