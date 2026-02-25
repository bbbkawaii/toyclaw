import { useState, useCallback, type JSX, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkflowStore } from "../../store/workflow-store";
import { postImageAnalyze } from "../../shared/api/toyclaw";
import type { DirectionPreset } from "../../shared/types/api";
import { NavigationFooter } from "../../shared/ui/NavigationFooter";

const DIRECTION_OPTIONS: { key: DirectionPreset; icon: string; title: string; desc: string; detail: string[] }[] = [
  {
    key: "CHANGE_COLOR",
    icon: "fa-palette",
    title: "换个色号",
    desc: "最省钱 - 模具一点不动，换个颜色就是新品。工厂仅需调整色粉方案。",
    detail: ["模具不变，仅调整色粉/喷漆方案", "改造成本极低，适合快速迭代"],
  },
  {
    key: "SEASONAL_THEME",
    icon: "fa-rocket",
    title: "蹭个节日",
    desc: "清库存神器 - 形状不动，印个节日图案就是限定款。",
    detail: ["修改移印菲林或更换贴纸内容", "自动根据目标市场生成节日效果"],
  },
  {
    key: "ADD_ACCESSORY",
    icon: "fa-gift",
    title: "加个小配件",
    desc: "稍微花点小钱 - 主体不动，加个道具/小布片就是新故事。",
    detail: ["采购现成配件或低成本注塑小件", "增加产品溢价能力与故事性"],
  },
];

export function Step1UploadPage(): JSX.Element {
  const navigate = useNavigate();
  const { setImageResult, setStep } = useWorkflowStore();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<DirectionPreset | null>(null);
  const [directionText, setDirectionText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  }, [handleFile]);

  const handleSubmit = async () => {
    if (!file) {
      setError("请先上传一张玩具图片喵~");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await postImageAnalyze({
        image: file,
        directionPreset: selectedPreset ?? undefined,
        directionText: directionText.trim() || undefined,
      });
      setImageResult(result);
      setStep("step2");
      navigate("/workflow/step2");
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
          Step 1: 上传玩具 & 选择方向
        </h1>
        <p className="text-lg text-toy-secondary max-w-2xl mx-auto leading-relaxed">
          上传您的玩具图片，AI 将分析其特征，并根据您选择的改款方向为后续步骤做准备。
        </p>
      </div>

      <div className="space-y-8 animate-fade-in-up stagger-2">
        {/* Upload Area */}
        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-lg font-bold mb-6 flex items-center">
            <span className="w-1.5 h-6 bg-primary rounded-full mr-3" />
            上传玩具图片
          </h2>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("fileInput")?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-primary bg-primary/5"
                : preview
                  ? "border-primary/30 bg-primary/5"
                  : "border-black/10 hover:border-primary/30 hover:bg-white/50"
            }`}
          >
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            {preview ? (
              <div className="flex flex-col items-center">
                <img src={preview} alt="Preview" className="max-h-48 rounded-xl shadow-lg mb-4 object-contain" />
                <p className="text-sm text-primary font-bold">{file?.name}</p>
                <p className="text-xs text-toy-secondary mt-1">点击重新选择</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <i className="fas fa-cloud-upload-alt text-3xl" />
                </div>
                <p className="font-bold text-toy-text mb-1">拖拽图片至此处，或点击选择文件</p>
                <p className="text-xs text-toy-secondary">支持 JPG、PNG、WebP 格式</p>
              </div>
            )}
          </div>
        </div>

        {/* Direction Preset Selection */}
        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-lg font-bold mb-6 flex items-center">
            <span className="w-1.5 h-6 bg-primary rounded-full mr-3" />
            选择一个设计方向（可选）
          </h2>
          <div className="space-y-4">
            {DIRECTION_OPTIONS.map((opt) => {
              const selected = selectedPreset === opt.key;
              return (
                <div
                  key={opt.key}
                  onClick={() => setSelectedPreset(selected ? null : opt.key)}
                  className={`glass-card rounded-2xl p-6 border cursor-pointer transition-all ${
                    selected
                      ? "border-primary bg-primary-light/40 shadow-[0_0_0_2px_rgba(111,143,122,0.2)]"
                      : "border-transparent hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mr-5 shrink-0">
                      <i className={`fas ${opt.icon} text-xl`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-toy-text mb-1">{opt.title}</h3>
                      <p className="text-toy-secondary text-sm leading-relaxed">{opt.desc}</p>
                      {selected && (
                        <div className="mt-4 pt-4 border-t border-black/5">
                          <ul className="space-y-2 text-sm text-toy-secondary">
                            {opt.detail.map((d) => (
                              <li key={d} className="flex items-center">
                                <i className="fa-solid fa-circle-check text-primary mr-2 text-[10px]" />
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Free-text Direction */}
        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-lg font-bold mb-6 flex items-center">
            <i className="fa-solid fa-pen-fancy text-primary mr-3" />
            自由描述（可选）
          </h2>
          <textarea
            value={directionText}
            onChange={(e) => setDirectionText(e.target.value)}
            placeholder="例如：希望增加圣诞主题元素，使用红绿配色..."
            rows={3}
            className="w-full bg-white/50 border-black/5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary py-4 px-5 resize-none text-sm"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center">
            <i className="fas fa-exclamation-circle mr-2" />
            {error}
          </div>
        )}
      </div>

      <NavigationFooter
        onBack={() => navigate("/dashboard")}
        backLabel="取消并返回仪表盘"
        onNext={handleSubmit}
        nextLabel="下一步：选择目标市场"
        nextDisabled={!file}
        nextLoading={loading}
      />
    </>
  );
}
