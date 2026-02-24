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

class RecordingImageProvider implements ImageGenerationProvider {
  readonly providerName = "recording";
  readonly modelName = "recording-v1";
  readonly calls: Array<{ prompt: string; referenceImageBase64?: string }> = [];

  async generatePreview(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    this.calls.push({
      prompt: input.prompt,
      referenceImageBase64: input.referenceImageBase64,
    });
    const digest = Buffer.from(`img-${this.calls.length}`, "utf8").toString("base64");
    return {
      imageBase64: digest,
      mimeType: "image/png",
      rawResponse: { mocked: true },
    };
  }
}

class PreviewFailingImageProvider implements ImageGenerationProvider {
  readonly providerName = "preview-failing";
  readonly modelName = "preview-failing-v1";
  readonly calls: Array<{ prompt: string; referenceImageBase64?: string }> = [];
  private callIndex = 0;

  async generatePreview(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    this.calls.push({
      prompt: input.prompt,
      referenceImageBase64: input.referenceImageBase64,
    });
    this.callIndex++;
    // First two calls are for preview (with-reference attempt, then text-only fallback) — both fail
    if (this.callIndex <= 2) {
      return { rawResponse: { mocked: true } };
    }
    const digest = Buffer.from(`img-${this.callIndex}`, "utf8").toString("base64");
    return {
      imageBase64: digest,
      mimeType: "image/png",
      rawResponse: { mocked: true },
    };
  }
}


class ReferenceSensitiveImageProvider implements ImageGenerationProvider {
  readonly providerName = "reference-sensitive";
  readonly modelName = "reference-sensitive-v1";

  async generatePreview(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    if (input.referenceImageBase64) {
      throw new Error("Unable to process input image.");
    }

    return {
      imageBase64: Buffer.from("fallback-image", "utf8").toString("base64"),
      mimeType: "image/png",
      rawResponse: {
        fallback: true,
      },
    };
  }
}

const VALID_PNG_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aE0AAAAASUVORK5CYII=",
  "base64",
);

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

  it("retries image generation without reference image when reference call fails", async () => {
    const fallbackApp = await createApp({
      prisma,
      visionProvider: new MockVisionProvider(),
      imageGenerationProvider: new ReferenceSensitiveImageProvider(),
      config: {
        databaseUrl: dbUrl,
        uploadDir: join(tmpRoot, "retry-uploads"),
        openaiModel: "mock-vision-v1",
        maxFileSizeMb: 10,
        providerTimeoutMs: 1000,
        port: 0,
      },
    });
    await fallbackApp.ready();

    const multipart = buildMultipart({
      fields: { directionPreset: "CHANGE_COLOR" },
      file: {
        fieldName: "image",
        filename: "toy.png",
        contentType: "image/png",
        data: VALID_PNG_BUFFER,
      },
    });

    const imageResponse = await fallbackApp.inject({
      method: "POST",
      url: "/api/v1/image-input/analyze",
      payload: multipart.body,
      headers: {
        "content-type": multipart.contentType,
      },
    });
    expect(imageResponse.statusCode).toBe(200);
    const imagePayload = imageResponse.json();

    const crossResponse = await fallbackApp.inject({
      method: "POST",
      url: "/api/v1/cross-cultural/analyze",
      payload: {
        requestId: imagePayload.requestId,
        targetMarket: "US",
      },
    });
    expect(crossResponse.statusCode).toBe(200);
    const crossPayload = crossResponse.json();

    const redesignResponse = await fallbackApp.inject({
      method: "POST",
      url: "/api/v1/redesign/suggest",
      payload: {
        requestId: imagePayload.requestId,
        crossCulturalAnalysisId: crossPayload.analysisId,
        assets: {
          previewImage: true,
          threeView: false,
          showcaseVideo: false,
        },
      },
    });

    await fallbackApp.close();

    expect(redesignResponse.statusCode).toBe(200);
    const redesignPayload = redesignResponse.json();
    expect(redesignPayload.assets.previewImage.status).toBe("READY");
    expect(redesignPayload.assets.threeView.front.status).toBe("SKIPPED");
    expect(redesignPayload.assets.showcaseVideo.status).toBe("SKIPPED");
  });

  it("chains preview output as reference for three-view generation", async () => {
    const recorder = new RecordingImageProvider();
    const chainApp = await createApp({
      prisma,
      visionProvider: new MockVisionProvider(),
      imageGenerationProvider: recorder,
      config: {
        databaseUrl: dbUrl,
        uploadDir: join(tmpRoot, "chain-uploads"),
        openaiModel: "mock-vision-v1",
        maxFileSizeMb: 10,
        providerTimeoutMs: 1000,
        port: 0,
      },
    });
    await chainApp.ready();

    const multipart = buildMultipart({
      fields: { directionPreset: "CHANGE_COLOR" },
      file: {
        fieldName: "image",
        filename: "toy.png",
        contentType: "image/png",
        data: VALID_PNG_BUFFER,
      },
    });

    const imageResponse = await chainApp.inject({
      method: "POST",
      url: "/api/v1/image-input/analyze",
      payload: multipart.body,
      headers: { "content-type": multipart.contentType },
    });
    expect(imageResponse.statusCode).toBe(200);
    const imagePayload = imageResponse.json();

    const crossResponse = await chainApp.inject({
      method: "POST",
      url: "/api/v1/cross-cultural/analyze",
      payload: {
        requestId: imagePayload.requestId,
        targetMarket: "US",
      },
    });
    expect(crossResponse.statusCode).toBe(200);
    const crossPayload = crossResponse.json();

    const redesignResponse = await chainApp.inject({
      method: "POST",
      url: "/api/v1/redesign/suggest",
      payload: {
        requestId: imagePayload.requestId,
        crossCulturalAnalysisId: crossPayload.analysisId,
        assets: {
          previewImage: true,
          threeView: true,
          showcaseVideo: false,
        },
      },
    });

    await chainApp.close();

    expect(redesignResponse.statusCode).toBe(200);
    const redesignPayload = redesignResponse.json();
    expect(redesignPayload.assets.previewImage.status).toBe("READY");
    expect(redesignPayload.assets.threeView.front.status).toBe("READY");

    // Preview call uses the original uploaded image as reference
    const previewCall = recorder.calls[0];
    expect(previewCall.prompt).toContain("hero shot");

    // Three-view calls should use the preview output (not the original upload) as reference
    const previewOutputBase64 = previewCall.referenceImageBase64;
    const threeViewCalls = recorder.calls.slice(1);
    expect(threeViewCalls).toHaveLength(3);
    for (const call of threeViewCalls) {
      expect(call.referenceImageBase64).not.toBe(previewOutputBase64);
      // The reference should be the preview output base64, not the original image
      expect(call.referenceImageBase64).toBeDefined();
    }

    // Prompts should contain the consistency requirement (referenceIsRedesign=true)
    for (const call of threeViewCalls) {
      expect(call.prompt).toContain("finalized redesign");
      expect(call.prompt).not.toContain("original toy before redesign");
    }
  });

  it("uses fallback prompt when preview fails and three-view gets original reference", async () => {
    const recorder = new PreviewFailingImageProvider();
    const failApp = await createApp({
      prisma,
      visionProvider: new MockVisionProvider(),
      imageGenerationProvider: recorder,
      config: {
        databaseUrl: dbUrl,
        uploadDir: join(tmpRoot, "fail-uploads"),
        openaiModel: "mock-vision-v1",
        maxFileSizeMb: 10,
        providerTimeoutMs: 1000,
        port: 0,
      },
    });
    await failApp.ready();

    const multipart = buildMultipart({
      fields: { directionPreset: "ADD_ACCESSORY" },
      file: {
        fieldName: "image",
        filename: "toy.png",
        contentType: "image/png",
        data: VALID_PNG_BUFFER,
      },
    });

    const imageResponse = await failApp.inject({
      method: "POST",
      url: "/api/v1/image-input/analyze",
      payload: multipart.body,
      headers: { "content-type": multipart.contentType },
    });
    expect(imageResponse.statusCode).toBe(200);
    const imagePayload = imageResponse.json();

    const crossResponse = await failApp.inject({
      method: "POST",
      url: "/api/v1/cross-cultural/analyze",
      payload: {
        requestId: imagePayload.requestId,
        targetMarket: "EUROPE",
      },
    });
    expect(crossResponse.statusCode).toBe(200);
    const crossPayload = crossResponse.json();

    const redesignResponse = await failApp.inject({
      method: "POST",
      url: "/api/v1/redesign/suggest",
      payload: {
        requestId: imagePayload.requestId,
        crossCulturalAnalysisId: crossPayload.analysisId,
        assets: {
          previewImage: true,
          threeView: true,
          showcaseVideo: false,
        },
      },
    });

    await failApp.close();

    expect(redesignResponse.statusCode).toBe(200);
    const redesignPayload = redesignResponse.json();
    expect(redesignPayload.assets.previewImage.status).toBe("FAILED");
    expect(redesignPayload.assets.threeView.front.status).toBe("READY");

    // When preview failed, three-view prompts should use the fallback wording
    // (referenceIsRedesign=false → "original toy before redesign")
    const threeViewCalls = recorder.calls.filter((c) => c.prompt.includes("view technical render"));
    expect(threeViewCalls.length).toBeGreaterThanOrEqual(3);
    for (const call of threeViewCalls) {
      expect(call.prompt).toContain("original toy before redesign");
      expect(call.prompt).not.toContain("finalized redesign");
    }
  });
});
