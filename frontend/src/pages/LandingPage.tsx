import { useState, type JSX } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "../shared/ui/AppHeader";

export function LandingPage(): JSX.Element {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="bg-surface overflow-x-hidden">
      <AppHeader variant="transparent" />

      {/* Hero */}
      <main className="relative mesh-gradient-hero min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6 overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8 tracking-tight">
            让世界文化{" "}
            <span className="text-primary block mt-2">变成可生产的玩具</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: "0.8s" }}>
            ToyBridge AI — 将文化洞察、AI 设计与工艺可行性结合，帮助工厂快速生成可落地的设计方案与报价。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-20 opacity-0 animate-fade-in-up" style={{ animationDelay: "1s" }}>
            <Link
              to="/workflow/step1"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 no-underline text-center"
            >
              立即开始创作
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto px-8 py-4 bg-white/50 backdrop-blur-sm border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-white transition-all"
            >
              <i className="fas fa-play-circle mr-2 text-primary" /> 观看视频演示
            </button>
          </div>

          {/* Parallax card */}
          <div className="relative max-w-5xl mx-auto px-4 mt-12 opacity-0 animate-fade-in-up" style={{ animationDelay: "1.2s" }}>
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20 animate-float">
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group overflow-hidden">
                <div className="relative z-10 text-center p-8">
                  <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl text-primary animate-pulse">
                    <i className="fas fa-magic text-3xl" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-800">智能文化适配引擎</h4>
                  <p className="text-gray-500 mt-2">实时解析区域性文化符号，自动转化为 3D 设计雏形</p>
                </div>
                <div className="absolute top-6 left-6 bg-white/80 backdrop-blur px-4 py-2 rounded-lg shadow-sm border border-white/50 flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Live Analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Value Propositions */}
      <section className="py-32 bg-white relative" id="features">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">重新定义玩具出海的设计流程</h2>
            <p className="text-gray-500 text-lg">通过 AI 深度学习当地文化基因，为传统玩具工厂注入全球竞争力。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: "fa-globe-asia", color: "primary", title: "文化驱动的设计", desc: "深度抓取目标市场的流行元素、节庆 IP 与色彩禁忌，为设计提供具备科学依据的文化参考。" },
              { icon: "fa-tools", color: "accent-blue", title: "工艺先行方案", desc: "内置主流玩具生产工艺库，在生成设计的同时自动校验物理可行性，减少返工成本。" },
              { icon: "fa-box-open", color: "accent-gold", title: "一体化设计包", desc: "一键导出包含 AI 效果图、工艺说明、初步成本测算及包装方案的完整设计包。" },
            ].map((card) => (
              <div key={card.title} className="group p-8 rounded-3xl bg-surface border border-transparent hover:border-primary/20 hover:bg-white transition-all duration-500 hover:shadow-2xl">
                <div className={`w-16 h-16 rounded-2xl bg-${card.color}/10 flex items-center justify-center text-${card.color} mb-8 group-hover:scale-110 transition-transform`}>
                  <i className={`fas ${card.icon} text-2xl`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{card.title}</h3>
                <p className="text-gray-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-24 bg-surface/50 border-y border-gray-100">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-12 md:space-y-0 relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-8" />
              {[
                { num: "1", title: "选择市场", desc: "选择目标国家，AI 自动生成该区域的文化画像与审美偏好趋势。" },
                { num: "2", title: "校验工艺", desc: "上传您的现有产品或灵感，AI 将根据您的工厂能力调整结构细节。" },
                { num: "3", title: "生成方案", desc: "获取多套可落地的效果图与详细的成本预估报告，支持一键导出。" },
              ].map((step) => (
                <div key={step.num} className="flex flex-col items-center text-center max-w-xs group">
                  <div className="w-16 h-16 rounded-full bg-white border-4 border-primary text-primary font-bold text-xl flex items-center justify-center mb-6 shadow-xl group-hover:bg-primary group-hover:text-white transition-all">
                    {step.num}
                  </div>
                  <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                  <p className="text-gray-500 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-32 bg-white" id="cases">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-20">助力 500+ 工厂走向世界</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24 opacity-60">
            {["GLOBAL TOYS", "FABRICA CO.", "NEXTGEN IP", "KIDS WORLD"].map((name) => (
              <div key={name} className="flex items-center justify-center p-6 bg-gray-50 rounded-xl grayscale hover:grayscale-0 transition-all cursor-pointer">
                <span className="font-black text-gray-400 text-2xl tracking-tighter">{name}</span>
              </div>
            ))}
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-primary/5 rounded-[40px] p-8 md:p-16 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                <div className="w-full md:w-1/3">
                  <div className="aspect-square bg-gray-200 rounded-3xl overflow-hidden shadow-2xl rotate-3 flex items-center justify-center">
                    <i className="fas fa-image text-6xl text-gray-300" />
                  </div>
                </div>
                <div className="w-full md:w-2/3">
                  <div className="flex items-center space-x-1 text-yellow-500 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => <i key={i} className="fas fa-star" />)}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">日本毛绒市场出海案例</h3>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8 italic">
                    "ToyBridge AI 帮助我们在进入日本市场时，精准识别了当地人对'治愈系'色彩的偏好。相比传统调研，我们的研发周期缩短了 70%，成本优化了 12%。"
                  </p>
                  <div>
                    <p className="font-bold text-gray-900">张伟</p>
                    <p className="text-primary text-sm font-semibold uppercase tracking-widest">某出口型玩具厂研发总监</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="bg-primary rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-8">准备好让您的玩具走向全球了吗？</h2>
              <p className="text-white/80 text-xl mb-12">立即加入先行计划，获取免费的文化分析报告与 AI 方案生成额度。</p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Link to="/workflow/step1" className="px-10 py-5 bg-white text-primary font-bold rounded-2xl hover:bg-surface transition-all transform hover:scale-105 shadow-xl no-underline">
                  免费试用 7 天
                </Link>
                <button className="px-10 py-5 bg-transparent border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">
                  预约 1对1 演示
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mesh-gradient-footer text-white py-20 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold">
                  <span className="text-xl">T</span>
                </div>
                <span className="text-2xl font-bold">ToyBridge AI</span>
              </div>
              <p className="text-gray-400 max-w-sm leading-relaxed mb-8">
                作为全球领先的玩具产业 AI 智库，我们致力于通过技术手段消除文化壁垒，让每一件玩具都能找到属于它的孩子。
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-8 uppercase tracking-widest text-primary">产品</h4>
              <ul className="space-y-4 text-gray-400">
                <li><span className="hover:text-white transition-colors cursor-pointer">文化数据库</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">AI 实验室</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">工艺校验</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-8 uppercase tracking-widest text-primary">公司</h4>
              <ul className="space-y-4 text-gray-400">
                <li><span className="hover:text-white transition-colors cursor-pointer">关于我们</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">新闻动态</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">隐私政策</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>&copy; 2026 ToyBridge AI. 保留所有权利。</p>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100]" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[2rem] max-w-4xl w-full mx-4 overflow-hidden relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 transition-all z-10">
              <i className="fas fa-times" />
            </button>
            <div className="p-8 md:p-12">
              <h3 className="text-2xl font-bold mb-6">了解 ToyBridge AI 如何工作</h3>
              <div className="aspect-video bg-gray-900 rounded-2xl flex items-center justify-center relative cursor-pointer">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl animate-pulse">
                  <i className="fas fa-play" />
                </div>
                <span className="absolute bottom-6 text-white/50 text-sm">点击预览视频功能 (演示环境)</span>
              </div>
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { val: "120ms", label: "分析速度" },
                  { val: "15+", label: "支持市场" },
                  { val: "98%", label: "校验准确率" },
                  { val: "7d", label: "平均交付周期" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold text-primary">{stat.val}</p>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
