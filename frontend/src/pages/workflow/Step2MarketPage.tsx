import { useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkflowStore } from "../../store/workflow-store";
import {
  postCrossCulturalAnalyze,
  postRedesignSuggest,
} from "../../shared/api/toyclaw";
import type { TargetMarket } from "../../shared/types/api";
import { NavigationFooter } from "../../shared/ui/NavigationFooter";

interface CountryEntry {
  emoji: string;
  label: string;
  market: TargetMarket;
}

const COUNTRIES: CountryEntry[] = [
  { emoji: "🇯🇵", label: "日本", market: "JAPAN_KOREA" },
  { emoji: "🇰🇷", label: "韩国", market: "JAPAN_KOREA" },
  { emoji: "🇺🇸", label: "美国", market: "US" },
  { emoji: "🇬🇧", label: "英国", market: "EUROPE" },
  { emoji: "🇩🇪", label: "德国", market: "EUROPE" },
  { emoji: "🇸🇦", label: "沙特", market: "MIDDLE_EAST" },
  { emoji: "🇦🇪", label: "阿联酋", market: "MIDDLE_EAST" },
  { emoji: "🇮🇩", label: "印尼", market: "SOUTHEAST_ASIA" },
  { emoji: "🇹🇭", label: "泰国", market: "SOUTHEAST_ASIA" },
  { emoji: "🇻🇳", label: "越南", market: "SOUTHEAST_ASIA" },
];

const CATEGORIES = ["推荐地区", "日韩", "欧美", "中东", "东南亚"] as const;
const CATEGORY_MARKET_MAP: Record<string, TargetMarket | null> = {
  "推荐地区": null,
  "日韩": "JAPAN_KOREA",
  "欧美": "US",
  "中东": "MIDDLE_EAST",
  "东南亚": "SOUTHEAST_ASIA",
};

const CULTURE_SNAPSHOT: Record<TargetMarket, { title: string; items: { icon: string; iconBg: string; iconColor: string; label: string; value: string }[] }> = {
  JAPAN_KOREA: {
    title: "日韩市场文化快照",
    items: [
      { icon: "fa-calendar-check", iconBg: "bg-orange-100", iconColor: "text-orange-600", label: "近期节庆", value: "樱花祭（3月）、七夕（7月）" },
      { icon: "fa-fire", iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "流行 IP 方向", value: "和风元素、治愈系萌宠、机甲" },
      { icon: "fa-chart-line", iconBg: "bg-green-100", iconColor: "text-green-600", label: "本月热度", value: "日系毛绒品类增长 15%" },
      { icon: "fa-shield-halved", iconBg: "bg-purple-100", iconColor: "text-purple-600", label: "出海壁垒", value: "环保认证、小体积包装偏好" },
    ],
  },
  US: {
    title: "美国市场文化快照",
    items: [
      { icon: "fa-calendar-check", iconBg: "bg-orange-100", iconColor: "text-orange-600", label: "近期节庆", value: "感恩节、圣诞节、黑五促销" },
      { icon: "fa-fire", iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "流行 IP 方向", value: "STEM教育、超级英雄、极简风" },
      { icon: "fa-chart-line", iconBg: "bg-green-100", iconColor: "text-green-600", label: "本月热度", value: "教育类玩具需求增长 22%" },
      { icon: "fa-shield-halved", iconBg: "bg-purple-100", iconColor: "text-purple-600", label: "出海壁垒", value: "ASTM F963 认证、CPSIA 合规" },
    ],
  },
  EUROPE: {
    title: "欧洲市场文化快照",
    items: [
      { icon: "fa-calendar-check", iconBg: "bg-orange-100", iconColor: "text-orange-600", label: "近期节庆", value: "复活节、圣诞集市" },
      { icon: "fa-fire", iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "流行 IP 方向", value: "经典传承、自然环保、北欧极简" },
      { icon: "fa-chart-line", iconBg: "bg-green-100", iconColor: "text-green-600", label: "本月热度", value: "可持续玩具品类增长 18%" },
      { icon: "fa-shield-halved", iconBg: "bg-purple-100", iconColor: "text-purple-600", label: "出海壁垒", value: "EN71 认证、REACH 化学品合规" },
    ],
  },
  MIDDLE_EAST: {
    title: "中东市场文化快照",
    items: [
      { icon: "fa-calendar-check", iconBg: "bg-orange-100", iconColor: "text-orange-600", label: "近期节庆", value: "开斋节、古尔邦节" },
      { icon: "fa-fire", iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "流行 IP 方向", value: "高端礼品、金色调、传统纹样" },
      { icon: "fa-chart-line", iconBg: "bg-green-100", iconColor: "text-green-600", label: "本月热度", value: "节日礼品类增长 30%" },
      { icon: "fa-shield-halved", iconBg: "bg-purple-100", iconColor: "text-purple-600", label: "出海壁垒", value: "文化敏感性审核、GSO认证" },
    ],
  },
  SOUTHEAST_ASIA: {
    title: "东南亚市场文化快照",
    items: [
      { icon: "fa-calendar-check", iconBg: "bg-orange-100", iconColor: "text-orange-600", label: "近期节庆", value: "宋干节、排灯节" },
      { icon: "fa-fire", iconBg: "bg-blue-100", iconColor: "text-blue-600", label: "流行 IP 方向", value: "高饱和度、热带色系、本地吉祥物" },
      { icon: "fa-chart-line", iconBg: "bg-green-100", iconColor: "text-green-600", label: "本月热度", value: "平价毛绒品类增长 25%" },
      { icon: "fa-shield-halved", iconBg: "bg-purple-100", iconColor: "text-purple-600", label: "出海壁垒", value: "TISI认证、多语言包装要求" },
    ],
  },
};

export function Step2MarketPage(): JSX.Element {
  const navigate = useNavigate();
  const { requestId, setTargetMarket, setCrossCulturalResult, setRedesignResult, setStep } = useWorkflowStore();

  const [selected, setSelected] = useState<TargetMarket | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("推荐地区");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCountries = activeCategory === "推荐地区"
    ? COUNTRIES
    : COUNTRIES.filter((c) => c.market === CATEGORY_MARKET_MAP[activeCategory]);

  const snapshot = selected ? CULTURE_SNAPSHOT[selected] : null;

  const handleNext = async () => {
    if (!selected || !requestId) return;
    setLoading(true);
    setError(null);
    try {
      setTargetMarket(selected);
      const crossResult = await postCrossCulturalAnalyze({ requestId, targetMarket: selected });
      setCrossCulturalResult(crossResult);

      const redesignResult = await postRedesignSuggest({
        requestId,
        crossCulturalAnalysisId: crossResult.analysisId,
        assets: { previewImage: true, threeView: true },
      });
      setRedesignResult(redesignResult);
      setStep("step3");
      navigate("/workflow/step3");
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-12 animate-fade-in-up stagger-1">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Step 2: 选择目标市场
        </h1>
        <p className="text-lg text-toy-secondary max-w-2xl mx-auto leading-relaxed">
          AI 将根据您选择的区域文化深度调整模型，为您提供符合当地审美与流行趋势的玩具设计建议。
        </p>
      </div>

      {/* Search & Country Picker */}
      <section className="animate-fade-in-up stagger-2 mb-8">
        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-lg font-bold mb-6 flex items-center">
            <span className="w-1.5 h-6 bg-primary rounded-full mr-3" />
            选择国家 / 地区
          </h2>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-white hover:shadow-lg hover:shadow-primary/20"
                    : "bg-white text-toy-secondary border border-black/5 hover:border-primary hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Country Grid */}
          <div className="overflow-x-auto hide-scrollbar -mx-2 px-2">
            <div className="flex space-x-6 min-w-max py-4">
              {filteredCountries.map((country) => {
                const isSelected = selected === country.market;
                return (
                  <div
                    key={country.label}
                    onClick={() => setSelected(country.market)}
                    className="group cursor-pointer text-center"
                  >
                    <div
                      className={`w-20 h-20 rounded-3xl bg-white border flex items-center justify-center text-4xl mb-3 shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all ${
                        isSelected
                          ? "ring-4 ring-primary/40 border-primary"
                          : "border-black/5"
                      }`}
                    >
                      {country.emoji}
                    </div>
                    <span className={`text-sm font-semibold transition-colors ${
                      isSelected ? "text-primary" : "text-toy-secondary group-hover:text-primary"
                    }`}>
                      {country.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Culture Snapshot */}
      {snapshot && (
        <section className="animate-fade-in-up stagger-3 mb-12">
          <div className="relative overflow-hidden glass-card rounded-3xl p-8 border-primary/20">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md uppercase tracking-wider">AI Insights</span>
                <h3 className="text-xl font-bold">{snapshot.title}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {snapshot.items.map((item) => (
                  <div key={item.label} className="flex items-start space-x-4 p-4 rounded-2xl bg-white/40 border border-white/50">
                    <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center ${item.iconColor} shrink-0`}>
                      <i className={`fa-solid ${item.icon}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-toy-secondary mb-1">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center mb-4">
          <i className="fas fa-exclamation-circle mr-2" />
          {error}
        </div>
      )}

      <NavigationFooter
        onBack={() => navigate("/workflow/step1")}
        backLabel="上一步"
        onNext={handleNext}
        nextLabel="下一步：生成设计"
        nextDisabled={!selected}
        nextLoading={loading}
      />
    </>
  );
}
