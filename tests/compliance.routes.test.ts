import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import { ComplianceRetriever } from "../src/modules/compliance/retriever";
import type { RetrievedChunk } from "../src/modules/compliance/retriever";
import type { VisionProvider, VisionProviderInput, VisionProviderResult } from "../src/providers/vision/base";
import type { GeminiEmbeddingProvider } from "../src/providers/embedding/gemini";

// ── Mock fetchWithProxy so no real Gemini calls are made ──────────────
const FAKE_REPORT = {
  applicableStandards: [
    {
      standardId: "EN 71-3:2019",
      standardName: "Safety of toys — Migration of certain elements",
      mandatory: true,
      relevance: "PVC material requires migration testing for heavy metals",
    },
  ],
  materialFindings: [
    {
      material: "PVC",
      concern: "Phthalate content",
      requirement: "DEHP+BBP+DBP ≤ 0.1% by weight per REACH Annex XVII Entry 51",
      sourceStandard: "EN 71-3:2019",
    },
  ],
  ageGrading: {
    recommendedAge: "3+",
    reason: "Small parts risk for children under 36 months",
    requiredWarnings: ["Not suitable for children under 36 months"],
  },
  labelRequirements: [
    {
      item: "CE marking",
      detail: "Minimum 5 mm height, affixed visibly and indelibly",
      mandatory: true,
    },
  ],
  certificationPath: [
    {
      step: "EN 71 testing",
      description: "Submit samples to accredited lab for EN 71-1/2/3 testing",
    },
  ],
  summary: "The plush bear with PVC components requires EN 71 testing and CE marking for the European market.",
};

vi.mock("../src/lib/http/fetch-with-proxy", () => ({
  fetchWithProxy: vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [{ text: JSON.stringify(FAKE_REPORT) }],
          },
        },
      ],
    }),
  }),
}));

class MockVisionProvider implements VisionProvider {
  readonly providerName = "mock";
  readonly modelName = "mock-vision-v1";

  async extractFeatures(_input: VisionProviderInput): Promise<VisionProviderResult> {
    return {
      features: {
        shape: {
          category: "plush bear",
          confidence: 0.92,
          evidence: "round body with soft limbs",
        },
        colors: [
          { name: "red", hex: "#FF0000", proportion: 0.5, confidence: 0.9 },
          { name: "white", hex: "#FFFFFF", proportion: 0.5, confidence: 0.9 },
        ],
        material: [
          { name: "PVC", confidence: 0.85 },
          { name: "polyester fabric", confidence: 0.8 },
        ],
        style: [
          { name: "cute", confidence: 0.9 },
        ],
      },
      rawModelOutput: { mocked: true },
      latencyMs: 5,
    };
  }
}

class MockComplianceRetriever extends ComplianceRetriever {
  constructor() {
    // Pass dummy values — we override all methods
    super("", {} as GeminiEmbeddingProvider);
  }

  override async load(): Promise<void> {
    // No-op
  }

  override isLoaded(): boolean {
    return true;
  }

  override async retrieve(_query: string, _targetMarket: string, _topK?: number): Promise<RetrievedChunk[]> {
    return [
      {
        id: "EUROPE/EN_71-3_Migration_Elements.pdf#0",
        text: "EN 71-3:2019+A1:2021 specifies migration limits for 19 elements from toy materials. For Category I materials (dry, brittle, powder-like or pliable), the lead migration limit is 2.0 mg/kg. PVC materials must be tested for phthalate content per REACH Annex XVII Entry 51: the sum of DEHP, BBP, and DBP shall not exceed 0.1% by weight.",
        score: 0.92,
        source: "EN_71-3_Migration_Elements.pdf",
        section: "Migration limits",
      },
      {
        id: "EUROPE/EU_Toy_Safety_Directive_2009_48_EC.pdf#0",
        text: "The CE marking shall be affixed visibly, legibly and indelibly to the toy, to an attached label, or to the packaging. The minimum height of the CE marking shall be 5 mm. Toys intended for children under 36 months must bear the warning: 'Not suitable for children under 36 months' or 'Not suitable for children under 3 years', together with a brief indication of the specific hazards.",
        score: 0.88,
        source: "EU_Toy_Safety_Directive_2009_48_EC.pdf",
        section: "CE marking requirements",
      },
      {
        id: "EUROPE/EN_71-1_Mechanical_Physical_Properties.pdf#0",
        text: "EN 71-1 specifies requirements for mechanical and physical properties of toys. Small parts: any toy or component which, when tested in the small parts cylinder, fits entirely within the cylinder, shall not be intended for use by children under 36 months. Sharp points and edges testing shall be performed on accessible parts.",
        score: 0.85,
        source: "EN_71-1_Mechanical_Physical_Properties.pdf",
        section: "Mechanical safety",
      },
    ];
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

describe("compliance routes", () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let tmpRoot: string;
  let dbUrl: string;

  beforeAll(async () => {
    tmpRoot = mkdtempSync(join(tmpdir(), "toyclaw-compliance-test-"));
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
      complianceRetriever: new MockComplianceRetriever(),
      config: {
        databaseUrl: dbUrl,
        uploadDir: join(tmpRoot, "uploads"),
        openaiModel: "mock-vision-v1",
        maxFileSizeMb: 10,
        providerTimeoutMs: 60000,
        port: 0,
        geminiComplianceModel: "gemini-3-flash-preview",
      },
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    rmSync(tmpRoot, { recursive: true, force: true });
  });

  async function createImageAnalysis(): Promise<string> {
    const multipart = buildMultipart({
      fields: { directionText: "european market plush toy" },
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
      headers: { "content-type": multipart.contentType },
    });
    expect(response.statusCode).toBe(200);
    return response.json().requestId;
  }

  it("returns 404 when requestId does not exist", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/compliance/assess",
      payload: {
        requestId: randomUUID(),
        targetMarket: "EUROPE",
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().code).toBe("ANALYSIS_REQUEST_NOT_FOUND");
  });

  it("returns 404 when assessmentId does not exist", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/compliance/assess/${randomUUID()}`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().code).toBe("COMPLIANCE_NOT_FOUND");
  });

  it("validates request body", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/compliance/assess",
      payload: {
        requestId: "not-a-uuid",
        targetMarket: "INVALID",
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("creates and fetches compliance assessment", async () => {
    const requestId = await createImageAnalysis();

    const assessResponse = await app.inject({
      method: "POST",
      url: "/api/v1/compliance/assess",
      payload: {
        requestId,
        targetMarket: "EUROPE",
      },
    });

    expect(assessResponse.statusCode).toBe(200);
    const payload = assessResponse.json();
    expect(payload.assessmentId).toBeTypeOf("string");
    expect(payload.requestId).toBe(requestId);
    expect(payload.targetMarket).toBe("EUROPE");
    expect(payload.report.applicableStandards.length).toBeGreaterThan(0);
    expect(payload.report.certificationPath.length).toBeGreaterThan(0);
    expect(payload.report.ageGrading.recommendedAge).toBeTypeOf("string");
    expect(payload.summary).toBeTypeOf("string");

    // Fetch by ID
    const getResponse = await app.inject({
      method: "GET",
      url: `/api/v1/compliance/assess/${payload.assessmentId}`,
    });

    expect(getResponse.statusCode).toBe(200);
    const fetched = getResponse.json();
    expect(fetched.assessmentId).toBe(payload.assessmentId);
    expect(fetched.report.applicableStandards).toEqual(payload.report.applicableStandards);
  });
});

// ── Retriever unit tests ──────────────────────────────────────────────
describe("ComplianceRetriever", () => {
  it("throws COMPLIANCE_INDEX_MISSING for empty directory", async () => {
    const emptyDir = mkdtempSync(join(tmpdir(), "toyclaw-retriever-empty-"));
    const retriever = new ComplianceRetriever(emptyDir, {} as GeminiEmbeddingProvider);

    await expect(retriever.load()).rejects.toMatchObject({
      code: "COMPLIANCE_INDEX_MISSING",
      statusCode: 503,
    });

    rmSync(emptyDir, { recursive: true, force: true });
  });

  it("throws EMBEDDING_DIMENSION_MISMATCH when query dim differs from index", async () => {
    const indexDir = mkdtempSync(join(tmpdir(), "toyclaw-retriever-dim-"));

    // Write a 2-chunk index with dim=3
    const chunksMeta = [
      { id: "c1", text: "chunk one", market: "EUROPE", source: "a.pdf", section: "s1" },
      { id: "c2", text: "chunk two", market: "EUROPE", source: "a.pdf", section: "s2" },
    ];
    writeFileSync(join(indexDir, "chunks_meta.json"), JSON.stringify(chunksMeta));
    const embeddings = new Float32Array([1, 0, 0, 0, 1, 0]); // 2 chunks × dim 3
    writeFileSync(join(indexDir, "embeddings.bin"), Buffer.from(embeddings.buffer));

    // Fake embedding provider that returns a different dimension (dim=5)
    const fakeProvider = {
      embed: async () => [1, 0, 0, 0, 0],
    } as unknown as GeminiEmbeddingProvider;

    const retriever = new ComplianceRetriever(indexDir, fakeProvider);
    await retriever.load();

    await expect(retriever.retrieve("test query", "EUROPE")).rejects.toMatchObject({
      code: "EMBEDDING_DIMENSION_MISMATCH",
      statusCode: 500,
    });

    rmSync(indexDir, { recursive: true, force: true });
  });

  it("filters by market and respects topK", async () => {
    const indexDir = mkdtempSync(join(tmpdir(), "toyclaw-retriever-market-"));

    const chunksMeta = [
      { id: "c1", text: "EU safety", market: "EUROPE", source: "a.pdf", section: "s1" },
      { id: "c2", text: "US safety", market: "US", source: "b.pdf", section: "s2" },
      { id: "c3", text: "Global safety", market: "Global", source: "c.pdf", section: "s3" },
      { id: "c4", text: "EU labeling", market: "EUROPE", source: "d.pdf", section: "s4" },
      { id: "c5", text: "Middle East", market: "MIDDLE_EAST", source: "e.pdf", section: "s5" },
    ];
    writeFileSync(join(indexDir, "chunks_meta.json"), JSON.stringify(chunksMeta));

    // dim=2, 5 chunks; make EU chunks have higher dot product with query [1,0]
    const embeddings = new Float32Array([
      0.9, 0.1,  // c1 EU — high score
      0.5, 0.5,  // c2 US
      0.6, 0.4,  // c3 Global — medium score
      0.8, 0.2,  // c4 EU — high score
      0.7, 0.3,  // c5 Middle East
    ]);
    writeFileSync(join(indexDir, "embeddings.bin"), Buffer.from(embeddings.buffer));

    const fakeProvider = {
      embed: async () => [1, 0],
    } as unknown as GeminiEmbeddingProvider;

    const retriever = new ComplianceRetriever(indexDir, fakeProvider);
    await retriever.load();

    // EUROPE includes EUROPE + Global chunks; US and MIDDLE_EAST excluded
    const results = await retriever.retrieve("test", "EUROPE", 2);
    expect(results).toHaveLength(2);

    // All returned chunks must be EUROPE or Global
    for (const r of results) {
      const meta = chunksMeta.find((c) => c.id === r.id);
      expect(["EUROPE", "Global"]).toContain(meta?.market);
    }

    // Results must be sorted descending by score
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);

    // topK=1 should return only 1
    const single = await retriever.retrieve("test", "EUROPE", 1);
    expect(single).toHaveLength(1);

    rmSync(indexDir, { recursive: true, force: true });
  });
});

// ── ComplianceService JSON parsing tests ──────────────────────────────
import { fetchWithProxy } from "../src/lib/http/fetch-with-proxy";
const mockedFetch = vi.mocked(fetchWithProxy);

describe("ComplianceService parseJson fallback", () => {

  let app: FastifyInstance;
  let prisma: PrismaClient;
  let tmpRoot: string;
  let dbUrl: string;

  beforeAll(async () => {
    tmpRoot = mkdtempSync(join(tmpdir(), "toyclaw-compliance-json-test-"));
    const dbPath = join(tmpRoot, "test.db").replaceAll("\\", "/");
    dbUrl = `file:${dbPath}`;

    execSync("npx prisma db push --skip-generate", {
      cwd: resolve(__dirname, ".."),
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: "pipe",
    });

    prisma = new PrismaClient({
      datasources: { db: { url: dbUrl } },
    });
    await prisma.$connect();

    app = await createApp({
      prisma,
      visionProvider: new MockVisionProvider(),
      complianceRetriever: new MockComplianceRetriever(),
      config: {
        databaseUrl: dbUrl,
        uploadDir: join(tmpRoot, "uploads"),
        openaiModel: "mock-vision-v1",
        maxFileSizeMb: 10,
        providerTimeoutMs: 60000,
        port: 0,
        geminiComplianceModel: "gemini-3-flash-preview",
      },
    });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
    rmSync(tmpRoot, { recursive: true, force: true });
  });

  async function createAnalysis(): Promise<string> {
    const multipart = buildMultipart({
      fields: { directionText: "test toy" },
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
      headers: { "content-type": multipart.contentType },
    });
    return response.json().requestId;
  }

  function makeGeminiResponse(text: string) {
    return {
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text }] } }],
      }),
    };
  }

  it("parses JSON wrapped in markdown code fence", async () => {
    const fencedJson = "```json\n" + JSON.stringify(FAKE_REPORT) + "\n```";
    mockedFetch.mockResolvedValueOnce(makeGeminiResponse(fencedJson) as Response);

    const requestId = await createAnalysis();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/compliance/assess",
      payload: { requestId, targetMarket: "EUROPE" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().report.applicableStandards).toHaveLength(1);
  });

  it("parses JSON with leading prose text", async () => {
    const dirtyJson = "Here is the compliance report:\n\n" + JSON.stringify(FAKE_REPORT) + "\n\nI hope this helps.";
    mockedFetch.mockResolvedValueOnce(makeGeminiResponse(dirtyJson) as Response);

    const requestId = await createAnalysis();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/compliance/assess",
      payload: { requestId, targetMarket: "EUROPE" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().report.summary).toBeTruthy();
  });

  it("returns 502 for completely non-JSON output after retries", async () => {
    // Both attempts return non-JSON
    mockedFetch
      .mockResolvedValueOnce(makeGeminiResponse("I cannot produce JSON sorry.") as Response)
      .mockResolvedValueOnce(makeGeminiResponse("Still no JSON here!") as Response);

    const requestId = await createAnalysis();
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/compliance/assess",
      payload: { requestId, targetMarket: "EUROPE" },
    });

    expect(response.statusCode).toBe(502);
    expect(response.json().code).toBe("MODEL_OUTPUT_INVALID");
  });
});
