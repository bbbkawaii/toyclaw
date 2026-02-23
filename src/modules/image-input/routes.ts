import type { MultipartFile } from "@fastify/multipart";
import type { FastifyInstance, FastifyPluginAsync, FastifyRequest } from "fastify";
import { AppError } from "../../lib/errors";
import type { ImageInputService } from "./service";

export interface ImageInputRoutesOptions {
  service: ImageInputService;
}

export const imageInputRoutes: FastifyPluginAsync<ImageInputRoutesOptions> = async (
  app: FastifyInstance,
  options,
) => {
  app.post("/analyze", async (request) => {
    const payload = await readMultipartPayload(request);
    return options.service.analyzeUpload(payload);
  });

  app.get<{
    Params: {
      requestId: string;
    };
  }>("/analyze/:requestId", async (request) => {
    return options.service.getAnalysis(request.params.requestId);
  });
};

interface MultipartPayload {
  filePart: MultipartFile;
  directionText?: string;
  directionPreset?: string;
}

async function readMultipartPayload(request: FastifyRequest): Promise<MultipartPayload> {
  const filePart = await request.file();

  if (!filePart) {
    throw new AppError("image file is required", "MISSING_IMAGE", 400);
  }

  const directionText = extractFieldValue(filePart.fields?.directionText);
  const directionPreset = extractFieldValue(filePart.fields?.directionPreset);

  return {
    filePart,
    directionText,
    directionPreset,
  };
}

function extractFieldValue(field: unknown): string | undefined {
  if (!field) {
    return undefined;
  }

  if (Array.isArray(field)) {
    return extractFieldValue(field[0]);
  }

  if (typeof field === "object" && "value" in field) {
    const value = (field as { value: unknown }).value;
    if (typeof value === "string") {
      return value;
    }
    if (value === null || value === undefined) {
      return undefined;
    }
    return String(value);
  }

  return undefined;
}
