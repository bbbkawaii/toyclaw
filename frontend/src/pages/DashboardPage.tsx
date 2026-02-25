import { useState, type JSX } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "../shared/ui/AppHeader";
import { MobileBottomNav } from "../shared/ui/MobileBottomNav";

export function DashboardPage(): JSX.Element {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMarket, setShowMarket] = useState(false);
  const [showCalc, setShowCalc] = useState(false);

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
            <h1 className="text-3xl md:text-4xl font-bold text-toy-text mb-2">欢迎回来，John！</h1>
            <p className="text-toy-secondary animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
              今天我们为您筛选了 3 个具有潜力的出海设计方向。
            </p>
          </section>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: "fa-rocket", color: "primary", label: "活跃设计方案", value: "12", pct: "65%" },
              { icon: "fa-globe", color: "accent-blue", label: "覆盖目标市场", value: "8", pct: "40%" },
              { icon: "fa-check-double", color: "accent-gold", label: "工艺校验通过率", value: "94.2%", pct: "94%" },
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
              <button className="text-primary text-sm font-bold hover:underline">
                查看所有项目 <i className="fa-solid fa-arrow-right ml-1" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Project Card 1 */}
              <div className="glass-card group p-5 rounded-2xl hover:-translate-y-2 transition-all duration-300">
                <div className="relative rounded-xl overflow-hidden mb-4 aspect-[4/3] bg-primary-soft flex items-center justify-center">
                  <i className="fas fa-teddy-bear text-6xl text-primary/20" />
                  <div className="absolute top-3 left-3 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-[10px] font-bold text-primary">
                    日本市场 · 毛绒
                  </div>
                </div>
                <h3 className="font-bold text-toy-text mb-1">JP_Sakura_Koala_V2</h3>
                <p className="text-xs text-toy-secondary mb-4">基于日本樱花季文化洞察生成的治愈系考拉方案。</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-toy-secondary">最后编辑：2小时前</span>
                  <div className="flex gap-2">
                    <Link to="/project/mock-1" className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors no-underline">
                      继续设计
                    </Link>
                  </div>
                </div>
              </div>

              {/* Project Card 2 */}
              <div className="glass-card group p-5 rounded-2xl hover:-translate-y-2 transition-all duration-300">
                <div className="relative rounded-xl overflow-hidden mb-4 aspect-[4/3] bg-accent-blue/5 flex items-center justify-center">
                  <i className="fas fa-robot text-6xl text-accent-blue/20" />
                  <div className="absolute top-3 left-3 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-[10px] font-bold text-accent-blue">
                    美国市场 · PVC
                  </div>
                </div>
                <h3 className="font-bold text-toy-text mb-1">US_Cyber_Mecha_Toy</h3>
                <p className="text-xs text-toy-secondary mb-4">面向北美青少年的赛博朋克风格可动机甲玩具。</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-toy-secondary">最后编辑：1天前</span>
                  <div className="flex gap-2">
                    <Link to="/project/mock-2" className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors no-underline">
                      继续设计
                    </Link>
                  </div>
                </div>
              </div>

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
