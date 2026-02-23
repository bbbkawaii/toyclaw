import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ApiError, type ApiError as ApiErrorType, toApiError } from "../shared/api/errors";
import { postCrossCulturalAnalyze, postImageAnalyze, postRedesignSuggest } from "../shared/api/toyclaw";
import {
  toZhAssetPrompt,
  toZhAssetReason,
  toZhColorName,
  toZhColorUsage,
  toZhCompetitorArchetype,
  toZhCompetitorOpportunities,
  toZhCompetitorSummary,
  toZhCopyTone,
  toZhFeatureTerm,
  toZhFestivalElements,
  toZhFestivalName,
  toZhFestivalReason,
  toZhPackagingReason,
  toZhPackagingStyleName,
  toZhPackagingVisual,
  toZhSchemeName,
  toZhSchemeReason,
  toZhShapeAction,
  toZhShapeReason,
  toZhShapeTitle,
  toZhShowcaseScript,
  toZhTabooRecommendation,
  toZhTabooRisk,
  toZhTabooTitle,
  toZhText,
} from "../shared/i18n/content";
import { toImageAssetStatusLabel, toLevelLabel, toShowcaseVideoStatusLabel } from "../shared/i18n/labels";
import { DIRECTION_PRESETS, TARGET_MARKETS, type DirectionPreset, type ImageAssetResult, type TargetMarket } from "../shared/types/api";
import { InlineError } from "../shared/ui/InlineError";
import { LoadingPulse } from "../shared/ui/LoadingPulse";
import { SurfacePanel } from "../shared/ui/SurfacePanel";
import { useWorkflowStore } from "../store/workflow-store";
import commonStyles from "./PageCommon.module.css";
import styles from "./LinearWorkflowPage.module.css";

const STEP_SECTION_ID = {
  "image-input": "step-image-input",
  "cross-cultural": "step-cross-cultural",
  redesign: "step-redesign",
} as const;

const directionPresetLabels: Record<DirectionPreset, string> = {
  CHANGE_COLOR: "换个色号",
  SEASONAL_THEME: "蹭个节日",
  ADD_ACCESSORY: "加个小配件",
};

const marketLabels: Record<TargetMarket, string> = {
  US: "美国",
  EUROPE: "欧洲",
  MIDDLE_EAST: "中东",
  SOUTHEAST_ASIA: "东南亚",
  JAPAN_KOREA: "日韩",
};

const imageFormSchema = z
  .object({
    image: z.custom<FileList>((value) => value instanceof FileList && value.length > 0, {
      message: "请上传玩具图片",
    }),
    directionMode: z.enum(["TEXT", "PRESET"]),
    directionText: z.string().optional(),
    directionPreset: z.enum(DIRECTION_PRESETS).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.directionMode === "TEXT" && (!value.directionText || value.directionText.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["directionText"],
        message: "请输入改款方向建议",
      });
    }
    if (value.directionMode === "PRESET" && !value.directionPreset) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["directionPreset"],
        message: "请选择预设方向",
      });
    }
  });

const crossFormSchema = z.object({
  targetMarket: z.enum(TARGET_MARKETS),
});

type ImageFormValues = z.infer<typeof imageFormSchema>;
type CrossFormValues = z.infer<typeof crossFormSchema>;

function scrollToStep(stepId: string): void {
  const section = document.getElementById(stepId);
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function LinearWorkflowPage(): JSX.Element {
  const {
    requestId,
    analysisId,
    imageResult,
    crossCulturalResult,
    redesignResult,
    setStep,
    setImageResult,
    setCrossCulturalResult,
    setRedesignResult,
  } = useWorkflowStore();

  const [isSubmittingImage, setSubmittingImage] = useState(false);
  const [isSubmittingCross, setSubmittingCross] = useState(false);
  const [isGeneratingRedesign, setGeneratingRedesign] = useState(false);

  const [imageError, setImageError] = useState<ApiErrorType | null>(null);
  const [crossError, setCrossError] = useState<ApiErrorType | null>(null);
  const [redesignError, setRedesignError] = useState<ApiErrorType | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const autoTriggeredAnalysisIdRef = useRef<string | null>(null);

  const imageForm = useForm<ImageFormValues>({
    resolver: zodResolver(imageFormSchema),
    defaultValues: {
      directionMode: "PRESET",
      directionText: "",
      directionPreset: "CHANGE_COLOR",
    },
  });

  const crossForm = useForm<CrossFormValues>({
    resolver: zodResolver(crossFormSchema),
    defaultValues: {
      targetMarket: "US",
    },
  });

  const directionMode = imageForm.watch("directionMode");
  const fileList = imageForm.watch("image");

  useEffect(() => {
    if (!fileList || fileList.length === 0) {
      setPreviewUrl(null);
      return;
    }

    const file = fileList.item(0);
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [fileList]);

  useEffect(() => {
    if (!analysisId) {
      autoTriggeredAnalysisIdRef.current = null;
    }
  }, [analysisId]);

  const runRedesignGeneration = useCallback(async (): Promise<void> => {
    if (!requestId || !analysisId) {
      setRedesignError(
        new ApiError({
          message: "缺少请求编号或分析编号，请先完成前两个模块。",
          code: "MISSING_DEPENDENCY_ID",
        }),
      );
      return;
    }

    setGeneratingRedesign(true);
    setRedesignError(null);

    try {
      const response = await postRedesignSuggest({
        requestId,
        crossCulturalAnalysisId: analysisId,
        assets: {
          previewImage: true,
          threeView: true,
          showcaseVideo: true,
        },
      });
      setRedesignResult(response);
    } catch (rawError) {
      setRedesignError(toApiError(rawError));
    } finally {
      setGeneratingRedesign(false);
    }
  }, [analysisId, requestId, setRedesignResult]);

  useEffect(() => {
    if (!requestId || !analysisId) {
      return;
    }

    if (redesignResult?.crossCulturalAnalysisId === analysisId) {
      autoTriggeredAnalysisIdRef.current = analysisId;
      return;
    }

    if (isGeneratingRedesign) {
      return;
    }

    if (autoTriggeredAnalysisIdRef.current === analysisId) {
      return;
    }

    autoTriggeredAnalysisIdRef.current = analysisId;
    void runRedesignGeneration();
  }, [
    analysisId,
    isGeneratingRedesign,
    redesignResult?.crossCulturalAnalysisId,
    requestId,
    runRedesignGeneration,
  ]);

  const onSubmitImage = imageForm.handleSubmit(async (values) => {
    const file = values.image.item(0);
    if (!file) {
      return;
    }

    setSubmittingImage(true);
    setImageError(null);

    try {
      const payload =
        values.directionMode === "TEXT"
          ? {
              image: file,
              directionText: values.directionText?.trim(),
            }
          : {
              image: file,
              directionPreset: values.directionPreset,
            };

      const response = await postImageAnalyze(payload);
      setImageResult(response);
      setStep("cross-cultural");
      setCrossError(null);
      setRedesignError(null);
      window.setTimeout(() => {
        scrollToStep(STEP_SECTION_ID["cross-cultural"]);
      }, 120);
    } catch (rawError) {
      setImageError(toApiError(rawError));
    } finally {
      setSubmittingImage(false);
    }
  });

  const onSubmitCrossCultural = crossForm.handleSubmit(async (values) => {
    if (!requestId) {
      setCrossError(
        new ApiError({
          message: "缺少请求编号，请先完成图像输入模块。",
          code: "MISSING_REQUEST_ID",
        }),
      );
      return;
    }

    setSubmittingCross(true);
    setCrossError(null);
    setRedesignError(null);

    try {
      const result = await postCrossCulturalAnalyze({
        requestId,
        targetMarket: values.targetMarket,
      });
      setCrossCulturalResult(result);
      setStep("redesign");
      window.setTimeout(() => {
        scrollToStep(STEP_SECTION_ID.redesign);
      }, 120);
    } catch (rawError) {
      setCrossError(toApiError(rawError));
    } finally {
      setSubmittingCross(false);
    }
  });

  const featureSummary = useMemo(() => imageResult?.features, [imageResult]);
  const crossResult = crossCulturalResult;
  const redesign = redesignResult;

  return (
    <motion.div className={commonStyles.stack} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section id={STEP_SECTION_ID["image-input"]} className={styles.sectionAnchor}>
        <SurfacePanel
          title="第一步：图像输入模块"
          subtitle="上传原始玩具图片，并提供改款方向（文本或预设）"
          rightSlot={<span className="pill">Step 01</span>}
        >
          <form className={commonStyles.form} onSubmit={onSubmitImage}>
            <div className={commonStyles.field}>
              <label className={commonStyles.label} htmlFor="image-file">
                玩具图片
              </label>
              <input
                id="image-file"
                className={commonStyles.input}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                {...imageForm.register("image")}
              />
              <span className={commonStyles.hint}>支持 jpg/png/webp，文件大小不超过 10MB。</span>
              {imageForm.formState.errors.image ? (
                <span className={commonStyles.hint} style={{ color: "var(--danger)" }}>
                  {imageForm.formState.errors.image.message}
                </span>
              ) : null}
            </div>

            {previewUrl ? (
              <div className={commonStyles.field}>
                <span className={commonStyles.label}>图片预览</span>
                <img src={previewUrl} alt="上传预览" className={styles.previewImage} />
              </div>
            ) : null}

            <div className={commonStyles.field}>
              <span className={commonStyles.label}>改款方向输入</span>
              <div className={commonStyles.radioRow}>
                <label className={commonStyles.radioItem}>
                  <input type="radio" value="TEXT" {...imageForm.register("directionMode")} />
                  文本建议
                </label>
                <label className={commonStyles.radioItem}>
                  <input type="radio" value="PRESET" {...imageForm.register("directionMode")} />
                  预设模板
                </label>
              </div>
            </div>

            {directionMode === "TEXT" ? (
              <div className={commonStyles.field}>
                <label className={commonStyles.label} htmlFor="direction-text">
                  文本建议
                </label>
                <textarea
                  id="direction-text"
                  className={commonStyles.textarea}
                  placeholder="例如：改成中东节日礼盒版，加入金色点缀和可拆灯笼挂饰"
                  {...imageForm.register("directionText")}
                />
                {imageForm.formState.errors.directionText ? (
                  <span className={commonStyles.hint} style={{ color: "var(--danger)" }}>
                    {imageForm.formState.errors.directionText.message}
                  </span>
                ) : null}
              </div>
            ) : (
              <div className={commonStyles.field}>
                <label className={commonStyles.label} htmlFor="direction-preset">
                  预设方向
                </label>
                <select id="direction-preset" className={commonStyles.select} {...imageForm.register("directionPreset")}>
                  {DIRECTION_PRESETS.map((preset) => (
                    <option key={preset} value={preset}>
                      {directionPresetLabels[preset]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <InlineError error={imageError} />
            <div className={commonStyles.buttonRow}>
              <button className={commonStyles.buttonPrimary} type="submit" disabled={isSubmittingImage}>
                {isSubmittingImage ? "解析中..." : "提交并解析图像"}
              </button>
              {isSubmittingImage ? <LoadingPulse label="智能模型正在提取形状/颜色/材质/风格" /> : null}
            </div>
          </form>
        </SurfacePanel>

        <SurfacePanel
          title="图像特征解析"
          subtitle="形状 / 颜色 / 材质 / 风格"
          rightSlot={<span className="pill">视觉分析</span>}
        >
          {featureSummary ? (
            <div className={commonStyles.split}>
              <div className={commonStyles.metricGrid}>
                <article className={commonStyles.metricCard}>
                  <h4>形状</h4>
                  <p>
                    {toZhFeatureTerm(featureSummary.shape.category)} ·{" "}
                    <strong>{Math.round(featureSummary.shape.confidence * 100)}%</strong>
                  </p>
                </article>
                <article className={commonStyles.metricCard}>
                  <h4>材质</h4>
                  <ul className={commonStyles.list}>
                    {featureSummary.material.map((item) => (
                      <li key={item.name}>
                        {toZhFeatureTerm(item.name)} ({Math.round(item.confidence * 100)}%)
                      </li>
                    ))}
                  </ul>
                </article>
                <article className={commonStyles.metricCard}>
                  <h4>风格</h4>
                  <ul className={commonStyles.list}>
                    {featureSummary.style.map((item) => (
                      <li key={item.name}>
                        {toZhFeatureTerm(item.name)} ({Math.round(item.confidence * 100)}%)
                      </li>
                    ))}
                  </ul>
                </article>
              </div>

              <article className={commonStyles.metricCard}>
                <h4>颜色分布</h4>
                <div className={commonStyles.metricGrid}>
                  {featureSummary.colors.map((color) => (
                    <p className={commonStyles.colorLine} key={`${color.name}-${color.hex}`}>
                      <span className={commonStyles.colorSwatch} style={{ backgroundColor: color.hex }} />
                      {toZhColorName(color.name)} · 占比 {Math.round(color.proportion * 100)}%
                    </p>
                  ))}
                </div>
              </article>
            </div>
          ) : (
            <p className="muted">暂无解析结果。完成上传后会自动展示第一步提取的核心特征。</p>
          )}
        </SurfacePanel>
      </section>

      <section id={STEP_SECTION_ID["cross-cultural"]} className={styles.sectionAnchor}>
        <SurfacePanel
          title="第二步：跨文化分析模块"
          subtitle="目标市场选择 + 文化禁忌检测 + 节日/热点 + 竞品风格参考"
          rightSlot={<span className="pill">Step 02</span>}
        >
          <form className={commonStyles.form} onSubmit={onSubmitCrossCultural}>
            <div className={commonStyles.field}>
              <label className={commonStyles.label} htmlFor="target-market">
                目标市场
              </label>
              <select id="target-market" className={commonStyles.select} {...crossForm.register("targetMarket")}>
                {TARGET_MARKETS.map((market) => (
                  <option key={market} value={market}>
                    {marketLabels[market]}
                  </option>
                ))}
              </select>
            </div>

            {!requestId ? (
              <div className={styles.stepBanner}>完成第一步后解锁本步骤。</div>
            ) : (
              <p className={commonStyles.hint}>请求编号已就绪，提交后会自动进入第三步生成。</p>
            )}

            <InlineError error={crossError} />
            <div className={commonStyles.buttonRow}>
              <button className={commonStyles.buttonPrimary} type="submit" disabled={isSubmittingCross || !requestId}>
                {isSubmittingCross ? "分析中..." : "生成跨文化分析"}
              </button>
              {isSubmittingCross ? <LoadingPulse label="正在检索禁忌/节日/竞品风格..." /> : null}
            </div>
          </form>
        </SurfacePanel>

        <div className={commonStyles.split}>
          <SurfacePanel title="文化禁忌检测" subtitle="优先处理命中的高风险项">
            {crossResult ? (
              <div className={commonStyles.metricGrid}>
                {crossResult.tabooFindings.map((item) => (
                  <article key={item.ruleId} className={commonStyles.metricCard}>
                    <h4>
                      [{toLevelLabel(item.severity)}] {toZhTabooTitle(item.ruleId, item.title)}
                    </h4>
                    <p>
                      命中: <strong>{item.matched ? "是" : "否"}</strong>
                    </p>
                    <p className={commonStyles.hint}>风险: {toZhTabooRisk(item.matched, item.risk)}</p>
                    <p className={commonStyles.hint}>建议: {toZhTabooRecommendation(item.matched, item.recommendation)}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">暂无结果。完成第二步后显示文化禁忌命中情况。</p>
            )}
          </SurfacePanel>

          <SurfacePanel title="节日/热点主题匹配" subtitle="优先对接高相关度活动主题">
            {crossResult ? (
              <div className={commonStyles.metricGrid}>
                {crossResult.festivalThemes.map((item) => (
                  <article key={item.themeId} className={commonStyles.metricCard}>
                    <h4>
                      {toZhFestivalName(item.themeId, item.name)} · {Math.round(item.relevance * 100)}%
                    </h4>
                    <p className={commonStyles.hint}>{toZhFestivalReason(item.relevance)}</p>
                    <ul className={commonStyles.list}>
                      {toZhFestivalElements(item.themeId, item.suggestedElements)
                        .slice(0, 3)
                        .map((it) => (
                          <li key={it}>{it}</li>
                        ))}
                    </ul>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">暂无节日主题匹配。</p>
            )}
          </SurfacePanel>
        </div>

        <SurfacePanel title="竞品风格参考" subtitle="对齐优势，避免同质化">
          {crossResult ? (
            <div className={commonStyles.metricGrid}>
              {crossResult.competitorStyles.map((item) => (
                <article key={item.referenceId} className={commonStyles.metricCard}>
                  <h4>
                    {toZhCompetitorArchetype(item.referenceId, item.brandArchetype)} ·{" "}
                    {Math.round(item.matchingScore * 100)}%
                  </h4>
                  <p>{toZhCompetitorSummary(item.styleSummary)}</p>
                  <ul className={commonStyles.list}>
                    {toZhCompetitorOpportunities(item.opportunities).map((opportunity) => (
                      <li key={opportunity}>{opportunity}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">暂无竞品风格参考。</p>
          )}
        </SurfacePanel>
      </section>

      <section id={STEP_SECTION_ID.redesign} className={styles.sectionAnchor}>
        <SurfacePanel
          title="第三步：改款建议模块"
          subtitle="第二步完成后自动生成颜色方案 / 造型细节 / 包装风格 / 智能效果图"
          rightSlot={<span className="pill">Step 03 · Auto</span>}
        >
          <div className={styles.statusWrap}>
            {!analysisId ? <div className={styles.stepBanner}>完成第二步后自动触发第三步。</div> : null}
            {analysisId && isGeneratingRedesign ? (
              <LoadingPulse label="正在自动生成颜色/造型/包装/效果图..." />
            ) : null}
            <InlineError error={redesignError} />
            {analysisId && redesignError ? (
              <div className={commonStyles.buttonRow}>
                <button className={commonStyles.buttonGhost} type="button" onClick={() => void runRedesignGeneration()}>
                  重试生成改款建议
                </button>
              </div>
            ) : null}
          </div>
        </SurfacePanel>

        <div className={commonStyles.split}>
          <SurfacePanel title="颜色方案建议" subtitle="保留识别度并强化市场适配">
            {redesign ? (
              <div className={commonStyles.metricGrid}>
                {redesign.colorSchemes.map((scheme) => (
                  <article key={scheme.schemeName} className={commonStyles.metricCard}>
                    <h4>
                      {toZhSchemeName(scheme.schemeName)} · {toZhText(scheme.positioning, "本地化定位")}
                    </h4>
                    <p className={commonStyles.hint}>{toZhSchemeReason(scheme.reason)}</p>
                    <div className={commonStyles.metricGrid}>
                      {scheme.colors.map((color) => (
                        <p key={`${scheme.schemeName}-${color.hex}-${color.usage}`} className={commonStyles.colorLine}>
                          <span className={commonStyles.colorSwatch} style={{ backgroundColor: color.hex }} />
                          {toZhColorName(color.name)}（{toZhColorUsage(color.usage)}）
                        </p>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">暂无颜色方案建议。</p>
            )}
          </SurfacePanel>

          <SurfacePanel title="造型 / 细节调整建议" subtitle="优先落地高优先级动作">
            {redesign ? (
              <div className={commonStyles.metricGrid}>
                {redesign.shapeAdjustments.map((item) => (
                  <article key={item.title} className={commonStyles.metricCard}>
                    <h4>
                      [{toLevelLabel(item.priority)}] {toZhShapeTitle(item.title)}
                    </h4>
                    <p className={commonStyles.hint}>{toZhShapeReason(item.reason)}</p>
                    <ul className={commonStyles.list}>
                      {item.actions.map((action) => (
                        <li key={action}>{toZhShapeAction(action)}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">暂无造型与细节建议。</p>
            )}
          </SurfacePanel>
        </div>

        <div className={commonStyles.split}>
          <SurfacePanel title="包装风格建议" subtitle="面向目标市场的陈列与文案语气">
            {redesign ? (
              <div className={commonStyles.metricGrid}>
                {redesign.packagingSuggestions.map((item) => (
                  <article key={item.styleName} className={commonStyles.metricCard}>
                    <h4>{toZhPackagingStyleName(item.styleName)}</h4>
                    <p className={commonStyles.hint}>{toZhPackagingReason(item.reason)}</p>
                    <p className={commonStyles.hint}>语气: {toZhCopyTone(item.copyTone)}</p>
                    <ul className={commonStyles.list}>
                      {item.visualElements.map((visual) => (
                        <li key={visual}>{toZhPackagingVisual(visual)}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">暂无包装建议。</p>
            )}
          </SurfacePanel>

          <SurfacePanel title="智能效果图生成" subtitle="改款预览图 + 三视图 + 展示视频脚本">
            {redesign ? (
              <div className={commonStyles.metricGrid}>
                <RenderImageAsset title="改款预览图" asset={redesign.assets.previewImage} />
                <RenderImageAsset title="三视图 · 正视图" asset={redesign.assets.threeView.front} />
                <RenderImageAsset title="三视图 · 侧视图" asset={redesign.assets.threeView.side} />
                <RenderImageAsset title="三视图 · 背视图" asset={redesign.assets.threeView.back} />

                <article className={commonStyles.metricCard}>
                  <h4>展示视频脚本（{toShowcaseVideoStatusLabel(redesign.assets.showcaseVideo.status)}）</h4>
                  <p>{toZhShowcaseScript()}</p>
                  <p className={commonStyles.hint}>当前版本不生成关键帧，仅输出视频脚本。</p>
                </article>
              </div>
            ) : (
              <p className="muted">暂无智能资产结果。</p>
            )}
          </SurfacePanel>
        </div>
      </section>
    </motion.div>
  );
}

function RenderImageAsset({ title, asset }: { title: string; asset: ImageAssetResult }): JSX.Element {
  const imageSrc =
    asset.imageBase64 && asset.status === "READY"
      ? `data:${asset.mimeType ?? "image/png"};base64,${asset.imageBase64}`
      : null;

  return (
    <article className={commonStyles.metricCard}>
      <h4>
        {title} · {toImageAssetStatusLabel(asset.status)}
      </h4>
      <p className={commonStyles.hint}>生成提示词: {toZhAssetPrompt()}</p>
      {imageSrc ? (
        <img src={imageSrc} alt={title} className={styles.assetImage} />
      ) : (
        <p className={commonStyles.hint}>未生成图片: {toZhAssetReason(asset.reason)}</p>
      )}
    </article>
  );
}
