import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { projectDetailParamsSchema, projectListQuerySchema } from "./schemas";
import type { ProjectsService } from "./service";

export interface ProjectsRoutesOptions {
  service: ProjectsService;
}

export const projectsRoutes: FastifyPluginAsync<ProjectsRoutesOptions> = async (
  app: FastifyInstance,
  options,
) => {
  app.get("/", async (request) => {
    const parsed = projectListQuerySchema.parse(request.query);
    return options.service.list(parsed);
  });

  app.get<{
    Params: { requestId: string };
  }>("/:requestId", async (request) => {
    const parsed = projectDetailParamsSchema.parse(request.params);
    return options.service.getDetail(parsed.requestId);
  });
};
