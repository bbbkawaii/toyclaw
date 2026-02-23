const MARKET_LABELS: Record<string, string> = {
  US: "美国",
  EUROPE: "欧洲",
  MIDDLE_EAST: "中东",
  SOUTHEAST_ASIA: "东南亚",
  JAPAN_KOREA: "日韩",
};

const COLOR_LABELS: Record<string, string> = {
  red: "红色",
  green: "绿色",
  "forest green": "森林绿",
  blue: "蓝色",
  "deep blue": "深蓝",
  navy: "藏青",
  "midnight blue": "午夜蓝",
  yellow: "黄色",
  orange: "橙色",
  purple: "紫色",
  pink: "粉色",
  coral: "珊瑚色",
  gold: "金色",
  silver: "银色",
  white: "白色",
  "off-white": "米白",
  cream: "奶油白",
  beige: "米色",
  brown: "棕色",
  black: "黑色",
  mint: "薄荷绿",
  turquoise: "青绿色",
  aqua: "水绿色",
  lime: "青柠绿",
  sand: "沙色",
  sky: "天空蓝",
  "sky blue": "天蓝色",
  azure: "蔚蓝",
  teal: "蓝绿色",
  pastel: "马卡龙色",
  gray: "灰色",
  "brick red": "砖红",
  mustard: "芥末黄",
  peach: "蜜桃色",
  lavender: "薰衣草紫",
  emerald: "祖母绿",
};

const TABOO_TITLE_LABELS: Record<string, string> = {
  "us-weaponized-style": "避免儿童产品出现明显武器化或血腥视觉",
  "us-material-safety": "避免触发材质安全疑虑",
  "us-overdark-palette": "纯黑红惊悚配色可能过于激进",
  "eu-militarized-story": "避免过强军事化叙事",
  "eu-unsustainable-look": "一次性塑料感会削弱环保认可",
  "eu-heritage-symbol-misuse": "宗教与文化符号不宜符号化滥用",
  "me-pig-symbolism": "避免猪相关视觉与材质联想",
  "me-religious-symbol-abuse": "宗教符号不应做娱乐化装饰",
  "me-revealing-characters": "家庭类玩具应避免暴露化角色造型",
  "sea-sacred-symbols": "避免将神圣宗教符号作为装饰元素",
  "sea-ethnic-stereotype": "避免夸张族群刻板印象",
  "sea-heat-sensitive-material": "高温高湿环境下需避免粘腻材质表现",
  "jk-horror-graphic": "主流渠道应避免过度惊悚视觉",
  "jk-low-finish": "粗糙做工会显著影响品质感",
  "jk-overcrowded-graphics": "过度堆叠图形会降低陈列可读性",
};

const FESTIVAL_NAME_LABELS: Record<string, string> = {
  "us-christmas-gifting": "圣诞礼赠主题",
  "us-halloween-lite": "万圣节萌趣主题",
  "us-back-to-school": "返校学习主题",
  "eu-christmas-market": "圣诞市集主题",
  "eu-earth-day": "地球日环保主题",
  "eu-summer-travel": "暑期出游迷你主题",
  "me-ramadan-eid": "斋月/开斋节礼赠主题",
  "me-national-day": "国庆庆典主题",
  "me-summer-family": "夏季家庭室内主题",
  "sea-lunar-new-year": "农历新年限定主题",
  "sea-songkran-splash": "泼水节主题",
  "sea-school-holiday": "学生假期社交主题",
  "jk-sakura": "樱花春季系列",
  "jk-summer-matsuri": "夏日祭典主题",
  "jk-year-end-gift": "年末礼赠胶囊主题",
};

const FESTIVAL_ELEMENTS: Record<string, string[]> = {
  "us-christmas-gifting": ["礼赠包装结构", "温暖节日光感", "家庭场景化陈列"],
  "us-halloween-lite": ["轻惊悚萌系配件", "派对化点缀元素", "收藏编号标识"],
  "us-back-to-school": ["学习任务卡", "模块化可组合部件", "科学探索视觉点"],
  "eu-christmas-market": ["手作质感纹理", "礼带与徽章细节", "故事感插画风格"],
  "eu-earth-day": ["环保材质符号", "低油墨视觉", "自然教育信息卡"],
  "eu-summer-travel": ["便携规格设计", "耐用涂层表达", "轻量化包装结构"],
  "me-ramadan-eid": ["礼盒化开箱体验", "灯笼纹样元素", "家庭叙事主视觉"],
  "me-national-day": ["本地化庆典色带", "纪念徽章元素", "礼赠组合套装"],
  "me-summer-family": ["收纳友好结构", "软触材质表达", "多人互动玩法提示"],
  "sea-lunar-new-year": ["新年吉庆符号", "限定编号标签", "礼袋配套插页"],
  "sea-songkran-splash": ["水花动态图形", "户外玩乐配件", "轻便便携包装"],
  "sea-school-holiday": ["社交分享属性", "拍照友好视觉", "高性价比组合感"],
  "jk-sakura": ["柔和渐变层次", "季节限定外套", "收藏编号体系"],
  "jk-summer-matsuri": ["祭典风格配件", "烟火主题点缀", "小体积展示底座"],
  "jk-year-end-gift": ["简约高端盒型", "金属质感细节", "角色故事卡片"],
};

const COMPETITOR_ARCHETYPE_LABELS: Record<string, string> = {
  "us-comp-collectible": "盲盒收藏风格",
  "us-comp-stem": "STEM学习风格",
  "us-comp-lifestyle": "家庭生活方式风格",
  "eu-comp-minimal-premium": "极简高端设计风格",
  "eu-comp-montessori": "蒙氏感官学习风格",
  "eu-comp-retro-craft": "复古手作复兴风格",
  "me-comp-premium-gift": "高端家庭礼赠风格",
  "me-comp-character-collectible": "角色收藏系列风格",
  "me-comp-educational": "双语教育玩具风格",
  "sea-comp-kawaii-social": "可爱社交趋势风格",
  "sea-comp-value-bundle": "高价值组合包风格",
  "sea-comp-tropical-fun": "热带活力户外风格",
  "jk-comp-gacha": "胶囊扭蛋收藏风格",
  "jk-comp-collab-ip": "IP联名手办风格",
  "jk-comp-desk-companion": "桌面陪伴极简风格",
};

const SCHEME_NAME_LABELS: Record<string, string> = {
  "Market Fit Core": "市场适配基础款",
  "Seasonal Campaign": "节日活动款",
  "Differentiated Shelf Pop": "货架差异化吸睛款",
};

const PACKAGING_STYLE_LABELS: Record<string, string> = {
  "Retail Shelf Hero Box": "零售主视觉陈列盒",
  "Holiday Gift Sleeve": "节日礼赠外套盒",
  "Eco Minimal Carton": "环保极简纸盒",
  "Craft Story Pack": "工艺叙事包装",
  "Premium Family Gift Carton": "高端家庭礼赠盒",
  "Festival Sleeve Edition": "节庆限定外套版",
  "Color-Rich Value Pack": "高饱和高价值组合包",
  "Portable Travel Blister": "便携出行吸塑卡装",
  "Precision Window Box": "精致透窗展示盒",
  "Seasonal Capsule Sleeve": "季节胶囊外套版",
  "Campaign Overlay Kit": "活动叠加组件包",
};

const COLOR_USAGE_LABELS: Record<string, string> = {
  primary: "主色",
  accent: "强调色",
  support: "辅助色",
  "primary body": "主体主色",
  "accent details": "细节强调",
  "logo and packaging background": "品牌标识与包装底色",
  "accessory highlights": "配件高光点缀",
  "outline and frame": "轮廓与边框",
  "attention-grabbing accessory": "吸睛配件",
  "secondary panel": "次级分区",
};

const COPY_TONE_LABELS: Record<string, string> = {
  "confident, family-friendly, benefit-first": "自信、家庭友好、卖点优先",
  "warm, celebratory, collectible": "温暖、庆典感、收藏导向",
  "clean, transparent, sustainability-led": "干净、透明、环保导向",
  "educational, understated premium": "教育导向、克制高级",
  "elegant, trust-focused, family-oriented": "优雅、可信、家庭导向",
  "celebratory, premium, respectful": "庆典感、高端、得体",
  "energetic, value-driven, social": "活力、价值导向、社交友好",
  "playful, practical, quick-read": "有趣、实用、快速可读",
  "refined, detail-centric, collectible": "精致、细节导向、收藏友好",
  "curated, subtle, fan-community friendly": "精选、克制、粉丝社群友好",
  "localized, concise, action-oriented": "本地化、简洁、行动导向",
};

const ASSET_REASON_LABELS: Record<string, string> = {
  DISABLED_BY_REQUEST: "已按配置跳过生成",
  IMAGE_PROVIDER_NOT_CONFIGURED: "未配置图片生成服务",
  IMAGE_PROVIDER_NO_IMAGE: "图片服务未返回有效图片",
  IMAGE_PROVIDER_ERROR: "图片生成失败，请稍后重试",
  VIDEO_MODEL_NOT_CONFIGURED: "当前环境未配置视频模型",
};

const FEATURE_TERM_LABELS: Record<string, string> = {
  animal: "动物",
  plush: "毛绒",
  "animal plush": "动物毛绒",
  "soft fabric": "软质织物",
  cute: "可爱风",
  collectible: "收藏向",
  premium: "高端",
  minimal: "极简",
  modular: "模块化",
  educational: "教育向",
  lifestyle: "生活方式",
  character: "角色化",
};

const TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/keyword hits:/gi, "关键词命中："],
  [/color fit:/gi, "颜色匹配："],
  [/General seasonal demand with compatible toy style\./gi, "季节需求与当前玩具风格匹配。"],
  [/borrow cues from:/gi, "可借鉴元素："],
  [/Mitigate:/gi, "规避项："],
  [/Seasonal story add-on/gi, "季节主题扩展"],
  [/Differentiate against/gi, "差异化对标"],
  [/quality expectation upgrade/gi, "品质预期升级"],
  [/Run local distributor review before final mold commit/gi, "量产前进行本地渠道复审"],
  [/Reserve one clear hero area for campaign icon or badge/gi, "预留活动主视觉徽章区域"],
  [/Increase depth layering on key details/gi, "增强关键细节层次感"],
  [/Design one signature silhouette element for recall/gi, "打造可识别的标志性轮廓元素"],
  [/Tighten seam lines around face and joints/gi, "优化面部与关节缝线精度"],
  [/Use matte \+ gloss contrast to improve perceived quality/gi, "通过哑光与亮面对比提升品质感"],
  [/Preserves original recognition while shifting to a market-proven palette\./gi, "在保留原有识别度基础上，切换为目标市场验证过的配色。"],
  [/Aligns visual language with near-term seasonal campaigns\./gi, "视觉语言与近期节日活动节奏对齐。"],
  [/Improves shelf visibility while keeping culturally neutral tone\./gi, "在保持文化中性表达的前提下，提升货架可见度。"],
];

const TOKEN_LABELS: Record<string, string> = {
  gift: "礼赠",
  family: "家庭",
  campaign: "活动",
  premium: "高端",
  collectible: "收藏",
  learning: "学习",
  cute: "可爱",
  modular: "模块化",
  social: "社交",
  seasonal: "季节",
  limited: "限定",
  style: "风格",
  package: "包装",
  packaging: "包装",
  detail: "细节",
  details: "细节",
  safe: "安全",
  market: "市场",
  localized: "本地化",
  toy: "玩具",
  redesign: "改款",
  hero: "主视觉",
  quality: "品质",
  story: "叙事",
  neutral: "中性",
  soft: "柔和",
  clean: "清晰",
  display: "展示",
  desk: "桌面",
  capsule: "胶囊",
  figure: "手办",
  bundle: "组合",
  value: "价值",
  trend: "趋势",
  eco: "环保",
  minimal: "极简",
  holiday: "节日",
  school: "校园",
  christmas: "圣诞",
  halloween: "万圣节",
  sakura: "樱花",
  matsuri: "祭典",
  ramadan: "斋月",
  eid: "开斋节",
  lunar: "农历",
  year: "年度",
  ready: "已就绪",
  failed: "失败",
  skipped: "已跳过",
};

export function toZhMarketLabel(market: string): string {
  return MARKET_LABELS[market] ?? "目标市场";
}

export function toZhColorName(name: string): string {
  const normalized = name.trim().toLowerCase();
  return COLOR_LABELS[normalized] ?? toZhText(name, "主题色");
}

export function toZhFeatureTerm(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (FEATURE_TERM_LABELS[normalized]) {
    return FEATURE_TERM_LABELS[normalized];
  }
  return toZhText(value, "已识别特征");
}

export function toZhTabooTitle(ruleId: string, fallback: string): string {
  return TABOO_TITLE_LABELS[ruleId] ?? toZhText(fallback, "文化敏感项");
}

export function toZhTabooRisk(matched: boolean, fallback: string): string {
  if (!matched) {
    return "未命中明显风险，可继续推进。";
  }
  return toZhText(fallback, "存在潜在文化或合规风险，建议优先规避。");
}

export function toZhTabooRecommendation(matched: boolean, fallback: string): string {
  if (!matched) {
    return "维持当前方向，进入下一步设计。";
  }
  return toZhText(fallback, "建议替换敏感元素并进行本地化复审。");
}

export function toZhFestivalName(themeId: string, fallback: string): string {
  return FESTIVAL_NAME_LABELS[themeId] ?? toZhText(fallback, "市场活动主题");
}

export function toZhFestivalReason(relevance: number): string {
  return `与当前产品特征匹配度为 ${Math.round(relevance * 100)}%，建议作为优先活动方向。`;
}

export function toZhFestivalElements(themeId: string, fallback: string[]): string[] {
  const predefined = FESTIVAL_ELEMENTS[themeId];
  if (predefined) {
    return predefined;
  }
  return fallback.map((item) => toZhText(item, "本地化活动元素"));
}

export function toZhCompetitorArchetype(referenceId: string, fallback: string): string {
  return COMPETITOR_ARCHETYPE_LABELS[referenceId] ?? toZhText(fallback, "主流竞品风格");
}

export function toZhCompetitorSummary(summary: string): string {
  return toZhText(summary, "该风格强调识别度、陈列效率与用户理解成本。");
}

export function toZhCompetitorOpportunities(opportunities: string[]): string[] {
  return opportunities.map((item) => toZhText(item, "强化差异化卖点并提升陈列表现。"));
}

export function toZhSchemeName(name: string): string {
  return SCHEME_NAME_LABELS[name] ?? toZhText(name, "本地化配色方案");
}

export function toZhColorUsage(usage: string): string {
  const normalized = usage.trim().toLowerCase();
  return COLOR_USAGE_LABELS[normalized] ?? toZhText(usage, "应用位置");
}

export function toZhSchemeReason(reason: string): string {
  return toZhText(reason, "该配色方案有助于提升目标市场适配度。");
}

export function toZhShapeTitle(title: string): string {
  const mitigateMatch = title.match(/^Mitigate:\s*(.+)$/i);
  if (mitigateMatch?.[1]) {
    return `规避项：${toZhText(mitigateMatch[1], "文化风险点")}`;
  }

  const seasonalMatch = title.match(/^Seasonal story add-on \((.+)\)$/i);
  if (seasonalMatch?.[1]) {
    return `季节主题扩展（${toZhText(seasonalMatch[1], "本地节庆")})`;
  }

  const competitorMatch = title.match(/^Differentiate against (.+)$/i);
  if (competitorMatch?.[1]) {
    return `差异化对标：${toZhText(competitorMatch[1], "主流竞品")}`;
  }

  const qualityMatch = title.match(/^(US|EUROPE|MIDDLE_EAST|SOUTHEAST_ASIA|JAPAN_KOREA) quality expectation upgrade$/i);
  if (qualityMatch?.[1]) {
    return `${toZhMarketLabel(qualityMatch[1].toUpperCase())}品质预期升级`;
  }

  return toZhText(title, "结构与细节优化项");
}

export function toZhShapeReason(reason: string): string {
  return toZhText(reason, "该调整有助于提升市场接受度与做工感知。");
}

export function toZhShapeAction(action: string): string {
  return toZhText(action, "优化结构细节并增强使用体验。");
}

export function toZhPackagingStyleName(styleName: string): string {
  return PACKAGING_STYLE_LABELS[styleName] ?? toZhText(styleName, "本地化包装风格");
}

export function toZhCopyTone(copyTone: string): string {
  const normalized = copyTone.trim().toLowerCase();
  return COPY_TONE_LABELS[normalized] ?? toZhText(copyTone, "清晰、友好、目标导向");
}

export function toZhPackagingReason(reason: string): string {
  return toZhText(reason, "该包装策略可提升陈列效率与转化表现。");
}

export function toZhPackagingVisual(visual: string): string {
  return toZhText(visual, "本地化视觉元素");
}

export function toZhAssetPrompt(): string {
  return "系统已生成对应资产提示词（中文化展示已启用）。";
}

export function toZhAssetReason(reason?: string): string {
  if (!reason) {
    return "未提供说明";
  }
  if (ASSET_REASON_LABELS[reason]) {
    return ASSET_REASON_LABELS[reason];
  }
  return toZhText(reason, "生成流程异常，请稍后重试。");
}

export function toZhShowcaseScript(): string {
  return [
    "0-3秒：主视角环绕展示改款后的整体轮廓。",
    "3-7秒：特写展示配件细节与材质质感。",
    "7-10秒：正侧背三视角切换突出工艺完成度。",
    "10-12秒：包装露出并收束到活动主题口号。",
  ].join(" ");
}

export function toZhText(raw: string, fallback: string): string {
  const text = raw.trim();
  if (text.length === 0) {
    return fallback;
  }
  if (!/[A-Za-z]/.test(text)) {
    return text;
  }

  let converted = text;
  for (const [pattern, replacement] of TEXT_REPLACEMENTS) {
    converted = converted.replace(pattern, replacement);
  }

  converted = converted.replace(/\b[a-z][a-z0-9-]*\b/gi, (token) => {
    const normalized = token.toLowerCase();
    if (COLOR_LABELS[normalized]) {
      return COLOR_LABELS[normalized];
    }
    if (TOKEN_LABELS[normalized]) {
      return TOKEN_LABELS[normalized];
    }
    return "";
  });

  converted = converted
    .replace(/\(/g, "（")
    .replace(/\)/g, "）")
    .replace(/[;:]/g, "，")
    .replace(/，+/g, "，")
    .replace(/\s+/g, " ")
    .replace(/\s*，\s*/g, "，")
    .replace(/^，|，$/g, "")
    .trim();

  if (converted.length === 0 || /[A-Za-z]/.test(converted)) {
    return fallback;
  }

  return converted;
}
