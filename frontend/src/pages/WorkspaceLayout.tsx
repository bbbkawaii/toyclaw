import { motion } from "framer-motion";
import type { JSX } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { toImageAssetStatusLabel } from "../shared/i18n/labels";
import { StepRail } from "../shared/ui/StepRail";
import { useWorkflowStore, type WorkflowStep } from "../store/workflow-store";
import styles from "./WorkspaceLayout.module.css";

const STEP_PATH_MAP: Record<WorkflowStep, string> = {
  "image-input": "/image-input",
  "cross-cultural": "/cross-cultural",
  redesign: "/redesign",
};

const PATH_STEP_MAP: Record<string, WorkflowStep> = {
  "/image-input": "image-input",
  "/cross-cultural": "cross-cultural",
  "/redesign": "redesign",
};

export function WorkspaceLayout(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const state = useWorkflowStore();

  const routeStep = PATH_STEP_MAP[location.pathname] ?? "image-input";
  const currentStep: WorkflowStep = routeStep;

  const stepItems = [
    {
      key: "image-input" as const,
      label: "图像输入",
      description: "上传原始玩具图并解析视觉特征",
      enabled: true,
      done: Boolean(state.imageResult),
    },
    {
      key: "cross-cultural" as const,
      label: "跨文化分析",
      description: "目标市场 + 禁忌/节日/竞品匹配",
      enabled: Boolean(state.requestId),
      done: Boolean(state.crossCulturalResult),
    },
    {
      key: "redesign" as const,
      label: "改款建议",
      description: "颜色/造型/包装 + 智能资产预览",
      enabled: Boolean(state.requestId && state.analysisId),
      done: Boolean(state.redesignResult),
    },
  ];

  const handleStepClick = (step: WorkflowStep): void => {
    if (step === "cross-cultural" && !state.requestId) {
      return;
    }
    if (step === "redesign" && (!state.requestId || !state.analysisId)) {
      return;
    }
    state.setStep(step);
    navigate(STEP_PATH_MAP[step]);
  };

  const handleReset = (): void => {
    state.reset();
    navigate("/image-input");
  };

  return (
    <div className="app-shell">
      <motion.header
        className={styles.head}
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div>
          <p className={styles.eyebrow}>玩具出海智能助手</p>
          <h1 className="neon-title">全球玩具改款实验室</h1>
          <p className={`muted ${styles.subline}`}>
            从原始玩具图到跨文化合规与改款建议，三步完成出海方案。
          </p>
        </div>
        <button className={styles.resetButton} type="button" onClick={handleReset}>
          重新开始
        </button>
      </motion.header>

      <div className={styles.grid}>
        <aside className={styles.leftRail}>
          <StepRail items={stepItems} currentStep={currentStep} onStepClick={handleStepClick} />
        </aside>

        <motion.main
          className={styles.main}
          key={location.pathname}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        >
          <Outlet />
        </motion.main>

        <aside className={styles.summary}>
          <section className={styles.summaryPanel}>
            <h3 className={styles.summaryTitle}>会话摘要</h3>
            <dl className={styles.metaList}>
              <div>
                <dt>请求编号</dt>
                <dd>{state.requestId ?? "暂无"}</dd>
              </div>
              <div>
                <dt>分析编号</dt>
                <dd>{state.analysisId ?? "暂无"}</dd>
              </div>
              <div>
                <dt>建议编号</dt>
                <dd>{state.suggestionId ?? "暂无"}</dd>
              </div>
            </dl>
            <ul className={styles.statList}>
              <li>
                颜色方案:
                <strong>{state.redesignResult?.colorSchemes.length ?? 0}</strong>
              </li>
              <li>
                禁忌命中:
                <strong>
                  {state.crossCulturalResult?.tabooFindings.filter((item) => item.matched).length ?? 0}
                </strong>
              </li>
              <li>
                预览图状态:
                <strong>
                  {state.redesignResult
                    ? toImageAssetStatusLabel(state.redesignResult.assets.previewImage.status)
                    : "暂无"}
                </strong>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
