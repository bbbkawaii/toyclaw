import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import type { VisionProvider, VisionProviderInput, VisionProviderResult } from "../src/providers/vision/base";

class MockVisionProvider implements VisionProvider {
  readonly providerName = "mock";
  readonly modelName = "mock-vision-v1";

  async extractFeatures(input: VisionProviderInput): Promise<VisionProviderResult> {
    return {
      features: {
        shape: {
          category: "pig mascot",
          confidence: 0.91,
          evidence: input.direction.value,
        },
        colors: [
          {
            name: "red",
            hex: "#FF0000",
            proportion: 0.68,
            confidence: 0.9,
          },
          {
            name: "gold",
            hex: "#D4AF37",
            proportion: 0.32,
            confidence: 0.87,
          },
        ],
        material: [
          {
            name: "plastic",
            confidence: 0.9,
          },
        ],
        style: [
          {
            name: "festival",
            confidence: 0.82,
          },
        ],
      },
      rawModelOutput: { mocked: true },
      latencyMs: 10,
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

describe("cross-cultural routes", () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let tmpRoot: string;
  let dbUrl: string;

  beforeAll(async () => {
    tmpRoot = mkdtempSync(join(tmpdir(), "toyclaw-cc-test-"));
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

  it("creates and fetches cross-cultural analysis", async () => {
    const multipart = buildMultipart({
      fields: { directionText: "middle east festival gift toy" },
      file: {
        fieldName: "image",
        filename: "toy.png",
        contentType: "image/png",
        data: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
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
        targetMarket: "MIDDLE_EAST",
      },
    });

    expect(crossResponse.statusCode).toBe(200);
    const crossPayload = crossResponse.json();
    expect(crossPayload.analysisId).toBeTypeOf("string");
    expect(crossPayload.targetMarket).toBe("MIDDLE_EAST");
    expect(crossPayload.tabooFindings.some((item: { matched: boolean }) => item.matched)).toBe(true);
    expect(crossPayload.festivalThemes.length).toBeGreaterThan(0);
    expect(crossPayload.competitorStyles.length).toBeGreaterThan(0);

    const getResponse = await app.inject({
      method: "GET",
      url: `/api/v1/cross-cultural/analyze/${crossPayload.analysisId}`,
    });

    expect(getResponse.statusCode).toBe(200);
    const fetched = getResponse.json();
    expect(fetched.analysisId).toBe(crossPayload.analysisId);
    expect(fetched.summary).toContain("Middle East");
  });

  it("returns 404 when requestId does not exist", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/cross-cultural/analyze",
      payload: {
        requestId: randomUUID(),
        targetMarket: "US",
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().code).toBe("ANALYSIS_REQUEST_NOT_FOUND");
  });
});

