import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useState } from "react";
import type { JSX } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { ApiError, type ApiError as ApiErrorType, toApiError } from "../shared/api/errors";
import { postRedesignSuggest } from "../shared/api/toyclaw";
import type { ImageAssetResult } from "../shared/types/api";
import { InlineError } from "../shared/ui/InlineError";
import { LoadingPulse } from "../shared/ui/LoadingPulse";
import { SurfacePanel } from "../shared/ui/SurfacePanel";
import { useWorkflowStore } from "../store/workflow-store";
import commonStyles from "./PageCommon.module.css";

const formSchema = z.object({
  previewImage: z.boolean(),
  threeView: z.boolean(),
  showcaseVideo: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function RedesignPage(): JSX.Element {
  const navigate = useNavigate();
  const workflow = useWorkflowStore();
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiErrorType | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      previewImage: true,
      threeView: true,
      showcaseVideo: true,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!workflow.requestId || !workflow.analysisId) {
      setError(
        new ApiError({
          message: "缺少 requestId 或 analysisId，请先完成前两个模块。",
          code: "MISSING_DEPENDENCY_ID",
        }),
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await postRedesignSuggest({
        requestId: workflow.requestId,
        crossCulturalAnalysisId: workflow.analysisId,
        assets: values,
      });
      workflow.setRedesignResult(response);
    } catch (rawError) {
      setError(toApiError(rawError));
    } finally {
      setSubmitting(false);
    }
  });

  const result = workflow.redesignResult;

  return (
    <motion.div className={commonStyles.stack} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SurfacePanel
        title="改款建议模块"
        subtitle="颜色方案 / 造型细节 / 包装风格 / AI效果图"
        rightSlot={<span className="pill">step 03</span>}
      >
        <form className={commonStyles.form} onSubmit={onSubmit}>
          <div className={commonStyles.field}>
            <span className={commonStyles.label}>AI 资产生成开关</span>
            <div className={commonStyles.radioRow}>
              <label className={commonStyles.radioItem}>
                <input type="checkbox" {...form.register("previewImage")} />
                改款预览图
              </label>
              <label className={commonStyles.radioItem}>
                <input type="checkbox" {...form.register("threeView")} />
                三视图
              </label>
              <label className={commonStyles.radioItem}>
                <input type="checkbox" {...form.register("showcaseVideo")} />
                展示视频关键帧
              </label>
            </div>
            <span className={commonStyles.hint}>
              当前绑定 requestId:
              <span className="kbd"> {workflow.requestId ?? "--"} </span>
              analysisId:
              <span className="kbd"> {workflow.analysisId ?? "--"} </span>
            </span>
          </div>

          <InlineError error={error} />
          <div className={commonStyles.buttonRow}>
            <button
              className={commonStyles.buttonPrimary}
              type="submit"
              disabled={isSubmitting || !workflow.requestId || !workflow.analysisId}
            >
              {isSubmitting ? "生成中..." : "生成改款建议"}
            </button>
            {isSubmitting ? <LoadingPulse label="正在生成颜色/造型/包装/效果图..." /> : null}
            <button className={commonStyles.buttonGhost} type="button" onClick={() => navigate("/cross-cultural")}>
              返回跨文化分析
            </button>
          </div>
        </form>
      </SurfacePanel>

      <div className={commonStyles.split}>
        <SurfacePanel title="颜色方案建议" subtitle="保留识别度并强化市场适配">
          {result ? (
            <div className={commonStyles.metricGrid}>
              {result.colorSchemes.map((scheme) => (
                <article key={scheme.schemeName} className={commonStyles.metricCard}>
                  <h4>
                    {scheme.schemeName} · {scheme.positioning}
                  </h4>
                  <p className={commonStyles.hint}>{scheme.reason}</p>
                  <div className={commonStyles.metricGrid}>
                    {scheme.colors.map((color) => (
                      <p key={`${scheme.schemeName}-${color.hex}-${color.usage}`} className={commonStyles.colorLine}>
                        <span className={commonStyles.colorSwatch} style={{ backgroundColor: color.hex }} />
                        {color.name} {color.hex} ({color.usage})
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
          {result ? (
            <div className={commonStyles.metricGrid}>
              {result.shapeAdjustments.map((item) => (
                <article key={item.title} className={commonStyles.metricCard}>
                  <h4>
                    [{item.priority}] {item.title}
                  </h4>
                  <p className={commonStyles.hint}>{item.reason}</p>
                  <ul className={commonStyles.list}>
                    {item.actions.map((action) => (
                      <li key={action}>{action}</li>
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
          {result ? (
            <div className={commonStyles.metricGrid}>
              {result.packagingSuggestions.map((item) => (
                <article key={item.styleName} className={commonStyles.metricCard}>
                  <h4>{item.styleName}</h4>
                  <p className={commonStyles.hint}>{item.reason}</p>
                  <p className={commonStyles.hint}>语气: {item.copyTone}</p>
                  <ul className={commonStyles.list}>
                    {item.visualElements.map((visual) => (
                      <li key={visual}>{visual}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">暂无包装建议。</p>
          )}
        </SurfacePanel>

        <SurfacePanel title="AI效果图生成" subtitle="改款预览图 + 三视图 + 展示视频关键帧">
          {result ? (
            <div className={commonStyles.metricGrid}>
              <RenderImageAsset title="改款预览图" asset={result.assets.previewImage} />
              <RenderImageAsset title="三视图 · Front" asset={result.assets.threeView.front} />
              <RenderImageAsset title="三视图 · Side" asset={result.assets.threeView.side} />
              <RenderImageAsset title="三视图 · Back" asset={result.assets.threeView.back} />

              <article className={commonStyles.metricCard}>
                <h4>展示视频方案 ({result.assets.showcaseVideo.status})</h4>
                <p>{result.assets.showcaseVideo.script}</p>
                <ul className={commonStyles.list}>
                  {result.assets.showcaseVideo.keyframes.map((frame) => (
                    <li key={frame.label}>
                      {frame.label}: {frame.prompt}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          ) : (
            <p className="muted">暂无 AI 资产结果。</p>
          )}
        </SurfacePanel>
      </div>
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
        {title} · {asset.status}
      </h4>
      <p className={commonStyles.hint}>Prompt: {asset.prompt}</p>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={title}
          style={{
            marginTop: 8,
            width: "100%",
            borderRadius: 10,
            border: "1px solid color-mix(in srgb, var(--line) 44%, transparent)",
          }}
        />
      ) : (
        <p className={commonStyles.hint}>未生成图片: {asset.reason ?? "N/A"}</p>
      )}
    </article>
  );
}
