import * as fs from "node:fs";
import * as path from "node:path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
import { GeminiEmbeddingProvider } from "../src/providers/embedding/gemini";

// Load .env file manually for standalone script execution
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex < 0) {
      continue;
    }
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

interface ChunkRecord {
  id: string;
  text: string;
  market: string;
  source: string;
  section: string;
  embedding: number[];
}

interface IndexMeta {
  version: string;
  createdAt: string;
  docCount: number;
  chunkCount: number;
}

const MARKET_DIRS: Record<string, string> = {
  "US美国标准": "US",
  "Europe欧洲标准": "EUROPE",
  "MiddleEast中东标准": "MIDDLE_EAST",
  "SoutheastAsia东南亚标准": "SOUTHEAST_ASIA",
  "JapanKorea日韩标准": "JAPAN_KOREA",
};

const CHUNK_MAX_CHARS = 2000;
const CHUNK_OVERLAP_CHARS = 200;
const EMBEDDING_BATCH_SIZE = 20;
const EMBEDDING_DELAY_MS = 500;

async function main(): Promise<void> {
  const docsDir = process.argv[2] || path.resolve(__dirname, "../合规文件");
  const outputDir = process.argv[3] || path.resolve(__dirname, "../storage/compliance-index");

  if (!fs.existsSync(docsDir)) {
    console.error(`Error: Documents directory not found: ${docsDir}`);
    console.error("Usage: npx tsx scripts/ingest-compliance-docs.ts [docs-dir] [output-dir]");
    console.error("Place compliance PDF files in the docs directory and try again.");
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_IMAGE_API_KEY
    || process.env.GEMINI_VISION_API_KEY
    || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Error: Set GEMINI_IMAGE_API_KEY, GEMINI_VISION_API_KEY, or GEMINI_API_KEY");
    process.exit(1);
  }

  const modelName = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
  const apiBaseUrl = process.env.GEMINI_VISION_API_URL
    || "https://generativelanguage.googleapis.com/v1beta/models";

  const embeddingProvider = new GeminiEmbeddingProvider({
    apiBaseUrl,
    apiKey,
    modelName,
    timeoutMs: 30000,
  });

  console.log(`Docs directory: ${docsDir}`);
  console.log(`Output directory: ${outputDir}`);
  console.log(`Embedding model: ${modelName}`);

  const allChunks: Omit<ChunkRecord, "embedding">[] = [];

  // Process root-level PDFs (Global)
  const rootFiles = fs.readdirSync(docsDir).filter((f) => f.endsWith(".pdf"));
  for (const file of rootFiles) {
    const filePath = path.join(docsDir, file);
    console.log(`Processing [Global] ${file}...`);
    try {
      const chunks = await extractAndChunk(filePath, "Global", file);
      allChunks.push(...chunks);
    } catch (error) {
      console.warn(`  ⚠ Skipping ${file}: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  // Process market subdirectories
  for (const [dirName, marketKey] of Object.entries(MARKET_DIRS)) {
    const dirPath = path.join(docsDir, dirName);
    if (!fs.existsSync(dirPath)) {
      console.warn(`Skipping missing directory: ${dirName}`);
      continue;
    }

    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".pdf"));
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      console.log(`Processing [${marketKey}] ${file}...`);
      try {
        const chunks = await extractAndChunk(filePath, marketKey, file);
        allChunks.push(...chunks);
      } catch (error) {
        console.warn(`  ⚠ Skipping ${file}: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }
  }

  console.log(`\nTotal chunks to embed: ${allChunks.length}`);

  // Generate embeddings in batches
  const chunksWithEmbeddings: ChunkRecord[] = [];
  for (let i = 0; i < allChunks.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = allChunks.slice(i, i + EMBEDDING_BATCH_SIZE);
    const batchTexts = batch.map((c) => c.text);
    const batchIndex = Math.floor(i / EMBEDDING_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(allChunks.length / EMBEDDING_BATCH_SIZE);

    console.log(`Embedding batch ${batchIndex}/${totalBatches} (${batch.length} chunks)...`);

    const embeddings = await embeddingProvider.embedBatch(batchTexts);

    for (let j = 0; j < batch.length; j++) {
      chunksWithEmbeddings.push({
        ...batch[j],
        embedding: embeddings[j],
      });
    }

    if (i + EMBEDDING_BATCH_SIZE < allChunks.length) {
      await sleep(EMBEDDING_DELAY_MS);
    }
  }

  // Count unique docs
  const uniqueSources = new Set(chunksWithEmbeddings.map((c) => c.source));

  // Write output
  fs.mkdirSync(outputDir, { recursive: true });

  // Write chunk metadata (without embeddings) as JSON
  const chunksMeta = chunksWithEmbeddings.map((c) => ({
    id: c.id,
    text: c.text,
    market: c.market,
    source: c.source,
    section: c.section,
  }));
  const chunksMetaPath = path.join(outputDir, "chunks_meta.json");
  fs.writeFileSync(chunksMetaPath, JSON.stringify(chunksMeta));
  console.log(`\nWrote ${chunksMetaPath} (${chunksMeta.length} chunk metadata entries)`);

  // Write embeddings as binary Float32Array
  const embeddingDim = chunksWithEmbeddings.length > 0 ? chunksWithEmbeddings[0].embedding.length : 0;
  const float32 = new Float32Array(chunksWithEmbeddings.length * embeddingDim);
  for (let i = 0; i < chunksWithEmbeddings.length; i++) {
    float32.set(chunksWithEmbeddings[i].embedding, i * embeddingDim);
  }
  const embeddingsPath = path.join(outputDir, "embeddings.bin");
  fs.writeFileSync(embeddingsPath, Buffer.from(float32.buffer));
  const embeddingsSizeMb = (float32.byteLength / 1024 / 1024).toFixed(1);
  console.log(`Wrote ${embeddingsPath} (${embeddingsSizeMb} MB, dim=${embeddingDim})`);

  const meta: IndexMeta = {
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    docCount: uniqueSources.size,
    chunkCount: chunksWithEmbeddings.length,
  };
  const metaPath = path.join(outputDir, "meta.json");
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  console.log(`Wrote ${metaPath}`);
  console.log(`\nDone! ${meta.docCount} documents → ${meta.chunkCount} chunks indexed.`);
}

async function extractAndChunk(
  filePath: string,
  market: string,
  fileName: string,
): Promise<Omit<ChunkRecord, "embedding">[]> {
  const buffer = fs.readFileSync(filePath);
  const pdf = await pdfParse(buffer);
  const fullText = pdf.text;

  if (!fullText || fullText.trim().length === 0) {
    console.warn(`  Warning: No text extracted from ${fileName}`);
    return [];
  }

  const sections = splitIntoSections(fullText);
  const chunks: Omit<ChunkRecord, "embedding">[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const sectionChunks = splitIntoChunks(section.text, CHUNK_MAX_CHARS, CHUNK_OVERLAP_CHARS);

    for (const chunkText of sectionChunks) {
      if (chunkText.trim().length < 50) {
        continue;
      }

      chunks.push({
        id: `${market}/${fileName}#${chunkIndex}`,
        text: chunkText.trim(),
        market,
        source: fileName,
        section: section.heading || `section-${chunkIndex}`,
      });
      chunkIndex++;
    }
  }

  console.log(`  → ${chunks.length} chunks`);
  return chunks;
}

interface Section {
  heading: string;
  text: string;
}

function splitIntoSections(text: string): Section[] {
  // Split on common heading patterns: numbered sections, uppercase headings, etc.
  const headingPattern = /\n(?=(?:\d+\.[\d.]*\s+[A-Z])|(?:(?:CHAPTER|SECTION|ARTICLE|ANNEX|PART|APPENDIX)\s+[\dIVXLCDM]+)|(?:[A-Z][A-Z\s]{10,}))/g;

  const parts = text.split(headingPattern);

  if (parts.length <= 1) {
    return [{ heading: "full-document", text }];
  }

  return parts
    .map((part) => {
      const firstLine = part.trim().split("\n")[0] || "";
      return {
        heading: firstLine.slice(0, 120).trim(),
        text: part.trim(),
      };
    })
    .filter((s) => s.text.length > 0);
}

function splitIntoChunks(text: string, maxChars: number, overlap: number): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChars;

    if (end < text.length) {
      // Try to break at paragraph boundary
      const paragraphBreak = text.lastIndexOf("\n\n", end);
      if (paragraphBreak > start + maxChars * 0.5) {
        end = paragraphBreak;
      } else {
        // Try sentence boundary
        const sentenceBreak = text.lastIndexOf(". ", end);
        if (sentenceBreak > start + maxChars * 0.5) {
          end = sentenceBreak + 1;
        }
      }
    } else {
      end = text.length;
    }

    chunks.push(text.slice(start, end));

    if (end >= text.length) {
      break;
    }

    start = end - overlap;
    if (start < 0) {
      start = 0;
    }
  }

  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error("Ingest failed:", error);
  process.exit(1);
});
