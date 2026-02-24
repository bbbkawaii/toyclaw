import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import {
  redesignRetryAssetBodySchema,
  redesignSuggestBodySchema,
  redesignSuggestParamsSchema,
} from "./schemas";
import type { RedesignService } from "./service";

export interface RedesignRoutesOptions {
  service: RedesignService;
}

export const redesignRoutes: FastifyPluginAsync<RedesignRoutesOptions> = async (
  app: FastifyInstance,
  options,
) => {
  app.post("/suggest", async (request) => {
    const payload = redesignSuggestBodySchema.parse(request.body ?? {});
    return options.service.createSuggestion(payload);
  });

  app.get<{
    Params: {
      suggestionId: string;
    };
  }>("/suggest/:suggestionId", async (request) => {
    const params = redesignSuggestParamsSchema.parse(request.params);
    return options.service.getSuggestion(params.suggestionId);
  });

  app.post<{
    Params: {
      suggestionId: string;
    };
  }>("/suggest/:suggestionId/retry", async (request) => {
    const params = redesignSuggestParamsSchema.parse(request.params);
    const payload = redesignRetryAssetBodySchema.parse(request.body ?? {});

    return options.service.retryAsset({
      suggestionId: params.suggestionId,
      asset: payload.asset,
    });
  });
};
