import { useEffect, useState, type JSX } from "react";
import { Link, useParams } from "react-router-dom";
import { AppHeader } from "../shared/ui/AppHeader";
import { useProjectStore } from "../store/project-store";

const MARKET_LABELS: Record<string, string> = {
  US: "美国",
  EUROPE: "欧洲",
  MIDDLE_EAST: "中东",
  SOUTHEAST_ASIA: "东南亚",
  JAPAN_KOREA: "日韩",
};

function getUploadUrl(imagePath: string): string {
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
  const origin = base.replace(/\/api\/v1\/?$/, "");
  return `${origin}/uploads/${imagePath}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type TabId = "overview" | "designs" | "marketing" | "timeline";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "项目概览" },
  { id: "designs", label: "设计方案" },
  { id: "marketing", label: "市场洞察" },
  { id: "timeline", label: "时间线" },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PROCESSING: { label: "处理中", cls: "bg-yellow-100 text-yellow-700" },
  SUCCEEDED: { label: "已完成", cls: "bg-green-100 text-green-700" },
  FAILED: { label: "失败", cls: "bg-red-100 text-red-700" },
};

export function ProjectDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const { currentProject: project, detailLoading, detailError, fetchProjectDetail, clearDetail } = useProjectStore();

  useEffect(() => {
    if (id) {
      fetchProjectDetail(id);
    }
    return () => clearDetail();
  }, [id, fetchProjectDetail, clearDetail]);

  if (detailLoading) {
    return (
      <div className="mesh-gradient min-h-screen">
        <AppHeader variant="glass" />
        <main className="pt-32 pb-20 container mx-auto px-6">
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-toy-secondary">加载项目详情中...</p>
          </div>
        </main>
      </div>
    );
  }

  if (detailError || !project) {
    return (
      <div className="mesh-gradient min-h-screen">
        <AppHeader variant="glass" />
        <main className="pt-32 pb-20 container mx-auto px-6">
          <div className="text-center py-20">
            <i className="fa-solid fa-triangle-exclamation text-5xl text-red-300 mb-4" />
            <p className="text-red-500 mb-4">{detailError || "项目未找到"}</p>
            <Link to="/dashboard" className="px-6 py-3 bg-primary text-white font-bold rounded-xl no-underline">
              返回项目列表
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[project.status] || STATUS_MAP.PROCESSING;

  // Parse typed data from JSON fields
  const features = project.result as {
    shape?: { category?: string; confidence?: number; evidence?: string };
    colors?: Array<{ name?: string; hex?: string; proportion?: number }>;
    material?: Array<{ name?: string; confidence?: number }>;
    style?: Array<{ name?: string; confidence?: number }>;
  } | null;

  interface AssetImage {
    status?: string;
    imageBase64?: string;
    mimeType?: string;
    prompt?: string;
    reason?: string;
  }

  interface RedesignData {
    id: string;
    targetMarket: string;
    colorSchemes?: Array<{ schemeName?: string; positioning?: string; colors?: Array<{ name?: string; hex?: string; usage?: string }>; reason?: string }>;
    shapeAdjustments?: Array<{ title?: string; priority?: string; actions?: string[]; reason?: string }>;
    packagingSuggestions?: Array<{ styleName?: string; materials?: string[]; visualElements?: string[]; copyTone?: string; reason?: string }>;
    assets?: {
      previewImage?: AssetImage;
      threeView?: {
        front?: AssetImage;
        side?: AssetImage;
        back?: AssetImage;
      };
      showcaseVideo?: {
        status?: string;
        script?: string;
        keyframes?: Array<{ label?: string; prompt?: string; imageBase64?: string; mimeType?: string }>;
        reason?: string;
      };
    };
    createdAt: string;
  }

  const redesign = project.redesignSuggestions[0] as RedesignData | undefined;

  return (
    <div className="mesh-gradient min-h-screen">
      <AppHeader variant="glass" />

      <main className="pt-32 pb-20 container mx-auto px-6">
        {/* Project Header */}
        <section className="mb-8 animate-fade-in-up">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusInfo.cls}`}>
                  {statusInfo.label}
                </span>
                <span className="text-gray-400 text-sm">
                  编号: {project.requestId.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900">{project.originalFilename}</h1>
              <p className="text-gray-500 mt-2 text-lg">{project.directionValue}</p>
            </div>
            <div className="flex space-x-3">
              <Link to="/workflow/step1" className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-md hover:shadow-lg no-underline">
                <i className="fas fa-wand-magic-sparkles mr-2" /> 新建设计
              </Link>
            </div>
          </div>
        </section>

        {/* Summary Card */}
        <div className="glass-card rounded-[2rem] p-8 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { label: "改款方向", value: project.directionMode === "PRESET" ? project.directionValue : project.directionValue.slice(0, 20) + (project.directionValue.length > 20 ? "..." : "") },
              { label: "目标市场", value: project.crossCulturalAnalyses.map((cc) => MARKET_LABELS[cc.targetMarket] || cc.targetMarket).join(" / ") || "未分析" },
              { label: "文化分析", value: `${project.crossCulturalAnalyses.length} 份` },
              { label: "创建时间", value: formatDate(project.createdAt) },
            ].map((item) => (
              <div key={item.label} className="border-r border-gray-100 last:border-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-xl font-bold text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex space-x-8 mb-8 border-b border-gray-200/50">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-sm font-bold tracking-wide transition-all ${
                activeTab === tab.id
                  ? "text-primary border-b-[3px] border-primary"
                  : "text-gray-400 hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === "overview" && (
          <div className="animate-slide-up grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Image Preview */}
              <div className="glass-card rounded-[2.5rem] overflow-hidden relative aspect-video group">
                <img
                  src={getUploadUrl(project.imagePath)}
                  alt={project.originalFilename}
                  className="w-full h-full object-contain bg-white/50"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = "none";
                    el.parentElement!.innerHTML = `
                      <div class="absolute inset-0 flex items-center justify-center flex-col text-center p-12">
                        <div class="w-48 h-48 bg-white/80 rounded-full flex items-center justify-center shadow-2xl mb-6">
                          <i class="fas fa-image text-6xl text-primary/40"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">图片暂不可用</h3>
                      </div>
                    `;
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Features */}
                {features && (
                  <div className="glass-card rounded-3xl p-6">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                      <i className="fas fa-shapes text-primary mr-2" /> 特征提取
                    </h4>
                    <div className="space-y-3 text-sm">
                      {features.shape && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">造型</span>
                          <span className="font-bold text-gray-800">{features.shape.category}</span>
                        </div>
                      )}
                      {Array.isArray(features.colors) && features.colors.length > 0 && (
                        <div>
                          <span className="text-gray-500 block mb-2">主色</span>
                          <div className="flex gap-2 flex-wrap">
                            {features.colors.map((c, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <span
                                  className="inline-block w-4 h-4 rounded-full border border-gray-200"
                                  style={{ backgroundColor: c.hex || "#ccc" }}
                                />
                                <span className="text-xs text-gray-700">{c.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {Array.isArray(features.material) && features.material.length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">材质</span>
                          <span className="font-bold text-gray-800">{features.material.map((m) => m.name).join(", ")}</span>
                        </div>
                      )}
                      {Array.isArray(features.style) && features.style.length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">风格</span>
                          <span className="font-bold text-gray-800">{features.style.map((s) => s.name).join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Compliance */}
                <div className="glass-card rounded-3xl p-6">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                    <i className="fas fa-shield-halved text-accent-blue mr-2" /> 合规性检测
                  </h4>
                  {project.complianceAssessments.length > 0 ? (
                    <ul className="text-sm space-y-2">
                      {project.complianceAssessments.map((ca) => (
                        <li key={ca.id} className="flex items-center text-gray-600">
                          <i className="fas fa-check-circle text-green-500 mr-2" />
                          {MARKET_LABELS[ca.targetMarket] || ca.targetMarket} - {ca.summary.slice(0, 30)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400">暂无合规检测数据</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Cross-cultural summaries */}
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-gray-800 px-2">AI 改款建议简报</h4>
              {project.crossCulturalAnalyses.length > 0 ? (
                project.crossCulturalAnalyses.map((cc) => (
                  <div key={cc.id} className="glass-card rounded-3xl p-6 border-l-4 border-primary">
                    <div className="flex items-center space-x-3 mb-3">
                      <i className="fas fa-globe text-primary" />
                      <span className="font-bold text-gray-800">{MARKET_LABELS[cc.targetMarket] || cc.targetMarket}</span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{cc.summary}</p>
                  </div>
                ))
              ) : (
                <div className="glass-card rounded-3xl p-6 text-center">
                  <p className="text-sm text-gray-400">暂无文化分析数据</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "marketing" && (
          <div className="animate-slide-up glass-card rounded-[2.5rem] p-10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">AI 市场深度改款分析</h3>
                <p className="text-gray-500 mt-1">基于各地区文化画像与审美偏好生成的定制方案</p>
              </div>
            </div>
            {project.crossCulturalAnalyses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {project.crossCulturalAnalyses.map((cc) => {
                  const taboos = Array.isArray(cc.tabooFindings) ? cc.tabooFindings as Array<{ title?: string; risk?: string; recommendation?: string; matched?: boolean }> : [];
                  const festivals = Array.isArray(cc.festivalThemes) ? cc.festivalThemes as Array<{ name?: string; reason?: string }> : [];
                  const competitors = Array.isArray(cc.competitorStyles) ? cc.competitorStyles as Array<{ brandArchetype?: string; styleSummary?: string }> : [];

                  const highlights: string[] = [];
                  const matchedTaboos = taboos.filter((t) => t.matched);
                  if (matchedTaboos.length > 0) {
                    highlights.push(`禁忌提醒：${matchedTaboos[0].title || matchedTaboos[0].risk || "请注意文化禁忌"}`);
                  }
                  if (festivals.length > 0) {
                    highlights.push(`节日主题：${festivals[0].name || "可匹配当地节日"}`);
                  }
                  if (competitors.length > 0) {
                    highlights.push(`竞品风格：${competitors[0].brandArchetype || competitors[0].styleSummary || "参考当地竞品"}`);
                  }
                  if (highlights.length === 0) {
                    highlights.push(cc.summary.slice(0, 60));
                  }

                  return (
                    <div key={cc.id} className="p-8 bg-surface/50 rounded-3xl border border-white hover:shadow-xl transition-all group">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                        <i className="fas fa-globe text-xl" />
                      </div>
                      <h4 className="text-xl font-bold mb-4">{MARKET_LABELS[cc.targetMarket] || cc.targetMarket}</h4>
                      <ul className="space-y-4">
                        {highlights.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start">
                            <i className="fas fa-check text-primary mt-1 mr-3" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <i className="fas fa-earth-asia text-4xl text-gray-300 mb-4" />
                <p className="text-gray-500">暂无市场洞察数据</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="animate-slide-up glass-card rounded-[2.5rem] p-10">
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-12">
                {/* Build timeline from real data */}
                {[
                  { date: formatDate(project.createdAt), title: "上传图片并提取特征", desc: `上传了 ${project.originalFilename}，方向：${project.directionValue}`, active: true },
                  ...project.crossCulturalAnalyses.map((cc) => ({
                    date: formatDate(cc.createdAt),
                    title: `完成 ${MARKET_LABELS[cc.targetMarket] || cc.targetMarket} 文化分析`,
                    desc: cc.summary.slice(0, 80),
                    active: true,
                  })),
                  ...project.redesignSuggestions.map((rd) => ({
                    date: formatDate(rd.createdAt),
                    title: `生成 ${MARKET_LABELS[rd.targetMarket] || rd.targetMarket} 设计方案`,
                    desc: `包含配色方案、造型调整和包装建议`,
                    active: true,
                  })),
                  ...project.complianceAssessments.map((ca) => ({
                    date: formatDate(ca.createdAt),
                    title: `完成 ${MARKET_LABELS[ca.targetMarket] || ca.targetMarket} 合规评估`,
                    desc: ca.summary.slice(0, 80),
                    active: true,
                  })),
                ].map((item, idx) => (
                  <div key={idx} className={`relative pl-20 group ${!item.active ? "opacity-50" : ""}`}>
                    <div className={`absolute left-6 w-5 h-5 rounded-full border-4 border-white shadow-md z-10 group-hover:scale-125 transition-transform ${item.active ? "bg-primary" : "bg-gray-300"}`} />
                    <div className="bg-white/40 p-6 rounded-2xl border border-white/50">
                      <p className={`text-xs font-black uppercase tracking-widest mb-1 ${item.active ? "text-primary" : "text-gray-400"}`}>{item.date}</p>
                      <h5 className="text-lg font-bold text-gray-800">{item.title}</h5>
                      <p className="text-gray-500 mt-2">{item.desc}</p>
                    </div>
                  </div>
                ))}
                {project.crossCulturalAnalyses.length === 0 && project.redesignSuggestions.length === 0 && (
                  <div className="relative pl-20">
                    <div className="absolute left-6 w-5 h-5 rounded-full border-4 border-white shadow-md z-10 bg-gray-300" />
                    <div className="bg-white/40 p-6 rounded-2xl border border-white/50">
                      <p className="text-xs font-black uppercase tracking-widest mb-1 text-gray-400">待完成</p>
                      <h5 className="text-lg font-bold text-gray-800">等待下一步操作</h5>
                      <p className="text-gray-500 mt-2">可通过工作台继续进行文化分析和设计生成</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "designs" && (
          <div className="animate-slide-up">
            {redesign ? (
              <div className="space-y-8">
                {/* Preview image — show regardless of status */}
                {redesign.assets?.previewImage && (
                  <div className="glass-card rounded-[2.5rem] overflow-hidden">
                    <h4 className="font-bold text-gray-800 px-8 pt-6 flex items-center">
                      <i className="fas fa-image text-primary mr-2" /> AI 生成预览
                    </h4>
                    {redesign.assets.previewImage.status === "READY" && redesign.assets.previewImage.imageBase64 ? (
                      <img
                        src={`data:${redesign.assets.previewImage.mimeType || "image/png"};base64,${redesign.assets.previewImage.imageBase64}`}
                        alt="AI 生成预览"
                        className="w-full max-h-[500px] object-contain bg-white/50 p-4"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <i className={`fas ${redesign.assets.previewImage.status === "FAILED" ? "fa-triangle-exclamation text-red-300" : "fa-clock text-gray-300"} text-3xl`} />
                        </div>
                        <p className="text-sm font-bold text-gray-500">
                          {redesign.assets.previewImage.status === "FAILED" ? "预览图生成失败" : "预览图未生成"}
                        </p>
                        {redesign.assets.previewImage.reason && (
                          <p className="text-xs text-gray-400 mt-1">{redesign.assets.previewImage.reason}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Three-view drawings — show all views regardless of status */}
                {redesign.assets?.threeView && (
                  <div className="glass-card rounded-[2.5rem] p-8">
                    <h4 className="font-bold text-gray-800 mb-6 flex items-center">
                      <i className="fas fa-cube text-primary mr-2" /> 三视图
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { key: "front", label: "正面视图", data: redesign.assets!.threeView!.front },
                        { key: "side", label: "侧面视图", data: redesign.assets!.threeView!.side },
                        { key: "back", label: "背面视图", data: redesign.assets!.threeView!.back },
                      ].map((v) => (
                        <div key={v.key} className="bg-white/50 rounded-2xl overflow-hidden border border-white/60">
                          {v.data?.status === "READY" && v.data.imageBase64 ? (
                            <img
                              src={`data:${v.data.mimeType || "image/png"};base64,${v.data.imageBase64}`}
                              alt={v.label}
                              className="w-full aspect-square object-contain p-2"
                            />
                          ) : (
                            <div className="w-full aspect-square bg-gray-50 flex flex-col items-center justify-center">
                              <i className={`fas ${v.data?.status === "FAILED" ? "fa-triangle-exclamation text-red-200" : "fa-clock text-gray-200"} text-3xl mb-2`} />
                              <p className="text-[10px] text-gray-400">
                                {v.data?.status === "FAILED" ? "生成失败" : v.data?.status === "SKIPPED" ? "已跳过" : "未生成"}
                              </p>
                              {v.data?.reason && <p className="text-[9px] text-gray-300 mt-0.5">{v.data.reason}</p>}
                            </div>
                          )}
                          <p className="text-center text-xs font-bold text-gray-500 py-2 border-t border-gray-100">{v.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Color schemes */}
                  {Array.isArray(redesign.colorSchemes) && redesign.colorSchemes.length > 0 && (
                    <div className="glass-card rounded-3xl p-8">
                      <h4 className="font-bold text-gray-800 mb-6 flex items-center">
                        <i className="fas fa-palette text-primary mr-2" /> 配色方案
                      </h4>
                      <div className="space-y-6">
                        {redesign.colorSchemes.map((scheme, i) => (
                          <div key={i}>
                            <p className="font-bold text-sm mb-1">{scheme.schemeName}</p>
                            <p className="text-xs text-gray-500 mb-2">{scheme.positioning}</p>
                            <div className="flex gap-2 flex-wrap mb-2">
                              {Array.isArray(scheme.colors) && scheme.colors.map((c, ci) => (
                                <div key={ci} className="flex items-center gap-1.5 px-2 py-1 bg-white/60 rounded-lg">
                                  <span className="inline-block w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: c.hex || "#ccc" }} />
                                  <span className="text-xs">{c.name}</span>
                                </div>
                              ))}
                            </div>
                            {scheme.reason && <p className="text-xs text-gray-400">{scheme.reason}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shape adjustments */}
                  {Array.isArray(redesign.shapeAdjustments) && redesign.shapeAdjustments.length > 0 && (
                    <div className="glass-card rounded-3xl p-8">
                      <h4 className="font-bold text-gray-800 mb-6 flex items-center">
                        <i className="fas fa-shapes text-primary mr-2" /> 造型调整
                      </h4>
                      <div className="space-y-4">
                        {redesign.shapeAdjustments.map((adj, i) => (
                          <div key={i} className="p-4 bg-white/40 rounded-xl border border-white/50">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                adj.priority === "HIGH" ? "bg-red-100 text-red-600" :
                                adj.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-600" :
                                "bg-blue-100 text-blue-600"
                              }`}>
                                {adj.priority}
                              </span>
                              <span className="font-bold text-sm">{adj.title}</span>
                            </div>
                            {Array.isArray(adj.actions) && (
                              <ul className="text-xs text-gray-500 space-y-1 mb-1">
                                {adj.actions.map((action, ai) => (
                                  <li key={ai} className="flex items-start">
                                    <i className="fas fa-chevron-right text-primary/50 mr-1.5 mt-0.5 text-[8px]" />
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {adj.reason && <p className="text-[10px] text-gray-400">{adj.reason}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Packaging suggestions */}
                {Array.isArray(redesign.packagingSuggestions) && redesign.packagingSuggestions.length > 0 && (
                  <div className="glass-card rounded-[2.5rem] p-8">
                    <h4 className="font-bold text-gray-800 mb-6 flex items-center">
                      <i className="fas fa-box-open text-primary mr-2" /> 包装建议
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {redesign.packagingSuggestions.map((pkg, i) => (
                        <div key={i} className="p-6 bg-white/40 rounded-2xl border border-white/50">
                          <h5 className="font-bold text-sm text-gray-800 mb-3">{pkg.styleName}</h5>
                          {Array.isArray(pkg.materials) && pkg.materials.length > 0 && (
                            <div className="mb-2">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">材料</p>
                              <div className="flex gap-1.5 flex-wrap">
                                {pkg.materials.map((m, mi) => (
                                  <span key={mi} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">{m}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {Array.isArray(pkg.visualElements) && pkg.visualElements.length > 0 && (
                            <div className="mb-2">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">视觉元素</p>
                              <ul className="text-xs text-gray-600 space-y-0.5">
                                {pkg.visualElements.map((ve, vi) => (
                                  <li key={vi} className="flex items-start">
                                    <i className="fas fa-circle text-primary/30 mr-1.5 mt-1 text-[5px]" />
                                    {ve}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {pkg.copyTone && (
                            <div className="mb-2">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">文案调性</p>
                              <p className="text-xs text-gray-600">{pkg.copyTone}</p>
                            </div>
                          )}
                          {pkg.reason && <p className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-100">{pkg.reason}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Showcase video script — always show when data exists */}
                {redesign.assets?.showcaseVideo && (
                  <div className="glass-card rounded-[2.5rem] p-8">
                    <h4 className="font-bold text-gray-800 mb-6 flex items-center">
                      <i className="fas fa-film text-primary mr-2" /> 展示视频脚本
                      {redesign.assets.showcaseVideo.status === "SCRIPT_ONLY" && (
                        <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded">仅脚本</span>
                      )}
                      {redesign.assets.showcaseVideo.status === "SKIPPED" && (
                        <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded">已跳过</span>
                      )}
                    </h4>
                    {redesign.assets.showcaseVideo.script ? (
                      <div className="p-5 bg-white/40 rounded-2xl border border-white/50 mb-6">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">脚本内容</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{redesign.assets.showcaseVideo.script}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 mb-4">暂无脚本内容</p>
                    )}
                    {redesign.assets.showcaseVideo.reason && (
                      <p className="text-xs text-gray-400 mb-4"><i className="fas fa-info-circle mr-1" />{redesign.assets.showcaseVideo.reason}</p>
                    )}
                    {Array.isArray(redesign.assets.showcaseVideo.keyframes) && redesign.assets.showcaseVideo.keyframes.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">关键帧</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {redesign.assets.showcaseVideo.keyframes.map((kf, ki) => (
                            <div key={ki} className="bg-white/40 rounded-xl border border-white/50 overflow-hidden">
                              {kf.imageBase64 ? (
                                <img
                                  src={`data:${kf.mimeType || "image/png"};base64,${kf.imageBase64}`}
                                  alt={kf.label || `关键帧 ${ki + 1}`}
                                  className="w-full aspect-video object-contain bg-gray-50"
                                />
                              ) : (
                                <div className="w-full aspect-video bg-gray-50 flex items-center justify-center">
                                  <i className="fas fa-image text-2xl text-gray-200" />
                                </div>
                              )}
                              <div className="p-2">
                                <p className="text-xs font-bold text-gray-700 truncate">{kf.label || `帧 ${ki + 1}`}</p>
                                {kf.prompt && <p className="text-[10px] text-gray-400 line-clamp-2">{kf.prompt}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 glass-card rounded-[2.5rem]">
                <i className="fas fa-images text-4xl text-gray-300 mb-4" />
                <p className="text-gray-500">暂无设计方案数据</p>
              </div>
            )}
          </div>
        )}

        {/* Action Footer */}
        <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <Link to="/dashboard" className="text-gray-500 font-bold hover:text-primary transition-colors no-underline">
            <i className="fas fa-arrow-left-long mr-2" /> 返回项目列表
          </Link>
        </div>
      </main>
    </div>
  );
}
