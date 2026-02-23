import { motion } from "framer-motion";
import type { JSX } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
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
      description: "颜色/造型/包装 + AI 资产预览",
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
          <p className={styles.eyebrow}>ToyGlobal AI Agent</p>
          <h1 className="neon-title">Global Toy Redesign Lab</h1>
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
                <dt>requestId</dt>
                <dd>{state.requestId ?? "--"}</dd>
              </div>
              <div>
                <dt>analysisId</dt>
                <dd>{state.analysisId ?? "--"}</dd>
              </div>
              <div>
                <dt>suggestionId</dt>
                <dd>{state.suggestionId ?? "--"}</dd>
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
                预览图:
                <strong>{state.redesignResult?.assets.previewImage.status ?? "--"}</strong>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
