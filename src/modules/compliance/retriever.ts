import * as fs from "node:fs";
import * as path from "node:path";
import { AppError } from "../../lib/errors";
import type { GeminiEmbeddingProvider } from "../../providers/embedding/gemini";
import type { ComplianceIndex } from "./types";

const MARKET_ALIASES: Record<string, string[]> = {
  US: ["US", "US美国标准", "Global"],
  EUROPE: ["EUROPE", "Europe欧洲标准", "Global"],
  MIDDLE_EAST: ["MIDDLE_EAST", "MiddleEast中东标准", "Global"],
  SOUTHEAST_ASIA: ["SOUTHEAST_ASIA", "SoutheastAsia东南亚标准", "Global"],
  JAPAN_KOREA: ["JAPAN_KOREA", "JapanKorea日韩标准", "Global"],
};

export interface ChunkMeta {
  id: string;
  text: string;
  market: string;
  source: string;
  section: string;
}

export interface RetrievedChunk {
  id: string;
  text: string;
  score: number;
  source: string;
  section: string;
}

export class ComplianceRetriever {
  private chunkMetas: ChunkMeta[] = [];
  private embeddings: Float32Array = new Float32Array(0);
  private embeddingDim = 0;
  private loaded = false;

  constructor(
    private readonly indexDir: string,
    private readonly embeddingProvider: GeminiEmbeddingProvider,
  ) {}

  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }

    const metaPath = path.join(this.indexDir, "meta.json");
    const chunksMetaPath = path.join(this.indexDir, "chunks_meta.json");
    const embeddingsPath = path.join(this.indexDir, "embeddings.bin");

    // Support both new binary format and legacy single-file format
    if (fs.existsSync(chunksMetaPath) && fs.existsSync(embeddingsPath)) {
      this.chunkMetas = JSON.parse(fs.readFileSync(chunksMetaPath, "utf-8")) as ChunkMeta[];
      const buffer = fs.readFileSync(embeddingsPath);
      this.embeddings = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
      this.embeddingDim = this.chunkMetas.length > 0
        ? this.embeddings.length / this.chunkMetas.length
        : 0;
    } else if (fs.existsSync(path.join(this.indexDir, "chunks.json"))) {
      // Legacy format — load from single JSON file
      const raw = JSON.parse(
        fs.readFileSync(path.join(this.indexDir, "chunks.json"), "utf-8"),
      ) as { id: string; text: string; market: string; source: string; section: string; embedding: number[] }[];

      this.chunkMetas = raw.map((c) => ({
        id: c.id,
        text: c.text,
        market: c.market,
        source: c.source,
        section: c.section,
      }));
      this.embeddingDim = raw.length > 0 ? raw[0].embedding.length : 0;
      this.embeddings = new Float32Array(raw.length * this.embeddingDim);
      for (let i = 0; i < raw.length; i++) {
        this.embeddings.set(raw[i].embedding, i * this.embeddingDim);
      }
    } else {
      throw new AppError(
        "Compliance index not found. Run the ingest script first: npx tsx scripts/ingest-compliance-docs.ts",
        "COMPLIANCE_INDEX_MISSING",
        503,
      );
    }

    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as ComplianceIndex;
      console.log(
        `Compliance index loaded: ${meta.chunkCount} chunks from ${meta.docCount} docs (v${meta.version})`,
      );
    }

    this.loaded = true;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  async retrieve(query: string, targetMarket: string, topK: number = 10): Promise<RetrievedChunk[]> {
    if (!this.loaded) {
      await this.load();
    }

    const queryEmbedding = await this.embeddingProvider.embed(query);
    const marketKeys = MARKET_ALIASES[targetMarket] ?? [targetMarket, "Global"];

    if (queryEmbedding.length !== this.embeddingDim) {
      throw new AppError(
        `Embedding dimension mismatch: query has ${queryEmbedding.length}, index has ${this.embeddingDim}`,
        "EMBEDDING_DIMENSION_MISMATCH",
        500,
      );
    }

    const scored: RetrievedChunk[] = [];

    for (let i = 0; i < this.chunkMetas.length; i++) {
      const meta = this.chunkMetas[i];
      if (!marketKeys.includes(meta.market)) {
        continue;
      }

      const offset = i * this.embeddingDim;
      const score = cosineSimilarityTyped(
        queryEmbedding,
        this.embeddings,
        offset,
        this.embeddingDim,
      );

      scored.push({
        id: meta.id,
        text: meta.text,
        score,
        source: meta.source,
        section: meta.section,
      });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

function cosineSimilarityTyped(
  a: number[],
  b: Float32Array,
  offset: number,
  dim: number,
): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < dim; i++) {
    const ai = a[i];
    const bi = b[offset + i];
    dotProduct += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}
