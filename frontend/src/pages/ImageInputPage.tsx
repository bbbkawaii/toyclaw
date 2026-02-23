import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { postImageAnalyze } from "../shared/api/toyclaw";
import { type ApiError, toApiError } from "../shared/api/errors";
import { DIRECTION_PRESETS, type DirectionPreset } from "../shared/types/api";
import { InlineError } from "../shared/ui/InlineError";
import { LoadingPulse } from "../shared/ui/LoadingPulse";
import { SurfacePanel } from "../shared/ui/SurfacePanel";
import { useWorkflowStore } from "../store/workflow-store";
import commonStyles from "./PageCommon.module.css";

const formSchema = z
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

type FormValues = z.infer<typeof formSchema>;

const directionPresetLabels: Record<DirectionPreset, string> = {
  CHANGE_COLOR: "换个色号",
  SEASONAL_THEME: "蹭个节日",
  ADD_ACCESSORY: "加个小配件",
};

export function ImageInputPage(): JSX.Element {
  const navigate = useNavigate();
  const workflow = useWorkflowStore();
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      directionMode: "PRESET",
      directionText: "",
      directionPreset: "CHANGE_COLOR",
    },
  });

  const directionMode = form.watch("directionMode");
  const fileList = form.watch("image");

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

  const featureSummary = useMemo(() => workflow.imageResult?.features, [workflow.imageResult]);

  const onSubmit = form.handleSubmit(async (values) => {
    const file = values.image.item(0);
    if (!file) {
      return;
    }

    setSubmitting(true);
    setError(null);

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
      workflow.setImageResult(response);
      workflow.setStep("cross-cultural");
      navigate("/cross-cultural");
    } catch (rawError) {
      setError(toApiError(rawError));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <motion.div className={commonStyles.stack} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SurfacePanel
        title="图像输入模块"
        subtitle="上传原始玩具图片，并提供改款方向（文本或预设）"
        rightSlot={<span className="pill">第 01 步</span>}
      >
        <form className={commonStyles.form} onSubmit={onSubmit}>
          <div className={commonStyles.field}>
            <label className={commonStyles.label} htmlFor="image-file">
              玩具图片
            </label>
            <input
              id="image-file"
              className={commonStyles.input}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              {...form.register("image")}
            />
            <span className={commonStyles.hint}>支持 jpg / png / webp，最大 10MB。</span>
            {form.formState.errors.image ? (
              <span className={commonStyles.hint} style={{ color: "var(--danger)" }}>
                {form.formState.errors.image.message}
              </span>
            ) : null}
          </div>

          {previewUrl ? (
            <div className={commonStyles.field}>
              <span className={commonStyles.label}>图片预览</span>
              <img
                src={previewUrl}
                alt="上传预览"
                style={{
                  width: "100%",
                  maxWidth: "360px",
                  borderRadius: "12px",
                  border: "1px solid color-mix(in srgb, var(--line) 56%, transparent)",
                }}
              />
            </div>
          ) : null}

          <div className={commonStyles.field}>
            <span className={commonStyles.label}>改款方向输入</span>
            <div className={commonStyles.radioRow}>
              <label className={commonStyles.radioItem}>
                <input type="radio" value="TEXT" {...form.register("directionMode")} />
                文本建议
              </label>
              <label className={commonStyles.radioItem}>
                <input type="radio" value="PRESET" {...form.register("directionMode")} />
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
                {...form.register("directionText")}
              />
              {form.formState.errors.directionText ? (
                <span className={commonStyles.hint} style={{ color: "var(--danger)" }}>
                  {form.formState.errors.directionText.message}
                </span>
              ) : null}
            </div>
          ) : (
            <div className={commonStyles.field}>
              <label className={commonStyles.label} htmlFor="direction-preset">
                预设方向
              </label>
              <select id="direction-preset" className={commonStyles.select} {...form.register("directionPreset")}>
                {DIRECTION_PRESETS.map((preset) => (
                  <option key={preset} value={preset}>
                    {directionPresetLabels[preset]}
                  </option>
                ))}
              </select>
            </div>
          )}

          <InlineError error={error} />
          <div className={commonStyles.buttonRow}>
            <button className={commonStyles.buttonPrimary} type="submit" disabled={isSubmitting}>
              {isSubmitting ? "解析中..." : "提交并解析图像"}
            </button>
            {isSubmitting ? <LoadingPulse label="智能模型正在提取形状/颜色/材质/风格" /> : null}
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
                  {featureSummary.shape.category} · <strong>{Math.round(featureSummary.shape.confidence * 100)}%</strong>
                </p>
              </article>
              <article className={commonStyles.metricCard}>
                <h4>材质</h4>
                <ul className={commonStyles.list}>
                  {featureSummary.material.map((item) => (
                    <li key={item.name}>
                      {item.name} ({Math.round(item.confidence * 100)}%)
                    </li>
                  ))}
                </ul>
              </article>
              <article className={commonStyles.metricCard}>
                <h4>风格</h4>
                <ul className={commonStyles.list}>
                  {featureSummary.style.map((item) => (
                    <li key={item.name}>
                      {item.name} ({Math.round(item.confidence * 100)}%)
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
                    {color.name} {color.hex} · 占比 {Math.round(color.proportion * 100)}%
                  </p>
                ))}
              </div>
            </article>
          </div>
        ) : (
          <p className="muted">
            暂无解析结果。完成上传后，这里会显示提取出的玩具特征。
          </p>
        )}
      </SurfacePanel>
    </motion.div>
  );
}
