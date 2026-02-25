export interface ProjectSummary {
  requestId: string;
  originalFilename: string;
  imagePath: string;
  status: "PROCESSING" | "SUCCEEDED" | "FAILED";
  directionMode: "TEXT" | "PRESET";
  directionValue: string;
  targetMarkets: string[];
  crossCulturalCount: number;
  redesignCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListResponse {
  projects: ProjectSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProjectDetailResponse {
  requestId: string;
  originalFilename: string;
  imagePath: string;
  status: "PROCESSING" | "SUCCEEDED" | "FAILED";
  directionMode: "TEXT" | "PRESET";
  directionValue: string;
  createdAt: string;
  updatedAt: string;
  result: {
    shape: unknown;
    colors: unknown;
    material: unknown;
    style: unknown;
  } | null;
  crossCulturalAnalyses: Array<{
    id: string;
    targetMarket: string;
    tabooFindings: unknown;
    festivalThemes: unknown;
    competitorStyles: unknown;
    summary: string;
    createdAt: string;
  }>;
  redesignSuggestions: Array<{
    id: string;
    targetMarket: string;
    crossCulturalAnalysisId: string;
    colorSchemes: unknown;
    shapeAdjustments: unknown;
    packagingSuggestions: unknown;
    assets: unknown;
    assetProvider: string | null;
    assetModelName: string | null;
    createdAt: string;
  }>;
  complianceAssessments: Array<{
    id: string;
    targetMarket: string;
    report: unknown;
    summary: string;
    createdAt: string;
  }>;
}
