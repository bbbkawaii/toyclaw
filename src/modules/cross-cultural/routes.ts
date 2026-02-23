import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { crossCulturalAnalyzeBodySchema, crossCulturalAnalyzeParamsSchema } from "./schemas";
import type { CrossCulturalService } from "./service";

export interface CrossCulturalRoutesOptions {
  service: CrossCulturalService;
}

export const crossCulturalRoutes: FastifyPluginAsync<CrossCulturalRoutesOptions> = async (
  app: FastifyInstance,
  options,
) => {
  app.post("/analyze", async (request) => {
    const payload = crossCulturalAnalyzeBodySchema.parse(request.body ?? {});
    return options.service.analyze(payload);
  });

  app.get<{
    Params: {
      analysisId: string;
    };
  }>("/analyze/:analysisId", async (request) => {
    const params = crossCulturalAnalyzeParamsSchema.parse(request.params);
    return options.service.getAnalysis(params.analysisId);
  });
};

