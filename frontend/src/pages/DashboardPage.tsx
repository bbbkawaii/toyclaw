import { useEffect, useState, type JSX } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "../shared/ui/AppHeader";
import { MobileBottomNav } from "../shared/ui/MobileBottomNav";
import { useProjectStore } from "../store/project-store";

const MARKET_LABELS: Record<string, string> = {
  US: "美国",
  EUROPE: "欧洲",
  MIDDLE_EAST: "中东",
  SOUTHEAST_ASIA: "东南亚",
  JAPAN_KOREA: "日韩",
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

function getUploadUrl(imagePath: string): string {
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
  const origin = base.replace(/\/api\/v1\/?$/, "");
  return `${origin}/uploads/${imagePath}`;
}

export function DashboardPage(): JSX.Element {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMarket, setShowMarket] = useState(false);
  const [showCalc, setShowCalc] = useState(false);

  const { projects, total, loading, error, fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const uniqueMarkets = new Set(projects.flatMap((p) => p.targetMarkets));

  return (
    <div className="mesh-gradient min-h-screen">
      <AppHeader variant="glass" />

      {/* Sidebar */}
      <aside
        className={`fixed top-20 left-0 bottom-0 bg-white/40 backdrop-blur-md border-r border-white/20 z-40 transition-all duration-300 hidden lg:block ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          <nav className="space-y-2 flex-1">
            <a href="#" className="flex items-center gap-4 px-4 py-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 transition-all justify-center lg:justify-start">
              <i className="fa-solid fa-house-chimney w-5 text-center" />
              {!sidebarCollapsed && <span className="font-medium">概览中心</span>}
            </a>
            <Link to="/workflow/step1" className="flex items-center gap-4 px-4 py-3 text-toy-secondary hover:bg-primary/5 hover:text-primary rounded-xl transition-all no-underline justify-center lg:justify-start">
              <i className="fa-solid fa-plus-circle w-5 text-center" />
              {!sidebarCollapsed && <span className="font-medium">开启新设计</span>}
            </Link>
            <a href="#" className="flex items-center gap-4 px-4 py-3 text-toy-secondary hover:bg-primary/5 hover:text-primary rounded-xl transition-all justify-center lg:justify-start">
              <i className="fa-solid fa-layer-group w-5 text-center" />
              {!sidebarCollapsed && <span className="font-medium">项目管理</span>}
            </a>
            <button
              onClick={() => { setShowMarket(true); setShowCalc(false); }}
              className="w-full flex items-center gap-4 px-4 py-3 text-toy-secondary hover:bg-primary/5 hover:text-primary rounded-xl transition-all justify-center lg:justify-start"
            >
              <i className="fa-solid fa-earth-asia w-5 text-center" />
              {!sidebarCollapsed && <span className="font-medium">市场情报</span>}
            </button>
            <button
              onClick={() => { setShowCalc(true); setShowMarket(false); }}
              className="w-full flex items-center gap-4 px-4 py-3 text-toy-secondary hover:bg-primary/5 hover:text-primary rounded-xl transition-all justify-center lg:justify-start"
            >
              <i className="fa-solid fa-calculator w-5 text-center" />
              {!sidebarCollapsed && <span className="font-medium">成本测算</span>}
            </button>
          </nav>
          {!sidebarCollapsed && (
            <div className="mt-auto p-4 bg-primary/10 rounded-2xl border border-primary/20">
              <p className="text-xs font-bold text-primary mb-1">专业版空间</p>
              <p className="text-[10px] text-toy-secondary mb-3">还剩 15 天试用期</p>
              <button className="w-full py-2 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary-dark transition-colors">
                立即升级
              </button>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="mt-4 p-2 text-toy-secondary hover:text-primary flex justify-center"
          >
            <i className={`fa-solid ${sidebarCollapsed ? "fa-angles-right" : "fa-angles-left"}`} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-24 px-6 pb-20 transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
        <div className="max-w-7xl mx-auto">
          {/* Welcome */}
          <section className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-toy-text mb-2">概览中心</h1>
            <p className="text-toy-secondary animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
              {total > 0
                ? `共有 ${total} 个设计项目，覆盖 ${uniqueMarkets.size} 个目标市场。`
                : "还没有项目，开始你的第一个设计吧。"}
            </p>
          </section>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: "fa-rocket",
                color: "primary",
                label: "设计项目总数",
                value: String(total),
                pct: `${Math.min(total * 8, 100)}%`,
              },
              {
                icon: "fa-globe",
                color: "accent-blue",
                label: "覆盖目标市场",
                value: String(uniqueMarkets.size),
                pct: `${Math.min(uniqueMarkets.size * 20, 100)}%`,
              },
              {
                icon: "fa-check-double",
                color: "accent-gold",
                label: "成功率",
                value: total > 0
                  ? `${Math.round((projects.filter((p) => p.status === "SUCCEEDED").length / projects.length) * 100)}%`
                  : "—",
                pct: total > 0
                  ? `${Math.round((projects.filter((p) => p.status === "SUCCEEDED").length / projects.length) * 100)}%`
                  : "0%",
              },
            ].map((stat, i) => (
              <div key={stat.label} className="glass-card p-6 rounded-2xl animate-fade-in-up" style={{ animationDelay: `${0.1 * (i + 1)}s` }}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-${stat.color}/10 text-${stat.color} flex items-center justify-center`}>
                    <i className={`fa-solid ${stat.icon} text-xl`} />
                  </div>
                  <div>
                    <p className="text-xs text-toy-secondary font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-toy-text">{stat.value}</p>
                  </div>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div className={`bg-${stat.color} h-full rounded-full`} style={{ width: stat.pct }} />
                </div>
              </div>
            ))}
          </div>

          {/* Recent Projects */}
          <section className="mb-10">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-2xl font-bold text-toy-text">最近工作项</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Loading skeleton */}
              {loading && projects.length === 0 && (
                <>
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="glass-card p-5 rounded-2xl animate-pulse">
                      <div className="rounded-xl mb-4 aspect-[4/3] bg-gray-200" />
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-full mb-4" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                  ))}
                </>
              )}

              {/* Error state */}
              {error && !loading && (
                <div className="col-span-full text-center py-12">
                  <i className="fa-solid fa-triangle-exclamation text-4xl text-red-300 mb-4" />
                  <p className="text-red-500 mb-2">{error}</p>
                  <button onClick={() => fetchProjects()} className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg">
                    重试
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && projects.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
                    <i className="fa-solid fa-folder-open text-3xl" />
                  </div>
                  <h3 className="font-bold text-toy-text text-lg mb-2">还没有项目</h3>
                  <p className="text-toy-secondary text-sm mb-6">开始你的第一个设计，让 AI 帮你探索全球市场机会。</p>
                  <Link to="/workflow/step1" className="px-6 py-3 bg-primary text-white font-bold rounded-xl no-underline hover:bg-primary-dark transition-colors">
                    开始新项目
                  </Link>
                </div>
              )}

              {/* Project Cards */}
              {projects.map((project) => (
                <div key={project.requestId} className="glass-card group p-5 rounded-2xl hover:-translate-y-2 transition-all duration-300">
                  <div className="relative rounded-xl overflow-hidden mb-4 aspect-[4/3] bg-primary-soft">
                    <img
                      src={getUploadUrl(project.imagePath)}
                      alt={project.originalFilename}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                      {project.targetMarkets.map((m) => (
                        <span key={m} className="px-2.5 py-1 bg-white/80 backdrop-blur-sm rounded-full text-[10px] font-bold text-primary">
                          {MARKET_LABELS[m] || m}
                        </span>
                      ))}
                    </div>
                    {project.status !== "SUCCEEDED" && (
                      <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        project.status === "PROCESSING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {project.status === "PROCESSING" ? "处理中" : "失败"}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-toy-text mb-1 truncate">{project.originalFilename}</h3>
                  <p className="text-xs text-toy-secondary mb-4 line-clamp-2">{project.directionValue}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-toy-secondary">最后编辑：{formatRelativeTime(project.updatedAt)}</span>
                    <div className="flex gap-2">
                      <Link to={`/project/${project.requestId}`} className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors no-underline">
                        查看详情
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* New Project CTA */}
              <Link
                to="/workflow/step1"
                className="border-2 border-dashed border-primary/20 rounded-2xl flex flex-col items-center justify-center p-6 text-center hover:border-primary/50 hover:bg-white/30 transition-all cursor-pointer group no-underline"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-plus text-2xl" />
                </div>
                <h3 className="font-bold text-toy-text mb-1">开始新项目</h3>
                <p className="text-xs text-toy-secondary">利用 AI 快速从市场灵感<br />转化为可落地的设计方案</p>
              </Link>
            </div>
          </section>

          {/* Dynamic Sections */}
          <div className="space-y-8">
            {showMarket && (
              <section className="animate-fade-in-up">
                <div className="glass-card p-8 rounded-3xl">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-toy-text">全球市场情报</h2>
                      <p className="text-sm text-toy-secondary">实时分析文化趋势与消费偏好</p>
                    </div>
                    <button onClick={() => setShowMarket(false)} className="text-toy-secondary hover:text-red-500 p-2">
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="p-5 bg-white/50 rounded-2xl border border-white">
                        <h3 className="font-bold text-sm mb-4">区域热度分析</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-bold">日本 (东南亚)</span>
                              <span className="text-primary font-bold">92% 匹配您的工厂</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary w-[92%]" /></div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-bold">美国 (北美)</span>
                              <span className="text-accent-blue font-bold">78% 匹配您的工厂</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-accent-blue w-[78%]" /></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                      <h3 className="font-bold text-primary mb-3">AI 策略专家</h3>
                      <p className="text-xs leading-relaxed text-toy-secondary mb-4">
                        检测到您的工厂在"双层毛绒填充"工艺上有优势，日本目前的"冬日暖愈"系列急需此类产能，建议优先生成相关方案。
                      </p>
                      <button className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20">查看详细研报</button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {showCalc && (
              <section className="animate-fade-in-up">
                <div className="glass-card p-8 rounded-3xl">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-toy-text">智能成本测算</h2>
                      <p className="text-sm text-toy-secondary">精确到每道工艺的出海成本预估</p>
                    </div>
                    <button onClick={() => setShowCalc(false)} className="text-toy-secondary hover:text-red-500 p-2">
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-toy-secondary mb-2 uppercase tracking-wider">目标数量</label>
                        <input type="range" min="100" max="10000" step="100" defaultValue="5000" className="w-full accent-primary" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-toy-secondary mb-2 uppercase tracking-wider">材质等级</label>
                        <select className="w-full bg-white/50 border-gray-100 rounded-xl text-sm focus:ring-primary focus:border-primary">
                          <option>环保A级毛绒 (推荐)</option>
                          <option>标准B级毛绒</option>
                        </select>
                      </div>
                    </div>
                    <div className="p-6 bg-primary-soft rounded-2xl border border-primary/10 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-medium text-toy-secondary mb-1">预计单只成本 (FOB)</p>
                        <p className="text-4xl font-bold text-primary">¥ 12.80</p>
                      </div>
                      <div className="pt-4 border-t border-primary/10 mt-4">
                        <p className="text-[10px] text-toy-secondary leading-tight">基于您的工厂档案和当前原材料市场价自动计算。包含15% 智能优化空间。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
