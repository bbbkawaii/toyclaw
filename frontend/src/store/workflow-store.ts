import { create } from "zustand";
import type {
  AnalyzeResponse,
  ComplianceAssessmentResponse,
  CrossCulturalAnalysisResponse,
  RedesignSuggestionResponse,
} from "../shared/types/api";

export type WorkflowStep = "image-input" | "cross-cultural" | "redesign" | "compliance";

interface WorkflowState {
  step: WorkflowStep;
  requestId?: string;
  analysisId?: string;
  suggestionId?: string;
  complianceId?: string;
  imageResult?: AnalyzeResponse;
  crossCulturalResult?: CrossCulturalAnalysisResponse;
  redesignResult?: RedesignSuggestionResponse;
  complianceResult?: ComplianceAssessmentResponse;
  setStep: (step: WorkflowStep) => void;
  setImageResult: (value: AnalyzeResponse) => void;
  setCrossCulturalResult: (value: CrossCulturalAnalysisResponse) => void;
  setRedesignResult: (value: RedesignSuggestionResponse) => void;
  setComplianceResult: (value: ComplianceAssessmentResponse) => void;
  reset: () => void;
}

const initialState: Pick<
  WorkflowState,
  "step" | "requestId" | "analysisId" | "suggestionId" | "complianceId" | "imageResult" | "crossCulturalResult" | "redesignResult" | "complianceResult"
> = {
  step: "image-input",
  requestId: undefined,
  analysisId: undefined,
  suggestionId: undefined,
  complianceId: undefined,
  imageResult: undefined,
  crossCulturalResult: undefined,
  redesignResult: undefined,
  complianceResult: undefined,
};

export const useWorkflowStore = create<WorkflowState>((set) => ({
  ...initialState,
  setStep: (step) => {
    set({ step });
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
      step: "cross-cultural",
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
  reset: () => {
    set(initialState);
  },
}));

