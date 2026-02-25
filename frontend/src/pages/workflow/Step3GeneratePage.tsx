import { useState, useEffect, useCallback, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkflowStore } from "../../store/workflow-store";
import {
  postRedesignSuggest,
  postRedesignRetryAsset,
  postComplianceAssess,
  getCapabilities,
} from "../../shared/api/toyclaw";
import type { RetryableRedesignAssetKey } from "../../shared/types/api";
import { NavigationFooter } from "../../shared/ui/NavigationFooter";

const LOADING_STEPS = [
  { title: "解析文化元素...", desc: "正在提取目标市场传统纹样与色彩倾向", progress: 30 },
  { title: "材质纹理渲染...", desc: "应用仿真材质与纹理模型", progress: 65 },
  { title: "工艺可行性校验...", desc: "检查工艺参数与生产可行性", progress: 90 },
  { title: "设计已完成！", desc: "正在准备高清预览模型", progress: 100 },
];

export function Step3GeneratePage(): JSX.Element {
  const navigate = useNavigate();
  const {
    requestId,
    analysisId,
    suggestionId,
    targetMarket,
    redesignResult,
    crossCulturalResult,
    complianceResult,
    complianceAvailable,
    setRedesignResult,
    setComplianceResult,
    setComplianceAvailable,
  } = useWorkflowStore();

  const [showLoading, setShowLoading] = useState(!redesignResult);
  const [loadingStep, setLoadingStep] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [retryingAsset, setRetryingAsset] = useState<string | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check capabilities
  useEffect(() => {
    getCapabilities().then((caps) => setComplianceAvailable(caps.compliance));
  }, [setComplianceAvailable]);

  // Loading animation
  useEffect(() => {
    if (!showLoading) return;
    let step = 0;
    const interval = setInterval(() => {
      if (step < LOADING_STEPS.length) {
        setLoadingStep(step);
        step++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowLoading(false), 800);
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [showLoading]);

  const handleRegenerate = useCallback(async () => {
    if (!requestId || !analysisId) return;
    setRegenerating(true);
    setError(null);
    try {
      const result = await postRedesignSuggest({
        requestId,
        crossCulturalAnalysisId: analysisId,
        assets: { previewImage: true, threeView: true },
      });
      setRedesignResult(result);
      setShowLoading(true);
      setLoadingStep(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "重新生成失败");
    } finally {
      setRegenerating(false);
    }
  }, [requestId, analysisId, setRedesignResult]);

  const handleRetryAsset = useCallback(async (asset: RetryableRedesignAssetKey) => {
    if (!suggestionId) return;
    setRetryingAsset(asset);
    try {
      const result = await postRedesignRetryAsset({ suggestionId, asset });
      setRedesignResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "重试失败");
    } finally {
      setRetryingAsset(null);
    }
  }, [suggestionId, setRedesignResult]);

  const handleCompliance = useCallback(async () => {
    if (!requestId || !targetMarket) return;
    setComplianceLoading(true);
    try {
      const result = await postComplianceAssess({ requestId, targetMarket });
      setComplianceResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "合规检测失败");
    } finally {
      setComplianceLoading(false);
    }
  }, [requestId, targetMarket, setComplianceResult]);

  const previewSrc = redesignResult?.assets.previewImage.imageBase64
    ? `data:${redesignResult.assets.previewImage.mimeType || "image/png"};base64,${redesignResult.assets.previewImage.imageBase64}`
    : null;

  const threeViewImages = redesignResult
    ? [
        { key: "threeView.front" as RetryableRedesignAssetKey, label: "正面", asset: redesignResult.assets.threeView.front },
        { key: "threeView.side" as RetryableRedesignAssetKey, label: "侧面", asset: redesignResult.assets.threeView.side },
        { key: "threeView.back" as RetryableRedesignAssetKey, label: "背面", asset: redesignResult.assets.threeView.back },
      ]
    : [];

  return (
    <>
      <div className="text-center mb-12 animate-fade-in-up stagger-1">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Step 3: 生成设计 & 确认
        </h1>
        <p className="text-lg text-toy-secondary max-w-2xl mx-auto leading-relaxed">
          AI 正在为您解析目标市场文化基因，打造具有竞争力的玩具设计方案。
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Preview */}
        <div className="lg:col-span-7 space-y-6 animate-fade-in-up stagger-2">
          <div className="glass-card rounded-4xl p-8 min-h-[460px] relative flex flex-col items-center justify-center overflow-hidden border-primary/10">
            {/* Loading Overlay */}
            {showLoading && (
              <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center transition-opacity duration-500">
                <div className="relative mb-8">
                  <div className="w-24 h-24 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <i className="fas fa-wand-magic-sparkles text-2xl text-primary animate-pulse-soft" />
                  </div>
                </div>
                <div className="text-center space-y-3 px-12 w-full max-w-sm">
                  <h3 className="text-xl font-bold text-gray-900">
                    {LOADING_STEPS[loadingStep]?.title ?? "加载中..."}
                  </h3>
                  <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${LOADING_STEPS[loadingStep]?.progress ?? 0}%` }}
                    />
                  </div>
                  <p className="text-sm text-toy-secondary">
                    {LOADING_STEPS[loadingStep]?.desc ?? ""}
                  </p>
                </div>
              </div>
            )}

            {/* Result Content */}
            {!showLoading && redesignResult && (
              <div className="w-full flex flex-col items-center animate-fade-in-up">
                {previewSrc ? (
                  <div className="relative w-full max-w-xs aspect-square mb-8 group">
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-90 opacity-40" />
                    <img
                      src={previewSrc}
                      alt="Design Preview"
                      className="relative z-10 w-full h-full object-contain drop-shadow-2xl animate-float"
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-xs aspect-square mb-8 flex items-center justify-center bg-gray-50 rounded-3xl">
                    <div className="text-center text-gray-400">
                      <i className="fas fa-image text-4xl mb-2" />
                      <p className="text-sm">预览图生成中...</p>
                      <button
                        onClick={() => handleRetryAsset("previewImage")}
                        disabled={retryingAsset === "previewImage"}
                        className="mt-2 text-xs text-primary hover:underline"
                      >
                        {retryingAsset === "previewImage" ? "重试中..." : "点击重试"}
                      </button>
                    </div>
                  </div>
                )}
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
                    <span>AI 精准生成完成</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {!showLoading && redesignResult && (
            <div className="grid grid-cols-4 gap-4">
              {previewSrc && (
                <div className="aspect-square glass-card rounded-2xl p-3 border-2 border-primary shadow-lg bg-white">
                  <img src={previewSrc} alt="Main" className="w-full h-full object-contain" />
                </div>
              )}
              {threeViewImages.map((tv) => {
                const src = tv.asset.imageBase64
                  ? `data:${tv.asset.mimeType || "image/png"};base64,${tv.asset.imageBase64}`
                  : null;
                return (
                  <div
                    key={tv.key}
                    className="aspect-square glass-card rounded-2xl p-3 border border-black/5 flex items-center justify-center cursor-pointer hover:bg-white transition-all"
                  >
                    {src ? (
                      <img src={src} alt={tv.label} className="w-full h-full object-contain" />
                    ) : (
                      <button
                        onClick={() => handleRetryAsset(tv.key)}
                        disabled={retryingAsset === tv.key}
                        className="text-gray-400 hover:text-primary transition-colors text-center"
                      >
                        {retryingAsset === tv.key ? (
                          <i className="fas fa-spinner fa-spin" />
                        ) : (
                          <>
                            <i className="fas fa-plus" />
                            <p className="text-[10px] mt-1">{tv.label}</p>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Color Schemes */}
          {!showLoading && redesignResult && redesignResult.colorSchemes.length > 0 && (
            <div className="glass-card rounded-3xl p-6 border-primary/10">
              <h4 className="text-sm font-bold mb-4 flex items-center">
                <span className="w-1.5 h-4 bg-primary rounded-full mr-2" />
                配色方案
              </h4>
              <div className="space-y-4">
                {redesignResult.colorSchemes.map((scheme) => (
                  <div key={scheme.schemeName} className="p-4 bg-white/50 rounded-2xl border border-white">
                    <p className="text-sm font-bold mb-2">{scheme.schemeName} — {scheme.positioning}</p>
                    <div className="flex gap-2 mb-2">
                      {scheme.colors.map((c) => (
                        <div key={c.hex} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full border border-black/10" style={{ background: c.hex }} />
                          <span className="text-xs text-toy-secondary">{c.name}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-toy-secondary">{scheme.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shape Adjustments */}
          {!showLoading && redesignResult && redesignResult.shapeAdjustments.length > 0 && (
            <div className="glass-card rounded-3xl p-6 border-primary/10">
              <h4 className="text-sm font-bold mb-4 flex items-center">
                <span className="w-1.5 h-4 bg-primary rounded-full mr-2" />
                造型调整建议
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {redesignResult.shapeAdjustments.map((adj) => (
                  <div key={adj.title} className="flex items-start space-x-3 p-4 bg-white/50 rounded-2xl border border-white">
                    <i className={`fas fa-exclamation-triangle mt-1 ${
                      adj.priority === "HIGH" ? "text-orange-500" : adj.priority === "MEDIUM" ? "text-yellow-500" : "text-blue-500"
                    }`} />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{adj.title}</p>
                      <p className="text-xs text-toy-secondary">{adj.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-5 space-y-6 animate-fade-in-up stagger-3">
          {/* Design Parameters */}
          <div className="glass-card rounded-3xl p-6 border-primary/10">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">设计方案详情</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-black/5">
                <span className="text-sm text-toy-secondary">目标市场</span>
                <span className="text-sm font-bold">{targetMarket ?? "—"}</span>
              </div>
              {crossCulturalResult && (
                <div className="flex justify-between items-center py-2 border-b border-black/5">
                  <span className="text-sm text-toy-secondary">文化分析摘要</span>
                  <span className="text-sm font-bold truncate max-w-[200px]">{crossCulturalResult.summary.slice(0, 30)}...</span>
                </div>
              )}
            </div>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="w-full mt-6 py-3 bg-primary/10 text-primary font-bold rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {regenerating ? (
                <i className="fas fa-spinner fa-spin" />
              ) : (
                <>
                  <i className="fas fa-sync-alt" />
                  <span>重新生成设计</span>
                </>
              )}
            </button>
          </div>

          {/* Packaging Suggestions */}
          {!showLoading && redesignResult && redesignResult.packagingSuggestions.length > 0 && (
            <div className="glass-card rounded-3xl p-6 border-primary/10">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">包装建议</h4>
              {redesignResult.packagingSuggestions.map((pkg) => (
                <div key={pkg.styleName} className="mb-4 last:mb-0">
                  <p className="text-sm font-bold mb-1">{pkg.styleName}</p>
                  <p className="text-xs text-toy-secondary mb-2">{pkg.reason}</p>
                  <div className="flex flex-wrap gap-1">
                    {pkg.materials.map((m) => (
                      <span key={m} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Compliance */}
          {complianceAvailable && !showLoading && (
            <div className="glass-card rounded-3xl p-6 border-primary/10">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">合规检测</h4>
              {complianceResult ? (
                <div className="space-y-3">
                  <p className="text-sm text-toy-secondary mb-3">{complianceResult.summary}</p>
                  {complianceResult.report.applicableStandards.map((std) => (
                    <div key={std.standardId} className="flex items-center text-sm text-gray-600">
                      <i className={`fas fa-${std.mandatory ? "check-circle text-green-500" : "info-circle text-blue-500"} mr-2`} />
                      {std.standardName}
                    </div>
                  ))}
                  {complianceResult.report.ageGrading && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-xl text-xs text-yellow-800">
                      <strong>年龄分级：</strong> {complianceResult.report.ageGrading.recommendedAge} — {complianceResult.report.ageGrading.reason}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleCompliance}
                  disabled={complianceLoading}
                  className="w-full py-3 bg-accent-blue/10 text-accent-blue font-bold rounded-2xl hover:bg-accent-blue hover:text-white transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {complianceLoading ? (
                    <i className="fas fa-spinner fa-spin" />
                  ) : (
                    <>
                      <i className="fas fa-shield-halved" />
                      <span>运行合规检测</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center mt-6 max-w-7xl mx-auto">
          <i className="fas fa-exclamation-circle mr-2" />
          {error}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <NavigationFooter
          onBack={() => navigate("/workflow/step2")}
          backLabel="上一步: 选择目标市场"
          extras={
            <div className="flex items-center space-x-4">
              <button className="px-6 py-3 glass-card rounded-2xl text-sm font-bold hover:bg-white transition-all">
                <i className="fas fa-download mr-2" /> 下载 PDF 报价单
              </button>
              <button className="px-6 py-3 glass-card rounded-2xl text-sm font-bold hover:bg-white transition-all">
                <i className="fas fa-share-alt mr-2" /> 共享预览
              </button>
            </div>
          }
        />
      </div>
    </>
  );
}
