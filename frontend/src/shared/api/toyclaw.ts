import { apiClient } from "./client";
import { toApiError } from "./errors";
import type {
  AnalyzeResponse,
  ComplianceAssessmentResponse,
  CrossCulturalAnalysisResponse,
  DirectionPreset,
  RedesignSuggestionResponse,
  RetryableRedesignAssetKey,
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

export interface RedesignRetryAssetPayload {
  suggestionId: string;
  asset: RetryableRedesignAssetKey;
}

export interface ComplianceAssessPayload {
  requestId: string;
  targetMarket: TargetMarket;
}

export interface CapabilitiesResponse {
  compliance: boolean;
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

export async function postRedesignRetryAsset(payload: RedesignRetryAssetPayload): Promise<RedesignSuggestionResponse> {
  try {
    const response = await apiClient.post<RedesignSuggestionResponse>(
      `/redesign/suggest/${payload.suggestionId}/retry`,
      {
        asset: payload.asset,
      },
    );
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function postComplianceAssess(
  payload: ComplianceAssessPayload,
): Promise<ComplianceAssessmentResponse> {
  try {
    const response = await apiClient.post<ComplianceAssessmentResponse>("/compliance/assess", payload);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getComplianceAssess(assessmentId: string): Promise<ComplianceAssessmentResponse> {
  try {
    const response = await apiClient.get<ComplianceAssessmentResponse>(`/compliance/assess/${assessmentId}`);
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getCapabilities(): Promise<CapabilitiesResponse> {
  try {
    const response = await apiClient.get<CapabilitiesResponse>("/capabilities");
    return response.data;
  } catch {
    return { compliance: false };
  }
}
