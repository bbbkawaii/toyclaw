import type { Prisma, PrismaClient } from "@prisma/client";
import { AppError } from "../../lib/errors";
import { extractedFeaturesSchema } from "../image-input/schemas";
import type { ExtractedFeatures } from "../image-input/types";
import { getMarketProfile, type CompetitorStyleProfile, type FestivalThemeProfile, type TabooRuleProfile } from "./knowledge-base";
import {
  competitorStyleReferenceSchema,
  crossCulturalResultPayloadSchema,
  festivalThemeMatchSchema,
  tabooFindingSchema,
} from "./schemas";
import type {
  CompetitorStyleReference,
  CrossCulturalAnalysisResponse,
  FestivalThemeMatch,
  TabooFinding,
  TargetMarket,
  TabooSeverity,
} from "./types";

export interface AnalyzeCrossCulturalInput {
  requestId: string;
  targetMarket: TargetMarket;
}

interface CrossCulturalServiceDeps {
  prisma: PrismaClient;
}

interface FeatureContext {
  sourceText: string;
  directionText: string;
  colorNames: Set<string>;
  colorHexes: Set<string>;
  materialNames: Set<string>;
  styleNames: Set<string>;
  shapeText: string;
}

const SEVERITY_RANK: Record<TabooSeverity, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export class CrossCulturalService {
  constructor(private readonly deps: CrossCulturalServiceDeps) {}

  async analyze(input: AnalyzeCrossCulturalInput): Promise<CrossCulturalAnalysisResponse> {
    const existing = await this.deps.prisma.analysisRequest.findUnique({
      where: { id: input.requestId },
      include: { result: true },
    });

    if (!existing) {
      throw new AppError("Image analysis request not found", "ANALYSIS_REQUEST_NOT_FOUND", 404);
    }
    if (existing.status !== "SUCCEEDED" || !existing.result) {
      throw new AppError("Image analysis is not ready", "ANALYSIS_NOT_READY", 409, {
        status: existing.status,
      });
    }

    const features = extractedFeaturesSchema.parse({
      shape: existing.result.shape,
      colors: existing.result.colors,
      material: existing.result.material,
      style: existing.result.style,
    });
    const context = this.buildFeatureContext(features, existing.directionValue);
    const profile = getMarketProfile(input.targetMarket);

    const tabooFindings = this.evaluateTabooRules(profile.tabooRules, context);
    const festivalThemes = this.matchFestivalThemes(profile.festivalThemes, context);
    const competitorStyles = this.matchCompetitorStyles(profile.competitorStyles, context);
    const summary = this.buildSummary(profile.displayName, tabooFindings, festivalThemes, competitorStyles);

    const parsedPayload = crossCulturalResultPayloadSchema.parse({
      tabooFindings,
      festivalThemes,
      competitorStyles,
      summary,
    });

    const created = await this.deps.prisma.crossCulturalAnalysis.create({
      data: {
        requestId: existing.id,
        targetMarket: input.targetMarket,
        tabooFindings: parsedPayload.tabooFindings as unknown as Prisma.InputJsonValue,
        festivalThemes: parsedPayload.festivalThemes as unknown as Prisma.InputJsonValue,
        competitorStyles: parsedPayload.competitorStyles as unknown as Prisma.InputJsonValue,
        summary: parsedPayload.summary,
      },
    });

    return {
      analysisId: created.id,
      requestId: created.requestId,
      targetMarket: created.targetMarket as TargetMarket,
      tabooFindings: parsedPayload.tabooFindings,
      festivalThemes: parsedPayload.festivalThemes,
      competitorStyles: parsedPayload.competitorStyles,
      summary: created.summary,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async getAnalysis(analysisId: string): Promise<CrossCulturalAnalysisResponse> {
    const existing = await this.deps.prisma.crossCulturalAnalysis.findUnique({
      where: { id: analysisId },
    });

    if (!existing) {
      throw new AppError("Cross-cultural analysis not found", "CROSS_CULTURAL_NOT_FOUND", 404);
    }

    const payload = crossCulturalResultPayloadSchema.parse({
      tabooFindings: existing.tabooFindings,
      festivalThemes: existing.festivalThemes,
      competitorStyles: existing.competitorStyles,
      summary: existing.summary,
    });

    return {
      analysisId: existing.id,
      requestId: existing.requestId,
      targetMarket: existing.targetMarket as TargetMarket,
      tabooFindings: payload.tabooFindings,
      festivalThemes: payload.festivalThemes,
      competitorStyles: payload.competitorStyles,
      summary: payload.summary,
      createdAt: existing.createdAt.toISOString(),
    };
  }

  private buildFeatureContext(features: ExtractedFeatures, directionValue: string): FeatureContext {
    const colorNames = new Set(features.colors.map((item) => normalize(item.name)));
    const colorHexes = new Set(features.colors.map((item) => item.hex.toUpperCase()));
    const materialNames = new Set(features.material.map((item) => normalize(item.name)));
    const styleNames = new Set(features.style.map((item) => normalize(item.name)));
    const shapeText = normalize(features.shape.category);
    const directionText = normalize(directionValue);

    const rawContext = [
      features.shape.category,
      ...features.colors.map((item) => `${item.name} ${item.hex}`),
      ...features.material.map((item) => item.name),
      ...features.style.map((item) => item.name),
      directionValue,
    ].join(" ");

    return {
      sourceText: normalize(rawContext),
      directionText,
      colorNames,
      colorHexes,
      materialNames,
      styleNames,
      shapeText,
    };
  }

  private evaluateTabooRules(rules: TabooRuleProfile[], context: FeatureContext): TabooFinding[] {
    const findings = rules.map((rule) => {
      const evidence = uniqueStrings([
        ...this.collectKeywordEvidence("color", rule.colorKeywords, context.sourceText),
        ...this.collectHexEvidence(rule.colorHexes, context.colorHexes),
        ...this.collectExactEvidence("material", rule.materialKeywords, context.materialNames, context.sourceText),
        ...this.collectExactEvidence("style", rule.styleKeywords, context.styleNames, context.sourceText),
        ...this.collectShapeEvidence(rule.shapeKeywords, context.shapeText, context.sourceText),
      ]);

      return tabooFindingSchema.parse({
        ruleId: rule.id,
        title: rule.title,
        severity: rule.severity,
        matched: evidence.length > 0,
        evidence,
        risk: rule.risk,
        recommendation: rule.recommendation,
      });
    });

    return findings.sort(
      (a, b) =>
        Number(b.matched) - Number(a.matched) ||
        SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
        a.title.localeCompare(b.title),
    );
  }

  private matchFestivalThemes(themes: FestivalThemeProfile[], context: FeatureContext): FestivalThemeMatch[] {
    return themes
      .map((theme) => {
        const keywordHits = theme.keywords.filter((keyword) => includesKeyword(context.sourceText, keyword));
        const colorHits = theme.preferredColors.filter((color) => this.hasColorMatch(color, context));
        const directionHits = theme.keywords.filter((keyword) => includesKeyword(context.directionText, keyword));
        const score = clamp01(
          0.2 +
            Math.min(keywordHits.length, 3) * 0.17 +
            Math.min(colorHits.length, 2) * 0.15 +
            (directionHits.length > 0 ? 0.12 : 0),
        );

        const reasonSegments = [
          keywordHits.length > 0 ? `keyword hits: ${keywordHits.slice(0, 3).join(", ")}` : "",
          colorHits.length > 0 ? `color fit: ${colorHits.slice(0, 2).join(", ")}` : "",
        ].filter((item) => item.length > 0);

        return festivalThemeMatchSchema.parse({
          themeId: theme.id,
          name: theme.name,
          season: theme.season,
          relevance: score,
          reason:
            reasonSegments.length > 0
              ? reasonSegments.join("; ")
              : "General seasonal demand with compatible toy style.",
          suggestedElements: theme.styleHints,
          suggestedColors: theme.preferredColors,
        });
      })
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 3);
  }

  private matchCompetitorStyles(
    references: CompetitorStyleProfile[],
    context: FeatureContext,
  ): CompetitorStyleReference[] {
    return references
      .map((item) => {
        const keywordHits = item.keywords.filter((keyword) => includesKeyword(context.sourceText, keyword));
        const paletteHits = item.palette.filter((color) => this.hasColorMatch(color, context));
        const score = clamp01(0.25 + Math.min(keywordHits.length, 3) * 0.18 + Math.min(paletteHits.length, 2) * 0.14);

        return competitorStyleReferenceSchema.parse({
          referenceId: item.id,
          brandArchetype: item.brandArchetype,
          styleSummary: item.styleSummary,
          matchingScore: score,
          opportunities:
            keywordHits.length > 0
              ? uniqueStrings([...item.opportunities, `borrow cues from: ${keywordHits.slice(0, 2).join(", ")}`])
              : item.opportunities,
        });
      })
      .sort((a, b) => b.matchingScore - a.matchingScore)
      .slice(0, 3);
  }

  private buildSummary(
    marketName: string,
    tabooFindings: TabooFinding[],
    festivalThemes: FestivalThemeMatch[],
    competitorStyles: CompetitorStyleReference[],
  ): string {
    const matchedCount = tabooFindings.filter((item) => item.matched).length;
    const topTheme = festivalThemes[0]?.name ?? "N/A";
    const topCompetitor = competitorStyles[0]?.brandArchetype ?? "N/A";
    const tabooSummary =
      matchedCount > 0
        ? `${matchedCount} taboo risks detected`
        : "no direct taboo match detected";

    return `${marketName}: ${tabooSummary}; top seasonal theme: ${topTheme}; strongest competitor style: ${topCompetitor}.`;
  }

  private collectKeywordEvidence(label: string, keywords: string[] | undefined, sourceText: string): string[] {
    if (!keywords || keywords.length === 0) {
      return [];
    }
    return keywords
      .filter((keyword) => includesKeyword(sourceText, keyword))
      .map((keyword) => `${label} keyword matched: ${keyword}`);
  }

  private collectHexEvidence(hexes: string[] | undefined, colorHexes: Set<string>): string[] {
    if (!hexes || hexes.length === 0) {
      return [];
    }

    return hexes
      .map((hex) => hex.toUpperCase())
      .filter((hex) => colorHexes.has(hex))
      .map((hex) => `palette contains ${hex}`);
  }

  private collectExactEvidence(
    label: string,
    values: string[] | undefined,
    existingValues: Set<string>,
    sourceText: string,
  ): string[] {
    if (!values || values.length === 0) {
      return [];
    }

    return values
      .filter((value) => existingValues.has(normalize(value)) || includesKeyword(sourceText, value))
      .map((value) => `${label} matched: ${value}`);
  }

  private collectShapeEvidence(keywords: string[] | undefined, shapeText: string, sourceText: string): string[] {
    if (!keywords || keywords.length === 0) {
      return [];
    }

    return keywords
      .filter((keyword) => includesKeyword(shapeText, keyword) || includesKeyword(sourceText, keyword))
      .map((keyword) => `shape cue matched: ${keyword}`);
  }

  private hasColorMatch(color: string, context: FeatureContext): boolean {
    if (color.startsWith("#")) {
      return context.colorHexes.has(color.toUpperCase());
    }
    return context.colorNames.has(normalize(color)) || includesKeyword(context.sourceText, color);
  }
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function includesKeyword(sourceText: string, keyword: string): boolean {
  return normalize(sourceText).includes(normalize(keyword));
}

function clamp01(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return Number(value.toFixed(3));
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

