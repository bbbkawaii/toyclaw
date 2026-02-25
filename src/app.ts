import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import * as fs from "node:fs";
import * as path from "node:path";
import { PrismaClient } from "@prisma/client";
import Fastify, { type FastifyInstance } from "fastify";
import { loadConfigFromEnv, type AppConfig } from "./config";
import { registerGlobalErrorHandler } from "./lib/error-handler";
import { LocalFileStorage } from "./lib/storage/local-file";
import { complianceRoutes } from "./modules/compliance/routes";
import { ComplianceRetriever } from "./modules/compliance/retriever";
import { ComplianceService } from "./modules/compliance/service";
import { crossCulturalRoutes } from "./modules/cross-cultural/routes";
import { CrossCulturalService } from "./modules/cross-cultural/service";
import { imageInputRoutes } from "./modules/image-input/routes";
import { ImageInputService } from "./modules/image-input/service";
import { projectsRoutes } from "./modules/projects/routes";
import { ProjectsService } from "./modules/projects/service";
import { redesignRoutes } from "./modules/redesign/routes";
import { RedesignService } from "./modules/redesign/service";
import { GeminiEmbeddingProvider } from "./providers/embedding/gemini";
import type { ImageGenerationProvider } from "./providers/image/base";
import { GeminiImageProvider } from "./providers/image/gemini";
import type { VisionProvider } from "./providers/vision/base";
import { GeminiVisionProvider } from "./providers/vision/gemini";
import { OpenAIVisionProvider } from "./providers/vision/openai";
import { SophnetVisionProvider } from "./providers/vision/sophnet";

export interface CreateAppOptions {
  config?: Partial<AppConfig>;
  prisma?: PrismaClient;
  visionProvider?: VisionProvider;
  imageGenerationProvider?: ImageGenerationProvider;
  complianceRetriever?: ComplianceRetriever;
}

export async function createApp(options: CreateAppOptions = {}): Promise<FastifyInstance> {
  const envConfig = loadConfigFromEnv({
    requireVisionProviderCredentials: !options.visionProvider,
    providerOverride: options.config?.visionProvider,
  });
  const config: AppConfig = {
    ...envConfig,
    ...options.config,
  };

  const app = Fastify({
    logger: true,
  });

  registerGlobalErrorHandler(app);

  await app.register(cors, {
    origin: buildCorsOrigin(config.corsOrigin),
    credentials: true,
  });

  await app.register(multipart, {
    limits: {
      files: 1,
      fileSize: config.maxFileSizeMb * 1024 * 1024,
    },
  });

  app.addHook("preHandler", async () => {
    // Reserved for future API key or JWT auth middleware.
  });

  const prisma = options.prisma ?? new PrismaClient({ datasources: { db: { url: config.databaseUrl } } });
  if (!options.prisma) {
    await prisma.$connect();
    app.addHook("onClose", async () => {
      await prisma.$disconnect();
    });
  }

  const provider = options.visionProvider ?? createDefaultVisionProvider(config);
  const storage = new LocalFileStorage(config.uploadDir);
  const imageInputService = new ImageInputService({
    prisma,
    storage,
    provider,
  });
  const crossCulturalService = new CrossCulturalService({
    prisma,
  });
  const imageGenerationProvider = options.imageGenerationProvider ?? createDefaultImageGenerationProvider(config);
  const redesignService = new RedesignService({
    prisma,
    uploadDir: config.uploadDir,
    imageProvider: imageGenerationProvider,
  });

  const geminiApiKey = config.geminiImageApiKey ?? config.geminiVisionApiKey ?? "";
  const canRegisterCompliance = !!(geminiApiKey && (options.complianceRetriever || fs.existsSync(config.complianceIndexDir)));

  if (canRegisterCompliance) {
    const embeddingProvider = new GeminiEmbeddingProvider({
      apiBaseUrl: config.geminiVisionApiUrl,
      apiKey: geminiApiKey,
      modelName: config.geminiEmbeddingModel,
      timeoutMs: config.providerTimeoutMs,
    });
    const complianceRetriever = options.complianceRetriever ?? new ComplianceRetriever(
      config.complianceIndexDir,
      embeddingProvider,
    );
    const complianceService = new ComplianceService({
      prisma,
      retriever: complianceRetriever,
      geminiApiBaseUrl: config.geminiVisionApiUrl,
      geminiApiKey: geminiApiKey,
      geminiComplianceModel: config.geminiComplianceModel,
      timeoutMs: config.providerTimeoutMs,
    });

    await app.register(complianceRoutes, {
      prefix: "/api/v1/compliance",
      service: complianceService,
    });
  } else {
    app.log.warn("Compliance module disabled: missing Gemini API key or compliance index");
  }

  const projectsService = new ProjectsService({ prisma });

  await app.register(fastifyStatic, {
    root: path.resolve(config.uploadDir),
    prefix: "/uploads/",
    decorateReply: false,
  });

  await app.register(imageInputRoutes, {
    prefix: "/api/v1/image-input",
    service: imageInputService,
  });
  await app.register(crossCulturalRoutes, {
    prefix: "/api/v1/cross-cultural",
    service: crossCulturalService,
  });
  await app.register(redesignRoutes, {
    prefix: "/api/v1/redesign",
    service: redesignService,
  });
  await app.register(projectsRoutes, {
    prefix: "/api/v1/projects",
    service: projectsService,
  });

  app.get("/healthz", async () => ({
    status: "ok",
  }));

  app.get("/api/v1/capabilities", async () => ({
    compliance: canRegisterCompliance,
  }));

  return app;
}

function createDefaultVisionProvider(config: AppConfig): VisionProvider {
  if (config.visionProvider === "sophnet") {
    return new SophnetVisionProvider({
      apiUrl: config.sophnetApiUrl,
      apiKey: config.sophnetApiKey as string,
      modelName: config.sophnetModel,
      timeoutMs: config.providerTimeoutMs,
    });
  }

  if (config.visionProvider === "gemini") {
    return new GeminiVisionProvider({
      apiBaseUrl: config.geminiVisionApiUrl,
      apiKey: config.geminiVisionApiKey as string,
      modelName: config.geminiVisionModel,
      timeoutMs: config.providerTimeoutMs,
    });
  }

  return new OpenAIVisionProvider({
    apiKey: config.openaiApiKey as string,
    modelName: config.openaiModel,
    timeoutMs: config.providerTimeoutMs,
  });
}

function createDefaultImageGenerationProvider(config: AppConfig): ImageGenerationProvider | undefined {
  if (!config.geminiImageApiKey) {
    return undefined;
  }

  return new GeminiImageProvider({
    apiBaseUrl: config.geminiImageApiUrl,
    apiKey: config.geminiImageApiKey,
    modelName: config.geminiImageModel,
    timeoutMs: config.providerTimeoutMs,
  });
}

function buildCorsOrigin(corsOriginValue: string): (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => void {
  const normalized = corsOriginValue.trim();
  if (normalized === "*") {
    return (_origin, cb) => cb(null, true);
  }

  const allowedOrigins = normalized
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return (origin, cb) => {
    // Non-browser clients (curl/server-to-server) often do not send Origin.
    if (!origin) {
      cb(null, true);
      return;
    }
    cb(null, allowedOrigins.includes(origin));
  };
}
