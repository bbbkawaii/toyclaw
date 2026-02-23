import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import type { ImageGenerationInput, ImageGenerationProvider, ImageGenerationResult } from "../src/providers/image/base";
import type { VisionProvider, VisionProviderInput, VisionProviderResult } from "../src/providers/vision/base";

class MockVisionProvider implements VisionProvider {
  readonly providerName = "mock";
  readonly modelName = "mock-vision-v1";

  async extractFeatures(input: VisionProviderInput): Promise<VisionProviderResult> {
    return {
      features: {
        shape: {
          category: "animal plush",
          confidence: 0.9,
          evidence: input.direction.value,
        },
        colors: [
          {
            name: "blue",
            hex: "#2563EB",
            proportion: 0.65,
            confidence: 0.91,
          },
          {
            name: "white",
            hex: "#F8FAFC",
            proportion: 0.35,
            confidence: 0.88,
          },
        ],
        material: [
          {
            name: "soft fabric",
            confidence: 0.9,
          },
        ],
        style: [
          {
            name: "cute",
            confidence: 0.86,
          },
        ],
      },
      rawModelOutput: { mocked: true },
      latencyMs: 11,
    };
  }
}

class MockImageGenerationProvider implements ImageGenerationProvider {
  readonly providerName = "mock-image";
  readonly modelName = "mock-image-v1";

  async generatePreview(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    const digest = Buffer.from(input.prompt.slice(0, 32), "utf8").toString("base64");
    return {
      imageBase64: digest,
      mimeType: "image/png",
      rawResponse: {
        mocked: true,
      },
    };
  }
}

interface MultipartBuilderInput {
  fields: Record<string, string>;
  file: {
    fieldName: string;
    filename: string;
    contentType: string;
    data: Buffer;
  };
}

function buildMultipart(input: MultipartBuilderInput): { body: Buffer; contentType: string } {
  const boundary = `----toyclaw-${Math.random().toString(16).slice(2)}`;
  const chunks: Buffer[] = [];

  for (const [name, value] of Object.entries(input.fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
        "utf8",
      ),
    );
  }

  chunks.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${input.file.fieldName}"; filename="${input.file.filename}"\r\nContent-Type: ${input.file.contentType}\r\n\r\n`,
      "utf8",
    ),
  );
  chunks.push(input.file.data);
  chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`, "utf8"));

  return {
    body: Buffer.concat(chunks),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

describe("redesign routes", () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let tmpRoot: string;
  let dbUrl: string;

  beforeAll(async () => {
    tmpRoot = mkdtempSync(join(tmpdir(), "toyclaw-rd-test-"));
    const dbPath = join(tmpRoot, "test.db").replaceAll("\\", "/");
    dbUrl = `file:${dbPath}`;

    execSync("npx prisma db push --skip-generate", {
      cwd: resolve(__dirname, ".."),
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: "pipe",
    });

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
    await prisma.$connect();

    app = await createApp({
      prisma,
      visionProvider: new MockVisionProvider(),
      imageGenerationProvider: new MockImageGenerationProvider(),
      config: {
        databaseUrl: dbUrl,
        uploadDir: join(tmpRoot, "uploads"),
        openaiModel: "mock-vision-v1",
        maxFileSizeMb: 10,
        providerTimeoutMs: 1000,
        port: 0,
      },
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    rmSync(tmpRoot, { recursive: true, force: true });
  });

  it("creates redesign suggestion with assets and fetches it", async () => {
    const multipart = buildMultipart({
      fields: { directionPreset: "SEASONAL_THEME" },
      file: {
        fieldName: "image",
        filename: "toy.webp",
        contentType: "image/webp",
        data: Buffer.from([0x52, 0x49, 0x46, 0x46]),
      },
    });

    const imageResponse = await app.inject({
      method: "POST",
      url: "/api/v1/image-input/analyze",
      payload: multipart.body,
      headers: {
        "content-type": multipart.contentType,
      },
    });
    expect(imageResponse.statusCode).toBe(200);
    const imagePayload = imageResponse.json();

    const crossResponse = await app.inject({
      method: "POST",
      url: "/api/v1/cross-cultural/analyze",
      payload: {
        requestId: imagePayload.requestId,
        targetMarket: "JAPAN_KOREA",
      },
    });
    expect(crossResponse.statusCode).toBe(200);
    const crossPayload = crossResponse.json();

    const redesignResponse = await app.inject({
      method: "POST",
      url: "/api/v1/redesign/suggest",
      payload: {
        requestId: imagePayload.requestId,
        crossCulturalAnalysisId: crossPayload.analysisId,
        assets: {
          previewImage: true,
          threeView: true,
          showcaseVideo: true,
        },
      },
    });

    expect(redesignResponse.statusCode).toBe(200);
    const redesignPayload = redesignResponse.json();
    expect(redesignPayload.suggestionId).toBeTypeOf("string");
    expect(redesignPayload.colorSchemes.length).toBeGreaterThan(1);
    expect(redesignPayload.shapeAdjustments.length).toBeGreaterThan(1);
    expect(redesignPayload.packagingSuggestions.length).toBeGreaterThan(1);
    expect(redesignPayload.assets.previewImage.status).toBe("READY");
    expect(redesignPayload.assets.threeView.front.status).toBe("READY");
    expect(redesignPayload.assets.showcaseVideo.status).toBe("SCRIPT_ONLY");
    expect(redesignPayload.assets.showcaseVideo.keyframes).toHaveLength(0);
    expect(redesignPayload.model.provider).toBe("mock-image");

    const getResponse = await app.inject({
      method: "GET",
      url: `/api/v1/redesign/suggest/${redesignPayload.suggestionId}`,
    });
    expect(getResponse.statusCode).toBe(200);
    const fetched = getResponse.json();
    expect(fetched.suggestionId).toBe(redesignPayload.suggestionId);
    expect(fetched.targetMarket).toBe("JAPAN_KOREA");
  });

  it("returns 400 when cross-cultural analysis does not belong to request", async () => {
    const multipartA = buildMultipart({
      fields: { directionText: "first toy" },
      file: {
        fieldName: "image",
        filename: "a.png",
        contentType: "image/png",
        data: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      },
    });
    const firstImage = await app.inject({
      method: "POST",
      url: "/api/v1/image-input/analyze",
      payload: multipartA.body,
      headers: { "content-type": multipartA.contentType },
    });
    expect(firstImage.statusCode).toBe(200);
    const firstPayload = firstImage.json();

    const cross = await app.inject({
      method: "POST",
      url: "/api/v1/cross-cultural/analyze",
      payload: {
        requestId: firstPayload.requestId,
        targetMarket: "US",
      },
    });
    expect(cross.statusCode).toBe(200);
    const crossPayload = cross.json();

    const multipartB = buildMultipart({
      fields: { directionText: "second toy" },
      file: {
        fieldName: "image",
        filename: "b.png",
        contentType: "image/png",
        data: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      },
    });
    const secondImage = await app.inject({
      method: "POST",
      url: "/api/v1/image-input/analyze",
      payload: multipartB.body,
      headers: { "content-type": multipartB.contentType },
    });
    expect(secondImage.statusCode).toBe(200);
    const secondPayload = secondImage.json();

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/redesign/suggest",
      payload: {
        requestId: secondPayload.requestId,
        crossCulturalAnalysisId: crossPayload.analysisId,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("CROSS_CULTURAL_MISMATCH");
  });
});
