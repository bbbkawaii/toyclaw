import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { complianceAssessBodySchema, complianceAssessParamsSchema } from "./schemas";
import type { ComplianceService } from "./service";

export interface ComplianceRoutesOptions {
  service: ComplianceService;
}

export const complianceRoutes: FastifyPluginAsync<ComplianceRoutesOptions> = async (
  app: FastifyInstance,
  options,
) => {
  app.post("/assess", async (request) => {
    const payload = complianceAssessBodySchema.parse(request.body ?? {});
    return options.service.assess(payload);
  });

  app.get<{
    Params: {
      assessmentId: string;
    };
  }>("/assess/:assessmentId", async (request) => {
    const params = complianceAssessParamsSchema.parse(request.params);
    return options.service.getAssessment(params.assessmentId);
  });
};
