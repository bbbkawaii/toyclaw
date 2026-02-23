import { create } from "zustand";
import type {
  AnalyzeResponse,
  CrossCulturalAnalysisResponse,
  RedesignSuggestionResponse,
} from "../shared/types/api";

export type WorkflowStep = "image-input" | "cross-cultural" | "redesign";

interface WorkflowState {
  step: WorkflowStep;
  requestId?: string;
  analysisId?: string;
  suggestionId?: string;
  imageResult?: AnalyzeResponse;
  crossCulturalResult?: CrossCulturalAnalysisResponse;
  redesignResult?: RedesignSuggestionResponse;
  setStep: (step: WorkflowStep) => void;
  setImageResult: (value: AnalyzeResponse) => void;
  setCrossCulturalResult: (value: CrossCulturalAnalysisResponse) => void;
  setRedesignResult: (value: RedesignSuggestionResponse) => void;
  reset: () => void;
}

const initialState: Pick<
  WorkflowState,
  "step" | "requestId" | "analysisId" | "suggestionId" | "imageResult" | "crossCulturalResult" | "redesignResult"
> = {
  step: "image-input",
  requestId: undefined,
  analysisId: undefined,
  suggestionId: undefined,
  imageResult: undefined,
  crossCulturalResult: undefined,
  redesignResult: undefined,
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
    });
  },
  setCrossCulturalResult: (value) => {
    set({
      crossCulturalResult: value,
      analysisId: value.analysisId,
      step: "cross-cultural",
      redesignResult: undefined,
      suggestionId: undefined,
    });
  },
  setRedesignResult: (value) => {
    set({
      redesignResult: value,
      suggestionId: value.suggestionId,
      step: "redesign",
    });
  },
  reset: () => {
    set(initialState);
  },
}));

