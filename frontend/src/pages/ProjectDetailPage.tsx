import { useState, type JSX } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "../shared/ui/AppHeader";

type TabId = "overview" | "designs" | "marketing" | "production" | "timeline";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "项目概览" },
  { id: "designs", label: "设计方案" },
  { id: "marketing", label: "市场洞察" },
  { id: "production", label: "生产工艺" },
  { id: "timeline", label: "时间线" },
];

export function ProjectDetailPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="mesh-gradient min-h-screen">
      <AppHeader variant="glass" />

      <main className="pt-32 pb-20 container mx-auto px-6">
        {/* Project Header */}
        <section className="mb-8 animate-fade-in-up">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">进行中 75%</span>
                <span className="text-gray-400 text-sm">项目编号: PRJ-2023-089</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900">益智拼装系列：文化全球化改款</h1>
              <p className="text-gray-500 mt-2 text-lg">融合当地文化符号的环保ABS拼装玩具设计项目</p>
            </div>
            <div className="flex space-x-3">
              <button className="px-6 py-3 border border-gray-200 bg-white/50 rounded-xl text-gray-700 font-semibold hover:bg-white transition-all shadow-sm">
                <i className="fas fa-share-nodes mr-2" /> 分享
              </button>
              <button className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-md hover:shadow-lg">
                <i className="fas fa-wand-magic-sparkles mr-2" /> 优化设计
              </button>
            </div>
          </div>
        </section>

        {/* Summary Card */}
        <div className="glass-card rounded-[2rem] p-8 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { label: "设计阶段", value: "概念验证 (V3.0)" },
              { label: "主打材质", value: "环保再生ABS" },
              { label: "目标市场", value: "美国 / 英国 / 泰国" },
              { label: "预计量产", value: "2026年6月" },
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
              {/* 3D Preview Placeholder */}
              <div className="glass-card rounded-[2.5rem] overflow-hidden relative aspect-video group">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white/20" />
                <div className="absolute inset-0 flex items-center justify-center flex-col text-center p-12">
                  <div className="w-48 h-48 bg-white/80 rounded-full flex items-center justify-center shadow-2xl mb-6 animate-pulse">
                    <i className="fas fa-paw text-6xl text-primary/40" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">3D 原型渲染预览</h3>
                  <p className="text-gray-500 mt-2">正在实时渲染中：澳大利亚文化系列 - 树袋熊益智拼装件</p>
                </div>
                <div className="absolute bottom-6 left-6 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Renderer V2</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sustainability */}
                <div className="glass-card rounded-3xl p-6">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                    <i className="fas fa-leaf text-primary mr-2" /> 可持续性指标
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">再生材料占比</span>
                      <span className="font-bold text-primary">85%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: "85%" }} />
                    </div>
                    <p className="text-xs text-gray-400">已通过 GRS 全球回收标准初步认证评估</p>
                  </div>
                </div>

                {/* Compliance */}
                <div className="glass-card rounded-3xl p-6">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                    <i className="fas fa-shield-halved text-accent-blue mr-2" /> 合规性检测
                  </h4>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center text-gray-600">
                      <i className="fas fa-check-circle text-green-500 mr-2" /> ASTM F963 (US) - 通过
                    </li>
                    <li className="flex items-center text-gray-600">
                      <i className="fas fa-check-circle text-green-500 mr-2" /> EN71 (EU) - 通过
                    </li>
                    <li className="flex items-center text-gray-600">
                      <i className="fas fa-clock text-yellow-500 mr-2" /> TISI (TH) - 审核中
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sidebar - AI Suggestions */}
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-gray-800 px-2">AI 改款建议简报</h4>
              {[
                { icon: "fa-flag-usa", iconColor: "text-blue-500", borderColor: "border-blue-400", market: "美国市场", desc: "建议增加 STEM 模块与极简莫兰迪色系包装，强调教育逻辑价值。", tag: "建议：配色优化", tagBg: "bg-blue-50", tagColor: "text-blue-600" },
                { icon: "fa-crown", iconColor: "text-emerald-500", borderColor: "border-emerald-400", market: "英国市场", desc: "结合复活节促销，增加皇家卫兵及伦敦地标联名包装预览。", tag: "建议：节日礼盒", tagBg: "bg-emerald-50", tagColor: "text-emerald-600" },
                { icon: "fa-sun", iconColor: "text-orange-500", borderColor: "border-orange-400", market: "泰国市场", desc: "建议使用高对比度明亮色（黄色/绿色），并添加本地语品牌故事说明。", tag: "建议：包装本土化", tagBg: "bg-orange-50", tagColor: "text-orange-600" },
              ].map((card) => (
                <div key={card.market} className={`glass-card rounded-3xl p-6 border-l-4 ${card.borderColor}`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <i className={`fas ${card.icon} ${card.iconColor}`} />
                    <span className="font-bold text-gray-800">{card.market}</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{card.desc}</p>
                  <span className={`px-2 py-1 ${card.tagBg} ${card.tagColor} text-[10px] font-bold rounded`}>{card.tag}</span>
                </div>
              ))}
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
              <button className="px-6 py-3 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-all">
                <i className="fas fa-file-pdf mr-2" /> 导出完整报告
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: "fa-palette", iconBg: "bg-blue-100", iconColor: "text-blue-600", title: "美国：极简教育风", items: ["颜色方案：增加中性色版本（灰、白、米色），符合现代家居审美。", "卖点强化：突出 STEM 标识，强调培养空间思维逻辑。"] },
                { icon: "fa-gift", iconBg: "bg-emerald-100", iconColor: "text-emerald-600", title: "英国：经典传承风", items: ["季节主题：匹配圣诞节/复活节配色，强调\"收藏价值\"。", "品牌背书：强调可持续认证及环保回收工艺。"] },
                { icon: "fa-language", iconBg: "bg-orange-100", iconColor: "text-orange-600", title: "泰国：高彩活力风", items: ["包装色彩：使用芒果黄、椰子绿等热带色系。", "本地化：适配泰语说明书，添加当地吉祥物联名形象。"] },
              ].map((card) => (
                <div key={card.title} className="p-8 bg-surface/50 rounded-3xl border border-white hover:shadow-xl transition-all group">
                  <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center ${card.iconColor} mb-6 group-hover:scale-110 transition-transform`}>
                    <i className={`fas ${card.icon} text-xl`} />
                  </div>
                  <h4 className="text-xl font-bold mb-4">{card.title}</h4>
                  <ul className="space-y-4">
                    {card.items.map((item) => (
                      <li key={item} className="text-sm text-gray-600 flex items-start">
                        <i className="fas fa-check text-primary mt-1 mr-3" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="animate-slide-up glass-card rounded-[2.5rem] p-10">
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-12">
                {[
                  { date: "2025-10-15 (已完成)", title: "概念设计与 AI 文化基准对标", desc: "完成了对北美与东南亚市场的文化符号库对标，确定了树袋熊主形象。", active: true },
                  { date: "2025-11-02 (进行中)", title: "3D 模型参数化与模具校验", desc: "正在进行注塑工艺可行性分析，确保 0.8mm 的精细纹理可生产。", active: true },
                  { date: "2025-11-20 (待启动)", title: "打样与市场测试报告", desc: "发送首批 3D 打印原型至英国分销商进行陈列反馈测试。", active: false },
                ].map((item) => (
                  <div key={item.title} className={`relative pl-20 group ${!item.active ? "opacity-50" : ""}`}>
                    <div className={`absolute left-6 w-5 h-5 rounded-full border-4 border-white shadow-md z-10 group-hover:scale-125 transition-transform ${item.active ? "bg-primary" : "bg-gray-300"}`} />
                    <div className="bg-white/40 p-6 rounded-2xl border border-white/50">
                      <p className={`text-xs font-black uppercase tracking-widest mb-1 ${item.active ? "text-primary" : "text-gray-400"}`}>{item.date}</p>
                      <h5 className="text-lg font-bold text-gray-800">{item.title}</h5>
                      <p className="text-gray-500 mt-2">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "designs" && (
          <div className="animate-slide-up text-center py-20 glass-card rounded-[2.5rem]">
            <i className="fas fa-images text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500">设计方案库加载中...</p>
          </div>
        )}

        {activeTab === "production" && (
          <div className="animate-slide-up text-center py-20 glass-card rounded-[2.5rem]">
            <i className="fas fa-industry text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500">工厂工艺校验模块加载中...</p>
          </div>
        )}

        {/* Action Footer */}
        <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <Link to="/dashboard" className="text-gray-500 font-bold hover:text-primary transition-colors no-underline">
            <i className="fas fa-arrow-left-long mr-2" /> 返回项目列表
          </Link>
          <div className="flex space-x-4">
            <button className="px-8 py-4 glass-card rounded-2xl font-bold text-gray-700 hover:bg-white transition-all">
              <i className="fas fa-cloud-arrow-down mr-2 text-primary" /> 导出完整设计包
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
