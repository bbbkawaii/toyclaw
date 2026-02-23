import type { DirectionInput } from "../types";

export const FEATURE_EXTRACTION_SYSTEM_PROMPT = `
You are a toy product analyst.
Your task is to inspect the input toy image and output only strict JSON.
Extract these feature groups:
1) shape: overall geometric or figurative category
2) colors: dominant palette with estimated proportion
3) material: likely materials from visual cues
4) style: design style tags (cartoon/minimal/vintage/etc.)

Rules:
- Return JSON only, no markdown.
- confidence and proportion must be numbers in range [0, 1].
- colors[].hex must be valid hex colors.
- colors[].proportion should sum close to 1.0.
- Keep evidence concise and factual.
`.trim();

export function buildFeatureExtractionUserPrompt(direction: DirectionInput): string {
  return `
Analyze this toy image for product redesign preparation.
Direction mode: ${direction.mode}
Direction value: ${direction.value}

Return JSON with this exact structure:
{
  "shape": { "category": string, "confidence": number, "evidence"?: string },
  "colors": [{ "name": string, "hex": string, "proportion": number, "confidence": number }],
  "material": [{ "name": string, "confidence": number, "evidence"?: string }],
  "style": [{ "name": string, "confidence": number, "evidence"?: string }]
}
`.trim();
}
