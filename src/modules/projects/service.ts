import type { PrismaClient, Prisma } from "@prisma/client";
import { AppError } from "../../lib/errors";
import type { ProjectDetailResponse, ProjectListResponse, ProjectSummary } from "./types";

interface ProjectsServiceDeps {
  prisma: PrismaClient;
}

export class ProjectsService {
  constructor(private readonly deps: ProjectsServiceDeps) {}

  async list(params: {
    page: number;
    pageSize: number;
    status?: "PROCESSING" | "SUCCEEDED" | "FAILED";
  }): Promise<ProjectListResponse> {
    const where: Prisma.AnalysisRequestWhereInput = {};
    if (params.status) {
      where.status = params.status;
    }

    const [total, requests] = await Promise.all([
      this.deps.prisma.analysisRequest.count({ where }),
      this.deps.prisma.analysisRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          crossCultural: {
            select: { targetMarket: true },
          },
          _count: {
            select: {
              crossCultural: true,
              redesigns: true,
            },
          },
        },
      }),
    ]);

    const projects: ProjectSummary[] = requests.map((req) => ({
      requestId: req.id,
      originalFilename: req.originalFilename,
      imagePath: req.imagePath,
      status: req.status,
      directionMode: req.directionMode,
      directionValue: req.directionValue,
      targetMarkets: [...new Set(req.crossCultural.map((cc) => cc.targetMarket))],
      crossCulturalCount: req._count.crossCultural,
      redesignCount: req._count.redesigns,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
    }));

    return {
      projects,
      total,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  async getDetail(requestId: string): Promise<ProjectDetailResponse> {
    const record = await this.deps.prisma.analysisRequest.findUnique({
      where: { id: requestId },
      include: {
        result: true,
        crossCultural: {
          orderBy: { createdAt: "asc" },
        },
        redesigns: {
          orderBy: { createdAt: "asc" },
        },
        complianceAssessments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!record) {
      throw new AppError("Project not found", "NOT_FOUND", 404);
    }

    return {
      requestId: record.id,
      originalFilename: record.originalFilename,
      imagePath: record.imagePath,
      status: record.status,
      directionMode: record.directionMode,
      directionValue: record.directionValue,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      result: record.result
        ? {
            shape: record.result.shape,
            colors: record.result.colors,
            material: record.result.material,
            style: record.result.style,
          }
        : null,
      crossCulturalAnalyses: record.crossCultural.map((cc) => ({
        id: cc.id,
        targetMarket: cc.targetMarket,
        tabooFindings: cc.tabooFindings,
        festivalThemes: cc.festivalThemes,
        competitorStyles: cc.competitorStyles,
        summary: cc.summary,
        createdAt: cc.createdAt.toISOString(),
      })),
      redesignSuggestions: record.redesigns.map((rd) => ({
        id: rd.id,
        targetMarket: rd.targetMarket,
        crossCulturalAnalysisId: rd.crossCulturalAnalysisId,
        colorSchemes: rd.colorSchemes,
        shapeAdjustments: rd.shapeAdjustments,
        packagingSuggestions: rd.packagingSuggestions,
        assets: rd.assets,
        assetProvider: rd.assetProvider,
        assetModelName: rd.assetModelName,
        createdAt: rd.createdAt.toISOString(),
      })),
      complianceAssessments: record.complianceAssessments.map((ca) => ({
        id: ca.id,
        targetMarket: ca.targetMarket,
        report: ca.report,
        summary: ca.summary,
        createdAt: ca.createdAt.toISOString(),
      })),
    };
  }
}
