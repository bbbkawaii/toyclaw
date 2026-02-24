import { z } from "zod";

export const VISION_PROVIDERS = ["sophnet", "openai", "gemini"] as const;
export type VisionProviderType = (typeof VISION_PROVIDERS)[number];

export interface AppConfig {
  port: number;
  databaseUrl: string;
  corsOrigin: string;
  visionProvider: VisionProviderType;
  sophnetApiUrl: string;
  sophnetApiKey?: string;
  sophnetModel: string;
  openaiApiKey?: string;
  openaiModel: string;
  geminiVisionApiUrl: string;
  geminiVisionApiKey?: string;
  geminiVisionModel: string;
  geminiImageApiUrl: string;
  geminiImageApiKey?: string;
  geminiImageModel: string;
  geminiEmbeddingModel: string;
  geminiComplianceModel: string;
  complianceIndexDir: string;
  uploadDir: string;
  maxFileSizeMb: number;
  providerTimeoutMs: number;
}

const optionalSecretSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  },
  z.string().min(1).optional(),
);

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().default("file:./dev.db"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  VISION_PROVIDER: z.enum(VISION_PROVIDERS).default("sophnet"),
  SOPHNET_API_URL: z.string().url().default("https://www.sophnet.com/api/open-apis/v1/chat/completions"),
  SOPHNET_API_KEY: optionalSecretSchema,
  SOPHNET_MODEL: z.string().default("Kimi-K2.5"),
  OPENAI_API_KEY: optionalSecretSchema,
  OPENAI_MODEL: z.string().default("gpt-4.1"),
  GEMINI_VISION_API_URL: z
    .string()
    .url()
    .default("https://generativelanguage.googleapis.com/v1beta/models"),
  GEMINI_VISION_API_KEY: optionalSecretSchema,
  GEMINI_VISION_MODEL: z.string().default("gemini-3-flash-preview"),
  GEMINI_IMAGE_API_URL: z
    .string()
    .url()
    .default("https://generativelanguage.googleapis.com/v1beta/models"),
  GEMINI_IMAGE_API_KEY: optionalSecretSchema,
  GEMINI_IMAGE_MODEL: z.string().default("gemini-3-pro-image-preview"),
  GEMINI_EMBEDDING_MODEL: z.string().default("gemini-embedding-001"),
  GEMINI_COMPLIANCE_MODEL: z.string().default("gemini-3-flash-preview"),
  COMPLIANCE_INDEX_DIR: z.string().default("storage/compliance-index"),
  UPLOAD_DIR: z.string().default("storage/uploads"),
  MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(10),
  PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
});

export interface LoadConfigOptions {
  requireVisionProviderCredentials?: boolean;
  providerOverride?: VisionProviderType;
}

export function loadConfigFromEnv(options: LoadConfigOptions = {}): AppConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${parsed.error.message}`);
  }

  const effectiveProvider = options.providerOverride ?? parsed.data.VISION_PROVIDER;
  const effectiveGeminiVisionApiKey = parsed.data.GEMINI_VISION_API_KEY ?? parsed.data.GEMINI_IMAGE_API_KEY;

  if (options.requireVisionProviderCredentials) {
    if (effectiveProvider === "sophnet" && !parsed.data.SOPHNET_API_KEY) {
      throw new Error("SOPHNET_API_KEY is required when VISION_PROVIDER=sophnet");
    }
    if (effectiveProvider === "openai" && !parsed.data.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required when VISION_PROVIDER=openai");
    }
    if (effectiveProvider === "gemini" && !effectiveGeminiVisionApiKey) {
      throw new Error("GEMINI_VISION_API_KEY (or GEMINI_IMAGE_API_KEY) is required when VISION_PROVIDER=gemini");
    }
  }

  return {
    port: parsed.data.PORT,
    databaseUrl: parsed.data.DATABASE_URL,
    corsOrigin: parsed.data.CORS_ORIGIN,
    visionProvider: parsed.data.VISION_PROVIDER,
    sophnetApiUrl: parsed.data.SOPHNET_API_URL,
    sophnetApiKey: parsed.data.SOPHNET_API_KEY,
    sophnetModel: parsed.data.SOPHNET_MODEL,
    openaiApiKey: parsed.data.OPENAI_API_KEY,
    openaiModel: parsed.data.OPENAI_MODEL,
    geminiVisionApiUrl: parsed.data.GEMINI_VISION_API_URL,
    geminiVisionApiKey: effectiveGeminiVisionApiKey,
    geminiVisionModel: parsed.data.GEMINI_VISION_MODEL,
    geminiImageApiUrl: parsed.data.GEMINI_IMAGE_API_URL,
    geminiImageApiKey: parsed.data.GEMINI_IMAGE_API_KEY,
    geminiImageModel: parsed.data.GEMINI_IMAGE_MODEL,
    geminiEmbeddingModel: parsed.data.GEMINI_EMBEDDING_MODEL,
    geminiComplianceModel: parsed.data.GEMINI_COMPLIANCE_MODEL,
    complianceIndexDir: parsed.data.COMPLIANCE_INDEX_DIR,
    uploadDir: parsed.data.UPLOAD_DIR,
    maxFileSizeMb: parsed.data.MAX_FILE_SIZE_MB,
    providerTimeoutMs: parsed.data.PROVIDER_TIMEOUT_MS,
  };
}
