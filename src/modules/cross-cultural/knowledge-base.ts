import type { TabooSeverity, TargetMarket } from "./types";

export interface TabooRuleProfile {
  id: string;
  title: string;
  severity: TabooSeverity;
  risk: string;
  recommendation: string;
  colorKeywords?: string[];
  colorHexes?: string[];
  materialKeywords?: string[];
  styleKeywords?: string[];
  shapeKeywords?: string[];
}

export interface FestivalThemeProfile {
  id: string;
  name: string;
  season: string;
  keywords: string[];
  preferredColors: string[];
  styleHints: string[];
}

export interface CompetitorStyleProfile {
  id: string;
  brandArchetype: string;
  styleSummary: string;
  keywords: string[];
  palette: string[];
  opportunities: string[];
}

export interface MarketProfile {
  market: TargetMarket;
  displayName: string;
  safePalette: string[];
  tabooRules: TabooRuleProfile[];
  festivalThemes: FestivalThemeProfile[];
  competitorStyles: CompetitorStyleProfile[];
}

const MARKET_PROFILES: Record<TargetMarket, MarketProfile> = {
  US: {
    market: "US",
    displayName: "United States",
    safePalette: ["#1E3A8A", "#F97316", "#10B981", "#F8FAFC"],
    tabooRules: [
      {
        id: "us-weaponized-style",
        title: "Avoid explicit weaponized or gore visual cues for kids products",
        severity: "HIGH",
        risk: "May trigger platform rejection and parent complaints in youth categories.",
        recommendation: "Replace violent cues with adventure or sports elements and softer silhouettes.",
        styleKeywords: ["weapon", "combat", "blood", "horror", "skull"],
        shapeKeywords: ["knife", "gun", "sword"],
      },
      {
        id: "us-material-safety",
        title: "Avoid safety-sensitive material signals",
        severity: "HIGH",
        risk: "Can create immediate concern around ASTM/CPSIA safety perception.",
        recommendation: "Highlight BPA-free/food-grade safe material storytelling in design and packaging.",
        materialKeywords: ["phthalate", "latex", "lead"],
      },
      {
        id: "us-overdark-palette",
        title: "Pure black-red horror palette may be seen as overly aggressive",
        severity: "MEDIUM",
        risk: "Can reduce conversion for mainstream family channels.",
        recommendation: "Blend with brighter family-safe accents and playful motifs.",
        colorHexes: ["#000000"],
        colorKeywords: ["black", "dark red", "blood red"],
      },
    ],
    festivalThemes: [
      {
        id: "us-christmas-gifting",
        name: "Christmas Gifting",
        season: "Q4",
        keywords: ["gift", "snow", "holiday", "family"],
        preferredColors: ["red", "green", "gold", "white"],
        styleHints: ["gift-ready", "warm lighting", "cozy textures"],
      },
      {
        id: "us-halloween-lite",
        name: "Halloween Cute Edition",
        season: "Q4",
        keywords: ["pumpkin", "spooky", "costume", "party"],
        preferredColors: ["orange", "purple", "black"],
        styleHints: ["cute spooky", "mini accessories", "collectible label"],
      },
      {
        id: "us-back-to-school",
        name: "Back-to-School STEM",
        season: "Q3",
        keywords: ["school", "study", "learning", "science"],
        preferredColors: ["blue", "yellow", "white"],
        styleHints: ["educational", "modular", "problem-solving angle"],
      },
    ],
    competitorStyles: [
      {
        id: "us-comp-collectible",
        brandArchetype: "Collectible Blind Box",
        styleSummary: "Compact silhouettes, high contrast accents, serial variants.",
        keywords: ["collectible", "blind box", "series", "limited"],
        palette: ["black", "orange", "cyan"],
        opportunities: ["Launch numbered variants", "Add rarity badges on package"],
      },
      {
        id: "us-comp-stem",
        brandArchetype: "STEM Learning Toy",
        styleSummary: "Functional details, visible mechanics, educational story points.",
        keywords: ["mechanic", "modular", "learning", "science"],
        palette: ["blue", "yellow", "white"],
        opportunities: ["Expose simple assembly points", "Bundle short experiment card"],
      },
      {
        id: "us-comp-lifestyle",
        brandArchetype: "Family Lifestyle Toy",
        styleSummary: "Soft corners, warm expressions, easy shelf readability.",
        keywords: ["family", "friendly", "soft", "cute"],
        palette: ["mint", "peach", "navy"],
        opportunities: ["Increase emotional facial cues", "Improve shelf-distance contrast"],
      },
    ],
  },
  EUROPE: {
    market: "EUROPE",
    displayName: "Europe",
    safePalette: ["#0F766E", "#2563EB", "#D97706", "#F1F5F9"],
    tabooRules: [
      {
        id: "eu-militarized-story",
        title: "Avoid aggressive militarized storytelling",
        severity: "MEDIUM",
        risk: "Can conflict with mainstream family-friendly merchandising in EU retailers.",
        recommendation: "Switch to exploration, craft, or teamwork narratives.",
        styleKeywords: ["military", "army", "combat"],
        shapeKeywords: ["tank", "rifle"],
      },
      {
        id: "eu-unsustainable-look",
        title: "Single-use plastic look reduces eco acceptance",
        severity: "HIGH",
        risk: "Weak sustainability perception impacts premium positioning.",
        recommendation: "Use recycled texture cues and communicate reusability on pack.",
        materialKeywords: ["single-use plastic", "thin pvc", "cheap plastic"],
      },
      {
        id: "eu-heritage-symbol-misuse",
        title: "Religious or heritage symbols should not be decorative cliches",
        severity: "MEDIUM",
        risk: "Could trigger local sensitivity and social backlash.",
        recommendation: "Use neutral geometric patterns or region-reviewed motifs.",
        styleKeywords: ["cross", "church", "cathedral icon"],
      },
    ],
    festivalThemes: [
      {
        id: "eu-christmas-market",
        name: "Christmas Market Edition",
        season: "Q4",
        keywords: ["christmas", "market", "gift", "winter"],
        preferredColors: ["forest green", "red", "gold", "cream"],
        styleHints: ["craft texture", "gift ribbon accents", "storybook visuals"],
      },
      {
        id: "eu-earth-day",
        name: "Earth Day Eco Campaign",
        season: "Q2",
        keywords: ["eco", "recycle", "nature", "planet"],
        preferredColors: ["green", "brown", "beige", "sky blue"],
        styleHints: ["recycled paper pack", "minimal ink", "nature education insert"],
      },
      {
        id: "eu-summer-travel",
        name: "Summer Travel Mini Set",
        season: "Q3",
        keywords: ["travel", "outdoor", "summer", "camping"],
        preferredColors: ["azure", "yellow", "white"],
        styleHints: ["portable format", "durable coating", "lightweight packaging"],
      },
    ],
    competitorStyles: [
      {
        id: "eu-comp-minimal-premium",
        brandArchetype: "Minimal Premium Design",
        styleSummary: "Quiet palette, clean silhouette, elevated material storytelling.",
        keywords: ["minimal", "premium", "clean", "scandinavian"],
        palette: ["beige", "teal", "navy"],
        opportunities: ["Reduce unnecessary surface graphics", "Add tactile material callouts"],
      },
      {
        id: "eu-comp-montessori",
        brandArchetype: "Montessori Sensory",
        styleSummary: "Natural materials, low-saturation palette, learning-centered structure.",
        keywords: ["sensory", "learning", "wood", "montessori"],
        palette: ["wood", "sage", "off-white"],
        opportunities: ["Offer open-ended play positions", "Highlight touch feedback details"],
      },
      {
        id: "eu-comp-retro-craft",
        brandArchetype: "Retro Craft Revival",
        styleSummary: "Vintage accents blended with modern safety finishing.",
        keywords: ["retro", "vintage", "craft", "heritage"],
        palette: ["mustard", "brick red", "cream"],
        opportunities: ["Add stitched or woven visual patterns", "Use limited retro capsule releases"],
      },
    ],
  },
  MIDDLE_EAST: {
    market: "MIDDLE_EAST",
    displayName: "Middle East",
    safePalette: ["#0F766E", "#1D4ED8", "#D4AF37", "#F8FAFC"],
    tabooRules: [
      {
        id: "me-pig-symbolism",
        title: "Avoid pig-related visual or material references",
        severity: "HIGH",
        risk: "Strong religious sensitivity in multiple target countries.",
        recommendation: "Use neutral animal forms and verify symbols with local reviewers.",
        shapeKeywords: ["pig", "swine"],
        materialKeywords: ["pigskin", "pork leather"],
        styleKeywords: ["pig mascot"],
      },
      {
        id: "me-religious-symbol-abuse",
        title: "Religious symbols should not be used as playful decoration",
        severity: "HIGH",
        risk: "Can trigger brand safety and legal distribution risks.",
        recommendation: "Avoid sacred iconography; replace with abstract geometry.",
        styleKeywords: ["crescent", "mosque", "scripture", "allah"],
      },
      {
        id: "me-revealing-characters",
        title: "Avoid revealing human styling in family toy categories",
        severity: "MEDIUM",
        risk: "Potential rejection in conservative retail channels.",
        recommendation: "Adopt modest costumes and family-friendly pose language.",
        styleKeywords: ["revealing outfit", "bikini", "provocative"],
      },
    ],
    festivalThemes: [
      {
        id: "me-ramadan-eid",
        name: "Ramadan / Eid Gift Edition",
        season: "Q1-Q2",
        keywords: ["ramadan", "eid", "family", "gift", "lantern"],
        preferredColors: ["emerald", "gold", "white", "midnight blue"],
        styleHints: ["premium gift box", "lantern patterns", "family storytelling"],
      },
      {
        id: "me-national-day",
        name: "National Day Celebration",
        season: "Varies by country",
        keywords: ["national", "celebration", "flag", "heritage"],
        preferredColors: ["green", "red", "white", "black"],
        styleHints: ["country-specific accents", "collectible badge", "giftable bundle"],
      },
      {
        id: "me-summer-family",
        name: "Summer Family Indoor Play",
        season: "Q2-Q3",
        keywords: ["summer", "family", "indoor", "cool"],
        preferredColors: ["sky blue", "mint", "sand"],
        styleHints: ["compact storage", "soft-touch finish", "group-play angle"],
      },
    ],
    competitorStyles: [
      {
        id: "me-comp-premium-gift",
        brandArchetype: "Premium Family Gift Set",
        styleSummary: "Gold accents, elegant typography, bundle-focused presentation.",
        keywords: ["premium", "gift", "family", "bundle"],
        palette: ["gold", "emerald", "white"],
        opportunities: ["Add ribbon-ready carton structure", "Offer festival sleeve variant"],
      },
      {
        id: "me-comp-character-collectible",
        brandArchetype: "Character Collectible Series",
        styleSummary: "Character-led hero shots with modest, polished costumes.",
        keywords: ["character", "series", "hero", "collectible"],
        palette: ["teal", "blue", "gold"],
        opportunities: ["Create regional color variants", "Add family storyline card"],
      },
      {
        id: "me-comp-educational",
        brandArchetype: "Bilingual Educational Toy",
        styleSummary: "Learning-forward visuals with Arabic + English callouts.",
        keywords: ["educational", "learning", "bilingual", "letters"],
        palette: ["blue", "yellow", "white"],
        opportunities: ["Integrate bilingual packaging hierarchy", "Use icon-led quick instruction"],
      },
    ],
  },
  SOUTHEAST_ASIA: {
    market: "SOUTHEAST_ASIA",
    displayName: "Southeast Asia",
    safePalette: ["#0EA5E9", "#10B981", "#F59E0B", "#F8FAFC"],
    tabooRules: [
      {
        id: "sea-sacred-symbols",
        title: "Avoid direct sacred religious symbols as playful ornaments",
        severity: "HIGH",
        risk: "Cross-country sensitivity across mixed religious populations.",
        recommendation: "Use neutral festive icons and country-specific localization review.",
        styleKeywords: ["buddha", "temple icon", "sacred scripture"],
      },
      {
        id: "sea-ethnic-stereotype",
        title: "Avoid exaggerated ethnic stereotypes",
        severity: "HIGH",
        risk: "Can cause backlash in social media and e-commerce reviews.",
        recommendation: "Use inclusive character styling and neutral visual language.",
        styleKeywords: ["tribal stereotype", "racial caricature"],
      },
      {
        id: "sea-heat-sensitive-material",
        title: "Heat-sensitive sticky coating in tropical climates",
        severity: "MEDIUM",
        risk: "Perceived quality drops quickly in high-humidity markets.",
        recommendation: "Use anti-stick matte coating and moisture-resistant packaging.",
        materialKeywords: ["sticky coating", "soft pvc"],
      },
    ],
    festivalThemes: [
      {
        id: "sea-lunar-new-year",
        name: "Lunar New Year Limited Edition",
        season: "Q1",
        keywords: ["lunar", "new year", "fortune", "family"],
        preferredColors: ["red", "gold", "white"],
        styleHints: ["fortune motifs", "limited serial", "gift envelope insert"],
      },
      {
        id: "sea-songkran-splash",
        name: "Songkran Water Festival",
        season: "Q2",
        keywords: ["water", "festival", "splash", "summer"],
        preferredColors: ["turquoise", "yellow", "white"],
        styleHints: ["water-splash graphics", "outdoor playful accessories", "lightweight pack"],
      },
      {
        id: "sea-school-holiday",
        name: "School Holiday Social Play",
        season: "Q2-Q3",
        keywords: ["holiday", "friends", "portable", "travel"],
        preferredColors: ["mint", "orange", "blue"],
        styleHints: ["shareable set", "social photo-friendly look", "value bundle"],
      },
    ],
    competitorStyles: [
      {
        id: "sea-comp-kawaii-social",
        brandArchetype: "Kawaii Social Trend",
        styleSummary: "Cute expressions, strong social-media visual identity.",
        keywords: ["cute", "kawaii", "social", "emoji"],
        palette: ["pink", "mint", "lavender"],
        opportunities: ["Increase face expression variants", "Design hashtag-ready visual motifs"],
      },
      {
        id: "sea-comp-value-bundle",
        brandArchetype: "High Value Bundle Pack",
        styleSummary: "Perceived abundance and accessory-rich presentation.",
        keywords: ["bundle", "value", "accessory", "set"],
        palette: ["orange", "teal", "white"],
        opportunities: ["Add clip-on accessories", "Highlight piece count on front panel"],
      },
      {
        id: "sea-comp-tropical-fun",
        brandArchetype: "Tropical Fun Outdoor",
        styleSummary: "Bright palette and energetic action poses.",
        keywords: ["tropical", "outdoor", "summer", "active"],
        palette: ["yellow", "aqua", "lime"],
        opportunities: ["Add weather-proof cues", "Use dynamic action showcase visuals"],
      },
    ],
  },
  JAPAN_KOREA: {
    market: "JAPAN_KOREA",
    displayName: "Japan & Korea",
    safePalette: ["#2563EB", "#EAB308", "#FB7185", "#F8FAFC"],
    tabooRules: [
      {
        id: "jk-horror-graphic",
        title: "Explicit horror visuals are risky for mainstream toy channels",
        severity: "MEDIUM",
        risk: "May narrow retail placement to niche audiences.",
        recommendation: "Shift to cute mystery tone and reduce violent textures.",
        styleKeywords: ["gore", "zombie", "blood", "horror"],
        colorKeywords: ["blood red"],
      },
      {
        id: "jk-low-finish",
        title: "Rough finish cues hurt quality expectations",
        severity: "HIGH",
        risk: "High standards for detailing and paint quality in this region.",
        recommendation: "Improve seam control, material texture, and precision details.",
        materialKeywords: ["rough plastic", "uneven paint", "cheap finish"],
      },
      {
        id: "jk-overcrowded-graphics",
        title: "Overly noisy graphic stacks reduce shelf clarity",
        severity: "MEDIUM",
        risk: "Can lower conversion in convenience-focused retail formats.",
        recommendation: "Use cleaner hierarchy and one hero focal element.",
        styleKeywords: ["busy pattern", "overloaded graphics", "neon overload"],
      },
    ],
    festivalThemes: [
      {
        id: "jk-sakura",
        name: "Sakura Spring Collection",
        season: "Q1-Q2",
        keywords: ["sakura", "spring", "flower", "limited"],
        preferredColors: ["pink", "white", "pastel blue"],
        styleHints: ["soft gradient", "seasonal sleeve", "collectible numbering"],
      },
      {
        id: "jk-summer-matsuri",
        name: "Summer Matsuri Fun",
        season: "Q3",
        keywords: ["summer", "festival", "matsuri", "night market"],
        preferredColors: ["navy", "gold", "coral"],
        styleHints: ["festival accessory add-on", "firework motif", "portable display stand"],
      },
      {
        id: "jk-year-end-gift",
        name: "Year-end Gift Capsule",
        season: "Q4",
        keywords: ["gift", "year-end", "capsule", "premium"],
        preferredColors: ["silver", "white", "deep blue"],
        styleHints: ["minimal premium box", "foil detail", "character story card"],
      },
    ],
    competitorStyles: [
      {
        id: "jk-comp-gacha",
        brandArchetype: "Capsule / Gacha Collectible",
        styleSummary: "Strong character identity with compact, repeat-buy variants.",
        keywords: ["capsule", "gacha", "variant", "character"],
        palette: ["pastel", "white", "black"],
        opportunities: ["Design rarity tiers", "Create seasonal capsule waves"],
      },
      {
        id: "jk-comp-collab-ip",
        brandArchetype: "IP Collaboration Figure",
        styleSummary: "High-precision details and premium display-oriented packaging.",
        keywords: ["ip", "collab", "display", "premium"],
        palette: ["navy", "silver", "red"],
        opportunities: ["Improve sculpt depth on key details", "Use window-box hero framing"],
      },
      {
        id: "jk-comp-desk-companion",
        brandArchetype: "Desk Companion Minimal Toy",
        styleSummary: "Calm palette, tactile finish, lifestyle context photography.",
        keywords: ["minimal", "desk", "lifestyle", "calm"],
        palette: ["beige", "gray", "blue"],
        opportunities: ["Add magnetic or modular desk interaction", "Strengthen clean lifestyle scenes"],
      },
    ],
  },
};

export function getMarketProfile(market: TargetMarket): MarketProfile {
  return MARKET_PROFILES[market];
}

