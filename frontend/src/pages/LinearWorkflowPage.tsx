import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type JSX } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ApiError, type ApiError as ApiErrorType, toApiError } from "../shared/api/errors";
import { postCrossCulturalAnalyze, postImageAnalyze, postRedesignSuggest } from "../shared/api/toyclaw";
import {
  toZhAssetReason,
  toZhColorName,
  toZhColorUsage,
  toZhCompetitorArchetype,
  toZhCompetitorOpportunities,
  toZhFeatureTerm,
  toZhFestivalElements,
  toZhFestivalName,
  toZhPackagingStyleName,
  toZhSchemeName,
  toZhShapeAction,
  toZhShapeTitle,
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
  CHANGE_COLOR: "换色",
  SEASONAL_THEME: "节日",
  ADD_ACCESSORY: "配件",
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
      message: "请上传图片",
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
        message: "请输入改款方向",
      });
    }
    if (value.directionMode === "PRESET" && !value.directionPreset) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["directionPreset"],
        message: "请选择预设",
      });
    }
  });

const crossFormSchema = z.object({
  targetMarket: z.enum(TARGET_MARKETS),
});

type ImageFormValues = z.infer<typeof imageFormSchema>;
type CrossFormValues = z.infer<typeof crossFormSchema>;

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

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
  const [dragActive, setDragActive] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const autoTriggeredAnalysisIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef(0);

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

  const { ref: formRef, ...imageRegisterRest } = imageForm.register("image");

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
          message: "缺少依赖编号",
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
          message: "请先完成第一步",
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

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && fileInputRef.current) {
      fileInputRef.current.files = files;
      imageForm.setValue("image", files, { shouldValidate: true });
    }
  };

  const featureSummary = useMemo(() => imageResult?.features, [imageResult]);
  const crossResult = crossCulturalResult;
  const redesign = redesignResult;

  const tabooHitCount = crossResult?.tabooFindings.filter((item) => item.matched).length ?? 0;
  const topTheme = crossResult?.festivalThemes[0];
  const topCompetitor = crossResult?.competitorStyles[0];

  const highPriorityCount = redesign?.shapeAdjustments.filter((item) => item.priority === "HIGH").length ?? 0;
  const previewStatus = redesign ? toImageAssetStatusLabel(redesign.assets.previewImage.status) : "暂无";
  const hasFailedRedesignImages = redesign
    ? [
        redesign.assets.previewImage,
        redesign.assets.threeView.front,
        redesign.assets.threeView.side,
        redesign.assets.threeView.back,
      ].some((asset) => asset.status === "FAILED")
    : false;

  return (
    <motion.div className={commonStyles.stack} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section id={STEP_SECTION_ID["image-input"]} className={styles.sectionAnchor}>
        <SurfacePanel title="第一步：输入" rightSlot={<span className="pill">Step 01</span>}>
          <form className={commonStyles.form} onSubmit={onSubmitImage}>
            <div className={commonStyles.field}>
              <label className={commonStyles.label} htmlFor="image-file">图片</label>
              <div
                className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ""} ${previewUrl ? styles.dropZoneHasFile : ""}`}
                role="button"
                tabIndex={0}
                aria-label="选择或拖拽上传图片"
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  id="image-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className={styles.dropZoneInput}
                  ref={(el) => {
                    formRef(el);
                    fileInputRef.current = el;
                  }}
                  {...imageRegisterRest}
                />
                {previewUrl ? (
                  <img src={previewUrl} alt="上传预览" className={styles.dropZonePreview} />
                ) : (
                  <div className={styles.dropZoneContent}>
                    <span className={styles.dropZoneIcon}>⬆</span>
                    <span className={styles.dropZoneText}>拖拽图片到此处，或点击选择</span>
                    <span className={commonStyles.hint}>jpg/png/webp · ≤10MB</span>
                  </div>
                )}
              </div>
              {imageForm.formState.errors.image ? (
                <span className={commonStyles.hint} style={{ color: "var(--danger)" }}>
                  {imageForm.formState.errors.image.message}
                </span>
              ) : null}
            </div>

            <div className={commonStyles.field}>
              <span className={commonStyles.label}>方向</span>
              <div className={commonStyles.radioRow}>
                <label className={commonStyles.radioItem}>
                  <input type="radio" value="TEXT" {...imageForm.register("directionMode")} />
                  文本
                </label>
                <label className={commonStyles.radioItem}>
                  <input type="radio" value="PRESET" {...imageForm.register("directionMode")} />
                  预设
                </label>
              </div>
            </div>

            {directionMode === "TEXT" ? (
              <div className={commonStyles.field}>
                <label className={commonStyles.label} htmlFor="direction-text">
                  文本方向
                </label>
                <textarea
                  id="direction-text"
                  className={commonStyles.textarea}
                  placeholder="例如：节日礼盒版，金色点缀"
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
                {isSubmittingImage ? "解析中..." : "开始解析"}
              </button>
              {isSubmittingImage ? <LoadingPulse label="解析中..." /> : null}
            </div>
          </form>
        </SurfacePanel>

        <SurfacePanel title="第一步结果">
          {featureSummary ? (
            <>
              <motion.div
                className={styles.summaryGrid}
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                <motion.article className={styles.summaryCard} variants={staggerItem}>
                  <span className={styles.summaryLabel}>形状</span>
                  <strong>{toZhFeatureTerm(featureSummary.shape.category)}</strong>
                  <span className={styles.summaryMeta}>{Math.round(featureSummary.shape.confidence * 100)}%</span>
                </motion.article>
                <motion.article className={styles.summaryCard} variants={staggerItem}>
                  <span className={styles.summaryLabel}>主色</span>
                  <strong>{toZhColorName(featureSummary.colors[0]?.name ?? "未知")}</strong>
                  <span className={styles.summaryMeta}>{featureSummary.colors.length} 色</span>
                </motion.article>
                <motion.article className={styles.summaryCard} variants={staggerItem}>
                  <span className={styles.summaryLabel}>风格/材质</span>
                  <strong>
                    {featureSummary.style.length}/{featureSummary.material.length}
                  </strong>
                  <span className={styles.summaryMeta}>条目数</span>
                </motion.article>
              </motion.div>

              <details className={styles.details}>
                <summary className={styles.detailsSummary}>查看明细</summary>
                <div className={styles.detailsBody}>
                  <section className={styles.detailsSection}>
                    <h4>颜色</h4>
                    <div className={commonStyles.metricGrid}>
                      {featureSummary.colors.map((color) => (
                        <p className={commonStyles.colorLine} key={`${color.name}-${color.hex}`}>
                          <span className={commonStyles.colorSwatch} style={{ backgroundColor: color.hex }} />
                          {toZhColorName(color.name)} · {Math.round(color.proportion * 100)}%
                        </p>
                      ))}
                    </div>
                  </section>
                  <section className={styles.detailsSection}>
                    <h4>材质</h4>
                    <ul className={commonStyles.list}>
                      {featureSummary.material.map((item) => (
                        <li key={item.name}>
                          {toZhFeatureTerm(item.name)} ({Math.round(item.confidence * 100)}%)
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className={styles.detailsSection}>
                    <h4>风格</h4>
                    <ul className={commonStyles.list}>
                      {featureSummary.style.map((item) => (
                        <li key={item.name}>
                          {toZhFeatureTerm(item.name)} ({Math.round(item.confidence * 100)}%)
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </details>
            </>
          ) : (
            <p className="muted">等待解析结果</p>
          )}
        </SurfacePanel>
      </section>

      <section id={STEP_SECTION_ID["cross-cultural"]} className={styles.sectionAnchor}>
        <SurfacePanel title="第二步：市场分析" rightSlot={<span className="pill">Step 02</span>}>
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

            {!requestId ? <div className={styles.stepBanner}>先完成第一步</div> : null}

            <InlineError error={crossError} />
            <div className={commonStyles.buttonRow}>
              <button className={commonStyles.buttonPrimary} type="submit" disabled={isSubmittingCross || !requestId}>
                {isSubmittingCross ? "分析中..." : "开始分析"}
              </button>
              {isSubmittingCross ? <LoadingPulse label="分析中..." /> : null}
            </div>
          </form>
        </SurfacePanel>

        <SurfacePanel title="第二步结果">
          {crossResult ? (
            <>
              <motion.div
                className={styles.summaryGrid}
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                <motion.article className={styles.summaryCard} variants={staggerItem}>
                  <span className={styles.summaryLabel}>禁忌命中</span>
                  <strong>{tabooHitCount}</strong>
                  <span className={styles.summaryMeta}>项</span>
                </motion.article>
                <motion.article className={styles.summaryCard} variants={staggerItem}>
                  <span className={styles.summaryLabel}>Top 主题</span>
                  <strong>{topTheme ? toZhFestivalName(topTheme.themeId, topTheme.name) : "暂无"}</strong>
                  <span className={styles.summaryMeta}>
                    {topTheme ? `${Math.round(topTheme.relevance * 100)}%` : "-"}
                  </span>
                </motion.article>
                <motion.article className={styles.summaryCard} variants={staggerItem}>
                  <span className={styles.summaryLabel}>Top 竞品</span>
                  <strong>
                    {topCompetitor
                      ? toZhCompetitorArchetype(topCompetitor.referenceId, topCompetitor.brandArchetype)
                      : "暂无"}
                  </strong>
                  <span className={styles.summaryMeta}>
                    {topCompetitor ? `${Math.round(topCompetitor.matchingScore * 100)}%` : "-"}
                  </span>
                </motion.article>
              </motion.div>

              <details className={styles.details}>
                <summary className={styles.detailsSummary}>查看明细</summary>
                <div className={styles.detailsBody}>
                  <section className={styles.detailsSection}>
                    <h4>禁忌项</h4>
                    <ul className={styles.compactList}>
                      {crossResult.tabooFindings.map((item) => (
                        <li key={item.ruleId}>
                          [{toLevelLabel(item.severity)}] {toZhTabooTitle(item.ruleId, item.title)} ·{" "}
                          {item.matched ? "命中" : "未命中"}
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className={styles.detailsSection}>
                    <h4>节日匹配</h4>
                    <ul className={styles.compactList}>
                      {crossResult.festivalThemes.map((item) => (
                        <li key={item.themeId}>
                          {toZhFestivalName(item.themeId, item.name)} · {Math.round(item.relevance * 100)}%
                          <span className={styles.inlineMeta}>
                            {toZhFestivalElements(item.themeId, item.suggestedElements).slice(0, 2).join(" / ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className={styles.detailsSection}>
                    <h4>竞品参考</h4>
                    <ul className={styles.compactList}>
                      {crossResult.competitorStyles.map((item) => (
                        <li key={item.referenceId}>
                          {toZhCompetitorArchetype(item.referenceId, item.brandArchetype)} ·{" "}
                          {Math.round(item.matchingScore * 100)}%
                          <span className={styles.inlineMeta}>
                            {toZhCompetitorOpportunities(item.opportunities).slice(0, 2).join(" / ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </details>
            </>
          ) : (
            <p className="muted">等待分析结果</p>
          )}
        </SurfacePanel>
      </section>

      <section id={STEP_SECTION_ID.redesign} className={styles.sectionAnchor}>
        <SurfacePanel title="第三步：改款输出" rightSlot={<span className="pill">Step 03 · Auto</span>}>
          <div className={styles.statusWrap}>
            {!analysisId ? <div className={styles.stepBanner}>等待第二步完成</div> : null}
            {analysisId && isGeneratingRedesign ? <LoadingPulse label="生成中..." /> : null}
            <InlineError error={redesignError} />
            {analysisId && redesignError ? (
              <div className={commonStyles.buttonRow}>
                <button className={commonStyles.buttonGhost} type="button" onClick={() => void runRedesignGeneration()}>
                  重试
                </button>
              </div>
            ) : null}
            {analysisId && !redesignError && hasFailedRedesignImages ? (
              <div className={commonStyles.buttonRow}>
                <button
                  className={commonStyles.buttonGhost}
                  type="button"
                  disabled={isGeneratingRedesign}
                  onClick={() => void runRedesignGeneration()}
                >
                  {isGeneratingRedesign ? "重新生成中..." : "重新生成图片"}
                </button>
              </div>
            ) : null}
          </div>
        </SurfacePanel>

        <SurfacePanel title="第三步结果">
          {redesign ? (
            <>
              <motion.div
                className={styles.summaryGrid}
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                <motion.article className={styles.summaryCard} variants={staggerItem}>
                  <span className={styles.summaryLabel}>配色方案</span>
                  <strong>{redesign.colorSchemes.length}</strong>
                  <span className={styles.summaryMeta}>组</span>
                </motion.article>
                <motion.article className={styles.summaryCard} variants={staggerItem}>
                  <span className={styles.summaryLabel}>高优动作</span>
                  <strong>{highPriorityCount}</strong>
                  <span className={styles.summaryMeta}>项</span>
                </motion.article>
                <motion.article className={styles.summaryCard} variants={staggerItem}>
                  <span className={styles.summaryLabel}>预览图状态</span>
                  <strong>{previewStatus}</strong>
                  <span className={styles.summaryMeta}>自动生成</span>
                </motion.article>
              </motion.div>

              <details className={styles.details}>
                <summary className={styles.detailsSummary}>查看明细</summary>
                <div className={styles.detailsBody}>
                  <section className={styles.detailsSection}>
                    <h4>颜色方案</h4>
                    <ul className={styles.compactList}>
                      {redesign.colorSchemes.map((scheme) => (
                        <li key={scheme.schemeName}>
                          {toZhSchemeName(scheme.schemeName)} · {toZhText(scheme.positioning, "本地化定位")}
                          <span className={styles.inlineMeta}>
                            {scheme.colors
                              .map((color) => `${toZhColorName(color.name)}(${toZhColorUsage(color.usage)})`)
                              .join(" / ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className={styles.detailsSection}>
                    <h4>造型调整</h4>
                    <ul className={styles.compactList}>
                      {redesign.shapeAdjustments.map((item) => (
                        <li key={item.title}>
                          [{toLevelLabel(item.priority)}] {toZhShapeTitle(item.title)}
                          <span className={styles.inlineMeta}>
                            {item.actions.slice(0, 2).map((action) => toZhShapeAction(action)).join(" / ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className={styles.detailsSection}>
                    <h4>包装建议</h4>
                    <ul className={styles.compactList}>
                      {redesign.packagingSuggestions.map((item) => (
                        <li key={item.styleName}>
                          {toZhPackagingStyleName(item.styleName)}
                          <span className={styles.inlineMeta}>
                            {item.visualElements.slice(0, 2).join(" / ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className={styles.detailsSection}>
                    <h4>智能资产</h4>
                    {hasFailedRedesignImages ? (
                      <p className={commonStyles.hint}>部分图片生成失败，可点击“重新生成图片”手动重试。</p>
                    ) : null}
                    <div className={styles.assetGrid}>
                      <RenderImageAsset
                        title="预览图"
                        asset={redesign.assets.previewImage}
                        onImageClick={setLightboxSrc}
                        onRetry={() => void runRedesignGeneration()}
                        isRetrying={isGeneratingRedesign}
                      />
                      <RenderImageAsset
                        title="正视图"
                        asset={redesign.assets.threeView.front}
                        onImageClick={setLightboxSrc}
                        onRetry={() => void runRedesignGeneration()}
                        isRetrying={isGeneratingRedesign}
                      />
                      <RenderImageAsset
                        title="侧视图"
                        asset={redesign.assets.threeView.side}
                        onImageClick={setLightboxSrc}
                        onRetry={() => void runRedesignGeneration()}
                        isRetrying={isGeneratingRedesign}
                      />
                      <RenderImageAsset
                        title="背视图"
                        asset={redesign.assets.threeView.back}
                        onImageClick={setLightboxSrc}
                        onRetry={() => void runRedesignGeneration()}
                        isRetrying={isGeneratingRedesign}
                      />
                    </div>
                    <p className={commonStyles.hint}>
                      展示脚本：{toShowcaseVideoStatusLabel(redesign.assets.showcaseVideo.status)}
                    </p>
                  </section>
                </div>
              </details>
            </>
          ) : (
            <p className="muted">等待输出结果</p>
          )}
        </SurfacePanel>
      </section>

      <AnimatePresence>
        {lightboxSrc ? (
          <motion.div
            className={styles.lightboxOverlay}
            role="dialog"
            aria-modal="true"
            aria-label="图片放大查看"
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setLightboxSrc(null)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setLightboxSrc(null);
              }
            }}
            ref={(el) => el?.focus()}
          >
            <motion.img
              src={lightboxSrc}
              alt="放大查看"
              className={styles.lightboxImage}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            />
            <button className={styles.lightboxClose} type="button" onClick={() => setLightboxSrc(null)}>
              ✕
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function RenderImageAsset({
  title,
  asset,
  onImageClick,
  onRetry,
  isRetrying = false,
}: {
  title: string;
  asset: ImageAssetResult;
  onImageClick: (src: string) => void;
  onRetry?: () => void;
  isRetrying?: boolean;
}): JSX.Element {
  const imageSrc =
    asset.imageBase64 && asset.status === "READY"
      ? `data:${asset.mimeType ?? "image/png"};base64,${asset.imageBase64}`
      : null;

  return (
    <article className={commonStyles.metricCard}>
      <h4>{title}</h4>
      <p className={commonStyles.hint}>{toImageAssetStatusLabel(asset.status)}</p>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={`${title} - 点击放大`}
          className={styles.assetImage}
          role="button"
          tabIndex={0}
          onClick={() => onImageClick(imageSrc)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onImageClick(imageSrc);
            }
          }}
        />
      ) : null}
      {!imageSrc && asset.reason ? (
        <p className={commonStyles.hint}>原因：{toZhAssetReason(asset.reason)}</p>
      ) : null}
      {asset.status === "FAILED" && onRetry ? (
        <div className={commonStyles.buttonRow}>
          <button className={commonStyles.buttonGhost} type="button" disabled={isRetrying} onClick={onRetry}>
            {isRetrying ? "重新生成中..." : "重新生成"}
          </button>
        </div>
      ) : null}
    </article>
  );
}
