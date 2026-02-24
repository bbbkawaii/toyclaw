import * as fs from "node:fs";
import * as path from "node:path";
import { GeminiEmbeddingProvider } from "../src/providers/embedding/gemini";
import { ComplianceRetriever } from "../src/modules/compliance/retriever";

// Load .env
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex < 0) continue;
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

const apiKey = process.env.GEMINI_IMAGE_API_KEY || process.env.GEMINI_VISION_API_KEY || process.env.GEMINI_API_KEY || "";
if (!apiKey) {
  console.error("No Gemini API key found. Set GEMINI_IMAGE_API_KEY, GEMINI_VISION_API_KEY, or GEMINI_API_KEY");
  process.exit(1);
}

const embeddingProvider = new GeminiEmbeddingProvider({
  apiBaseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
  apiKey,
  modelName: "gemini-embedding-001",
  timeoutMs: 30000,
});

const retriever = new ComplianceRetriever(
  path.resolve(__dirname, "../storage/compliance-index"),
  embeddingProvider,
);

async function main(): Promise<void> {
  const t0 = Date.now();
  await retriever.load();
  console.log(`Index loaded in ${Date.now() - t0}ms`);

  const t1 = Date.now();
  const results = await retriever.retrieve(
    "PVC plastic toy safety requirements, lead content, phthalate limits",
    "EUROPE",
    5,
  );
  console.log(`Retrieval done in ${Date.now() - t1}ms`);
  console.log("\n=== Top 5 results for EUROPE PVC query ===");
  for (const r of results) {
    console.log(`\nScore: ${r.score.toFixed(4)} | Source: ${r.source}`);
    console.log(`Text: ${r.text.slice(0, 200)}...`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
