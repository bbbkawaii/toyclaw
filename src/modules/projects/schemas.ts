import { z } from "zod";

export const projectListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  status: z.enum(["PROCESSING", "SUCCEEDED", "FAILED"]).optional(),
});

export const projectDetailParamsSchema = z.object({
  requestId: z.string().uuid(),
});
