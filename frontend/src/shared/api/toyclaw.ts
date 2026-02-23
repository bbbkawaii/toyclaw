import { apiClient } from "./client";
import { toApiError } from "./errors";
import type {
  AnalyzeResponse,
  CrossCulturalAnalysisResponse,
  DirectionPreset,
  RedesignSuggestionResponse,
  TargetMarket,
} from "../types/api";

export interface ImageAnalyzePayload {
  image: File;
  directionText?: string;
  directionPreset?: DirectionPreset;
}

export interface CrossCulturalAnalyzePayload {
  requestId: string;
  targetMarket: TargetMarket;
}

export interface RedesignSuggestPayload {
  requestId: string;
  crossCulturalAnalysisId: string;
  assets?: {
    previewImage?: boolean;
    threeView?: boolean;
    showcaseVideo?: boolean;
  };
}

export async function postImageAnalyze(payload: ImageAnalyzePayload): Promise<AnalyzeResponse> {
  const formData = new FormData();
  if (payload.directionText && payload.directionText.trim().length > 0) {
    formData.append("directionText", payload.directionText.trim());
  }
  if (payload.directionPreset) {
    formData.append("directionPreset", payload.directionPreset);
  }
  formData.append("image", payload.image);

  try {
    const response = await apiClient.post<AnalyzeResponse>("/image-input/analyze", formData);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getImageAnalyze(requestId: string): Promise<AnalyzeResponse> {
  try {
    const response = await apiClient.get<AnalyzeResponse>(`/image-input/analyze/${requestId}`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function postCrossCulturalAnalyze(
  payload: CrossCulturalAnalyzePayload,
): Promise<CrossCulturalAnalysisResponse> {
  try {
    const response = await apiClient.post<CrossCulturalAnalysisResponse>("/cross-cultural/analyze", payload);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getCrossCulturalAnalyze(analysisId: string): Promise<CrossCulturalAnalysisResponse> {
  try {
    const response = await apiClient.get<CrossCulturalAnalysisResponse>(
      `/cross-cultural/analyze/${analysisId}`,
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function postRedesignSuggest(payload: RedesignSuggestPayload): Promise<RedesignSuggestionResponse> {
  try {
    const response = await apiClient.post<RedesignSuggestionResponse>("/redesign/suggest", payload);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getRedesignSuggest(suggestionId: string): Promise<RedesignSuggestionResponse> {
  try {
    const response = await apiClient.get<RedesignSuggestionResponse>(`/redesign/suggest/${suggestionId}`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}
