import type { FestivalThemeMatch, TargetMarket } from "../../cross-cultural/types";
import type {
  ColorSchemeSuggestion,
  PackagingStyleSuggestion,
  ShapeDetailAdjustment,
  ShowcaseVideoKeyframe,
} from "../types";

export interface AssetPromptContext {
  targetMarket: TargetMarket;
  directionValue: string;
  shapeCategory: string;
  materialNames: string[];
  styleNames: string[];
  colorSchemes: ColorSchemeSuggestion[];
  shapeAdjustments: ShapeDetailAdjustment[];
  packagingSuggestions: PackagingStyleSuggestion[];
  festivalTheme?: FestivalThemeMatch;
}

export function buildPreviewAssetPrompt(context: AssetPromptContext): string {
  const primaryScheme = context.colorSchemes[0];
  const topAdjustments = context.shapeAdjustments.slice(0, 2).map((item) => item.title).join(", ");
  const packaging = context.packagingSuggestions[0]?.styleName ?? "localized premium carton";

  return `
Design a market-localized toy redesign concept render.
Target market: ${context.targetMarket}
Direction: ${context.directionValue}
Toy shape category: ${context.shapeCategory}
Material cues: ${context.materialNames.join(", ")}
Style cues: ${context.styleNames.join(", ")}
Primary color scheme: ${primaryScheme?.schemeName ?? "balanced seasonal"} -> ${formatScheme(primaryScheme)}
Priority adjustments: ${topAdjustments || "soften edges and improve accessory details"}
Packaging intent: ${packaging}
Seasonal anchor: ${context.festivalTheme?.name ?? "evergreen sales window"}

Render requirement:
- Product hero shot, studio quality, e-commerce ready
- Preserve recognizability of original toy while upgrading market fit
- Focus on child-safe, culturally neutral expression
`.trim();
}

export function buildThreeViewAssetPrompt(
  context: AssetPromptContext,
  view: "front" | "side" | "back",
  referenceIsRedesign = false,
): string {
  const scheme = context.colorSchemes[0];
  const adjustments = context.shapeAdjustments
    .slice(0, 3)
    .flatMap((item) => item.actions)
    .slice(0, 4)
    .join(", ");

  const referenceBlock = referenceIsRedesign
    ? `
Consistency requirement:
- The reference image shows the finalized redesign. Match its exact colors, proportions, surface details, and accessories.
- Do NOT invent new features or alter the design. Only change the camera angle to show the ${view} view.`
    : `
Design requirement:
- The reference image shows the original toy before redesign. Apply all color, shape, and style changes described above to produce the redesigned ${view} view.`;

  return `
Create a ${view} view technical render of the redesigned toy.
Target market: ${context.targetMarket}
Shape category: ${context.shapeCategory}
Colors: ${formatScheme(scheme)}
Adjustment notes: ${adjustments || "optimize silhouette and details"}
Style references: ${context.styleNames.join(", ") || "playful premium"}

Output style:
- neutral background
- clean product-centric framing
- suitable for product spec sheet
${referenceBlock}
`.trim();
}

export function buildShowcaseVideoScript(context: AssetPromptContext): string {
  const topTheme = context.festivalTheme?.name ?? "core evergreen season";
  const scheme = context.colorSchemes[0]?.schemeName ?? "localized fit palette";
  const packaging = context.packagingSuggestions[0]?.styleName ?? "market-ready retail pack";

  return [
    `0-3s: Hero orbit shot showing redesigned silhouette in ${scheme}.`,
    `3-7s: Close-up on accessory/detail improvements and safe material texture.`,
    `7-10s: Three-angle burst (front/side/back) to highlight craftsmanship.`,
    `10-12s: Packaging reveal (${packaging}) with ${topTheme} campaign tagline.`,
  ].join(" ");
}

export function buildShowcaseKeyframePrompt(
  context: AssetPromptContext,
  frame: Pick<ShowcaseVideoKeyframe, "label" | "prompt">,
): string {
  return `
Generate a cinematic keyframe for toy showcase video.
Frame label: ${frame.label}
Frame objective: ${frame.prompt}
Target market: ${context.targetMarket}
Main style: ${context.styleNames.join(", ") || "friendly collectible"}
Colors: ${formatScheme(context.colorSchemes[0])}
`.trim();
}

function formatScheme(scheme: ColorSchemeSuggestion | undefined): string {
  if (!scheme) {
    return "balanced primary + accent + neutral";
  }

  return scheme.colors.map((item) => `${item.name} ${item.hex}`).join(", ");
}

