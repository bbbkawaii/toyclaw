import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useState } from "react";
import type { JSX } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { ApiError, type ApiError as ApiErrorType, toApiError } from "../shared/api/errors";
import { postCrossCulturalAnalyze } from "../shared/api/toyclaw";
import { TARGET_MARKETS, type TargetMarket } from "../shared/types/api";
import { InlineError } from "../shared/ui/InlineError";
import { LoadingPulse } from "../shared/ui/LoadingPulse";
import { SurfacePanel } from "../shared/ui/SurfacePanel";
import { useWorkflowStore } from "../store/workflow-store";
import commonStyles from "./PageCommon.module.css";

const marketLabels: Record<TargetMarket, string> = {
  US: "美国",
  EUROPE: "欧洲",
  MIDDLE_EAST: "中东",
  SOUTHEAST_ASIA: "东南亚",
  JAPAN_KOREA: "日韩",
};

const formSchema = z.object({
  targetMarket: z.enum(TARGET_MARKETS),
});

type FormValues = z.infer<typeof formSchema>;

export function CrossCulturalPage(): JSX.Element {
  const navigate = useNavigate();
  const workflow = useWorkflowStore();
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiErrorType | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetMarket: "US",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!workflow.requestId) {
      setError(
        new ApiError({
          message: "缺少 requestId，请先完成图像输入模块。",
          code: "MISSING_REQUEST_ID",
        }),
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await postCrossCulturalAnalyze({
        requestId: workflow.requestId,
        targetMarket: values.targetMarket,
      });
      workflow.setCrossCulturalResult(result);
      workflow.setStep("redesign");
      navigate("/redesign");
    } catch (rawError) {
      setError(toApiError(rawError));
    } finally {
      setSubmitting(false);
    }
  });

  const result = workflow.crossCulturalResult;

  return (
    <motion.div className={commonStyles.stack} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <SurfacePanel
        title="跨文化分析模块"
        subtitle="目标市场选择 + 文化禁忌检测 + 节日/热点 + 竞品风格参考"
        rightSlot={<span className="pill">step 02</span>}
      >
        <form className={commonStyles.form} onSubmit={onSubmit}>
          <div className={commonStyles.field}>
            <label className={commonStyles.label} htmlFor="market">
              目标市场
            </label>
            <select id="market" className={commonStyles.select} {...form.register("targetMarket")}>
              {TARGET_MARKETS.map((market) => (
                <option key={market} value={market}>
                  {marketLabels[market]}
                </option>
              ))}
            </select>
          </div>

          {!workflow.requestId ? (
            <p className={commonStyles.hint} style={{ color: "var(--danger)" }}>
              还没有 requestId，请先返回「图像输入模块」完成上传。
            </p>
          ) : (
            <p className={commonStyles.hint}>
              当前 requestId: <span className="kbd">{workflow.requestId}</span>
            </p>
          )}

          <InlineError error={error} />
          <div className={commonStyles.buttonRow}>
            <button
              className={commonStyles.buttonPrimary}
              type="submit"
              disabled={isSubmitting || !workflow.requestId}
            >
              {isSubmitting ? "分析中..." : "生成跨文化分析"}
            </button>
            {isSubmitting ? <LoadingPulse label="正在检索禁忌/节日/竞品风格..." /> : null}
            <button className={commonStyles.buttonGhost} type="button" onClick={() => navigate("/image-input")}>
              返回图像输入
            </button>
          </div>
        </form>
      </SurfacePanel>

      <div className={commonStyles.split}>
        <SurfacePanel title="文化禁忌检测" subtitle="优先处理命中的高风险项">
          {result ? (
            <div className={commonStyles.metricGrid}>
              {result.tabooFindings.map((item) => (
                <article key={item.ruleId} className={commonStyles.metricCard}>
                  <h4>
                    [{item.severity}] {item.title}
                  </h4>
                  <p>
                    命中: <strong>{item.matched ? "是" : "否"}</strong>
                  </p>
                  <p className={commonStyles.hint}>风险: {item.risk}</p>
                  <p className={commonStyles.hint}>建议: {item.recommendation}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">暂无结果。提交分析后将显示文化禁忌命中情况。</p>
          )}
        </SurfacePanel>

        <SurfacePanel title="节日/热点主题匹配" subtitle="优先对接高相关度 campaign">
          {result ? (
            <div className={commonStyles.metricGrid}>
              {result.festivalThemes.map((item) => (
                <article key={item.themeId} className={commonStyles.metricCard}>
                  <h4>
                    {item.name} · {Math.round(item.relevance * 100)}%
                  </h4>
                  <p className={commonStyles.hint}>{item.reason}</p>
                  <ul className={commonStyles.list}>
                    {item.suggestedElements.slice(0, 3).map((it) => (
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
        {result ? (
          <div className={commonStyles.metricGrid}>
            {result.competitorStyles.map((item) => (
              <article key={item.referenceId} className={commonStyles.metricCard}>
                <h4>
                  {item.brandArchetype} · {Math.round(item.matchingScore * 100)}%
                </h4>
                <p>{item.styleSummary}</p>
                <ul className={commonStyles.list}>
                  {item.opportunities.map((opportunity) => (
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
    </motion.div>
  );
}
