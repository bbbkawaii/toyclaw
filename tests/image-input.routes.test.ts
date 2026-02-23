import { execSync } from "node:child_process";
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
    const sourceHint = input.direction.value.slice(0, 20);

    return {
      features: {
        shape: {
          category: "animal",
          confidence: 0.92,
          evidence: sourceHint,
        },
        colors: [
          {
            name: "red",
            hex: "#FF0000",
            proportion: 0.7,
            confidence: 0.9,
          },
          {
            name: "white",
            hex: "#FFFFFF",
            proportion: 0.3,
            confidence: 0.88,
          },
        ],
        material: [
          {
            name: "plastic",
            confidence: 0.86,
          },
        ],
        style: [
          {
            name: "cartoon",
            confidence: 0.8,
          },
        ],
      },
      rawModelOutput: { mocked: true },
      latencyMs: 12,
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

describe("image input routes", () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let tmpRoot: string;
  let dbUrl: string;

  beforeAll(async () => {
    tmpRoot = mkdtempSync(join(tmpdir(), "toyclaw-test-"));
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

  it("analyzes uploaded image with directionPreset", async () => {
    const multipart = buildMultipart({
      fields: {
        directionPreset: "CHANGE_COLOR",
      },
      file: {
        fieldName: "image",
        filename: "toy.png",
        contentType: "image/png",
        data: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/image-input/analyze",
      payload: multipart.body,
      headers: {
        "content-type": multipart.contentType,
      },
    });

    expect(response.statusCode).toBe(200);
    const payload = response.json();
    expect(payload.requestId).toBeTypeOf("string");
    expect(payload.input.direction.mode).toBe("PRESET");
    expect(payload.features.shape.category).toBe("animal");
    expect(payload.model.provider).toBe("mock");
  });

  it("returns 400 when direction is missing", async () => {
    const multipart = buildMultipart({
      fields: {},
      file: {
        fieldName: "image",
        filename: "toy.png",
        contentType: "image/png",
        data: Buffer.from([1, 2, 3, 4]),
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/image-input/analyze",
      payload: multipart.body,
      headers: {
        "content-type": multipart.contentType,
      },
    });

    expect(response.statusCode).toBe(400);
    const payload = response.json();
    expect(payload.code).toBe("MISSING_DIRECTION");
  });

  it("returns 415 for invalid file type", async () => {
    const multipart = buildMultipart({
      fields: {
        directionText: "test direction",
      },
      file: {
        fieldName: "image",
        filename: "toy.txt",
        contentType: "text/plain",
        data: Buffer.from("not an image", "utf8"),
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/image-input/analyze",
      payload: multipart.body,
      headers: {
        "content-type": multipart.contentType,
      },
    });

    expect(response.statusCode).toBe(415);
    const payload = response.json();
    expect(payload.code).toBe("INVALID_FILE_TYPE");
  });

  it("fetches analysis by requestId", async () => {
    const multipart = buildMultipart({
      fields: {
        directionText: "add little festival ribbon",
      },
      file: {
        fieldName: "image",
        filename: "toy.webp",
        contentType: "image/webp",
        data: Buffer.from([0x52, 0x49, 0x46, 0x46]),
      },
    });

    const postResponse = await app.inject({
      method: "POST",
      url: "/api/v1/image-input/analyze",
      payload: multipart.body,
      headers: {
        "content-type": multipart.contentType,
      },
    });

    expect(postResponse.statusCode).toBe(200);
    const created = postResponse.json();

    const getResponse = await app.inject({
      method: "GET",
      url: `/api/v1/image-input/analyze/${created.requestId}`,
    });

    expect(getResponse.statusCode).toBe(200);
    const fetched = getResponse.json();
    expect(fetched.requestId).toBe(created.requestId);
    expect(fetched.features.colors).toHaveLength(2);
    expect(fetched.input.direction.mode).toBe("TEXT");
  });
});
